import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Subject, Classroom } from '@shared/schema';
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, BookOpen, Home } from "lucide-react";

const CreateClassroom: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [name, setName] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [showCreateSubject, setShowCreateSubject] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch all subjects
  const { data: allSubjects, isLoading: isLoadingSubjects } = useQuery<Subject[]>({
    queryKey: ['/api/subjects'],
    queryFn: () => apiRequest('GET', '/api/subjects').then((res) => res.json()),
  });

  // Fetch all classrooms
  const { data: classrooms, isLoading: isLoadingClassrooms } = useQuery<Classroom[]>({
    queryKey: ['/api/classrooms'],
    queryFn: () => apiRequest('GET', '/api/classrooms').then((res) => res.json()),
  });

  // Create classroom mutation
  const createClassroomMutation = useMutation({
    mutationFn: (data: { name: string; subjects: string[] }) =>
      apiRequest('POST', '/api/classrooms', data),
    onSuccess: () => {
      toast({
        title: 'Classroom created successfully',
        description: `${name} has been added to the system.`,
      });
      setName('');
      setSubjects([]);
      setShowCreateForm(false);
      // Refresh classrooms list
      queryClient.invalidateQueries({ queryKey: ['/api/classrooms'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating classroom',
        description: error.message || 'An error occurred while creating the classroom.',
        variant: 'destructive',
      });
    },
  });

  // Create subject mutation
  const createSubjectMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      apiRequest('POST', '/api/subjects', data),
    onSuccess: (newSubject) => {
      toast({
        title: 'Subject created successfully',
        description: `${newSubject.name} has been added to the system.`,
      });
      setNewSubjectName('');
      setShowCreateSubject(false);
      // Invalidate subjects query to refresh the list
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

  const handleSubjectChange = (subjectId: string) => {
    setSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Classroom name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (subjects.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one subject.',
        variant: 'destructive',
      });
      return;
    }

    createClassroomMutation.mutate({ name, subjects });
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSubjectName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Subject name is required.',
        variant: 'destructive',
      });
      return;
    }

    createSubjectMutation.mutate({ name: newSubjectName });
  };

  // Function to get subject names by IDs
  const getSubjectNames = (subjectIds: string[]) => {
    if (!allSubjects) return [];
    return subjectIds.map(id => {
      const subject = allSubjects.find(subj => subj._id === id);
      return subject ? subject.name : 'Unknown Subject';
    });
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="Create Classroom"
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Classroom Management</h1>
              <p className="text-gray-600">View existing classrooms and create new ones</p>
            </div>

            {/* Existing Classrooms Section */}
            <div className="mb-12">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0">Existing Classrooms</h2>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-gray-100 text-gray-800">
                    {classrooms?.length || 0} classrooms
                  </Badge>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Classroom
                  </Button>
                </div>
              </div>

              {isLoadingClassrooms ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : classrooms && classrooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classrooms.map((classroom) => (
                    <div key={classroom._id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-800 truncate">{classroom.name}</h3>
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                            Active
                          </Badge>
                        </div>

                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Subjects</h4>
                          <div className="flex flex-wrap gap-2">
                            {getSubjectNames(classroom.subjects).map((subjectName, index) => (
                              <Badge key={index} className="bg-blue-100 text-blue-800">
                                {subjectName}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>{classroom.subjects.length} subjects</span>
                          <span>ID: {classroom._id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <Home className="mx-auto h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No classrooms found</h3>
                  <p className="text-gray-500 mb-4">Get started by creating a new classroom.</p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Classroom
                  </Button>
                </div>
              )}
            </div>

            {/* Create Classroom Modal/Form Card */}
            {showCreateForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">Create New Classroom</h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowCreateForm(false);
                          setName('');
                          setSubjects([]);
                          setShowCreateSubject(false);
                          setNewSubjectName('');
                        }}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Classroom Name */}
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Classroom Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                          placeholder="Enter classroom name"
                        />
                      </div>

                      {/* Subjects Section */}
                      <div className="bg-gray-50 p-5 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-0">
                            Subjects <span className="text-red-500">*</span>
                          </label>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {subjects.length} selected
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowCreateSubject(!showCreateSubject)}
                              className="px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition duration-200"
                            >
                              {showCreateSubject ? 'Cancel' : 'Add New Subject'}
                            </button>
                          </div>
                        </div>

                        {/* Create New Subject Form */}
                        {showCreateSubject && (
                          <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Create New Subject</h3>
                            <form onSubmit={handleCreateSubject} className="flex space-x-2">
                              <input
                                type="text"
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                                placeholder="Enter subject name"
                              />
                              <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                disabled={createSubjectMutation.isPending}
                              >
                                {createSubjectMutation.isPending ? 'Creating...' : 'Add'}
                              </button>
                            </form>
                          </div>
                        )}

                        {/* Subjects List */}
                        {isLoadingSubjects ? (
                          <div className="flex justify-center items-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                          </div>
                        ) : allSubjects && allSubjects.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {allSubjects.map((subject) => (
                              <div
                                key={subject._id}
                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition duration-200 ${
                                  subjects.includes(subject._id)
                                    ? 'bg-indigo-50 border-indigo-300'
                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                                onClick={() => handleSubjectChange(subject._id)}
                              >
                                <input
                                  type="checkbox"
                                  id={subject._id}
                                  checked={subjects.includes(subject._id)}
                                  onChange={() => handleSubjectChange(subject._id)}
                                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <label htmlFor={subject._id} className="ml-3 block text-sm text-gray-900 font-medium">
                                  {subject.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500">No subjects available. Please create subjects first.</p>
                          </div>
                        )}
                      </div>

                      {/* Submit Button */}
                      <div className="pt-4 flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false);
                            setName('');
                            setSubjects([]);
                            setShowCreateSubject(false);
                            setNewSubjectName('');
                          }}
                          className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition duration-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 flex justify-center items-center py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
                          disabled={createClassroomMutation.isPending}
                        >
                          {createClassroomMutation.isPending ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Creating...
                            </>
                          ) : (
                            'Create Classroom'
                          )}
                        </button>
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

export default CreateClassroom;