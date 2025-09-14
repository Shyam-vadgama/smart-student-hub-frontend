import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, UserPlus, UserCheck, Users2, TrendingUp, Hash } from "lucide-react";
import { achievementApi, followApi } from "@/lib/api";
import { Achievement, User } from "@shared/schema";
import AchievementCard from "@/components/AchievementCard";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function SocialFeedPage() {
  const queryClient = useQueryClient();
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Fetch social feed
  const { data: feed = [], isLoading, error } = useQuery({
    queryKey: ['social-feed'],
    queryFn: followApi.getFeed,
  });
  
  // Fetch following list
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
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
    } catch (error) {
      console.error('Error following user:', error);
    }
  };
  
  const handleUnfollow = async (userId: string) => {
    try {
      await followApi.unfollowUser(userId);
      setFollowStatus(prev => ({ ...prev, [userId]: false }));
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };
  
  const handleLike = async (achievementId: string) => {
    try {
      await achievementApi.toggleLike(achievementId);
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
    } catch (error) {
      console.error('Error liking achievement:', error);
    }
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading feed...</div>;
  }
  
  if (error) {
    return <div className="flex justify-center items-center h-full">Error loading feed</div>;
  }
  
  // Helper function to get student name
  const getStudentName = (student: string | { _id: string; name: string; email: string }) => {
    if (typeof student === 'string') {
      return 'User';
    }
    return student.name;
  };
  
  // Helper function to get student ID
  const getStudentId = (student: string | { _id: string; name: string; email: string }) => {
    if (typeof student === 'string') {
      return student;
    }
    return student._id;
  };
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Social Feed" 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content - Feed */}
            <div className="lg:col-span-3 space-y-6">
              <div className="mb-8">
                <h1 className="text-3xl font-bold">Social Feed</h1>
                <p className="text-muted-foreground">See what students you're following are up to</p>
              </div>
              
              {feed.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Follow other students to see their achievements in your feed
                    </p>
                    <Button asChild>
                      <a href="/users">Find Students to Follow</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {feed.map((achievement: Achievement) => (
                    <Card key={achievement._id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getStudentName(achievement.student)}`} />
                              <AvatarFallback>
                                {getStudentName(achievement.student).charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-semibold">{getStudentName(achievement.student)}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(achievement.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          {followStatus[getStudentId(achievement.student)] ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleUnfollow(getStudentId(achievement.student))}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Following
                            </Button>
                          ) : (
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => handleFollow(getStudentId(achievement.student))}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Follow
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <AchievementCard 
                          achievement={achievement} 
                          onApprove={undefined}
                          onReject={undefined}
                          onView={undefined}
                        />
                        <div className="flex items-center space-x-4 mt-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleLike(achievement._id)}
                          >
                            <Heart className="h-4 w-4 mr-2" />
                            Like ({achievement.likes.length})
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Comment ({achievement.comments.length})
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Right Sidebar - Trending & Suggestions */}
            <div className="lg:col-span-1 space-y-6">
              {/* Trending Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Trending Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">#Achievements</span>
                      </div>
                      <span className="text-xs text-muted-foreground">24 posts</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">#StudentLife</span>
                      </div>
                      <span className="text-xs text-muted-foreground">18 posts</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">#Coding</span>
                      </div>
                      <span className="text-xs text-muted-foreground">12 posts</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Hash className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">#Projects</span>
                      </div>
                      <span className="text-xs text-muted-foreground">8 posts</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Suggested Connections */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users2 className="h-5 w-5 mr-2" />
                    Suggested Connections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">John Doe</p>
                        <p className="text-xs text-muted-foreground">Computer Science</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>AS</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Alice Smith</p>
                        <p className="text-xs text-muted-foreground">Engineering</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>BJ</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Bob Johnson</p>
                        <p className="text-xs text-muted-foreground">Data Science</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}