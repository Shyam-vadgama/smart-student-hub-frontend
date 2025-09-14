import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, UserCheck, Users } from "lucide-react";
import { followApi } from "@/lib/api";
import { User } from "@shared/schema";

interface FollowListProps {
  userId: string;
  type: 'followers' | 'following';
}

export default function FollowList({ userId, type }: FollowListProps) {
  const queryClient = useQueryClient();
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});
  
  // Fetch followers or following list
  const { data = [], isLoading, error } = useQuery({
    queryKey: [type, userId],
    queryFn: () => type === 'followers' 
      ? followApi.getFollowers(userId)
      : followApi.getFollowing(userId),
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
  
  const handleFollow = async (targetUserId: string) => {
    try {
      await followApi.followUser(targetUserId);
      setFollowStatus(prev => ({ ...prev, [targetUserId]: true }));
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: [type, userId] });
    } catch (error) {
      console.error('Error following user:', error);
    }
  };
  
  const handleUnfollow = async (targetUserId: string) => {
    try {
      await followApi.unfollowUser(targetUserId);
      setFollowStatus(prev => ({ ...prev, [targetUserId]: false }));
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: [type, userId] });
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }
  
  if (error) {
    return <div className="flex justify-center items-center h-full">Error loading data</div>;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          {type === 'followers' ? 'Followers' : 'Following'}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({data.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {type === 'followers' 
              ? 'No followers yet' 
              : 'Not following anyone yet'}
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((user: User) => (
              <div key={user._id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                {followStatus[user._id] ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleUnfollow(user._id)}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Following
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => handleFollow(user._id)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Follow
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}