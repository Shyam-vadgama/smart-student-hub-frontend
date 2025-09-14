import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface ExampleCase {
  input: string;
  output: string;
  explanation: string;
}

interface TestCase {
  input: string;
  output: string;
}

export default function LeetCodeCreatePage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "easy",
    input_format: "",
    output_format: "",
    constraints: [""],
    example_cases: [{ input: "", output: "", explanation: "" }],
    test_cases: [{ input: "", output: "" }],
    solution: {
      c: "",
      cpp: "",
      java: "",
      python: ""
    }
  });

  const createProblemMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/leetcode/problems/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create problem');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leetcode/problems"] });
      toast({
        title: "Success",
        description: "Problem created successfully!",
      });
      setLocation('/leetcode');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create problem",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConstraintChange = (index: number, value: string) => {
    const newConstraints = [...formData.constraints];
    newConstraints[index] = value;
    setFormData(prev => ({
      ...prev,
      constraints: newConstraints
    }));
  };

  const addConstraint = () => {
    setFormData(prev => ({
      ...prev,
      constraints: [...prev.constraints, ""]
    }));
  };

  const removeConstraint = (index: number) => {
    if (formData.constraints.length > 1) {
      const newConstraints = formData.constraints.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        constraints: newConstraints
      }));
    }
  };

  const handleExampleCaseChange = (index: number, field: keyof ExampleCase, value: string) => {
    const newExampleCases = [...formData.example_cases];
    newExampleCases[index] = { ...newExampleCases[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      example_cases: newExampleCases
    }));
  };

  const addExampleCase = () => {
    setFormData(prev => ({
      ...prev,
      example_cases: [...prev.example_cases, { input: "", output: "", explanation: "" }]
    }));
  };

  const removeExampleCase = (index: number) => {
    if (formData.example_cases.length > 1) {
      const newExampleCases = formData.example_cases.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        example_cases: newExampleCases
      }));
    }
  };

  const handleTestCaseChange = (index: number, field: keyof TestCase, value: string) => {
    const newTestCases = [...formData.test_cases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      test_cases: newTestCases
    }));
  };

  const addTestCase = () => {
    setFormData(prev => ({
      ...prev,
      test_cases: [...prev.test_cases, { input: "", output: "" }]
    }));
  };

  const removeTestCase = (index: number) => {
    if (formData.test_cases.length > 1) {
      const newTestCases = formData.test_cases.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        test_cases: newTestCases
      }));
    }
  };

  const handleSolutionChange = (language: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      solution: {
        ...prev.solution,
        [language]: value
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty constraints
    const filteredConstraints = formData.constraints.filter(c => c.trim() !== "");
    
    if (filteredConstraints.length === 0) {
      toast({
        title: "Error",
        description: "At least one constraint is required",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      constraints: filteredConstraints
    };

    createProblemMutation.mutate(submitData);
  };

  if (!user || (user.role !== 'faculty' && user.role !== 'hod')) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Access Denied" 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-foreground mb-2">Access Denied</h3>
              <p className="text-muted-foreground mb-4">Only faculty and HOD can create problems.</p>
              <Button onClick={() => setLocation('/leetcode')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Problems
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Create Problem" 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="outline" onClick={() => setLocation('/leetcode')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Problem Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter problem title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => handleInputChange('difficulty', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Problem Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the problem..."
                    rows={6}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Input/Output Format</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="input_format">Input Format</Label>
                  <Textarea
                    id="input_format"
                    value={formData.input_format}
                    onChange={(e) => handleInputChange('input_format', e.target.value)}
                    placeholder="Describe the input format..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="output_format">Output Format</Label>
                  <Textarea
                    id="output_format"
                    value={formData.output_format}
                    onChange={(e) => handleInputChange('output_format', e.target.value)}
                    placeholder="Describe the output format..."
                    rows={3}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Constraints</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.constraints.map((constraint, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Input
                      value={constraint}
                      onChange={(e) => handleConstraintChange(index, e.target.value)}
                      placeholder="Enter constraint"
                      required
                    />
                    {formData.constraints.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeConstraint(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addConstraint}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Constraint
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Example Cases</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.example_cases.map((example, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Example {index + 1}</h4>
                      {formData.example_cases.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeExampleCase(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Input</Label>
                        <Textarea
                          value={example.input}
                          onChange={(e) => handleExampleCaseChange(index, 'input', e.target.value)}
                          placeholder="Example input"
                          rows={2}
                          required
                        />
                      </div>
                      <div>
                        <Label>Output</Label>
                        <Textarea
                          value={example.output}
                          onChange={(e) => handleExampleCaseChange(index, 'output', e.target.value)}
                          placeholder="Expected output"
                          rows={2}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Explanation</Label>
                      <Textarea
                        value={example.explanation}
                        onChange={(e) => handleExampleCaseChange(index, 'explanation', e.target.value)}
                        placeholder="Explain the example (optional)"
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addExampleCase}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Example Case
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test Cases</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.test_cases.map((testCase, index) => (
                  <div key={index} className="space-y-2 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Test Case {index + 1}</h4>
                      {formData.test_cases.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeTestCase(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Input</Label>
                        <Textarea
                          value={testCase.input}
                          onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                          placeholder="Test input"
                          rows={2}
                          required
                        />
                      </div>
                      <div>
                        <Label>Output</Label>
                        <Textarea
                          value={testCase.output}
                          onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                          placeholder="Expected output"
                          rows={2}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addTestCase}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Test Case
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Solutions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(formData.solution).map(([language, code]) => (
                  <div key={language}>
                    <Label className="capitalize">{language} Solution</Label>
                    <Textarea
                      value={code}
                      onChange={(e) => handleSolutionChange(language, e.target.value)}
                      placeholder={`Enter ${language} solution...`}
                      rows={6}
                      className="font-mono"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => setLocation('/leetcode')}>
                Cancel
              </Button>
              <Button type="submit" disabled={createProblemMutation.isPending}>
                {createProblemMutation.isPending ? "Creating..." : "Create Problem"}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
