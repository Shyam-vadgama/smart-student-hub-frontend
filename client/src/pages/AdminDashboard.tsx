import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { College } from '@shared/schema';
import { Link } from 'wouter';

const AdminDashboard: React.FC = () => {
  const { data: colleges, isLoading, error } = useQuery<College[]>(['/api/colleges'], () =>
    apiRequest('GET', '/api/colleges').then((res) => res.json())
  );

  if (isLoading) return <div>Loading colleges...</div>;
  if (error) return <div>Error loading colleges: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <Link href="/create-college">
        <a className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 mb-4">
          Create New College
        </a>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colleges?.map((college) => (
          <div key={college._id} className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2">{college.name}</h2>
            <p className="text-gray-600">{college.address}</p>
            <p className="text-gray-600">Principal ID: {college.principal}</p>
            <Link href={`/college/${college._id}`}>
              <a className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                View Details
              </a>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
