import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const CreatePrincipal: React.FC = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [collegeId, setCollegeId] = useState("");

  // Mutation
  const mutation = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/users/create-principal", {
        name,
        email,
        collegeId,
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Principal created successfully!",
      });
      setName("");
      setEmail("");
      setCollegeId("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create principal",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded-2xl">
      <h2 className="text-xl font-semibold mb-4">Create Principal</h2>

      <input
        type="text"
        placeholder="Principal Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border p-2 mb-3 rounded"
      />
      <input
        type="email"
        placeholder="Principal Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full border p-2 mb-3 rounded"
      />
      <input
        type="text"
        placeholder="College ID"
        value={collegeId}
        onChange={(e) => setCollegeId(e.target.value)}
        className="w-full border p-2 mb-3 rounded"
      />

      {/* Button */}
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isLoading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {mutation.isLoading ? "Creating..." : "Create Principal"}
      </button>
    </div>
  );
};

export default CreatePrincipal;
