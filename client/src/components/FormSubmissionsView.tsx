import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, User, FileText, Download } from "lucide-react";

interface FormSubmissionsViewProps {
  formId: string;
  onClose: () => void;
}

export default function FormSubmissionsView({ formId, onClose }: FormSubmissionsViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch form submissions
  useState(() => {
    const fetchSubmissions = async () => {
      if (!formId) return;
      
      setIsLoading(true);
      try {
        const response = await apiRequest('GET', `/api/forms/${formId}/submissions`);
        const data = await response.json();
        setSubmissions(data.submissions || []);
      } catch (error) {
        console.error('Error fetching submissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [formId]);

  const handleDownloadSubmissions = async () => {
    setIsDownloading(true);
    try {
      // Create a temporary link to trigger the download
      const link = document.createElement('a');
      link.href = `/api/forms/${formId}/submissions/download`;
      link.setAttribute('download', `form_submissions_${formId}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading submissions:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Form Submissions</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={handleDownloadSubmissions} 
              disabled={isDownloading || submissions.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Downloading...' : 'Download All'}
            </Button>
            <Button variant="ghost" onClick={onClose}>×</Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
              <p className="text-muted-foreground">
                No students have submitted this form yet.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(90vh-200px)]">
              <div className="space-y-4">
                {submissions.map((submission: any, index: number) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {typeof submission.student === 'object' 
                              ? submission.student.name 
                              : 'Student'}
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {submission.data && Object.entries(submission.data).map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">
                              {key}
                            </p>
                            <p className="text-sm">
                              {String(value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}