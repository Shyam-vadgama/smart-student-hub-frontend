import React, { useState } from 'react';
import { User, Image, Video, Calendar, ChevronDown, ThumbsUp, Heart, Hand, MessageCircle, Share, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { followApi, achievementApi } from '@/lib/api';
import { Achievement, User as UserType } from '@shared/schema';

const LinkedInMainContent = () => {
  const [newPost, setNewPost] = useState('');
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  // Fetch social feed (achievements from followed users)
  const { data: feed = [], isLoading: feedLoading } = useQuery({
    queryKey: ['social-feed'],
    queryFn: followApi.getFeed,
  });

  // Fetch all achievements for the main feed
  const { data: allAchievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => achievementApi.getAll(),
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: (achievementId: string) => achievementApi.toggleLike(achievementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: ({ achievementId, text }: { achievementId: string; text: string }) => 
      achievementApi.addComment(achievementId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-feed'] });
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
    },
  });

  const handleLike = (achievementId: string) => {
    likeMutation.mutate(achievementId);
  };

  const handleComment = (achievementId: string) => {
    const text = commentText[achievementId];
    if (text && text.trim()) {
      commentMutation.mutate({ achievementId, text });
      setCommentText((prev: Record<string, string>) => ({ ...prev, [achievementId]: '' }));
    }
  };

  const toggleComments = (achievementId: string) => {
    setShowComments((prev: Record<string, boolean>) => ({ ...prev, [achievementId]: !prev[achievementId] }));
  };

  const handlePost = () => {
    // TODO: Implement post creation
    console.log('Creating post:', newPost);
    setNewPost('');
  };

  // Helper function to get time ago
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Helper function to get student name
  const getStudentName = (student: string | { _id: string; name: string; email: string }) => {
    if (typeof student === 'string') {
      return 'User';
    }
    return student.name;
  };

  // Use feed data or fallback to all achievements
  const posts = feed.length > 0 ? feed : allAchievements;

  return (
    <div className="main-content">
      <div className="create-post">
        <div className="create-post-input">
          <User size={35} />
          <textarea 
            rows={2} 
            placeholder="Share an achievement or update..." 
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          />
        </div>
        <div className="create-post-links">
          <li>
            <Image size={15} />
            Photo
          </li>
          <li>
            <Video size={15} />
            Video
          </li>
          <li>
            <Calendar size={15} />
            Event
          </li>
          <li onClick={handlePost}>Post</li>
        </div>
      </div>
      
      <div className="sort-by">
        <hr />
        <p>Sort by : <span>top <ChevronDown size={12} /></span></p>
      </div>

      {feedLoading || achievementsLoading ? (
        <div className="post">
          <div className="text-center py-8">Loading posts...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="post">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-gray-600">Be the first to share an achievement!</p>
          </div>
        </div>
      ) : (
        posts.map((achievement: Achievement) => (
          <div key={achievement._id} className="post">
            <div className="post-author">
              <User size={35} />
              <div>
                <h1>{getStudentName(achievement.student)}</h1>
                <small>Student</small>
                <small>{getTimeAgo(achievement.createdAt)}</small>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">{achievement.title}</h2>
              <p className="mb-3">{achievement.description}</p>
              {achievement.certificatePath && (
                <img src={achievement.certificatePath} width="100%" alt="certificate" className="rounded-lg" />
              )}
              {achievement.media && achievement.media.length > 0 && (
                <div className="mt-3">
                  {achievement.media.map((media, index) => (
                    <div key={index} className="mb-2">
                      {media.type === 'image' ? (
                        <img src={media.url} width="100%" alt={media.caption || 'media'} className="rounded-lg" />
                      ) : (
                        <video src={media.url} width="100%" controls className="rounded-lg" />
                      )}
                      {media.caption && (
                        <p className="text-sm text-gray-600 mt-1">{media.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="post-stats">
              <div>
                <ThumbsUp size={15} />
                <Heart size={15} />
                <Hand size={15} />
                <span className="liked-users">
                  {achievement.likes.length > 0 
                    ? `${achievement.likes.length} people liked this`
                    : 'No likes yet'
                  }
                </span>
              </div>
              <div>
                <span>{achievement.comments.length} comments</span>
              </div>
            </div>
            
            <div className="post-activity">
              <div>
                <User size={22} className="post-activity-user-icon" />
                <ChevronDown size={12} className="post-activity-arrow-icon" />
              </div>
              <div className="post-activity-link" onClick={() => handleLike(achievement._id)}>
                <ThumbsUp size={18} />
                <span>Like</span>
              </div>
              <div className="post-activity-link" onClick={() => toggleComments(achievement._id)}>
                <MessageCircle size={18} />
                <span>Comment</span>
              </div>
              <div className="post-activity-link">
                <Share size={18} />
                <span>Share</span>
              </div>
              <div className="post-activity-link">
                <Send size={18} />
                <span>Send</span>
              </div>
            </div>

            {/* Comments Section */}
            {showComments[achievement._id] && (
              <div className="mt-4 border-t pt-4">
                <div className="space-y-3">
                  {achievement.comments.map((comment, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <User size={20} className="mt-1" />
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm">{comment.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {getTimeAgo(comment.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Comment Form */}
                  <div className="flex items-start space-x-3">
                    <User size={20} className="mt-1" />
                    <div className="flex-1 flex space-x-2">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={commentText[achievement._id] || ''}
                        onChange={(e) => setCommentText((prev: Record<string, string>) => ({ 
                          ...prev, 
                          [achievement._id]: e.target.value 
                        }))}
                      />
                      <button
                        onClick={() => handleComment(achievement._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default LinkedInMainContent;
