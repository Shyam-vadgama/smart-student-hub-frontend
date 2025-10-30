import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AchievementCard from "@/components/AchievementCard";
import AchievementForm from "@/components/AchievementForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { achievementApi } from "@/lib/api";
import { Plus, Filter, Trophy, Award, Star, RefreshCw } from "lucide-react";
import { Achievement } from "@shared/schema";

export default function AchievementsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Get all achievements for filtering options
  const { data: allAchievements = [], refetch } = useQuery({
    queryKey: ["/api/achievements"],
    queryFn: () => achievementApi.getAll(),
    enabled: !!user
  });

  // Get filtered achievements
  const { data: achievements = [], isLoading, error } = useQuery({
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
    refetch();
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setTypeFilter('all');
  };

  const handleApprove = async (id: string) => {
    try {
      await achievementApi.updateStatus(id, 'approved');
      // refresh both lists
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["/api/achievements"] })
      ]);
    } catch (e: any) {
      console.error('Approve failed', e);
    }
  };

  const handleReject = async (id: string) => {
    try {
      // Optional: ask for a comment
      const comment = window.prompt('Enter a reason (optional):') || undefined;
      await achievementApi.updateStatus(id, 'rejected', comment);
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["/api/achievements"] })
      ]);
    } catch (e: any) {
      console.error('Reject failed', e);
    }
  };

  const getActiveFiltersCount = () => {
    return [statusFilter, categoryFilter, typeFilter].filter(f => f !== 'all').length;
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={user.role === 'student' ? "My Achievements" : "All Achievements"} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Faculty/HOD Quick Review Panel: show the first pending achievement */}
            {user.role !== 'student' && allAchievements.length > 0 && (
              (() => {
                const firstPending = (allAchievements as Achievement[]).find(a => a.status === 'pending');
                if (!firstPending) return null;
                const isPdf = (url?: string) => !!url && url.toLowerCase().endsWith('.pdf');
                return (
                  <div className="bg-white rounded-xl shadow p-6 mb-8 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold">First Pending Achievement to Review</h2>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleApprove(firstPending._id)}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(firstPending._id)}>Reject</Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">{firstPending.title}</h3>
                        <p className="text-sm text-gray-700 mb-4 whitespace-pre-line">{firstPending.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {firstPending.category && <span className="text-xs px-2 py-1 bg-gray-100 rounded">Category: {firstPending.category}</span>}
                          {firstPending.type && <span className="text-xs px-2 py-1 bg-gray-100 rounded">Type: {firstPending.type}</span>}
                        </div>
                        {firstPending.certificatePath && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold mb-2">Certificate</h4>
                            {isPdf(firstPending.certificatePath) ? (
                              <a href={firstPending.certificatePath} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open certificate (PDF)</a>
                            ) : (
                              <img src={firstPending.certificatePath} alt="Certificate" className="max-h-64 rounded border" />
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        {firstPending.media && firstPending.media.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Media</h4>
                            <div className="grid grid-cols-2 gap-3">
                              {firstPending.media.slice(0,4).map((m, idx) => (
                                <div key={idx} className="aspect-video bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                                  {m.type === 'image' ? (
                                    <img src={m.url} alt={`Media ${idx}`} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs text-gray-600">Video</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Trophy className="h-8 w-8 mr-3 text-yellow-500" />
                  {user.role === 'student' ? "My Achievements" : "All Achievements"}
                </h1>
                <p className="text-gray-600 mt-1">
                  {user.role === 'student' 
                    ? "Track and showcase your accomplishments" 
                    : "View and manage student achievements"
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {user.role === 'student' && (
                  <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
                    <DialogTrigger asChild>
                      <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Achievement
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-xl flex items-center">
                          <Award className="h-5 w-5 mr-2 text-yellow-500" />
                          Add New Achievement
                        </DialogTitle>
                      </DialogHeader>
                      <AchievementForm onSuccess={handleAddSuccess} />
                    </DialogContent>
                  </Dialog>
                )}
                
                {getActiveFiltersCount() > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={handleClearFilters}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-100 mr-4">
                    <Trophy className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{allAchievements.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-100 mr-4">
                    <Star className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Approved</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {allAchievements.filter((a: Achievement) => a.status === 'approved').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-5 border-l-4 border-yellow-500">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-yellow-100 mr-4">
                    <Award className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {allAchievements.filter((a: Achievement) => a.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-red-100 mr-4">
                    <RefreshCw className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rejected</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {allAchievements.filter((a: Achievement) => a.status === 'rejected').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white rounded-xl shadow p-6 mb-8">
              <div className="flex items-center mb-4">
                <Filter className="h-5 w-5 text-gray-500 mr-2" />
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                    {getActiveFiltersCount()} active
                  </Badge>
                )}
              </div>
              
              <div className="space-y-4">
                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all" data-testid="filter-all" className="text-sm">All</TabsTrigger>
                    <TabsTrigger value="approved" data-testid="filter-approved" className="text-sm">Approved</TabsTrigger>
                    <TabsTrigger value="pending" data-testid="filter-pending" className="text-sm">Pending</TabsTrigger>
                    <TabsTrigger value="rejected" data-testid="filter-rejected" className="text-sm">Rejected</TabsTrigger>
                  </TabsList>
                </Tabs>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Filter by Category</label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="h-10">
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
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Filter by Type</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="h-10">
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
            </div>

            {/* Achievements Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-5">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="flex justify-between">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Achievements</h2>
                <p className="text-gray-600 mb-6">Failed to load achievements. Please try again.</p>
                <Button onClick={() => refetch()} className="flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : achievements.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="text-gray-400 text-6xl mb-6">🏆</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">No achievements found</h2>
                <p className="text-gray-600 mb-6">
                  {user.role === 'student' 
                    ? (statusFilter === 'all' 
                        ? "You haven't uploaded any achievements yet."
                        : `No ${statusFilter} achievements found with current filters.`)
                    : `No achievements found with current filters.`
                  }
                </p>
                {user.role === 'student' && (
                  <Button 
                    onClick={() => setShowAddForm(true)} 
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold shadow-md hover:shadow-lg"
                    data-testid="button-upload-first"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Your First Achievement
                  </Button>
                )}
                {getActiveFiltersCount() > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={handleClearFilters}
                    className="ml-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement: Achievement) => (
                  <AchievementCard
                    key={achievement._id}
                    achievement={achievement}
                    {...(user.role !== 'student' && achievement.status === 'pending'
                      ? { onApprove: handleApprove, onReject: handleReject }
                      : {})}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}