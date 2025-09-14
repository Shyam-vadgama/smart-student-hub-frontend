import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AchievementCard from "@/components/AchievementCard";
import AchievementForm from "@/components/AchievementForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { achievementApi } from "@/lib/api";
import { Plus } from "lucide-react";
import { Achievement } from "@shared/schema";

export default function AchievementsPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Get all achievements for filtering options
  const { data: allAchievements = [] } = useQuery({
    queryKey: ["/api/achievements"],
    queryFn: () => achievementApi.getAll(),
    enabled: !!user
  });

  // Get filtered achievements
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ["/api/achievements", statusFilter === 'all' ? undefined : statusFilter, categoryFilter, typeFilter],
    queryFn: async () => {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const category = categoryFilter === 'all' ? undefined : categoryFilter;
      const type = typeFilter === 'all' ? undefined : typeFilter;
      return achievementApi.getAll(status, category, type);
    },
    enabled: !!user
  });

  // Extract unique categories and types for filter dropdowns
  const categories = ['all', ...Array.from(new Set(allAchievements.map((a: Achievement) => a.category).filter(Boolean)))];
  const types = ['all', ...Array.from(new Set(allAchievements.map((a: Achievement) => a.type).filter(Boolean)))];

  const handleAddSuccess = () => {
    setShowAddForm(false);
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={user.role === 'student' ? "My Achievements" : "All Achievements"} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {user.role === 'student' ? "My Achievements" : "All Achievements"}
              </h2>
              {user.role !== 'student' && (
                <p className="text-muted-foreground mt-1">
                  View and filter all student achievements by category, type, and status
                </p>
              )}
            </div>
            {user.role === 'student' && (
              <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-achievement">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Achievement
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Achievement</DialogTitle>
                  </DialogHeader>
                  <AchievementForm onSuccess={handleAddSuccess} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Filter Tabs and Selects */}
          <div className="mb-6 space-y-4">
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" data-testid="filter-all">All</TabsTrigger>
                <TabsTrigger value="approved" data-testid="filter-approved">Approved</TabsTrigger>
                <TabsTrigger value="pending" data-testid="filter-pending">Pending</TabsTrigger>
                <TabsTrigger value="rejected" data-testid="filter-rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Filter by Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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
                <label className="text-sm font-medium mb-1 block">Filter by Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
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
          </div>

          {/* Achievements Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : achievements.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-foreground mb-2">No achievements found</h3>
              <p className="text-muted-foreground mb-4">
                {user.role === 'student' 
                  ? (statusFilter === 'all' 
                      ? "You haven't uploaded any achievements yet."
                      : `No ${statusFilter} achievements found.`)
                  : `No achievements found with current filters.`
                }
              </p>
              {user.role === 'student' && (
                <Button onClick={() => setShowAddForm(true)} data-testid="button-upload-first">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Your First Achievement
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement: Achievement) => (
                <AchievementCard 
                  key={achievement._id} 
                  achievement={achievement} 
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}