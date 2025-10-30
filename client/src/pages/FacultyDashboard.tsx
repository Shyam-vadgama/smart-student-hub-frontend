import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User, Subject, Student } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CalendarCheck } from "lucide-react";

const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [attendanceDate, setAttendanceDate] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Subjects fetch karne ka code
  const { data: subjects, isLoading: subjectsLoading, error: subjectsError } = useQuery<Subject[]>({
    queryKey: ['/api/subjects/faculty', user?._id],
    queryFn: async () => {
      if (!user?._id) {
        throw new Error("User ID is not available.");
      }
      const response = await apiRequest('GET', `/api/subjects/faculty/${user._id}`);
      return response.json();
    },
    enabled: !!user?.role && user.role === 'faculty',
  });

  // Students fetch karne ka code, yeh ab saare students ko laayega
  const { data: students, isLoading: studentsLoading, error: studentsError } = useQuery<Student[]>({
    queryKey: ['/api/users/students-all'],
    queryFn: () => apiRequest('GET', '/api/users/students-all').then((res) => res.json()),
    enabled: !!user?.role && user.role === 'faculty',
  });

  // This mutation will now send a single request for all selected students
  const takeAttendanceMutation = useMutation({
    mutationFn: (data: { studentIds: string[]; subject: string; date: string; status: string }) =>
      apiRequest('POST', '/api/attendance', data),
    onSuccess: () => {
      toast({
        title: 'Attendance marked successfully',
        description: `Attendance for ${selectedSubject?.name} has been recorded.`,
      });
      setAttendanceDate('');
      setSelectedStudents([]);
    },
    onError: (error: any) => {
      toast({
        title: 'Error marking attendance',
        description: error.message || 'An error occurred while marking attendance.',
        variant: 'destructive',
      });
    },
  });

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !attendanceDate || selectedStudents.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a subject, date, and students.',
        variant: 'destructive',
      });
      return;
    }

    // Now, send all selected students in a single request
    takeAttendanceMutation.mutate({
      subject: selectedSubject._id,
      date: attendanceDate,
      studentIds: selectedStudents,
      status: 'present',
    });
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Faculty Dashboard" 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.name}!</h1>
              <p className="text-gray-600">Manage your subjects and take attendance</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Subject List Section */}
              <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-800">My Subjects</h2>
                  </div>
                  <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                    {subjects?.length || 0} subjects
                  </Badge>
                </div>
                {subjectsLoading ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : subjects && subjects.length > 0 ? (
                  <div className="space-y-4">
                    {subjects.map((subj) => (
                      <Button 
                        key={subj._id}
                        variant={selectedSubject?._id === subj._id ? "default" : "outline"}
                        className="w-full justify-start text-left"
                        onClick={() => setSelectedSubject(subj)}
                      >
                        {subj.name}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No subjects assigned yet.</p>
                  </div>
                )}
              </div>
              
              {/* Mark Attendance Section */}
              <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
                <div className="flex items-center mb-6">
                  <CalendarCheck className="w-6 h-6 text-indigo-600 mr-3" />
                  <h2 className="text-xl font-semibold text-gray-800">Mark Attendance</h2>
                </div>
                
                {!selectedSubject ? (
                  <div className="text-center py-12 text-gray-500">
                    Please select a subject from the list to mark attendance.
                  </div>
                ) : (
                  <form onSubmit={handleAttendanceSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <div className="bg-gray-100 p-3 rounded-lg flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">{selectedSubject.name}</span>
                      </div>
                    </div>
                  
                    <div>
                      <label htmlFor="attendanceDate" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        id="attendanceDate"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 transition duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mark Present</label>
                      {studentsLoading ? (
                        <div className="text-center text-gray-500">Loading students...</div>
                      ) : students && students.length > 0 ? (
                        <>
                          <div className="text-sm text-gray-500 mb-2">{students.length} students found.</div>
                          <div className="h-64 overflow-y-auto border rounded-lg p-3 space-y-2 bg-gray-50">
                            {students.map((student) => (
                              <div 
                                key={student._id}
                                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded-md"
                                onClick={() => handleStudentToggle(student._id)}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedStudents.includes(student._id)}
                                  readOnly
                                  className="h-4 w-4 text-indigo-600 rounded"
                                />
                                <span>{student.name}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No students found.
                        </div>
                      )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full flex justify-center items-center mt-6"
                    disabled={takeAttendanceMutation.isPending || !selectedSubject || !attendanceDate || selectedStudents.length === 0}
                  >
                    {takeAttendanceMutation.isPending ? 'Marking...' : 'Mark Attendance'}
                  </Button>
                </form>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FacultyDashboard; 