import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation, useParams } from 'wouter';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search, FileText, User, Mail, Calendar, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';

type Submission = {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  selectedOption: string;
  createdAt: string;
};

type Problem = {
  _id: string;
  title: string;
  description: string;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || res.statusText);
  }
  return res.json();
}

function BusinessProblemSubmissionsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { id: problemId } = useParams<{ id: string }>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || (user.role !== 'hod' && user.role !== 'faculty')) {
      navigate('/auth');
      return;
    }

    let mounted = true;
    setLoading(true);

    const fetchProblemAndSubmissions = async () => {
      try {
        const fetchedProblem = await api<Problem>(`/api/business/problems/${problemId}`);
        if (mounted) setProblem(fetchedProblem);

        const fetchedSubmissions = await api<Submission[]>(`/api/business/problems/${problemId}/submissions`);
        if (mounted) {
          setSubmissions(fetchedSubmissions);
          setFilteredSubmissions(fetchedSubmissions);
        }

        if (mounted) setError(null);
      } catch (e) {
        console.error('Failed to fetch problem or submissions:', e);
        if (mounted) setError('Failed to load submissions.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProblemAndSubmissions();

    return () => { mounted = false; };
  }, [problemId, user, navigate]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredSubmissions(submissions);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = submissions.filter(sub => 
      sub.student.name.toLowerCase().includes(term) || 
      sub.student.email.toLowerCase().includes(term) ||
      sub.selectedOption.toLowerCase().includes(term)
    );
    setFilteredSubmissions(filtered);
  }, [searchTerm, submissions]);

  const handleExport = () => {
    if (problemId) {
      window.open(`/api/business/problems/${problemId}/submissions/export`, '_blank');
    }
  };

  const handleBack = () => {
    navigate('/business-problems');
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Submissions" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading submissions...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Submissions" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                <div className="text-red-500 text-5xl mb-4 text-center">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Error</h2>
                <p className="text-gray-600 mb-6 text-center">{error}</p>
                <div className="space-y-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleBack}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back to Problems
                  </button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={`Submissions: ${problem?.title || 'Problem'}`} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center mb-2">
                  <Button 
                    variant="ghost" 
                    onClick={handleBack}
                    className="mr-3 p-2 h-auto"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <h1 className="text-3xl font-bold text-gray-900">Submissions</h1>
                </div>
                <p className="text-gray-600 ml-10">View and manage student submissions for this business problem</p>
              </div>
              <Button 
                onClick={handleExport} 
                className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Download className="h-5 w-5 mr-2" /> Export to Excel
              </Button>
            </div>

            {/* Problem Description Card */}
            {problem && (
              <Card className="mb-8 border-l-4 border-l-blue-500 shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-500" />
                    Problem Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{problem.title}</h3>
                  <p className="text-gray-700 whitespace-pre-line">{problem.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Search and Stats */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                  <span className="font-medium">{submissions.length}</span> Total Submissions
                </div>
                <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg">
                  <span className="font-medium">{filteredSubmissions.length}</span> Filtered Results
                </div>
              </div>
            </div>

            {filteredSubmissions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-gray-400 text-6xl mb-6">📝</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {submissions.length === 0 ? 'No Submissions Yet' : 'No Matching Submissions'}
                </h2>
                <p className="text-gray-600 mb-6">
                  {submissions.length === 0 
                    ? "Students haven't submitted solutions for this problem." 
                    : "No submissions match your search criteria."}
                </p>
                {submissions.length > 0 && (
                  <Button 
                    onClick={() => setSearchTerm('')}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <Card className="shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-semibold text-gray-700">Student</TableHead>
                        <TableHead className="font-semibold text-gray-700">Email</TableHead>
                        <TableHead className="font-semibold text-gray-700">Submitted Answer</TableHead>
                        <TableHead className="font-semibold text-gray-700">Submission Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubmissions.map((sub) => (
                        <TableRow key={sub._id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              {sub.student.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 text-gray-400 mr-2" />
                              {sub.student.email}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <p className="text-gray-700 truncate" title={sub.selectedOption}>
                                {sub.selectedOption}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                              {new Date(sub.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default BusinessProblemSubmissionsPage;