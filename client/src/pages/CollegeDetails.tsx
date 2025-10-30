import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { College, Department, User } from '@shared/schema';
import { useParams, Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface CollegeDetailsData extends College {
  departments: (Department & { hod: User | null })[];
  users: {
    principals: User[];
    hods: User[];
    faculty: User[];
    students: User[];
  };
}

const CollegeDetails: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams();
  const collegeId = params.id;
  const [principalEmail, setPrincipalEmail] = useState('');

  const { data: collegeDetails, isLoading, error } = useQuery<CollegeDetailsData>(
    ['/api/colleges', collegeId],
    () => apiRequest('GET', `/api/colleges/${collegeId}`).then((res) => res.json())
  );

  const assignPrincipalMutation = useMutation(
    (data: { name: string; email: string; collegeId: string }) =>
      apiRequest('POST', '/api/users/create-principal', data),
    {
      onSuccess: () => {
        toast({ title: 'Principal assigned successfully. Password reset link sent.' });
        setPrincipalEmail('');
        queryClient.invalidateQueries(['/api/colleges', collegeId]); // Refetch college details
      },
      onError: (error: any) => {
        toast({
          title: 'Error assigning principal',
          description: error.message,
          variant: 'destructive',
        });
      },
    }
  );

  const handleAssignPrincipal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!principalEmail) {
      toast({ title: 'Principal email is required', variant: 'destructive' });
      return;
    }
    // Assuming the principal's name can be derived from the email or is not strictly needed for this call
    assignPrincipalMutation.mutate({ name: principalEmail.split('@')[0], email: principalEmail, collegeId });
  };

  if (isLoading) return <div>Loading college details...</div>;
  if (error) return <div>Error loading college details: {error.message}</div>;
  if (!collegeDetails) return <div>College not found.</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{collegeDetails.name}</h1>
      <p className="text-gray-600 mb-2">Address: {collegeDetails.address}</p>
      <p className="text-gray-600 mb-4">Principal: {collegeDetails.principal ? collegeDetails.users.principals.find(p => p._id === collegeDetails.principal)?.name : 'Not Assigned'}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Departments ({collegeDetails.departments.length})</h2>
          {collegeDetails.departments.length > 0 ? (
            <ul className="list-disc list-inside">
              {collegeDetails.departments.map(dept => (
                <li key={dept._id}>
                  {dept.name} (HOD: {dept.hod ? dept.hod.name : 'Not Assigned'})
                </li>
              ))}
            </ul>
          ) : (
            <p>No departments found.</p>
          )}
          <Link href={`/create-department?collegeId=${collegeId}`}>
            <a className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              Create Department
            </a>
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Users in College</h2>
          <p>HODs: {collegeDetails.users.hods.length}</p>
          <p>Faculty: {collegeDetails.users.faculty.length}</p>
          <p>Students: {collegeDetails.users.students.length}</p>
          {/* Assign Principal Form */}
          {!collegeDetails.principal && (
            <form onSubmit={handleAssignPrincipal} className="mt-4 space-y-2">
              <div>
                <label htmlFor="principalEmail" className="block text-sm font-medium text-gray-700">
                  Assign Principal (Email)
                </label>
                <input
                  type="email"
                  id="principalEmail"
                  value={principalEmail}
                  onChange={(e) => setPrincipalEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="principal@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-purple-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                disabled={assignPrincipalMutation.isLoading}
              >
                {assignPrincipalMutation.isLoading ? 'Assigning...' : 'Assign Principal'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollegeDetails;
