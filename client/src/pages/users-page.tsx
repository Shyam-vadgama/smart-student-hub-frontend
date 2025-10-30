import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, UserCheck, RefreshCw, Users } from "lucide-react";
import { followApi } from "@/lib/api";
import { User } from "@shared/schema";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});
  const [isFollowing, setIsFollowing] = useState<Record<string, boolean>>({});
  
  // Fetch all users
  const { data: users = [], isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    },
  });
  
  // Fetch current user's following list
  const { data: following = [] } = useQuery({
    queryKey: ['following'],
    queryFn: async () => {
      const user = await fetch('/api/user', { credentials: 'include' }).then(res => res.json());
      return followApi.getFollowing(user._id);
    },
  });
  
  // Update follow status when following list changes
  useEffect(() => {
    const status: Record<string, boolean> = {};
    following.forEach((user: User) => {
      status[user._id] = true;
    });
    setFollowStatus(status);
  }, [following]);
  
  const handleFollow = async (userId: string) => {
    setIsFollowing(prev => ({ ...prev, [userId]: true }));
    try {
      await followApi.followUser(userId);
      setFollowStatus(prev => ({ ...prev, [userId]: true }));
      queryClient.invalidateQueries({ queryKey: ['following'] });
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setIsFollowing(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  const handleUnfollow = async (userId: string) => {
    setIsFollowing(prev => ({ ...prev, [userId]: true }));
    try {
      await followApi.unfollowUser(userId);
      setFollowStatus(prev => ({ ...prev, [userId]: false }));
      queryClient.invalidateQueries({ queryKey: ['following'] });
    } catch (error) {
      console.error('Error unfollowing user:', error);
    } finally {
      setIsFollowing(prev => ({ ...prev, [userId]: false }));
    }
  };
  
  // Filter users based on search term
  const filteredUsers = users.filter((user: User) => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Connect with other students</p>
        </div>
        
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled
            />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Connect with other students</p>
        </div>
        
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Users</h2>
          <p className="text-gray-600 mb-6">Failed to load users. Please try again.</p>
          <Button onClick={() => refetch()} className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      {/* Header Section */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center">
            <Users className="h-8 w-8 mr-3 text-blue-500" />
            Users
          </h1>
          <p className="text-muted-foreground mt-1">Connect with other students and faculty</p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
          <span className="font-medium">{users.length}</span> Total Users
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by name or email..."
            className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-gray-400 text-6xl mb-6">👥</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {searchTerm ? 'No Users Found' : 'No Users Available'}
          </h2>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? "No users match your search criteria." 
              : "There are no users available at the moment."}
          </p>
          {searchTerm && (
            <Button 
              onClick={() => setSearchTerm('')}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user: User) => (
            <Card 
              key={user._id} 
              className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200 hover:border-blue-300"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                      <AvatarFallback className="bg-blue-100 text-blue-800 font-medium">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg font-semibold">{user.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`h-2 w-2 rounded-full mr-2 ${
                      user.role === 'student' ? 'bg-green-500' : 
                      user.role === 'faculty' ? 'bg-blue-500' : 'bg-purple-500'
                    }`}></div>
                    <span className="text-sm font-medium capitalize">
                      {user.role}
                    </span>
                  </div>
                  
                  {user.role === 'student' && (
                    <Button 
                      variant={followStatus[user._id] ? "outline" : "default"} 
                      size="sm"
                      className={`transition-all duration-300 ${
                        followStatus[user._id] 
                          ? "border-blue-500 text-blue-700 hover:bg-blue-50" 
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow"
                      }`}
                      onClick={() => followStatus[user._id] ? handleUnfollow(user._id) : handleFollow(user._id)}
                      disabled={isFollowing[user._id]}
                    >
                      {isFollowing[user._id] ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : followStatus[user._id] ? (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}