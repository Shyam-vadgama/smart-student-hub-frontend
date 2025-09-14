import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Move, Calendar, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { formsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface FormBuilderProps {
  onClose: () => void;
  form?: any;
}

export default function FormBuilder({ onClose, form }: FormBuilderProps) {
  const { toast } = useToast();
  
  // Helper function to parse date from string or Date object
  const parseDate = (date: string | Date | undefined): Date | undefined => {
    if (!date) return undefined;
    const d = new Date(date);
    return isNaN(d.getTime()) ? undefined : d;
  };

  const [formData, setFormData] = useState({
    title: form?.title || "",
    description: form?.description || "",
    fields: form?.fields || [],
    visibleFrom: parseDate(form?.visibleFrom),
    visibleUntil: parseDate(form?.visibleUntil)
  });

  const [newField, setNewField] = useState<FormField>({
    id: "",
    label: "",
    type: "text",
    required: false,
    options: []
  });

  const fieldTypes = [
    { value: "text", label: "Text" },
    { value: "email", label: "Email" },
    { value: "number", label: "Number" },
    { value: "date", label: "Date" },
    { value: "select", label: "Select" },
    { value: "textarea", label: "Textarea" },
    { value: "file", label: "File Upload" }
  ];

  const addField = () => {
    if (!newField.label) {
      toast({
        title: "Missing field label",
        description: "Please enter a label for the field",
        variant: "destructive"
      });
      return;
    }

    const field = {
      ...newField,
      id: Date.now().toString()
    };

    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, field]
    }));

    setNewField({
      id: "",
      label: "",
      type: "text",
      required: false,
      options: []
    });
  };

  const removeField = (fieldId: string) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter((f: any) => f.id !== fieldId)
    }));
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast({
        title: "Missing form title",
        description: "Please enter a title for the form",
        variant: "destructive"
      });
      return;
    }

    if (formData.fields.length === 0) {
      toast({
        title: "No fields added",
        description: "Please add at least one field to the form",
        variant: "destructive"
      });
      return;
    }

    try {
      // Prepare form data with visibility dates
      const formPayload: any = {
        ...formData,
        fields: formData.fields.map(({ id, ...rest }: FormField) => rest)
      };

      // Only include visibleFrom if it has a value
      if (formData.visibleFrom) {
        formPayload.visibleFrom = formData.visibleFrom.toISOString();
      }

      // Only include visibleUntil if it has a value
      if (formData.visibleUntil) {
        formPayload.visibleUntil = formData.visibleUntil.toISOString();
      }

      if (form) {
        await formsApi.update(form._id, formPayload);
        toast({
          title: "Form updated",
          description: "The form has been updated successfully"
        });
      } else {
        await formsApi.create(formPayload);
        toast({
          title: "Form created",
          description: "The form has been created successfully"
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      onClose();
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save the form. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {form ? "Edit Form" : "Create New Form"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Form Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="form-title">Form Title</Label>
                  <Input
                    id="form-title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter form title"
                    data-testid="input-form-title"
                  />
                </div>
                <div>
                  <Label htmlFor="form-description">Description (Optional)</Label>
                  <Textarea
                    id="form-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter form description"
                    data-testid="textarea-form-description"
                  />
                </div>
                
                {/* Visibility Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Visible From</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-visible-from"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.visibleFrom ? format(formData.visibleFrom, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.visibleFrom}
                          onSelect={(date) => setFormData(prev => ({ ...prev, visibleFrom: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Visible Until</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          data-testid="button-visible-until"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.visibleUntil ? format(formData.visibleUntil, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={formData.visibleUntil}
                          onSelect={(date) => setFormData(prev => ({ ...prev, visibleUntil: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Field */}
            <Card>
              <CardHeader>
                <CardTitle>Add Field</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="field-label">Field Label</Label>
                  <Input
                    id="field-label"
                    value={newField.label}
                    onChange={(e) => setNewField(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="Enter field label"
                    data-testid="input-field-label"
                  />
                </div>

                <div>
                  <Label htmlFor="field-type">Field Type</Label>
                  <Select
                    value={newField.type}
                    onValueChange={(value) => setNewField(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger data-testid="select-field-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="field-required"
                    checked={newField.required}
                    onCheckedChange={(checked) => setNewField(prev => ({ ...prev, required: checked }))}
                    data-testid="switch-field-required"
                  />
                  <Label htmlFor="field-required">Required field</Label>
                </div>

                {newField.type === "select" && (
                  <div>
                    <Label htmlFor="field-options">Options (one per line)</Label>
                    <Textarea
                      id="field-options"
                      placeholder="Option 1&#10;Option 2&#10;Option 3"
                      onChange={(e) => setNewField(prev => ({
                        ...prev,
                        options: e.target.value.split('\n').filter(opt => opt.trim())
                      }))}
                      data-testid="textarea-field-options"
                    />
                  </div>
                )}

                <Button onClick={addField} className="w-full" data-testid="button-add-field">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Field
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Form Preview */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Form Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg" data-testid="preview-form-title">
                      {formData.title || "Form Title"}
                    </h3>
                    {formData.description && (
                      <p className="text-muted-foreground text-sm" data-testid="preview-form-description">
                        {formData.description}
                      </p>
                    )}
                    
                    {/* Visibility Info Preview */}
                    {(formData.visibleFrom || formData.visibleUntil) && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {formData.visibleFrom && (
                          <p>Visible from: {format(formData.visibleFrom, "PPP")}</p>
                        )}
                        {formData.visibleUntil && (
                          <p>Visible until: {format(formData.visibleUntil, "PPP")}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Saved Date Info Preview */}
                    {form && form.savedDate && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p>Saved: {new Date(form.savedDate).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>

                  {formData.fields.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No fields added yet. Add fields to see the preview.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {formData.fields.map((field: any, index: number) => (
                        <div key={field.id} className="border border-border rounded p-3">
                          <div className="flex justify-between items-center mb-2">
                            <Label className="font-medium">
                              {field.label}
                              {field.required && <span className="text-destructive ml-1">*</span>}
                            </Label>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeField(field.id)}
                                data-testid={`button-remove-field-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {field.type === "textarea" ? (
                            <Textarea placeholder={`Enter ${field.label.toLowerCase()}`} disabled />
                          ) : field.type === "select" ? (
                            <Select disabled>
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                              </SelectTrigger>
                            </Select>
                          ) : field.type === "file" ? (
                            <div className="border-2 border-dashed border-border rounded p-4 text-center">
                              <p className="text-muted-foreground">File upload area</p>
                            </div>
                          ) : (
                            <Input
                              type={field.type}
                              placeholder={`Enter ${field.label.toLowerCase()}`}
                              disabled
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4 border-t border-border">
                    <Button variant="outline" onClick={onClose} data-testid="button-cancel">
                      Cancel
                    </Button>
                    <Button onClick={handleSave} data-testid="button-save-form">
                      {form ? "Update Form" : "Create Form"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}