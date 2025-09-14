import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { achievementApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import MediaUpload from "@/components/MediaUpload";

interface AchievementFormProps {
  onSuccess?: () => void;
}

export default function AchievementForm({ onSuccess }: AchievementFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [certificate, setCertificate] = useState<File | null>(null);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  
  // Predefined categories and types
  const categories = [
    "Webinar Attendance",
    "Workshop Participation",
    "Hackathon Participation",
    "Competition",
    "Certification",
    "Project Completion",
    "Internship",
    "Volunteer Work",
    "Research Publication",
    "Conference Attendance",
    "Course Completion",
    "Other"
  ];
  
  const types = [
    "Certificate",
    "Participation",
    "Completion",
    "Winner",
    "Runner-up",
    "Merit",
    "Distinction",
    "First Prize",
    "Second Prize",
    "Third Prize",
    "Special Recognition",
    "Other"
  ];
  
  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return achievementApi.create(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      toast({
        title: "Success",
        description: "Achievement added successfully!",
      });
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setType("");
      setCertificate(null);
      setMediaFiles([]);
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add achievement",
        variant: "destructive",
      });
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("type", type);
    if (certificate) {
      formData.append("certificate", certificate);
    }
    
    // Add media files
    mediaFiles.forEach((file, index) => {
      formData.append("media", file);
    });
    
    mutation.mutate(formData);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Achievement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Web Development Workshop"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your achievement..."
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((typ) => (
                    <SelectItem key={typ} value={typ}>
                      {typ}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="certificate">Certificate (Optional)</Label>
            <Input
              id="certificate"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setCertificate(e.target.files?.[0] || null)}
            />
          </div>
          
          <div className="space-y-2">
            <MediaUpload 
              onMediaChange={setMediaFiles}
              maxFiles={5}
            />
          </div>
          
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Adding..." : "Add Achievement"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}