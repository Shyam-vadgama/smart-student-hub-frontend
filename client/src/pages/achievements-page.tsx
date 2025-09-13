import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AchievementCard from "@/components/AchievementCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { achievementApi } from "@/lib/api";
import { Plus } from "lucide-react";

export default function AchievementsPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filter, setFilter] = useState('all');

  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ["/api/achievements", filter === 'all' ? undefined : filter],
    queryFn: () => achievementApi.getAll(filter === 'all' ? undefined : filter),
    enabled: !!user
  });

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="My Achievements" 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">My Achievements</h2>
            <Button data-testid="button-add-achievement">
              <Plus className="mr-2 h-4 w-4" />
              Add Achievement
            </Button>
          </div>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={setFilter} className="mb-6">
            <TabsList className="grid w-fit grid-cols-4">
              <TabsTrigger value="all" data-testid="filter-all">All</TabsTrigger>
              <TabsTrigger value="approved" data-testid="filter-approved">Approved</TabsTrigger>
              <TabsTrigger value="pending" data-testid="filter-pending">Pending</TabsTrigger>
              <TabsTrigger value="rejected" data-testid="filter-rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>

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
                {filter === 'all' 
                  ? "You haven't uploaded any achievements yet."
                  : `No ${filter} achievements found.`
                }
              </p>
              <Button data-testid="button-upload-first">
                <Plus className="mr-2 h-4 w-4" />
                Upload Your First Achievement
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement: any) => (
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
