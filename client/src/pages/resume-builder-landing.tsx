import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { resumeApi } from "@/lib/api";
import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function ResumeBuilderLandingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: resumes = [] } = useQuery({ 
    queryKey: ["/api/resumes"], 
    queryFn: resumeApi.list 
  });

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Resume Builder" 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        <main className="flex-1 overflow-y-auto">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
              <div className="text-center space-y-8">
                <div className="inline-block px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full">
                  <p className="text-blue-100 text-sm font-medium uppercase tracking-wider">
                    Professional Resume Builder
                  </p>
                </div>
                <h1 className="text-4xl sm:text-5xl font-bold max-w-4xl mx-auto leading-tight">
                  Stand Out From The Crowd With a Professional Resume
                </h1>
                <p className="max-w-2xl mx-auto text-blue-100 text-lg">
                  Create ATS-friendly resumes in minutes with our field-tested templates and expert guidance
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Link href="/resume-builder/create">
                    <a className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-white text-blue-600 px-8 py-3 text-lg font-semibold shadow-lg hover:bg-blue-50 transition-all duration-300 transform hover:-translate-y-1">
                      Create Your Resume
                    </a>
                  </Link>
                  <a href="#features" className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border-2 border-white/30 px-8 py-3 text-lg font-medium text-white hover:bg-white/10 transition-all duration-300">
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Saved Resumes Section */}
          <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4">
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Your Saved Resumes</h2>
                  <span className="text-sm text-slate-500">{resumes.length} saved</span>
                </div>
                
                {resumes.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">No resumes yet</h3>
                    <p className="text-slate-600 mb-6">Create your first professional resume in minutes</p>
                    <Link href="/resume-builder/create">
                      <a className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white px-6 py-2 font-medium hover:bg-blue-700 transition-colors">
                        Create New Resume
                      </a>
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Link href="/resume-builder/create">
                      <a className="group block border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-4 group-hover:bg-blue-200 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">Create New Resume</h3>
                        <p className="text-sm text-slate-500 mt-1">Start from scratch</p>
                      </a>
                    </Link>
                    
                    {resumes.map((r: any) => (
                      <Link href={`/resume-builder/edit/${r._id}`} key={r._id}>
                        <a
                          className="group bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="font-medium text-slate-800">Template {r.template}</h3>
                                <p className="text-sm text-slate-500">Resume ID: {r._id.substring(0, 8)}</p>
                              </div>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Updated {new Date(r.updatedAt).toLocaleDateString()}
                          </div>
                          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between">
                            <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                              Edit
                            </button>
                            <button className="text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
                              Download
                            </button>
                          </div>
                        </a>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-16 bg-slate-50" id="features">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl font-bold text-slate-800 mb-4">Everything You Need to Stand Out</h2>
                <p className="text-lg text-slate-600">
                  Our resume builder provides all the tools to create a professional resume that gets noticed by recruiters
                </p>
              </div>
              
              <div className="grid gap-8 md:grid-cols-3">
                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">AI-Powered Suggestions</h3>
                  <p className="text-slate-600 mb-4">
                    Get intelligent recommendations to improve your content, identify missing skills, and optimize for ATS systems.
                  </p>
                  <div className="inline-flex items-center text-blue-600 font-medium">
                    Learn more
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Professional Templates</h3>
                  <p className="text-slate-600 mb-4">
                    Choose from dozens of field-tested designs that are ATS-friendly and proven to impress recruiters.
                  </p>
                  <div className="inline-flex items-center text-blue-600 font-medium">
                    View templates
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">Easy Export & Sharing</h3>
                  <p className="text-slate-600 mb-4">
                    Download your resume as a PDF, share directly with employers, or generate a shareable link.
                  </p>
                  <div className="inline-flex items-center text-blue-600 font-medium">
                    See how it works
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}