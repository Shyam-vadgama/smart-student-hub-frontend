import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';

const CreateCollege: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [principal, setPrincipal] = useState('');
  const [createNewPrincipal, setCreateNewPrincipal] = useState(false);
  const [principalName, setPrincipalName] = useState('');
  const [principalEmail, setPrincipalEmail] = useState('');

  // Fetch all users
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
    queryFn: () => apiRequest('GET', '/api/users').then((res) => res.json()),
  });

  // Mutation for creating a college
  const createCollegeMutation = useMutation({
    mutationFn: (newCollege: { name: string; address: string; principal: string }) =>
      apiRequest('POST', '/api/colleges', newCollege).then((res) => res.json()),

    onSuccess: () => {
      toast({ 
        title: 'College created successfully',
        description: `${name} has been added to the system.`,
      });

      setName('');
      setAddress('');
      setPrincipal('');
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/colleges'] });
    },

    onError: (error: any) => {
      toast({
        title: 'Error creating college',
        description: error.message || 'An error occurred while creating the college.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for creating a principal
  const createPrincipalMutation = useMutation({
    mutationFn: (payload: { name: string; email: string }) =>
      apiRequest('POST', '/api/users/create-principal', payload).then((res) => res.json()),
    onSuccess: (data) => {
      toast({
        title: 'Principal created successfully',
        description: `${data.name} has been added as a principal.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating principal',
        description: error.message || 'An error occurred while creating the principal.',
        variant: 'destructive',
      });
    },
  });

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!name || !address) {
        toast({ 
          title: 'Validation Error', 
          description: 'College name and address are required fields.',
          variant: 'destructive' 
        });
        return;
      }

      let principalId = principal;

      if (createNewPrincipal) {
        if (!principalName || !principalEmail) {
          toast({ 
            title: 'Validation Error', 
            description: 'Principal name and email are required.',
            variant: 'destructive' 
          });
          return;
        }
        const created = await createPrincipalMutation.mutateAsync({ name: principalName, email: principalEmail });
        principalId = created?.user?._id || created?._id || '';
        if (!principalId) {
          toast({ 
            title: 'Error', 
            description: 'Failed to determine principal ID after creation.',
            variant: 'destructive' 
          });
          return;
        }
      } else {
        if (!principal) {
          toast({ 
            title: 'Validation Error', 
            description: 'Please select a principal for the college.',
            variant: 'destructive' 
          });
          return;
        }
      }

      await createCollegeMutation.mutateAsync({ name, address, principal: principalId });
      // Reset local inline principal fields
      setCreateNewPrincipal(false);
      setPrincipalName('');
      setPrincipalEmail('');
    } catch (err: any) {
      // Errors are toasted in respective mutations
    }
  };

  // Filter users to get only principals
  const principals = users?.filter(user => user.role === 'principal') || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Create New College</h1>
          <p className="text-gray-600">Add a new college to the system and assign a principal</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* College Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  College Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  placeholder="Enter college name"
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                  placeholder="Enter college address"
                  required
                />
              </div>

              {/* Principal Section */}
              <div className="bg-gray-50 p-5 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-0">
                    Principal Assignment <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCreateNewPrincipal(!createNewPrincipal)}
                    className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition duration-200"
                  >
                    {createNewPrincipal ? 'Select Existing Principal' : 'Create New Principal'}
                  </button>
                </div>

                {!createNewPrincipal ? (
                  <div>
                    <select
                      id="principal"
                      value={principal}
                      onChange={(e) => setPrincipal(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                      required
                    >
                      <option value="">Select a Principal</option>
                      {isLoadingUsers ? (
                        <option disabled>Loading principals...</option>
                      ) : principals.length === 0 ? (
                        <option disabled>No principals available</option>
                      ) : (
                        principals.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} ({user.email})
                          </option>
                        ))
                      )}
                    </select>
                    {principals.length === 0 && !isLoadingUsers && (
                      <p className="mt-2 text-sm text-gray-500">
                        No principals available. Please create a new principal.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="principalName" className="block text-sm font-medium text-gray-700 mb-1">
                        Principal Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="principalName"
                        value={principalName}
                        onChange={(e) => setPrincipalName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                        placeholder="Enter principal's full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="principalEmail" className="block text-sm font-medium text-gray-700 mb-1">
                        Principal Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        id="principalEmail"
                        value={principalEmail}
                        onChange={(e) => setPrincipalEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                        placeholder="Enter principal's email address"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex justify-center items-center py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={createCollegeMutation.isPending || createPrincipalMutation.isPending}
                >
                  {createCollegeMutation.isPending || createPrincipalMutation.isPending ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    'Create College'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>All fields marked with <span className="text-red-500">*</span> are required</p>
        </div>
      </div>
    </div>
  );
};

export default CreateCollege;