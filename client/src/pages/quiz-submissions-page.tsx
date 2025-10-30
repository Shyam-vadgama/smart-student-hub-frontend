import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AlertCircle, RefreshCw, User, Calendar, FileText } from "lucide-react";
import * as XLSX from 'xlsx';

export default function QuizSubmissionsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [, params] = useRoute("/quiz/:id/submissions");
  const quizId = params?.id;
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const isFaculty = user?.role === 'faculty' || user?.role === 'hod';

  // Function to log detailed error information
  const logErrorDetails = (err: any, response?: Response) => {
    console.group("🔴 Quiz Submissions Error Details");
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack);
    
    if (response) {
      console.error("Response Status:", response.status);
      console.error("Response Headers:", response.headers);
      
      // Log all response headers
      response.headers.forEach((value, name) => {
        console.error(`Header: ${name} = ${value}`);
      });
    }
    
    console.error("Quiz ID:", quizId);
    console.error("User Role:", user?.role);
    console.error("Is Faculty:", isFaculty);
    console.error("Current URL:", window.location.href);
    console.groupEnd();
  };

  useEffect(() => {
    if (!isFaculty) { 
      setLocation('/'); 
      return; 
    }
    
    if (!quizId) {
      const err = "Quiz ID is missing";
      setError(err);
      setDebugInfo({ quizId, isFaculty, userRole: user?.role });
      console.error(err, { quizId, isFaculty, userRole: user?.role });
      return;
    }

    // Validate quizId format (MongoDB ObjectId should be 24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(quizId)) {
      const err = `Invalid Quiz ID format: ${quizId}`;
      setError(err);
      setDebugInfo({ quizId, isFaculty, userRole: user?.role });
      console.error(err, { quizId, isFaculty, userRole: user?.role });
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      
      try {
        const url = `/api/quiz/${quizId}/submissions`;
        console.log("🔍 Fetching submissions from:", url);
        console.log("👤 User authentication:", user);
        
        // Add timeout to fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const res = await fetch(url, { 
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log("📡 Response status:", res.status);
        console.log("📋 Response headers:", res.headers);
        
        // Check content type before parsing
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Expected JSON response but got ${contentType || 'unknown content type'}`);
        }
        
        // Try to get more details from the response
        const responseText = await res.text();
        console.log("📄 Response body:", responseText);
        
        if (!res.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            errorData = { message: responseText || res.statusText };
          }
          
          // Log detailed error information
          logErrorDetails(new Error(errorData.message || res.statusText), res);
          
          const errorMessage = errorData.message || `Error ${res.status}: ${res.statusText}`;
          throw new Error(errorMessage);
        }
        
        // Parse the JSON response
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Failed to parse JSON response: ${e.message}`);
        }
        
        // Validate the data structure
        if (!Array.isArray(data)) {
          throw new Error(`Expected array of submissions but got ${typeof data}`);
        }
        
        console.log("✅ Submissions data:", data);
        setSubs(data);
      } catch (err: any) {
        let errorMessage = err.message || "Failed to load submissions";
        
        // Handle specific error cases
        if (err.name === 'AbortError') {
          errorMessage = "Request timed out. Please try again.";
        } else if (err.message.includes('Failed to fetch')) {
          errorMessage = "Network error. Please check your connection and try again.";
        }
        
        setError(errorMessage);
        console.error("❌ Fetch error:", err);
        setSubs([]);
        setDebugInfo({
          error: errorMessage,
          stack: err.stack,
          quizId,
          isFaculty,
          userRole: user?.role,
          timestamp: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };
    
    load();
  }, [quizId, isFaculty, setLocation, user]);

  // Function to retry the request
  const retryRequest = () => {
    setError(null);
    setDebugInfo(null);
    // Trigger the effect again by changing a dummy state
    setLoading(true);
    setTimeout(() => setLoading(false), 100);
  };

  const downloadExcel = () => {
    const data = subs.map(s => ({
      'Student Name': s.student?.name || 'Student',
      'Student Email': s.student?.email || 'N/A',
      'Score': s.score ?? 'N/A',
      'Submitted At': s.createdAt ? new Date(s.createdAt).toLocaleString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Submissions');
    XLSX.writeFile(workbook, `quiz_${quizId}_submissions.xlsx`);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Quiz Submissions" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Quiz Submissions</h1>
              <p className="text-muted-foreground mt-1">
                Viewing submissions for Quiz ID: <span className="font-mono">{quizId}</span>
              </p>
            </div>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {loading ? 'Loading...' : error ? 'Error' : 'Submissions'}
                </CardTitle>
                <Button onClick={downloadExcel} disabled={subs.length === 0 || loading || !!error}>
                  Download Excel
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">Loading submissions...</p>
                  </div>
                )}

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-destructive/20 p-2 rounded-full">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-destructive">Error Loading Submissions</h3>
                        <p className="text-muted-foreground mt-1">{error}</p>
                        
                        <div className="mt-4">
                          <p className="font-medium text-sm text-muted-foreground">Debugging Steps:</p>
                          <ol className="list-decimal pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
                            <li>Check browser console for detailed error logs</li>
                            <li>Verify you're logged in as faculty/HOD</li>
                            <li>Confirm the Quiz ID is valid: <span className="font-mono">{quizId}</span></li>
                            <li>Check if the quiz exists in the database</li>
                            <li>Verify your session is still active</li>
                          </ol>
                        </div>
                        
                        {debugInfo && (
                          <details className="mt-4">
                            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                              Debug Information
                            </summary>
                            <pre className="text-xs mt-2 bg-muted p-3 rounded overflow-auto max-h-60">
                              {JSON.stringify(debugInfo, null, 2)}
                            </pre>
                          </details>
                        )}
                        
                        <Button 
                          onClick={retryRequest} 
                          variant="outline" 
                          className="mt-4"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry Request
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {!error && !loading && subs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="bg-muted p-4 rounded-full mb-4">
                      <FileText className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">No Submissions Yet</h3>
                    <p className="text-muted-foreground mt-1 text-center max-w-md">
                      Students haven't submitted any responses for this quiz yet.
                    </p>
                  </div>
                ) : (
                  !error && !loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subs.map((s) => (
                        <Card key={s._id} className="border shadow-sm hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="bg-primary/10 p-2 rounded-full">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{s.student?.name || 'Student'}</div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Score: {s.score || 'N/A'}
                                  </Badge>
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'}
                                  </div>
                                </div>
                                <div className="text-xs text-muted-foreground mt-2">
                                  Submitted: {s.createdAt ? new Date(s.createdAt).toLocaleTimeString() : 'N/A'}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}