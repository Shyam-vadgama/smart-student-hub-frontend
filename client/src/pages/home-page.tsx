import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { achievementApi, analyticsApi } from "@/lib/api";
import { Trophy, CheckCircle, Clock, Calendar, Medal, Star, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [newAchievement, setNewAchievement] = useState({
    title: "",
    description: "",
    file: null as File | null
  });

  // Fetch user's achievements
  const { data: achievements = [] } = useQuery({
    queryKey: ["/api/achievements"],
    queryFn: () => achievementApi.getAll(),
    enabled: !!user
  });

  // Fetch analytics for HOD
  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics"],
    queryFn: () => analyticsApi.get(),
    enabled: user?.role === 'hod'
  });

  const handleFileSelect = (file: File) => {
    setNewAchievement(prev => ({ ...prev, file }));
  };

  const handleSubmitAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAchievement.title || !newAchievement.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', newAchievement.title);
      formData.append('description', newAchievement.description);
      if (newAchievement.file) {
        formData.append('certificate', newAchievement.file);
      }

      await achievementApi.create(formData);
      
      toast({
        title: "Achievement submitted",
        description: "Your achievement has been submitted for review"
      });

      setNewAchievement({ title: "", description: "", file: null });
    } catch (error) {
      toast({
        title: "Submission failed",
        description: "Failed to submit achievement. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  const getStats = () => {
    if (user.role === 'student') {
      const total = achievements.length;
      const approved = achievements.filter((a: any) => a.status === 'approved').length;
      const pending = achievements.filter((a: any) => a.status === 'pending').length;
      const thisMonth = achievements.filter((a: any) => {
        const achievementDate = new Date(a.createdAt);
        const now = new Date();
        return achievementDate.getMonth() === now.getMonth() && 
               achievementDate.getFullYear() === now.getFullYear();
      }).length;

      return { total, approved, pending, thisMonth };
    }

    if (user.role === 'hod' && analytics) {
      return {
        totalStudents: analytics.totalStudents,
        totalAchievements: analytics.totalAchievements,
        pendingReviews: analytics.pendingReviews,
        approvalRate: `${analytics.approvalRate}%`
      };
    }

    return { total: 0, approved: 0, pending: 0, thisMonth: 0 };
  };

  const stats = getStats();
  const recentAchievements = achievements.slice(0, 3);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Dashboard" 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {user.role === 'student' && (
              <>
                <StatsCard
                  title="Total Achievements"
                  value={stats.total}
                  icon={Trophy}
                  iconBgColor="bg-primary/10"
                />
                <StatsCard
                  title="Approved"
                  value={stats.approved}
                  icon={CheckCircle}
                  iconBgColor="bg-accent/10"
                />
                <StatsCard
                  title="Pending"
                  value={stats.pending}
                  icon={Clock}
                  iconBgColor="bg-chart-3/10"
                />
                <StatsCard
                  title="This Month"
                  value={stats.thisMonth}
                  icon={Calendar}
                  iconBgColor="bg-chart-4/10"
                />
              </>
            )}
            
            {user.role === 'hod' && analytics && (
              <>
                <StatsCard
                  title="Total Students"
                  value={stats.totalStudents}
                  icon={Trophy}
                  change="↗ 12%"
                  changeColor="positive"
                />
                <StatsCard
                  title="Total Achievements"
                  value={stats.totalAchievements}
                  icon={CheckCircle}
                  change="↗ 18%"
                  changeColor="positive"
                />
                <StatsCard
                  title="Pending Reviews"
                  value={stats.pendingReviews}
                  icon={Clock}
                  change="↗ 5%"
                  changeColor="negative"
                />
                <StatsCard
                  title="Approval Rate"
                  value={stats.approvalRate}
                  icon={Calendar}
                  change="↗ 3%"
                  changeColor="positive"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Achievement - Students only */}
            {user.role === 'student' && (
              <Card>
                <CardHeader>
                  <CardTitle>Upload New Achievement</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitAchievement} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Achievement Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter achievement title"
                        value={newAchievement.title}
                        onChange={(e) => setNewAchievement(prev => ({ ...prev, title: e.target.value }))}
                        data-testid="input-achievement-title"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe your achievement..."
                        value={newAchievement.description}
                        onChange={(e) => setNewAchievement(prev => ({ ...prev, description: e.target.value }))}
                        className="h-20 resize-none"
                        data-testid="input-achievement-description"
                      />
                    </div>

                    <div>
                      <Label>Tag Upload</Label>
                      <FileUpload onFileSelect={handleFileSelect} />
                    </div>

                    <Button type="submit" className="w-full" data-testid="button-submit-achievement">
                      Submit Achievement
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {user.role === 'student' ? 'Recent Achievements' : 'Recent Activity'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAchievements.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No achievements yet. Start by uploading your first achievement!
                    </p>
                  ) : (
                    recentAchievements.map((achievement: any) => (
                      <div key={achievement._id} className="flex items-center space-x-4 p-3 border border-border rounded-lg">
                        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                          {achievement.status === 'approved' ? (
                            <Medal className="h-5 w-5 text-accent" />
                          ) : achievement.status === 'pending' ? (
                            <Clock className="h-5 w-5 text-chart-3" />
                          ) : (
                            <Tag className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(achievement.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          achievement.status === 'approved' ? 'default' :
                          achievement.status === 'pending' ? 'secondary' : 'destructive'
                        }>
                          {achievement.status}
                        </Badge>
                      </div>
                    ))
                  )}

                  {user.role === 'student' && recentAchievements.length > 0 && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.location.href = '/achievements'}
                      data-testid="button-view-all-achievements"
                    >
                      View All Achievements
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
