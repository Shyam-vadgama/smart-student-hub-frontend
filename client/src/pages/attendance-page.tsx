import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Subject, Student, Attendance as AttendanceType } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CalendarCheck, CalendarDays, Users, CheckCircle2, XCircle, Loader2, Plus, History } from "lucide-react";
import { format, parseISO, isToday } from "date-fns";

function formatDateKey(dateString: string | Date) {
  const d = new Date(dateString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [attendanceDate, setAttendanceDate] = useState<string>("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Fetch subjects for this faculty
  const { data: subjects, isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects/faculty", user?._id],
    queryFn: async () => {
      if (!user?._id) throw new Error("User ID is not available.");
      const res = await apiRequest("GET", `/api/subjects/faculty/${user._id}`);
      return res.json();
    },
    enabled: !!user?.role && user.role === "faculty",
  });

  // Fetch all students
  const { data: students, isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/users/students-all"],
    queryFn: () => apiRequest("GET", "/api/users/students-all").then((r) => r.json()),
    enabled: !!user?.role && user.role === "faculty",
  });

  // Fetch previous attendance for selected subject
  const { data: attendanceRecords = [], isLoading: attendanceLoading, refetch: refetchAttendance } = useQuery<AttendanceType[]>({
    queryKey: ["/api/attendance/subject", selectedSubject?._id],
    queryFn: async () => {
      if (!selectedSubject?._id) return [] as AttendanceType[];
      const res = await apiRequest("GET", `/api/attendance/subject/${selectedSubject._id}`);
      return res.json();
    },
    enabled: !!user?.role && user.role === "faculty" && !!selectedSubject?._id,
  });

  // Create attendance for multiple students in one request
  const takeAttendanceMutation = useMutation({
    mutationFn: (data: { studentIds: string[]; subject: string; date: string; status: string }) =>
      apiRequest("POST", "/api/attendance", data),
    onSuccess: async () => {
      toast({ title: "Attendance marked successfully" });
      setAttendanceDate("");
      setSelectedStudents([]);
      await queryClient.invalidateQueries({ queryKey: ["/api/attendance/subject", selectedSubject?._id] });
      refetchAttendance();
    },
    onError: (error: any) => {
      toast({ title: "Error marking attendance", description: error?.message || "Please try again.", variant: "destructive" });
    },
  });

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents((prev) => (prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]));
  };

  // Group attendance by date for cards
  const groupedByDate = useMemo(() => {
    const map = new Map<string, AttendanceType[]>();
    for (const rec of attendanceRecords) {
      const key = formatDateKey(rec.date);
      map.set(key, [...(map.get(key) || []), rec]);
    }
    // Convert to sorted array (latest first)
    return Array.from(map.entries())
      .map(([date, list]) => ({ date, list }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [attendanceRecords]);

  // Set today's date as default when subject changes
  React.useEffect(() => {
    if (selectedSubject && !attendanceDate) {
      setAttendanceDate(formatDateKey(new Date()));
    }
  }, [selectedSubject, attendanceDate]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Attendance" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Manage Attendance</h1>
              <p className="text-gray-600">View previous sessions and add new attendance</p>
            </div>

            {/* Subject Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-600" /> Select Subject</CardTitle>
                <CardDescription>Choose a subject to manage attendance</CardDescription>
              </CardHeader>
              <CardContent>
                {subjectsLoading ? (
                  <div className="flex justify-center items-center h-16"><Loader2 className="animate-spin w-6 h-6 text-indigo-600" /></div>
                ) : subjects && subjects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {subjects.map((subj) => (
                      <Button
                        key={subj._id}
                        variant={selectedSubject?._id === subj._id ? "default" : "outline"}
                        onClick={() => setSelectedSubject(subj)}
                      >
                        {subj.name}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No subjects assigned</p>
                )}
              </CardContent>
            </Card>

            {selectedSubject ? (
              <Tabs defaultValue="previous" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                  <TabsTrigger value="previous" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Previous Attendance
                  </TabsTrigger>
                  <TabsTrigger value="new" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Mark New Attendance
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="previous" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-indigo-600" />
                        Previous Sessions for {selectedSubject.name}
                      </CardTitle>
                      <CardDescription>
                        {groupedByDate.length} session{groupedByDate.length !== 1 ? 's' : ''} recorded
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {attendanceLoading ? (
                        <div className="flex justify-center items-center h-32">
                          <Loader2 className="animate-spin w-6 h-6 text-indigo-600" />
                        </div>
                      ) : groupedByDate.length === 0 ? (
                        <div className="text-center py-12">
                          <CalendarCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No attendance records</h3>
                          <p className="text-gray-500">Mark your first attendance to see it here</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {groupedByDate.map(({ date, list }) => {
                            const present = list.filter((r) => r.status === "present").length;
                            const absent = list.filter((r) => r.status === "absent").length;
                            const total = list.length;
                            const attendanceDate = parseISO(date);
                            const isTodayDate = isToday(attendanceDate);
                            
                            return (
                              <div key={date} className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-gray-500" />
                                    <h3 className="font-semibold">{format(attendanceDate, "MMM dd, yyyy")}</h3>
                                    {isTodayDate && (
                                      <Badge variant="secondary" className="text-xs">Today</Badge>
                                    )}
                                  </div>
                                  <Badge variant="outline">{total} students</Badge>
                                </div>
                                
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Present</span>
                                    <div className="flex items-center gap-1">
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      <span className="font-medium">{present}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Absent</span>
                                    <div className="flex items-center gap-1">
                                      <XCircle className="w-4 h-4 text-red-600" />
                                      <span className="font-medium">{absent}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="pt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div 
                                        className="bg-green-600 h-2 rounded-full" 
                                        style={{ width: `${total > 0 ? (present / total) * 100 : 0}%` }}
                                      ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1 text-right">
                                      {total > 0 ? Math.round((present / total) * 100) : 0}% attendance
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="new" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarCheck className="w-5 h-5 text-indigo-600" />
                        Mark New Attendance for {selectedSubject.name}
                      </CardTitle>
                      <CardDescription>
                        Select date and mark students as present
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!attendanceDate || selectedStudents.length === 0) {
                            toast({ 
                              title: "Validation Error", 
                              description: "Please select date and students.", 
                              variant: "destructive" 
                            });
                            return;
                          }
                          takeAttendanceMutation.mutate({
                            subject: selectedSubject._id,
                            date: attendanceDate,
                            studentIds: selectedStudents,
                            status: "present",
                          });
                        }}
                        className="space-y-4"
                      >
                        <div>
                          <label htmlFor="attendanceDate" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            id="attendanceDate"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">Students</label>
                            {students && students.length > 0 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                className="h-8 px-2 text-xs"
                                onClick={() => setSelectedStudents(students.map((s) => s._id))}
                              >
                                Select all
                              </Button>
                            )}
                          </div>
                          {studentsLoading ? (
                            <div className="text-sm text-gray-500">Loading students...</div>
                          ) : students && students.length > 0 ? (
                            <div className="h-56 overflow-y-auto border rounded-lg p-3 space-y-2 bg-gray-50">
                              {students.map((student) => (
                                <div 
                                  key={student._id} 
                                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                                  onClick={() => handleStudentToggle(student._id)}
                                >
                                  <input 
                                    type="checkbox" 
                                    readOnly 
                                    checked={selectedStudents.includes(student._id)} 
                                    className="h-4 w-4 text-indigo-600" 
                                  />
                                  <span className="text-sm">{student.name}</span>
                                  {selectedStudents.includes(student._id) && (
                                    <Badge variant="secondary" className="ml-auto text-xs">Present</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">No students found.</div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="text-sm text-gray-500">
                            {selectedStudents.length} of {students?.length || 0} students selected
                          </div>
                          <Button 
                            type="submit" 
                            disabled={takeAttendanceMutation.isPending || !attendanceDate || selectedStudents.length === 0}
                          >
                            {takeAttendanceMutation.isPending ? "Marking..." : "Mark Attendance"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Select a subject</h3>
                  <p className="text-gray-500">Choose a subject to manage attendance</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AttendancePage;