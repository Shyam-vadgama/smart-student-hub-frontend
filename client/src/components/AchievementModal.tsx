import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { achievementApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Achievement } from "@shared/schema";
import { 
  Trophy, 
  CheckCircle, 
  Clock, 
  Heart, 
  MessageCircle, 
  QrCode, 
  Download, 
  Calendar,
  FileText,
  User
} from "lucide-react";

interface AchievementModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AchievementModal({ achievement, isOpen, onClose }: AchievementModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);

  const addCommentMutation = useMutation({
    mutationFn: (text: string) => achievementApi.addComment(achievement!._id, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully."
      });
    },
    onError: () => {
      toast({
        title: "Failed to add comment",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  const toggleLikeMutation = useMutation({
    mutationFn: () => achievementApi.toggleLike(achievement!._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      setIsLiked(!isLiked);
    },
    onError: () => {
      toast({
        title: "Failed to update like",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  });

  if (!achievement) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-accent" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-chart-3" />;
      default:
        return <Trophy className="h-5 w-5 text-primary" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default' as const;
      case 'pending':
        return 'secondary' as const;
      case 'rejected':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please enter a comment before submitting.",
        variant: "destructive"
      });
      return;
    }
    addCommentMutation.mutate(newComment);
  };

  const handleDownloadCertificate = () => {
    if (achievement.certificatePath) {
      window.open(achievement.certificatePath, '_blank');
    }
  };

  const handleDownloadQR = () => {
    if (achievement.qrCodePath) {
      window.open(achievement.qrCodePath, '_blank');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="achievement-modal">
        <DialogHeader>
          <DialogTitle>Achievement Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Achievement Header */}
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
              {getStatusIcon(achievement.status)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="modal-achievement-title">
                {achievement.title}
              </h3>
              <p className="text-muted-foreground" data-testid="modal-achievement-description">
                {achievement.description}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span data-testid="modal-achievement-date">
                    {new Date(achievement.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span data-testid="modal-achievement-student">
                    {typeof achievement.student === 'object' && achievement.student?.name 
                      ? achievement.student.name 
                      : 'Unknown Student'}
                  </span>
                </div>
              </div>
            </div>
            <Badge variant={getStatusVariant(achievement.status)} data-testid="modal-achievement-status">
              {achievement.status}
            </Badge>
          </div>

          {/* Certificate Preview */}
          {achievement.certificatePath && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Certificate
                </h4>
                <div className="bg-muted/30 rounded-lg p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-3">Certificate file attached</p>
                  <div className="flex justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadCertificate}
                      data-testid="button-download-certificate"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadCertificate}
                      data-testid="button-view-certificate"
                    >
                      View Full Size
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code (if approved) */}
          {achievement.status === 'approved' && achievement.qrCodePath && (
            <Card>
              <CardContent className="p-6">
                <h4 className="font-medium text-foreground mb-3 flex items-center">
                  <QrCode className="h-4 w-4 mr-2" />
                  Verification QR Code
                </h4>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 bg-muted/30 rounded-lg flex items-center justify-center">
                    <QrCode className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Scan to verify this achievement
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadQR}
                      data-testid="button-download-qr"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download QR Code
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card>
            <CardContent className="p-6">
              <h4 className="font-medium text-foreground mb-4 flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                Comments & Feedback
              </h4>
              
              <div className="space-y-4 mb-4">
                {achievement.comments && achievement.comments.length > 0 ? (
                  achievement.comments.map((comment, index) => (
                    <div key={index} className="flex space-x-3" data-testid={`comment-${index}`}>
                      <Avatar>
                        <AvatarFallback className="bg-accent/10 text-accent">
                          {typeof comment.user === 'object' && comment.user?.name
                            ? getUserInitials(comment.user.name)
                            : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-foreground" data-testid={`comment-author-${index}`}>
                            {typeof comment.user === 'object' && comment.user?.name 
                              ? comment.user.name 
                              : 'Unknown User'}
                          </span>
                          <span className="text-xs text-muted-foreground" data-testid={`comment-date-${index}`}>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid={`comment-text-${index}`}>
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">No comments yet</p>
                )}
              </div>

              {/* Add Comment (if faculty/hod or student viewing own achievement) */}
              {user && (['faculty', 'hod'].includes(user.role) || 
                (user.role === 'student' && achievement.student === user._id)) && (
                <div className="pt-4 border-t border-border">
                  <Label htmlFor="new-comment" className="text-sm font-medium">
                    Add Comment
                  </Label>
                  <Textarea
                    id="new-comment"
                    placeholder="Add your comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mt-2 h-20 resize-none"
                    data-testid="textarea-new-comment"
                  />
                  <div className="flex justify-end mt-2">
                    <Button
                      onClick={handleAddComment}
                      disabled={addCommentMutation.isPending}
                      data-testid="button-add-comment"
                    >
                      {addCommentMutation.isPending ? "Adding..." : "Add Comment"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => toggleLikeMutation.mutate()}
                className="flex items-center space-x-2"
                data-testid="button-toggle-like"
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-destructive text-destructive' : 'text-destructive'}`} />
                <span data-testid="achievement-likes-count">
                  {achievement.likes?.length || 0}
                </span>
              </Button>

              <div className="flex items-center space-x-2 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span data-testid="achievement-comments-count">
                  {achievement.comments?.length || 0} comments
                </span>
              </div>
            </div>

            <Button variant="outline" onClick={onClose} data-testid="button-close-modal">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
