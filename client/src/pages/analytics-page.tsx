import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { analyticsApi, achievementApi } from "@/lib/api";
import { Users, Trophy, Clock, Percent, Download, TrendingUp, UserPlus, Edit, BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [timeFilter, setTimeFilter] = useState("30");
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics"],
    queryFn: () => analyticsApi.get(),
    enabled: !!user && user.role === 'hod'
  });

  const { data: recentAchievements = [] } = useQuery({
    queryKey: ["/api/achievements", "recent"],
    queryFn: () => achievementApi.getAll(),
    enabled: !!user && user.role === 'hod'
  });

  // Fetch filtered achievements for analytics
  const { data: filteredAchievements = [] } = useQuery({
    queryKey: ["/api/achievements", "analytics", categoryFilter, typeFilter, statusFilter],
    queryFn: () => {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const category = categoryFilter === 'all' ? undefined : categoryFilter;
      const type = typeFilter === 'all' ? undefined : typeFilter;
      return achievementApi.getAll(status, category, type);
    },
    enabled: !!user && user.role === 'hod'
  });

  if (!user || user.role !== 'hod') {
    return null;
  }

  // Extract unique categories and types for filter dropdowns
  const categories = ['all', ...Array.from(new Set(recentAchievements.map((a: any) => a.category).filter(Boolean)))];
  const types = ['all', ...Array.from(new Set(recentAchievements.map((a: any) => a.type).filter(Boolean)))];

  const handleExportReport = () => {
    // Implementation for exporting analytics report
    console.log('Exporting analytics report...');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'achievement_approved':
        return <Trophy className="h-4 w-4 text-accent" />;
      case 'user_registered':
        return <UserPlus className="h-4 w-4 text-primary" />;
      case 'form_created':
        return <Edit className="h-4 w-4 text-chart-4" />;
      default:
        return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDepartmentColor = (department: string) => {
    const colors = {
      'Computer Science': 'bg-primary',
      'Electronics': 'bg-accent',
      'Mechanical': 'bg-chart-3',
      'Civil': 'bg-chart-4',
      'Others': 'bg-chart-5'
    };
    return colors[department as keyof typeof colors] || 'bg-muted';
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Analytics Dashboard" 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
            <div className="flex items-center space-x-4">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-40" data-testid="select-time-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last 3 Months</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportReport} data-testid="button-export-report">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div>
              <label className="text-sm font-medium mb-1 block">Status Filter</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
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
              <label className="text-sm font-medium mb-1 block">Category Filter</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
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
              <label className="text-sm font-medium mb-1 block">Type Filter</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
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
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusFilter('all');
                  setCategoryFilter('all');
                  setTypeFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Students"
              value={analytics?.totalStudents || 0}
              icon={Users}
              change="↗ 12%"
              changeColor="positive"
              iconBgColor="bg-primary/10"
            />
            <StatsCard
              title="Total Achievements"
              value={analytics?.totalAchievements || 0}
              icon={Trophy}
              change="↗ 18%"
              changeColor="positive"
              iconBgColor="bg-accent/10"
            />
            <StatsCard
              title="Pending Reviews"
              value={analytics?.pendingReviews || 0}
              icon={Clock}
              change="↗ 5%"
              changeColor="negative"
              iconBgColor="bg-chart-3/10"
            />
            <StatsCard
              title="Approval Rate"
              value={`${analytics?.approvalRate || 0}%`}
              icon={Percent}
              change="↗ 3%"
              changeColor="positive"
              iconBgColor="bg-chart-4/10"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            {/* Achievement Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Achievement Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Achievement trends over time</p>
                    <p className="text-xs text-muted-foreground">Chart implementation with actual data</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Department Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Department Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.departmentBreakdown?.map((dept: any, index: number) => (
                    <div key={dept._id || index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 ${getDepartmentColor(dept._id)} rounded-full`}></div>
                        <span className="text-foreground" data-testid={`department-${index}`}>
                          {dept._id || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-foreground" data-testid={`department-count-${index}`}>
                          {dept.count}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {analytics?.totalStudents > 0 ? Math.round((dept.count / analytics.totalStudents) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-4">No department data available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAchievements.slice(0, 10).map((achievement: any, index: number) => (
                    <TableRow key={achievement._id || index} data-testid={`activity-row-${index}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {getActivityIcon('achievement_approved')}
                          <div>
                            <p className="font-medium text-foreground" data-testid={`activity-title-${index}`}>
                              Achievement {achievement.status === 'approved' ? 'Approved' : 'Submitted'}
                            </p>
                            <p className="text-xs text-muted-foreground" data-testid={`activity-description-${index}`}>
                              {achievement.title}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-foreground" data-testid={`activity-user-${index}`}>
                        {achievement.student?.name || 'Unknown User'}
                      </TableCell>
                      <TableCell>
                        {achievement.category ? (
                          <Badge variant="outline" className="text-xs">
                            {achievement.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {achievement.type ? (
                          <Badge variant="outline" className="text-xs">
                            {achievement.type}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`activity-department-${index}`}>
                        {achievement.student?.profile?.department || 'N/A'}
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`activity-time-${index}`}>
                        {new Date(achievement.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            achievement.status === 'approved' ? 'default' :
                            achievement.status === 'pending' ? 'secondary' : 'destructive'
                          }
                          data-testid={`activity-status-${index}`}
                        >
                          {achievement.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredAchievements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No activities found with current filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
