import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, Clock, CheckCircle } from "lucide-react";

interface FormSubmissionProps {
  form: any;
  onClose: () => void;
}

export default function FormSubmission({ form, onClose }: FormSubmissionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if student has already submitted this form
  const hasStudentSubmitted = () => {
    if (!user || !form.submissions) return false;
    return form.submissions.some((submission: any) => 
      submission.student === user._id || 
      (typeof submission.student === 'object' && submission.student._id === user._id)
    );
  };

  // Get student's existing submission
  const getStudentSubmission = () => {
    if (!user || !form.submissions) return null;
    return form.submissions.find((submission: any) => 
      submission.student === user._id || 
      (typeof submission.student === 'object' && submission.student._id === user._id)
    );
  };

  const existingSubmission = getStudentSubmission();
  const alreadySubmitted = hasStudentSubmitted();

  // Check if form is currently available for submission
  const isFormAvailable = () => {
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

  const availability = isFormAvailable();

  const handleSubmit = async () => {
    if (!user || user.role !== 'student') {
      toast({
        title: "Access denied",
        description: "Only students can submit forms",
        variant: "destructive"
      });
      return;
    }

    // Check if student has already submitted this form
    if (alreadySubmitted) {
      toast({
        title: "Already submitted",
        description: "You have already submitted this form",
        variant: "destructive"
      });
      return;
    }

    // Check if form is still available
    if (!availability.available) {
      toast({
        title: "Form not available",
        description: availability.reason === 'not_started' 
          ? `Form starts on ${availability.date?.toLocaleDateString()}`
          : `Form expired on ${availability.date?.toLocaleDateString()}`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const submissionData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          submissionData.append(key, value);
        } else if (value !== null && value !== undefined) {
          submissionData.append(key, value);
        }
      });

      await apiRequest('POST', `/api/forms/${form._id}/submit`, { 
        data: submissionData
      });
      
      toast({
        title: "Form submitted",
        description: "Your form has been submitted successfully"
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/student/forms"] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit form",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {form.description && (
            <p className="text-muted-foreground">{form.description}</p>
          )}

          {/* Already Submitted Warning */}
          {alreadySubmitted && existingSubmission && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                You have already submitted this form on {new Date(existingSubmission.submittedAt).toLocaleDateString()}.
              </AlertDescription>
            </Alert>
          )}

          {/* Availability Warning */}
          {!availability.available && !alreadySubmitted && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {availability.reason === 'not_started' 
                  ? `This form is not yet available. It will be available starting ${availability.date?.toLocaleDateString()}.`
                  : `This form has expired. The submission deadline was ${availability.date?.toLocaleDateString()}.`
                }
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            {form.fields.map((field: any) => {
              const fieldId = field.id || field._id;
              const existingValue = existingSubmission?.data?.[fieldId] || "";
              const currentValue = formData[fieldId] || existingValue || "";
              
              return (
                <div key={fieldId} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                    {alreadySubmitted && existingValue && (
                      <span className="text-green-600 text-xs ml-2">(Previously submitted)</span>
                    )}
                  </Label>
                  
                  {field.type === "textarea" ? (
                    <Textarea
                      value={currentValue}
                      onChange={(e) => handleFieldChange(fieldId, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      required={field.required}
                      disabled={!availability.available || alreadySubmitted}
                    />
                  ) : field.type === "select" ? (
                    <Select
                      value={currentValue}
                      onValueChange={(value) => handleFieldChange(fieldId, value)}
                      disabled={!availability.available || alreadySubmitted}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option: string, index: number) => (
                          <SelectItem key={index} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === "file" ? (
                    <Input
                      type="file"
                      onChange={(e) => handleFieldChange(fieldId, e.target.files ? e.target.files[0] : null)}
                      required={field.required}
                      disabled={!availability.available || alreadySubmitted}
                    />
                  ) : (
                    <Input
                      type={field.type}
                      value={currentValue}
                      onChange={(e) => handleFieldChange(fieldId, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      required={field.required}
                      disabled={!availability.available || alreadySubmitted}
                    />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !availability.available || alreadySubmitted}
              variant={alreadySubmitted ? "secondary" : "default"}
            >
              {alreadySubmitted 
                ? "Already Submitted" 
                : isSubmitting 
                  ? "Submitting..." 
                  : "Submit Form"
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}