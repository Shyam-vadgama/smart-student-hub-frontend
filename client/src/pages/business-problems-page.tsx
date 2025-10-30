import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/use-auth';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';

type Problem = {
  _id: string;
  title: string;
  description: string;
  options?: string[];
  createdAt?: string;
};

type Submission = {
  _id: string;
  selectedOption: string;
  createdAt?: string;
  updatedAt?: string;
};

type UserSubmission = {
  _id: string;
  problemId: string;
  selectedOption: string;
  createdAt?: string;
  updatedAt?: string;
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

function BusinessProblemsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<Record<string, UserSubmission>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [expandedProblemId, setExpandedProblemId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    // First, fetch problems
    api<Problem[]>('/api/business/problems')
      .then(problemsData => {
        if (!mounted) return;
        setProblems(problemsData);
        
        // Then, try to fetch user submissions
        return api<UserSubmission[]>('/api/business/problems/submissions')
          .then(submissionsData => {
            if (!mounted) return;
            
            // Create a mapping of problemId to submission
            const submissionsMap: Record<string, UserSubmission> = {};
            submissionsData.forEach(sub => {
              submissionsMap[sub.problemId] = sub;
            });
            setUserSubmissions(submissionsMap);
            
            // Initialize selected answers with existing submissions
            const initialSelected: Record<string, string> = {};
            submissionsData.forEach(sub => {
              initialSelected[sub.problemId] = sub.selectedOption;
            });
            setSelected(initialSelected);
          })
          .catch(subError => {
            console.error('Failed to load submissions:', subError);
            // Continue without submissions data
          });
      })
      .catch(e => {
        if (mounted) {
          console.error('Failed to load problems:', e);
          setError('Failed to load problems');
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    
    return () => { mounted = false; };
  }, []);

  const toggleExpand = (problemId: string) => {
    setExpandedProblemId(prev => prev === problemId ? null : problemId);
  };

  const submit = async (problemId: string) => {
    try {
      setSubmittingId(problemId);
      const answer = selected[problemId];
      if (!answer) {
        alert('Please enter your answer');
        return;
      }
      await api(`/api/business/problems/${problemId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ selectedOption: answer })
      });
      
      // Update user submissions after successful submit
      const newSubmission: UserSubmission = {
        _id: 'temp_' + Date.now(), // Temporary ID, will be replaced by backend
        problemId,
        selectedOption: answer,
        createdAt: new Date().toISOString(),
      };
      
      setUserSubmissions(prev => ({
        ...prev,
        [problemId]: newSubmission
      }));
      
      alert('Submitted successfully');
      setExpandedProblemId(null); // Collapse after submission
    } catch (e: any) {
      console.error('Submission error:', e);
      alert(e?.message || 'Submit failed');
    } finally {
      setSubmittingId(null);
    }
  };

  const retryLoading = () => {
    setLoading(true);
    setError(null);
    
    // Retry loading problems
    api<Problem[]>('/api/business/problems')
      .then(problemsData => {
        setProblems(problemsData);
        
        // Then, try to fetch user submissions
        return api<UserSubmission[]>('/api/business/problems/submissions')
          .then(submissionsData => {
            const submissionsMap: Record<string, UserSubmission> = {};
            submissionsData.forEach(sub => {
              submissionsMap[sub.problemId] = sub;
            });
            setUserSubmissions(submissionsMap);
            
            const initialSelected: Record<string, string> = {};
            submissionsData.forEach(sub => {
              initialSelected[sub.problemId] = sub.selectedOption;
            });
            setSelected(initialSelected);
          })
          .catch(subError => {
            console.error('Failed to load submissions:', subError);
          });
      })
      .catch(e => {
        console.error('Failed to load problems:', e);
        setError('Failed to load problems');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Business Problems" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading business problems...</p>
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
          <Header title="Business Problems" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-center h-full">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                <div className="text-red-500 text-5xl mb-4 text-center">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Error</h2>
                <p className="text-gray-600 mb-6 text-center">{error}</p>
                <div className="space-y-3">
                  <button 
                    onClick={retryLoading} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300"
                  >
                    Try Again
                  </button>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition duration-300"
                  >
                    Refresh Page
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
        <Header title="Business Problems" onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Problems (BBA)</h1>
                <p className="text-gray-600">Analyze real-world business challenges and submit your solutions</p>
              </div>
              {(user?.role === 'hod' || user?.role === 'faculty') && (
                <Link to="/business-problems/create">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300 shadow-md hover:shadow-lg">
                    Create Business Problem
                  </Button>
                </Link>
              )}
            </div>

            {problems.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-gray-400 text-6xl mb-6">📋</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">No Problems Available</h2>
                <p className="text-gray-600">Check back later for new business challenges.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {problems.map(p => {
                  const isSubmitted = !!userSubmissions[p._id];
                  const isExpanded = expandedProblemId === p._id;
                  
                  return (
                    <div 
                      key={p._id} 
                      className={`bg-white rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      {/* Card Header */}
                      <div 
                        className={`p-5 cursor-pointer transition-colors duration-200 ${
                          isSubmitted 
                            ? 'bg-gradient-to-r from-green-600 to-emerald-700' 
                            : 'bg-gradient-to-r from-blue-600 to-indigo-700'
                        }`}
                        onClick={() => toggleExpand(p._id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            <h2 className="text-xl font-bold text-white">{p.title}</h2>
                            {isSubmitted && (
                              <span className="ml-3 bg-white text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                                SUBMITTED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {p.createdAt && (
                              <span className="bg-blue-800 text-blue-100 text-sm font-medium px-3 py-1 rounded-full">
                                {new Date(p.createdAt).toLocaleDateString()}
                              </span>
                            )}
                            {(user?.role === 'hod' || user?.role === 'faculty') && (
                              <Link to={`/business-problems/${p._id}/submissions`}>
                                <Button 
                                  variant="secondary" 
                                  size="sm" 
                                  className="bg-white text-blue-600 hover:bg-blue-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View Submissions
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Card Body - Only show when expanded */}
                      {isExpanded && (
                        <div className="p-6">
                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                              Problem Description
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <p className="text-gray-700 whitespace-pre-line">{p.description}</p>
                            </div>
                          </div>

                          {Array.isArray(p.options) && p.options.length > 0 && (
                            <div className="mb-6">
                              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                Available Options
                              </h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {p.options.map(opt => (
                                  <button
                                    key={opt}
                                    onClick={() => setSelected(prev => ({ ...prev, [p._id]: opt }))}
                                    className={`px-4 py-3 rounded-lg border transition-all duration-200 flex items-center ${
                                      selected[p._id] === opt
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${
                                      selected[p._id] === opt 
                                        ? 'border-blue-500 bg-blue-500' 
                                        : 'border-gray-400'
                                    }`}>
                                      {selected[p._id] === opt && (
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                      )}
                                    </div>
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                              Your Solution
                            </h3>
                            {isSubmitted ? (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-medium text-green-800">Your Submitted Answer:</h4>
                                  <span className="text-xs text-green-600">
                                    {userSubmissions[p._id]?.createdAt && 
                                      new Date(userSubmissions[p._id].createdAt!).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-green-700 whitespace-pre-line">
                                  {userSubmissions[p._id]?.selectedOption}
                                </p>
                              </div>
                            ) : (
                              <textarea
                                className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                placeholder="Type your answer or elaborate your chosen option…"
                                rows={4}
                                value={selected[p._id] || ''}
                                onChange={(e) => setSelected(prev => ({ ...prev, [p._id]: e.target.value }))}
                              />
                            )}
                          </div>

                          <div className="flex justify-between">
                            <Button 
                              variant="outline" 
                              onClick={() => setExpandedProblemId(null)}
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              Close
                            </Button>
                            
                            {(user?.role === 'student') && !isSubmitted && (
                              <button
                                onClick={() => submit(p._id)}
                                disabled={submittingId === p._id}
                                className={`px-6 py-3 rounded-lg font-semibold transition duration-300 flex items-center ${
                                  submittingId === p._id
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                }`}
                              >
                                {submittingId === p._id ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Submitting…
                                  </>
                                ) : (
                                  <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Submit Solution
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default BusinessProblemsPage;