import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import StatsCard from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { analyticsApi } from "@/lib/api";
import { University, GraduationCap, Users, Search } from "lucide-react";

export default function UsersPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics"],
    queryFn: () => analyticsApi.get(),
    enabled: !!user && user.role === 'hod'
  });

  // Mock users data - in real implementation, this would come from an API
  const mockUsers = [
    {
      _id: "1",
      name: "Alice Davis",
      email: "alice.davis@university.edu",
      role: "student",
      department: "Computer Science",
      lastActive: "2 hours ago",
      status: "active",
      achievementCount: 12
    },
    {
      _id: "2",
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@university.edu",
      role: "faculty",
      department: "Computer Science",
      lastActive: "1 hour ago",
      status: "active",
      achievementCount: 0
    },
    {
      _id: "3",
      name: "Bob Wilson",
      email: "bob.wilson@university.edu",
      role: "student",
      department: "Electronics",
      lastActive: "3 hours ago",
      status: "active",
      achievementCount: 8
    }
  ];

  if (!user || user.role !== 'hod') {
    return null;
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student':
        return <University className="h-4 w-4" />;
      case 'faculty':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'student':
        return 'default' as const;
      case 'faculty':
        return 'secondary' as const;
      case 'hod':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const filteredUsers = mockUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleViewUser = (userId: string) => {
    console.log('Viewing user:', userId);
  };

  const handleEditUser = (userId: string) => {
    console.log('Editing user:', userId);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="User Management" 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-foreground">User Management</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="input-search-users"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40" data-testid="select-role-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                  <SelectItem value="hod">HOD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <StatsCard
              title="Students"
              value={analytics?.totalStudents || 0}
              icon={University}
              iconBgColor="bg-primary/10"
            />
            <StatsCard
              title="Faculty"
              value="48"
              icon={GraduationCap}
              iconBgColor="bg-accent/10"
            />
            <StatsCard
              title="Active Today"
              value="156"
              icon={Users}
              iconBgColor="bg-chart-3/10"
            />
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Achievements</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((userData, index) => (
                    <TableRow key={userData._id} data-testid={`user-row-${index}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getUserInitials(userData.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground" data-testid={`user-name-${index}`}>
                              {userData.name}
                            </p>
                            <p className="text-xs text-muted-foreground" data-testid={`user-email-${index}`}>
                              {userData.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getRoleBadgeVariant(userData.role)}
                          className="flex items-center space-x-1 w-fit"
                          data-testid={`user-role-${index}`}
                        >
                          {getRoleIcon(userData.role)}
                          <span className="capitalize">{userData.role}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground" data-testid={`user-department-${index}`}>
                        {userData.department}
                      </TableCell>
                      <TableCell className="text-foreground" data-testid={`user-achievements-${index}`}>
                        {userData.role === 'student' ? userData.achievementCount : '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`user-last-active-${index}`}>
                        {userData.lastActive}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="default"
                          className="bg-accent/10 text-accent"
                          data-testid={`user-status-${index}`}
                        >
                          {userData.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUser(userData._id)}
                            data-testid={`button-view-user-${index}`}
                          >
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(userData._id)}
                            data-testid={`button-edit-user-${index}`}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm || roleFilter !== 'all' 
                          ? 'No users found matching your filters'
                          : 'No users found'
                        }
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
