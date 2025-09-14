import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, UserCheck } from "lucide-react";
import { followApi } from "@/lib/api";
import { User } from "@shared/schema";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});
  
  // Fetch all users
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users', { credentials: 'include' });
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
    try {
      await followApi.followUser(userId);
      setFollowStatus(prev => ({ ...prev, [userId]: true }));
      queryClient.invalidateQueries({ queryKey: ['following'] });
    } catch (error) {
      console.error('Error following user:', error);
    }
  };
  
  const handleUnfollow = async (userId: string) => {
    try {
      await followApi.unfollowUser(userId);
      setFollowStatus(prev => ({ ...prev, [userId]: false }));
      queryClient.invalidateQueries({ queryKey: ['following'] });
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };
  
  // Filter users based on search term
  const filteredUsers = users.filter((user: User) => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading users...</div>;
  }
  
  if (error) {
    return <div className="flex justify-center items-center h-full">Error loading users</div>;
  }
  
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
          />
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user: User) => (
          <Card key={user._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground capitalize">
                  Role: {user.role}
                </div>
                {user.role === 'student' && (
                  <Button 
                    variant={followStatus[user._id] ? "outline" : "default"} 
                    size="sm"
                    onClick={() => followStatus[user._id] ? handleUnfollow(user._id) : handleFollow(user._id)}
                  >
                    {followStatus[user._id] ? (
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
    </div>
  );
}