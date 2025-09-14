import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { studentFormsApi } from "@/lib/api";
import { Calendar, FileText, Clock, AlertCircle, CheckCircle } from "lucide-react";
import FormSubmission from "@/components/FormSubmission";

export default function StudentFormsPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedForm, setSelectedForm] = useState<any>(null);

  // Helper function to check if form is currently available for submission
  const isFormAvailable = (form: any) => {
    const now = new Date();
    
    // Check if form has visibleFrom date and if it's in the future
    if (form.visibleFrom) {
      const visibleFrom = new Date(form.visibleFrom);
      if (now < visibleFrom) {
        return { available: false, reason: 'not_started', date: visibleFrom };
      }
    }
    
    // Check if form has visibleUntil date and if it's in the past
    if (form.visibleUntil) {
      const visibleUntil = new Date(form.visibleUntil);
      if (now > visibleUntil) {
        return { available: false, reason: 'expired', date: visibleUntil };
      }
    }
    
    return { available: true };
  };

  // Helper function to check if student has already submitted the form
  const hasStudentSubmitted = (form: any) => {
    if (!user || !form.submissions) return false;
    return form.submissions.some((submission: any) => 
      submission.student === user._id || 
      (typeof submission.student === 'object' && submission.student._id === user._id)
    );
  };

  // Helper function to get student's submission data
  const getStudentSubmission = (form: any) => {
    if (!user || !form.submissions) return null;
    return form.submissions.find((submission: any) => 
      submission.student === user._id || 
      (typeof submission.student === 'object' && submission.student._id === user._id)
    );
  };

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["/api/student/forms"],
    queryFn: () => studentFormsApi.getAll(),
    enabled: !!user && user.role === 'student'
  });

  if (!user || user.role !== 'student') {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Available Forms" 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Available Forms</h2>
            <p className="text-muted-foreground">
              Fill out the forms that are currently available for submission
            </p>
          </div>

          {/* Forms Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : forms.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No forms available</h3>
                <p className="text-muted-foreground mb-4">
                  There are currently no forms available for submission.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form: any) => {
                const availability = isFormAvailable(form);
                const hasSubmitted = hasStudentSubmitted(form);
                const submission = getStudentSubmission(form);
                
                return (
                  <Card key={form._id} className={`hover:shadow-md transition-shadow ${!availability.available ? 'opacity-75' : ''}`}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{form.title}</span>
                        <div className="flex items-center space-x-2">
                          {hasSubmitted ? (
                            <Badge variant="default" className="bg-green-500">Submitted</Badge>
                          ) : availability.available ? (
                            <Badge variant="default">Available</Badge>
                          ) : availability.reason === 'not_started' ? (
                            <Badge variant="secondary">Not Started</Badge>
                          ) : (
                            <Badge variant="destructive">Expired</Badge>
                          )}
                        </div>
                      </CardTitle>
                      {form.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {form.description}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Fields:</span> {form.fields?.length || 0}
                      </div>
                      {form.savedDate && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Saved:</span>{" "}
                          <span>{new Date(form.savedDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {/* Submission Status */}
                      {hasSubmitted && submission && (
                        <div className="flex items-center text-sm text-green-600 bg-green-50 p-2 rounded">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span>Submitted on {new Date(submission.submittedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                        
                        {/* Availability Status */}
                        {!availability.available && (
                          <div className="flex items-center text-sm text-destructive bg-destructive/10 p-2 rounded">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            {availability.reason === 'not_started' 
                              ? `Form starts on ${availability.date?.toLocaleDateString()}`
                              : `Form expired on ${availability.date?.toLocaleDateString()}`
                            }
                          </div>
                        )}
                        
                        {/* Visibility Dates */}
                        {(form.visibleFrom || form.visibleUntil) && (
                          <div className="pt-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span className="font-medium">Available:</span>
                            </div>
                            {form.visibleFrom && (
                              <div className="text-xs text-muted-foreground ml-6">
                                From: {new Date(form.visibleFrom).toLocaleDateString()}
                              </div>
                            )}
                            {form.visibleUntil && (
                              <div className="text-xs text-muted-foreground ml-6">
                                Until: {new Date(form.visibleUntil).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <Button 
                          className="w-full mt-4" 
                          onClick={() => setSelectedForm(form)}
                          disabled={!availability.available || hasSubmitted}
                          variant={hasSubmitted ? "secondary" : "default"}
                        >
                          {hasSubmitted 
                            ? 'Already Submitted' 
                            : availability.available 
                              ? 'Fill Form' 
                              : 'Not Available'
                          }
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
      
      {selectedForm && (
        <FormSubmission 
          form={selectedForm} 
          onClose={() => setSelectedForm(null)} 
        />
      )}
    </div>
  );
}