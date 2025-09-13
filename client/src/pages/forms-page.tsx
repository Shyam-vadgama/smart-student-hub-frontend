import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import FormBuilder from "@/components/FormBuilder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formsApi } from "@/lib/api";
import { Plus, Edit, Trash2, Eye, Users } from "lucide-react";

export default function FormsPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFormBuilder, setShowFormBuilder] = useState(false);

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["/api/forms"],
    queryFn: () => formsApi.getAll(),
    enabled: !!user
  });

  if (!user || !['faculty', 'hod'].includes(user.role)) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Dynamic Forms" 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Dynamic Forms</h2>
            <Button 
              onClick={() => setShowFormBuilder(true)}
              data-testid="button-create-form"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Form
            </Button>
          </div>

          {/* Forms Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form: any) => (
                <Card key={form._id} data-testid="form-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg" data-testid="form-title">
                          {form.title}
                        </CardTitle>
                        {form.description && (
                          <p className="text-sm text-muted-foreground mt-1" data-testid="form-description">
                            {form.description}
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid="button-edit-form"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid="button-delete-form"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Fields:</span> {form.fields?.length || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Created:</span>{" "}
                        <span data-testid="form-created-date">
                          {new Date(form.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Submissions:</span>{" "}
                        <span data-testid="form-submissions-count">
                          {form.submissions?.length || 0}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-border">
                      <Badge 
                        variant={form.status === 'active' ? 'default' : 'secondary'}
                        data-testid="form-status"
                      >
                        {form.status}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          data-testid="button-preview-form"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          data-testid="button-view-submissions"
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Submissions
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Create New Form Card */}
              <Card className="border-2 border-dashed border-border flex items-center justify-center min-h-[300px]">
                <CardContent className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground mb-2">Create New Form</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Build custom forms for different achievement types
                  </p>
                  <Button 
                    onClick={() => setShowFormBuilder(true)}
                    data-testid="button-get-started"
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Form Builder Modal */}
          {showFormBuilder && (
            <FormBuilder onClose={() => setShowFormBuilder(false)} />
          )}
        </main>
      </div>
    </div>
  );
}
