import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import AchievementCard from "@/components/AchievementCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { achievementApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  CheckCircle, 
  ClipboardCheck, 
  Timer, 
  Tag, 
  Award, 
  Search, 
  Download,
  Calendar,
  User,
  FileText,
  X,
  Filter,
  SortAsc,
  Grid,
  List,
  AlertCircle,
  RefreshCw,
  Eye
} from "lucide-react";
import { Achievement } from "@shared/schema";
import { format, parseISO } from "date-fns";

export default function ReviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selected, setSelected] = useState<Achievement | null>(null);
  const [viewedMap, setViewedMap] = useState<Record<string, boolean>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('pending');

  // Build query parameters based on current filters
  const buildQueryParams = () => {
    const params: Record<string, string> = {};
    
    if (activeTab !== 'all') {
      params.status = activeTab;
    }
    
    if (categoryFilter !== 'all') {
      params.category = categoryFilter;
    }
    
    if (typeFilter !== 'all') {
      params.type = typeFilter;
    }
    
    if (searchQuery) {
      params.search = searchQuery;
    }
    
    return params;
  };

  // Fetch achievements using the API endpoint
  const { 
    data: achievementsData = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/achievements", activeTab, categoryFilter, typeFilter, searchQuery, sortBy],
    queryFn: async () => {
      const params = buildQueryParams();
      console.log("Fetching achievements with params:", params);
      
      try {
        // First try the direct API call with query parameters
        const response = await fetch(`/api/achievements?${new URLSearchParams(params)}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        console.log("Achievements data:", data);
        return data;
      } catch (err) {
        console.error("Direct API call failed, falling back to achievementApi:", err);
        
        // Fall back to the achievementApi method
        return achievementApi.getAll(activeTab as any).then(data => {
          // Apply client-side filtering
          let filtered = data;
          
          if (categoryFilter !== 'all') {
            filtered = filtered.filter(a => a.category === categoryFilter);
          }
          
          if (typeFilter !== 'all') {
            filtered = filtered.filter(a => a.type === typeFilter);
          }
          
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(a => 
              a.title.toLowerCase().includes(query) ||
              a.description.toLowerCase().includes(query) ||
              a.studentName.toLowerCase().includes(query)
            );
          }
          
          // Apply sorting
          if (sortBy === 'newest') {
            filtered.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
          } else if (sortBy === 'oldest') {
            filtered.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
          } else if (sortBy === 'student') {
            filtered.sort((a, b) => a.studentName.localeCompare(b.studentName));
          } else if (sortBy === 'category') {
            filtered.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
          }
          
          return filtered;
        });
      }
    },
    enabled: !!user
  });
  
  // Stats data
  const { data: statsData } = useQuery({
    queryKey: ["/api/achievements/stats"],
    queryFn: () => achievementApi.getStats(),
    enabled: !!user
  });

  // Extract unique categories and types for filter dropdowns
  const categories = ['all', ...Array.from(new Set(achievementsData.map((a: Achievement) => a.category).filter(Boolean)))];
  const types = ['all', ...Array.from(new Set(achievementsData.map((a: Achievement) => a.type).filter(Boolean)))];

  const approveMutation = useMutation({
    mutationFn: (ids: string | string[]) => 
      Array.isArray(ids) 
        ? achievementApi.bulkUpdateStatus(ids, "approved")
        : achievementApi.updateStatus(ids, "approved"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements/stats"] });
      toast({
        title: "Achievement approved",
        description: Array.isArray(selectedItems) && selectedItems.size > 1
          ? `${selectedItems.size} achievements have been approved successfully.`
          : "The achievement has been approved successfully."
      });
      setSelectedItems(new Set());
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
    mutationFn: ({ ids, reason }: { ids: string | string[], reason: string }) => 
      Array.isArray(ids) 
        ? achievementApi.bulkUpdateStatus(ids, "rejected", reason)
        : achievementApi.updateStatus(ids, "rejected", reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/achievements/stats"] });
      toast({
        title: "Achievement rejected",
        description: Array.isArray(selectedItems) && selectedItems.size > 1
          ? `${selectedItems.size} achievements have been rejected.`
          : "The achievement has been rejected."
      });
      setSelectedItems(new Set());
      setRejectReason('');
      setShowRejectDialog(false);
    },
    onError: () => {
      toast({
        title: "Rejection failed",
        description: "Failed to reject achievement. Please try again.",
        variant: "destructive"
      });
    }
  });

  const ensureViewed = (id: string): boolean => {
    if (viewedMap[id]) return true;
    toast({
      title: "Please review first",
      description: "Open the achievement details and review the uploaded certificate/media before approving or rejecting.",
      variant: "destructive"
    });
    return false;
  };

  const handleView = (achievement: Achievement) => {
    setSelected(achievement);
    setViewedMap(prev => ({ ...prev, [achievement._id]: true }));
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === achievementsData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(achievementsData.map(a => a._id)));
    }
  };

  const handleBulkApprove = () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one achievement to approve.",
        variant: "destructive"
      });
      return;
    }
    
    const allViewed = Array.from(selectedItems).every(id => viewedMap[id]);
    if (!allViewed) {
      toast({
        title: "Please review all selected items",
        description: "You must review each achievement before approving.",
        variant: "destructive"
      });
      return;
    }
    
    approveMutation.mutate(Array.from(selectedItems));
  };

  const handleBulkReject = () => {
    if (selectedItems.size === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one achievement to reject.",
        variant: "destructive"
      });
      return;
    }
    
    const allViewed = Array.from(selectedItems).every(id => viewedMap[id]);
    if (!allViewed) {
      toast({
        title: "Please review all selected items",
        description: "You must review each achievement before rejecting.",
        variant: "destructive"
      });
      return;
    }
    
    setShowRejectDialog(true);
  };

  const confirmBulkReject = () => {
    if (!rejectReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejection.",
        variant: "destructive"
      });
      return;
    }
    
    rejectMutation.mutate({
      ids: Array.from(selectedItems),
      reason: rejectReason
    });
  };

  const handleExport = () => {
    // Implementation for exporting data
    toast({
      title: "Export started",
      description: "Your data is being prepared for download."
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + A to select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        handleSelectAll();
      }
      
      // Escape to close modal
      if (e.key === 'Escape' && selected) {
        setSelected(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, achievementsData]);

  if (!user || !['faculty', 'hod'].includes(user.role)) {
    return null;
  }

  // Helper function to safely format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return "No date";
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Helper function to get status badge
  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

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
              value={statsData?.pending || 0}
              icon={Clock}
              iconBgColor="bg-chart-3/10"
              trend={statsData?.pendingTrend}
            />
            <StatsCard
              title="Approved Today"
              value={statsData?.approvedToday || 0}
              icon={CheckCircle}
              iconBgColor="bg-accent/10"
              trend={statsData?.approvedTrend}
            />
            <StatsCard
              title="Total Reviewed"
              value={statsData?.totalReviewed || 0}
              icon={ClipboardCheck}
              iconBgColor="bg-primary/10"
            />
            <StatsCard
              title="Avg. Review Time"
              value={`${statsData?.avgReviewTime || '0'}h`}
              icon={Timer}
              iconBgColor="bg-chart-4/10"
            />
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Achievement Reviews</h2>
            <p className="text-muted-foreground">
              Review and approve or reject student achievements
            </p>
          </div>

         

          {/* Tabs for different statuses */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="pending">Pending ({statsData?.pending || 0})</TabsTrigger>
              <TabsTrigger value="approved">Approved ({statsData?.approved || 0})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({statsData?.rejected || 0})</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="space-y-4">
              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
                <div className="md:col-span-4 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search achievements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
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
                
                <div className="md:col-span-2">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
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
                
                <div className="md:col-span-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SortAsc className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="student">Student Name</SelectItem>
                      <SelectItem value="category">Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setCategoryFilter('all');
                      setTypeFilter('all');
                      setSearchQuery('');
                      setSortBy('newest');
                    }}
                    className="flex-1"
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Bulk Actions */}
              {activeTab === 'pending' && selectedItems.size > 0 && (
                <div className="bg-muted/50 p-3 rounded-lg mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="select-all"
                      checked={selectedItems.size === achievementsData.length && achievementsData.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="select-all" className="text-sm">
                      {selectedItems.size} of {achievementsData.length} selected
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleBulkApprove}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve Selected
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={handleBulkReject}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject Selected
                    </Button>
                  </div>
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex justify-end mb-4">
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Achievements Grid/List */}
              {isLoading ? (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "space-y-4"
                }>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={viewMode === 'grid' 
                      ? "h-64 bg-muted animate-pulse rounded-lg" 
                      : "h-32 bg-muted animate-pulse rounded-lg"
                    }></div>
                  ))}
                </div>
              ) : isError ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Error Loading Achievements
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {error?.message || "Failed to load achievements. Please try again."}
                  </p>
                  <Button onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : achievementsData.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No {activeTab} achievements
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {activeTab === 'pending' 
                      ? "All achievements have been reviewed. Great work!" 
                      : `No ${activeTab} achievements found with the current filters.`}
                  </p>
                  {(categoryFilter !== 'all' || typeFilter !== 'all' || searchQuery) && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setCategoryFilter('all');
                        setTypeFilter('all');
                        setSearchQuery('');
                      }}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {achievementsData.map((achievement: Achievement) => (
                        <div key={achievement._id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-lg truncate">{achievement.title}</h3>
                              <Checkbox 
                                checked={selectedItems.has(achievement._id)}
                                onCheckedChange={() => handleSelectItem(achievement._id)}
                              />
                            </div>
                            
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline" className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {achievement.studentName || "Unknown"}
                              </Badge>
                              {getStatusBadge(achievement.status)}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {achievement.description || "No description provided"}
                            </p>
                            
                            <div className="flex justify-between items-center">
                              <div className="flex gap-1">
                                {achievement.category && (
                                  <Badge variant="secondary" className="text-xs">
                                    {achievement.category}
                                  </Badge>
                                )}
                                {achievement.type && (
                                  <Badge variant="outline" className="text-xs">
                                    {achievement.type}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleView(achievement)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                {/* Only show action buttons for pending achievements */}
                                {achievement.status === 'pending' && (
                                  <>
                                    <Button 
                                      size="sm" 
                                      onClick={() => {
                                        if (!ensureViewed(achievement._id)) return;
                                        approveMutation.mutate(achievement._id);
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="destructive"
                                      onClick={() => {
                                        if (!ensureViewed(achievement._id)) return;
                                        setSelectedItems(new Set([achievement._id]));
                                        setShowRejectDialog(true);
                                      }}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {achievementsData.map((achievement: Achievement) => (
                        <div 
                          key={achievement._id} 
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <Checkbox 
                              checked={selectedItems.has(achievement._id)}
                              onCheckedChange={() => handleSelectItem(achievement._id)}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-medium truncate">{achievement.title}</h3>
                                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>{achievement.studentName || "Unknown"}</span>
                                    <Calendar className="h-3 w-3 ml-2" />
                                    <span>{formatDate(achievement.date)}</span>
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  {achievement.category && (
                                    <Badge variant="secondary" className="text-xs">
                                      {achievement.category}
                                    </Badge>
                                  )}
                                  {achievement.type && (
                                    <Badge variant="outline" className="text-xs">
                                      {achievement.type}
                                    </Badge>
                                  )}
                                  {getStatusBadge(achievement.status)}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {achievement.description || "No description provided"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleView(achievement)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {/* Only show action buttons for pending achievements */}
                              {achievement.status === 'pending' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      if (!ensureViewed(achievement._id)) return;
                                      approveMutation.mutate(achievement._id);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => {
                                      if (!ensureViewed(achievement._id)) return;
                                      setSelectedItems(new Set([achievement._id]));
                                      setShowRejectDialog(true);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Review Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Achievement</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold">{selected.title}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {selected.studentName || "Unknown student"}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(selected.date)}
                  </Badge>
                  {selected.category && (
                    <Badge variant="secondary">{selected.category}</Badge>
                  )}
                  {selected.type && (
                    <Badge variant="outline">{selected.type}</Badge>
                  )}
                  {getStatusBadge(selected.status)}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-muted-foreground whitespace-pre-line">{selected.description || "No description provided"}</p>
              </div>
              
              {selected.certificatePath && (
                <div>
                  <h4 className="font-medium mb-2">Certificate</h4>
                  <div className="border rounded-lg overflow-hidden">
                    {selected.certificatePath.toLowerCase().endsWith('.pdf') ? (
                      <div className="p-8 flex flex-col items-center justify-center bg-muted/30">
                        <FileText className="h-12 w-12 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground mb-4">PDF Document</p>
                        <Button asChild>
                          <a href={selected.certificatePath} target="_blank" rel="noreferrer">
                            View Certificate
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <img 
                        src={selected.certificatePath} 
                        alt="Certificate" 
                        className="max-h-80 w-full object-contain" 
                      />
                    )}
                  </div>
                </div>
              )}
              
              {selected.media && selected.media.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Supporting Media</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selected.media.slice(0, 4).map((m, idx) => (
                      <div key={idx} className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                        {m.type === 'image' ? (
                          <img src={m.url} alt={`Media ${idx}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-4">
                            <div className="bg-muted-foreground/20 rounded-full p-3 inline-block mb-2">
                              <FileText className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">Video Document</p>
                            <Button size="sm" variant="outline" className="mt-2" asChild>
                              <a href={m.url} target="_blank" rel="noreferrer">
                                View
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    {selected.media.length > 4 && (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        <span className="text-muted-foreground">+{selected.media.length - 4} more</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Close
                </Button>
                
                {/* Only show action buttons for pending achievements */}
                {selected.status === 'pending' && (
                  <>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        setSelectedItems(new Set([selected._id]));
                        setShowRejectDialog(true);
                      }}
                    >
                      Reject
                    </Button>
                    <Button 
                      onClick={() => {
                        if (!ensureViewed(selected._id)) return;
                        approveMutation.mutate(selected._id);
                        setSelected(null);
                      }}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Rejection Reason Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason for Rejection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Please provide a reason for rejection</Label>
              <Textarea
                id="reject-reason"
                placeholder="Enter reason here..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmBulkReject}
                disabled={rejectMutation.isPending}
              >
                Reject {selectedItems.size} {selectedItems.size > 1 ? 'Achievements' : 'Achievement'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}