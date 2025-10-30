import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Trophy, Clock, CheckCircle, Star } from "lucide-react";
import { useLocation } from "wouter";

export default function LeetCodePage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [, setLocation] = useLocation();

  let redirectPath = null;
  if (user?.department) {
    const dept = user.department.toLowerCase();
    const isCodingDept = ['cs', 'it', 'cse', 'computer science', 'computer engineering', 'information technology'].includes(dept);
    if (!isCodingDept) {
      if (['me', 'mechanical'].includes(dept)) {
        redirectPath = '/quiz';
      } else if (['ee', 'electrical', 'ec', 'ece', 'electronics', 'electronics & communication'].includes(dept)) {
        redirectPath = '/circuit';
      } else if (['bba'].includes(dept)) {
        redirectPath = '/stock-trading';
      } else if (['bcom'].includes(dept)) {
        redirectPath = '/';
      }
    }
  }

  useEffect(() => {
    if (redirectPath) {
      setLocation(redirectPath);
    }
  }, [redirectPath, setLocation]);

  if (redirectPath) {
    return null;
  }

  // Fetch problems
  const { data: problems = [], isLoading } = useQuery({
    queryKey: ["/api/leetcode/problems"],
    queryFn: async () => {
      const res = await fetch('/api/leetcode/problems', { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      return data.success ? data.data : [];
    },
    enabled: !!user
  });

  // Fetch solved problems for current user
  const { data: solvedProblems = [] } = useQuery({
    queryKey: ["/api/leetcode/problems/solved", user?._id],
    queryFn: async () => {
      if (!user?._id) return [];
      const res = await fetch(`/api/leetcode/problems/solved/${user._id}`, { credentials: 'include' });
      if (!res.ok) return [];
      const data = await res.json();
      return data.success ? data.data : [];
    },
    enabled: !!user?._id
  });

  // Fetch badge information
  const { data: badge } = useQuery({
    queryKey: ["/api/leetcode/badge", user?._id],
    queryFn: async () => {
      if (!user?._id) return null;
      const res = await fetch('/api/leetcode/badge', { credentials: 'include' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.success ? data.data : null;
    },
    enabled: !!user?._id
  });

  const solvedProblemIds = new Set(solvedProblems);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'hard': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleProblemClick = (problemId: string) => {
    setLocation(`/leetcode/problems/${problemId}`);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Code Problems" 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Coding Problems</h2>
              <p className="text-muted-foreground mt-1">
                Practice coding problems to improve your programming skills
              </p>
            </div>
            {user.role === 'faculty' || user.role === 'hod' ? (
              <div className="flex gap-2">
                <Button onClick={() => setLocation('/leetcode/create')}>
                  <Code className="mr-2 h-4 w-4" />
                  Create Problem
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation('/leetcode/create?ai=1&difficulty=easy&category=Arrays')}
                  title="Auto-generate a problem with AI"
                >
                  <Code className="mr-2 h-4 w-4" />
                  Generate with AI
                </Button>
              </div>
            ) : null}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{problems.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Solved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{solvedProblems.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Badge</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{badge?.level || 'Beginner'}</div>
                <p className="text-xs text-muted-foreground">
                  {badge?.points || 0} points
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {problems.length > 0 ? Math.round((solvedProblems.length / problems.length) * 100) : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Problems List */}
          <Card>
            <CardHeader>
              <CardTitle>Problems</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg"></div>
                  ))}
                </div>
              ) : problems.length === 0 ? (
                <div className="text-center py-12">
                  <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No problems available</h3>
                  <p className="text-muted-foreground">
                    {user.role === 'faculty' || user.role === 'hod' 
                      ? "Create your first coding problem to get started."
                      : "No coding problems have been added yet."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {problems.map((problem: any, index: number) => (
                    <div
                      key={problem._id}
                      onClick={() => handleProblemClick(problem._id)}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-lg font-medium text-muted-foreground">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{problem.title}</h3>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge className={getDifficultyColor(problem.difficulty)}>
                          {problem.difficulty}
                        </Badge>
                        {solvedProblemIds.has(problem._id) && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}