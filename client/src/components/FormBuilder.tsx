import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Move } from "lucide-react";
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
  const [formData, setFormData] = useState({
    title: form?.title || "",
    description: form?.description || "",
    fields: form?.fields || []
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
      if (form) {
        await formsApi.update(form._id, formData);
        toast({
          title: "Form updated",
          description: "The form has been updated successfully"
        });
      } else {
        await formsApi.create(formData);
        toast({
          title: "Form created",
          description: "The form has been created successfully"
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      onClose();
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save the form. Please try again.",
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
