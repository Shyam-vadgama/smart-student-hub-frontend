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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { achievementApi, analyticsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Trophy, CheckCircle, Clock, Calendar, Medal, Star, Tag, FileText } from "lucide-react";
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
  
  // Filter states for faculty/HOD
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch user's achievements
  const { data: achievements = [] } = useQuery({
    queryKey: ["/api/achievements"],
    queryFn: () => achievementApi.getAll(),
    enabled: !!user
  });

  // Fetch all achievements for faculty/HOD with filters
  const { data: allAchievements = [] } = useQuery({
    queryKey: ["/api/achievements", "all", categoryFilter, typeFilter, statusFilter],
    queryFn: () => {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const category = categoryFilter === 'all' ? undefined : categoryFilter;
      const type = typeFilter === 'all' ? undefined : typeFilter;
      return achievementApi.getAll(status, category, type);
    },
    enabled: !!user && (user.role === 'faculty' || user.role === 'hod')
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
      
      // Invalidate achievements query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      
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
    const baseStats = {
      total: "0",
      approved: "0",
      pending: "0",
      thisMonth: "0",
      totalStudents: "0",
      totalAchievements: "0",
      pendingReviews: "0",
      approvalRate: "0%"
    };
    
    if (user.role === 'student') {
      // Ensure achievements is always an array
      const achievementsArray = Array.isArray(achievements) ? achievements : [];
      const total = achievementsArray.length;
      const approved = achievementsArray.filter((a: any) => a.status === 'approved').length;
      const pending = achievementsArray.filter((a: any) => a.status === 'pending').length;
      const thisMonth = achievementsArray.filter((a: any) => {
        const achievementDate = new Date(a.createdAt);
        const now = new Date();
        return achievementDate.getMonth() === now.getMonth() && 
               achievementDate.getFullYear() === now.getFullYear();
      }).length;

      return { 
        ...baseStats,
        total: total.toString(), 
        approved: approved.toString(), 
        pending: pending.toString(), 
        thisMonth: thisMonth.toString()
      };
    }

    if (user.role === 'hod' && analytics) {
      return {
        ...baseStats,
        totalStudents: (analytics.totalStudents || 0).toString(),
        totalAchievements: (analytics.totalAchievements || 0).toString(),
        pendingReviews: (analytics.pendingReviews || 0).toString(),
        approvalRate: `${analytics.approvalRate || 0}%`
      };
    }

    return baseStats;
  };

  const stats = getStats();
  const achievementsArray = Array.isArray(achievements) ? achievements : [];
  const recentAchievements = achievementsArray.slice(0, 3);
  
  // For faculty/HOD, use filtered achievements
  const displayAchievements = (user.role === 'faculty' || user.role === 'hod') ? allAchievements : achievements;
  const displayAchievementsArray = Array.isArray(displayAchievements) ? displayAchievements : [];
  const recentDisplayAchievements = displayAchievementsArray.slice(0, 3);

  // Extract unique categories and types for filter dropdowns
  const allAchievementsForFilters = (user.role === 'faculty' || user.role === 'hod') ? allAchievements : achievements;
  const categories = ['all', ...Array.from(new Set(allAchievementsForFilters.map((a: any) => a.category).filter(Boolean)))];
  const types = ['all', ...Array.from(new Set(allAchievementsForFilters.map((a: any) => a.type).filter(Boolean)))];

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

            {/* Recent Achievements or Student Forms */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {user.role === 'student' ? 'Recent Achievements' : 'Recent Activity'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.role === 'student' ? (
                    <>
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

                      <div className="pt-4 border-t border-border">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => window.location.href = '/student/forms'}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Available Forms
                        </Button>
                      </div>

                      {user.role === 'student' && recentAchievements.length > 0 && (
                        <Button 
                          variant="outline" 
                          className="w-full mt-2"
                          onClick={() => window.location.href = '/achievements'}
                          data-testid="button-view-all-achievements"
                        >
                          View All Achievements
                        </Button>
                      )}
                    </>
                  ) : (
                    // For faculty/HOD
                    <div className="space-y-4">
                      {/* Filter Controls for Faculty/HOD */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg">
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Status</Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Category</Label>
                          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="All Categories" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Categories</SelectItem>
                              {categories.filter((c): c is string => c !== 'all' && typeof c === 'string').map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Type</Label>
                          <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              {types.filter((t): t is string => t !== 'all' && typeof t === 'string').map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full mt-4"
                        onClick={() => window.location.href = '/leetcode/create'}
                      >
                        Create LeetCode Problem
                      </Button>

                      {recentDisplayAchievements.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No achievements found with current filters.
                        </p>
                      ) : (
                        recentDisplayAchievements.map((achievement: any) => (
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
                              {achievement.category && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {achievement.category}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge variant={
                                achievement.status === 'approved' ? 'default' :
                                achievement.status === 'pending' ? 'secondary' : 'destructive'
                              }>
                                {achievement.status}
                              </Badge>
                              {achievement.type && (
                                <Badge variant="outline" className="text-xs">
                                  {achievement.type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
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