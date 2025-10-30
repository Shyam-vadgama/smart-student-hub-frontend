// src/pages/HODDashboard.tsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Link, Trash2 } from "lucide-react";
import StudentManagement from "@/components/StudentManagement"; // New import

const HODDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newFacultyEmail, setNewFacultyEmail] = useState('');

  // Fetch all faculty
  const { data: faculty, isLoading: isLoadingFaculty } = useQuery<User[]>({
    queryKey: ['/api/users/faculty'],
    queryFn: () => apiRequest('GET', '/api/users/faculty').then((res) => res.json()),
    enabled: !!user && user.role === 'hod'
  });

  // Mutation to create a new faculty member and send a password reset email
  const createFacultyMutation = useMutation({
    mutationFn: (data: { name: string; email: string }) =>
      apiRequest('POST', '/api/users/create-faculty', data),
    onSuccess: (response) => {
      toast({ 
        title: 'Faculty created successfully',
        description: response.message || 'An email has been sent to the new faculty member to set their password.',
      });
      setNewFacultyName('');
      setNewFacultyEmail('');
      queryClient.invalidateQueries({ queryKey: ['/api/users/faculty'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating faculty',
        description: error.message || 'An error occurred while creating the faculty.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for resending a password reset link
  const resendPasswordLinkMutation = useMutation({
    mutationFn: (email: string) => 
      apiRequest('POST', '/api/users/resend-password-link', { email }),
    onSuccess: () => {
      toast({
        title: 'Password link sent',
        description: 'A new password reset link has been sent to the user.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error sending link',
        description: error.message || 'Failed to send password reset link.',
        variant: 'destructive',
      });
    },
  });

  // Mutation to delete a user (faculty or student)
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest('DELETE', `/api/users/${userId}`),
    onSuccess: () => {
      toast({
        title: 'User deleted',
        description: 'The user has been removed from the system.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/faculty'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/students'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting user',
        description: error.message || 'Failed to delete user.',
        variant: 'destructive',
      });
    },
  });


  const handleCreateFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacultyName.trim() || !newFacultyEmail.trim()) {
      toast({ 
        title: 'Validation Error',
        description: 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }
    createFacultyMutation.mutate({ name: newFacultyName, email: newFacultyEmail });
  };

  // Function to get user initials
  const getUserInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2);
  };
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="HOD Dashboard" 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Head of Department Dashboard</h1>
              <p className="text-gray-600">Manage faculty and department resources</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Faculty Form */}
              <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <UserPlus className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Create New Faculty</h2>
                </div>
                
                <form onSubmit={handleCreateFaculty} className="space-y-5">
                  <div>
                    <label htmlFor="faculty-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      id="faculty-name"
                      value={newFacultyName}
                      onChange={(e) => setNewFacultyName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                      placeholder="Enter faculty name"
                    />
                  </div>
                  <div>
                    <label htmlFor="faculty-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      id="faculty-email"
                      value={newFacultyEmail}
                      onChange={(e) => setNewFacultyEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                      placeholder="Enter faculty email"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full flex justify-center items-center py-3 px-4"
                    disabled={createFacultyMutation.isPending}
                  >
                    {createFacultyMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                    </>
                    ) : (
                      'Create Faculty'
                    )}
                  </Button>
                </form>
              </div>

              {/* Faculty List */}
              <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Manage Faculty</h2>
                </div>
                
                {isLoadingFaculty ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : faculty && faculty.length > 0 ? (
                  <div className="space-y-4">
                    {faculty.map((f) => (
                      <div key={f._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition duration-200 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                            <span className="text-sm font-bold text-indigo-800">
                              {getUserInitials(f.name)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{f.name}</p>
                            <p className="text-sm text-gray-500">{f.email}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleResendLink(f.email)}
                            disabled={resendPasswordLinkMutation.isPending}
                          >
                            <Link className="h-4 w-4 mr-1" />
                            Resend
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDeleteUser(f._id)}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Users className="mx-auto h-12 w-12" />
                  </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No faculty found</h3>
                    <p className="text-gray-500">Get started by creating a new faculty member.</p>
                  </div>
                )}
              </div>
            </div>
            {/* Student management section */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Student Form */}
              <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <UserPlus className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Create New Student</h2>
                </div>
                
                <form onSubmit={handleCreateStudent} className="space-y-5">
                  <div>
                    <label htmlFor="student-name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      id="student-name"
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                      placeholder="Enter student name"
                    />
                  </div>
                  <div>
                    <label htmlFor="student-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      id="student-email"
                      value={newStudentEmail}
                      onChange={(e) => setNewStudentEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                      placeholder="Enter student email"
                    />
                  </div>
                  {/* Classroom dropdown has been removed from here */}
                  <Button
                    type="submit"
                    className="w-full flex justify-center items-center py-3 px-4"
                    disabled={createStudentMutation.isPending}
                  >
                    {createStudentMutation.isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                    </>
                    ) : (
                      'Create Student'
                    )}
                  </Button>
                </form>
              </div>

              {/* Student List */}
              <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Manage Students</h2>
                </div>
                
                {isLoadingStudents ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : students && students.length > 0 ? (
                  <div className="space-y-4">
                    {students.map((s) => (
                      <div key={s._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition duration-200 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                            <span className="text-sm font-bold text-indigo-800">
                              {getUserInitials(s.name)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{s.name}</p>
                            <p className="text-sm text-gray-500">{s.email}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleResendLink(s.email)}
                            disabled={resendPasswordLinkMutation.isPending}
                          >
                            <Link className="h-4 w-4 mr-1" />
                            Resend
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => handleDeleteUser(s._id)}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Users className="mx-auto h-12 w-12" />
                  </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
                    <p className="text-gray-500">Get started by creating a new student.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StudentManagement;