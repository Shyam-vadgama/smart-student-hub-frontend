import React from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface CreateStudentProps {
  newStudentName: string;
  setNewStudentName: (name: string) => void;
  newStudentEmail: string;
  setNewStudentEmail: (email: string) => void;
  handleCreateStudent: (e: React.FormEvent) => void;
  createStudentMutation: {
    isPending: boolean;
  };
}

const CreateStudent: React.FC<CreateStudentProps> = ({ 
  newStudentName, 
  setNewStudentName, 
  newStudentEmail, 
  setNewStudentEmail, 
  handleCreateStudent, 
  createStudentMutation 
}) => {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
          <UserPlus className="w-6 h-6 text-blue-600" />
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
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
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
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
            placeholder="Enter student email"
          />
        </div>
        <Button
          type="submit"
          className="w-full flex justify-center items-center py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white"
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
  );
};

export default CreateStudent;