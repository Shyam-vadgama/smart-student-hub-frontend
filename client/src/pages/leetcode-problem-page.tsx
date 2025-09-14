import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, ArrowLeft, Play, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function LeetCodeProblemPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/leetcode/problems/:id");
  const problemId = params?.id;

  const [code, setCode] = useState(`// Write your solution here
function solution() {
    // Your code goes here
    return;
}`);

  const [language, setLanguage] = useState('javascript');
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');

  // Fetch problem details
  const { data: problem, isLoading } = useQuery({
    queryKey: ["/api/leetcode/problems", problemId],
    queryFn: async () => {
      if (!problemId) return null;
      const res = await fetch(`/api/leetcode/problems/${problemId}`, { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.success ? data.data : null;
    },
    enabled: !!problemId
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'hard': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('Running your code...');
    
    // Simulate code execution
    setTimeout(() => {
      setOutput('Code executed successfully!\nOutput: Hello World');
      setIsRunning(false);
    }, 2000);
  };

  const handleSubmitCode = async () => {
    setIsRunning(true);
    setOutput('Submitting your solution...');
    
    // Simulate submission
    setTimeout(() => {
      setOutput('Solution submitted successfully!\nAll test cases passed!');
      setIsRunning(false);
    }, 3000);
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Loading..." 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title="Problem Not Found" 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-foreground mb-2">Problem not found</h3>
              <p className="text-muted-foreground mb-4">The problem you're looking for doesn't exist.</p>
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
          title={problem.title} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="outline" onClick={() => setLocation('/leetcode')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Badge className={getDifficultyColor(problem.difficulty)}>
              {problem.difficulty}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Problem Description */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Problem Description</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <p>{problem.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Input Format:</h4>
                    <pre className="bg-muted p-3 rounded text-sm">{problem.input_format}</pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Output Format:</h4>
                    <pre className="bg-muted p-3 rounded text-sm">{problem.output_format}</pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Constraints:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {problem.constraints.map((constraint: string, index: number) => (
                        <li key={index} className="text-sm">{constraint}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Example Cases</CardTitle>
                </CardHeader>
                <CardContent>
                  {problem.example_cases.map((example: any, index: number) => (
                    <div key={index} className="mb-4 last:mb-0">
                      <h4 className="font-medium mb-2">Example {index + 1}:</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Input:</span>
                          <pre className="bg-muted p-2 rounded text-sm mt-1">{example.input}</pre>
                        </div>
                        <div>
                          <span className="font-medium">Output:</span>
                          <pre className="bg-muted p-2 rounded text-sm mt-1">{example.output}</pre>
                        </div>
                        {example.explanation && (
                          <div>
                            <span className="font-medium">Explanation:</span>
                            <p className="text-sm mt-1">{example.explanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Code Editor */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Code Editor</CardTitle>
                    <div className="flex items-center space-x-2">
                      <select 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value)}
                        className="px-3 py-1 border rounded text-sm"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                      </select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-64 p-4 border rounded font-mono text-sm bg-background"
                    placeholder="Write your solution here..."
                  />
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Button 
                      onClick={handleRunCode} 
                      disabled={isRunning}
                      variant="outline"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Run Code
                    </Button>
                    <Button 
                      onClick={handleSubmitCode} 
                      disabled={isRunning}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Submit
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Output</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded text-sm min-h-[100px] whitespace-pre-wrap">
                    {output || "Run your code to see output here..."}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
