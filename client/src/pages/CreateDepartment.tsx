import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const CreateDepartment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // States for the main form
  const [departmentName, setDepartmentName] = useState('');
  const [hodName, setHodName] = useState('');
  const [hodEmail, setHodEmail] = useState('');

  // Fetch colleges dynamically
  const { data: colleges = [], isLoading: collegesLoading } = useQuery({
    queryKey: ['colleges'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/colleges');
      return res.json();
    },
  });

  // This mutation handles the combined department and HOD creation
  const createDepartmentWithHodMutation = useMutation({
    mutationFn: async (data) =>
      apiRequest('POST', '/api/departments/create-with-hod', data),
    onSuccess: (response) => {
      toast({ title: response.message || 'Department created successfully' });
      // Reset form fields
      setDepartmentName('');
      setHodName('');
      setHodEmail('');
      // Invalidate queries to refresh department and user lists
      queryClient.invalidateQueries(['departments']);
      queryClient.invalidateQueries(['users']);
    },
    onError: (err) => {
      toast({
        title: 'Error creating department',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!departmentName || !hodName || !hodEmail) {
      toast({
        title: 'All fields are required',
        variant: 'destructive',
      });
      return;
    }
    // Call the combined mutation
    createDepartmentWithHodMutation.mutate({
      departmentName,
      hodName,
      hodEmail,
    });
  };

  if (collegesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        Loading colleges...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Create Department with HOD
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Department Name
            </label>
            <input
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              className="mt-1 block w-full border p-2 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., Computer Science"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              HOD Full Name
            </label>
            <input
              value={hodName}
              onChange={(e) => setHodName(e.target.value)}
              className="mt-1 block w-full border p-2 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              HOD Email
            </label>
            <input
              type="email"
              value={hodEmail}
              onChange={(e) => setHodEmail(e.target.value)}
              className="mt-1 block w-full border p-2 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g., jane.doe@college.edu"
            />
          </div>

          <button
            type="submit"
            disabled={createDepartmentWithHodMutation.isLoading}
            className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            {createDepartmentWithHodMutation.isLoading
              ? 'Creating...'
              : 'Create Department & HOD'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateDepartment;
