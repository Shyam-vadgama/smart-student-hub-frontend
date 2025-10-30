import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User, Classroom, Subject } from '@shared/schema';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus,
  X,
  BookOpen,
  UserRound,
  Home
} from "lucide-react";

const CreateSubject: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [name, setName] = useState('');
  const [faculty, setFaculty] = useState('');
  const [classroom, setClassroom] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch all subjects
  const { data: subjects, isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
    queryFn: () => apiRequest('GET', '/api/subjects').then((res) => res.json()),
  });

  // Fetch all users (for faculty list)
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('GET', '/api/users').then((res) => res.json()),
  });

  // Fetch all classrooms
  const { data: classrooms, isLoading: isLoadingClassrooms } = useQuery<Classroom[]>({
    queryKey: ['/api/classrooms'],
    queryFn: () => apiRequest('GET', '/api/classrooms').then((res) => res.json()),
  });

  // Create subject mutation
  const createSubjectMutation = useMutation({
    mutationFn: (data: { name: string; faculty: string; classroom: string }) =>
      apiRequest('POST', '/api/subjects', data),
    onSuccess: () => {
      toast({ 
        title: 'Subject created successfully',
        description: `${name} has been added to the system.`,
      });
      setName('');
      setFaculty('');
      setClassroom('');
      setShowCreateForm(false);
      // Refresh subjects list
      queryClient.invalidateQueries({ queryKey: ['/api/subjects'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating subject',
        description: error.message || 'An error occurred while creating the subject.',
        variant: 'destructive',
      });
    },
  });

  // Merged and corrected handleSubmit function
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Subject name is required.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!faculty) {
      toast({
        title: 'Validation Error',
        description: 'Please select a faculty member.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!classroom) {
      toast({
        title: 'Validation Error',
        description: 'Please select a classroom.',
        variant: 'destructive',
      });
      return;
    }
    
    createSubjectMutation.mutate({ name, faculty, classroom });
  };
  
  // Function to get faculty name by ID
  const getFacultyName = (facultyId: string) => {
    if (!users) return 'Unknown Faculty';
    const foundFaculty = users.find(user => user._id === facultyId);
    return foundFaculty ? foundFaculty.name : 'Unknown Faculty';
  };

  // Function to get classroom name by ID
  const getClassroomName = (classroomId: string) => {
    if (!classrooms) return 'Unknown Classroom';
    const foundClassroom = classrooms.find(room => room._id === classroomId);
    return foundClassroom ? foundClassroom.name : 'Unknown Classroom';
  };


  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Create Subject"
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Subject Management</h1>
              <p className="text-gray-600">View existing subjects and create new ones</p>
            </div>

            {/* Existing Subjects Section */}
            <div className="mb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Existing Subjects</h2>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                    {subjects?.length || 0} subjects
                  </Badge>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Subject
                  </Button>
                </div>
              </div>

              {isLoadingSubjects ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : subjects && subjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subjects.map((subject) => (
                    <div key={subject._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center">
                            <BookOpen size={20} />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Active
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex items-center space-x-2">
                          <UserRound size={16} className="text-gray-500" />
                          <span>Faculty: **{getFacultyName(subject.faculty)}**</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Home size={16} className="text-gray-500" />
                          <span>Classroom: **{getClassroomName(subject.classroom)}**</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
                  <div className="text-gray-400 mb-4">
                    <BookOpen className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No subjects found</h3>
                  <p className="text-gray-500 mb-4">Get started by creating a new subject.</p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Subject
                  </Button>
                </div>
              )}
            </div>

            {/* Create Subject Modal/Form Card */}
            {showCreateForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">Create New Subject</h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowCreateForm(false);
                          setName('');
                          setFaculty('');
                          setClassroom('');
                        }}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Subject Name */}
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                          Subject Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                          placeholder="e.g., Data Structures"
                        />
                      </div>

                      {/* Faculty Selection */}
                      <div>
                        <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-2">
                          Faculty <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="faculty"
                          value={faculty}
                          onChange={(e) => setFaculty(e.target.value)}
                          className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        >
                          <option value="">Select Faculty</option>
                          {isLoadingUsers ? (
                            <option disabled>Loading faculty...</option>
                          ) : users && users.filter(user => user.role === 'faculty').length > 0 ? (
                            users
                              .filter((user) => user.role === 'faculty')
                              .map((user) => (
                                <option key={user._id} value={user._id}>
                                  {user.name} ({user.email})
                                </option>
                              ))
                          ) : (
                            <option disabled>No faculty available</option>
                          )}
                        </select>
                      </div>

                      {/* Classroom Selection */}
                      <div>
                        <label htmlFor="classroom" className="block text-sm font-medium text-gray-700 mb-2">
                          Classroom <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="classroom"
                          value={classroom}
                          onChange={(e) => setClassroom(e.target.value)}
                          className="w-full px-4 py-3 rounded-md border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        >
                          <option value="">Select Classroom</option>
                          {isLoadingClassrooms ? (
                            <option disabled>Loading classrooms...</option>
                          ) : classrooms && classrooms.length > 0 ? (
                            classrooms.map((room) => (
                              <option key={room._id} value={room._id}>
                                {room.name}
                              </option>
                            ))
                          ) : (
                            <option disabled>No classrooms available</option>
                          )}
                        </select>
                      </div>

                      <div className="pt-4 flex flex-col sm:flex-row-reverse sm:space-x-4 space-y-3 sm:space-y-0 sm:space-x-reverse">
                        <Button
                          type="submit"
                          className="w-full sm:w-auto"
                          disabled={createSubjectMutation.isPending}
                        >
                          {createSubjectMutation.isPending ? (
                            <>
                              <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Creating...
                          </>
                        ) : (
                          'Create Subject'
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setShowCreateForm(false);
                          setName('');
                          setFaculty('');
                          setClassroom('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>All fields marked with <span className="text-red-500">*</span> are required</p>
        </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateSubject;