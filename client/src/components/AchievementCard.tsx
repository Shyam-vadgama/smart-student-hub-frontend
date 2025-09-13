import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, CheckCircle, Heart, MessageCircle, QrCode } from "lucide-react";
import { Achievement } from "@shared/schema";

interface AchievementCardProps {
  achievement: Achievement;
  onView?: (achievement: Achievement) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function AchievementCard({ 
  achievement, 
  onView, 
  onApprove, 
  onReject 
}: AchievementCardProps) {
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

  return (
    <Card className="achievement-card" data-testid="achievement-card">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              {getStatusIcon(achievement.status)}
            </div>
            <div>
              <h3 className="font-semibold text-foreground" data-testid="achievement-title">
                {achievement.title}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="achievement-date">
                {new Date(achievement.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Badge variant={getStatusVariant(achievement.status)} data-testid="achievement-status">
            {achievement.status}
          </Badge>
        </div>

        <p className="text-muted-foreground text-sm mb-4" data-testid="achievement-description">
          {achievement.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {achievement.likes && (
              <div className="flex items-center space-x-1">
                <Heart className="h-4 w-4 text-destructive" />
                <span data-testid="achievement-likes">{achievement.likes.length}</span>
              </div>
            )}
            {achievement.comments && (
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span data-testid="achievement-comments">{achievement.comments.length}</span>
              </div>
            )}
            {achievement.status === 'approved' && achievement.qrCodePath && (
              <div className="flex items-center space-x-1">
                <QrCode className="h-4 w-4" />
                <span>QR Available</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            {onApprove && onReject && achievement.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onApprove(achievement._id)}
                  data-testid="button-approve"
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onReject(achievement._id)}
                  data-testid="button-reject"
                >
                  Reject
                </Button>
              </>
            )}
            
            {onView && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onView(achievement)}
                data-testid="button-view-details"
              >
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
