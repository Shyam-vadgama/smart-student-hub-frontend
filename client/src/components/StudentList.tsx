import React from 'react';
import { Button } from "@/components/ui/button";
import { User, Users, Link, Trash2 } from "lucide-react";

interface StudentListProps {
  students: User[];
  isLoading: boolean;
  handleResendLink: (email: string) => void;
  handleDeleteUser: (userId: string) => void;
  resendPasswordLinkMutation: {
    isPending: boolean;
  };
  deleteUserMutation: {
    isPending: boolean;
  };
  getUserInitials: (name: string) => string;
}

const StudentList: React.FC<StudentListProps> = ({ 
  students, 
  isLoading, 
  handleResendLink, 
  handleDeleteUser, 
  resendPasswordLinkMutation, 
  deleteUserMutation, 
  getUserInitials 
}) => {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Manage Students</h2>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : students && students.length > 0 ? (
        <div className="space-y-4">
          {students.map((s) => (
            <div key={s._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition duration-200 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-sm font-bold text-blue-800">
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
  );
};

export default StudentList;