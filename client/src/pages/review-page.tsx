import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import AchievementCard from "@/components/AchievementCard";
import { achievementApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle, ClipboardCheck, Timer } from "lucide-react";

export default function ReviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: pendingAchievements = [], isLoading } = useQuery({
    queryKey: ["/api/achievements", "pending"],
    queryFn: () => achievementApi.getAll("pending"),
    enabled: !!user
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => achievementApi.updateStatus(id, "approved"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      toast({
        title: "Achievement approved",
        description: "The achievement has been approved successfully."
      });
    },
    onError: () => {
      toast({
        title: "Approval failed",
        description: "Failed to approve achievement. Please try again.",
        variant: "destructive"
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => achievementApi.updateStatus(id, "rejected"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      toast({
        title: "Achievement rejected",
        description: "The achievement has been rejected."
      });
    },
    onError: () => {
      toast({
        title: "Rejection failed",
        description: "Failed to reject achievement. Please try again.",
        variant: "destructive"
      });
    }
  });

  if (!user || !['faculty', 'hod'].includes(user.role)) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Review Achievements" 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Review Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StatsCard
              title="Pending Review"
              value={pendingAchievements.length}
              icon={Clock}
              iconBgColor="bg-chart-3/10"
            />
            <StatsCard
              title="Approved Today"
              value="8"
              icon={CheckCircle}
              iconBgColor="bg-accent/10"
            />
            <StatsCard
              title="Total Reviewed"
              value="142"
              icon={ClipboardCheck}
              iconBgColor="bg-primary/10"
            />
            <StatsCard
              title="Avg. Review Time"
              value="2.5h"
              icon={Timer}
              iconBgColor="bg-chart-4/10"
            />
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Pending Achievements</h2>
            <p className="text-muted-foreground">
              Review and approve or reject student achievements
            </p>
          </div>

          {/* Achievements Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : pendingAchievements.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No pending reviews
              </h3>
              <p className="text-muted-foreground">
                All achievements have been reviewed. Great work!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingAchievements.map((achievement: any) => (
                <AchievementCard 
                  key={achievement._id} 
                  achievement={achievement}
                  onApprove={(id) => approveMutation.mutate(id)}
                  onReject={(id) => rejectMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
