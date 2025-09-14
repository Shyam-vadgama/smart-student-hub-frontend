import React from 'react';
import { MoreHorizontal, User, TrendingUp, Award, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { achievementApi } from '@/lib/api';
import { Achievement } from '@shared/schema';

const LinkedInRightSidebar = () => {
  // Fetch trending achievements based on likes
  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => achievementApi.getAll(),
  });

  // Get trending achievements (most liked)
  const trendingAchievements = achievements
    .sort((a: Achievement, b: Achievement) => b.likes.length - a.likes.length)
    .slice(0, 4);

  // Mock trending topics based on achievement categories
  const trendingTopics = [
    { title: "Academic Excellence", count: 45, icon: Award },
    { title: "Programming Skills", count: 32, icon: TrendingUp },
    { title: "Project Management", count: 28, icon: Users },
    { title: "Leadership", count: 22, icon: Award },
  ];

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

  return (
    <div className="right-sidebar">
      <div className="sidebar-news">
        <MoreHorizontal size={15} className="info-icon" />
        <h3>Trending Achievements</h3>

        {trendingAchievements.length > 0 ? (
          trendingAchievements.map((achievement: Achievement, index: number) => (
            <div key={achievement._id}>
              <a href="#" className="block font-semibold text-sm mb-1">
                {achievement.title}
              </a>
              <span className="text-xs text-gray-500">
                {getTimeAgo(achievement.createdAt)} · {achievement.likes.length} likes
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No achievements yet</p>
          </div>
        )}

        <a href="#" className="read-more-link">View All Achievements</a>
      </div>

      <div className="sidebar-news">
        <TrendingUp size={15} className="info-icon" />
        <h3>Trending Topics</h3>

        {trendingTopics.map((topic, index) => (
          <div key={index} className="flex items-center justify-between py-2">
            <div className="flex items-center">
              <topic.icon size={16} className="mr-2 text-blue-600" />
              <span className="text-sm font-medium">{topic.title}</span>
            </div>
            <span className="text-xs text-gray-500">{topic.count}</span>
          </div>
        ))}

        <a href="#" className="read-more-link">See More Topics</a>
      </div>

      <div className="sidebar-ad">
        <small>Ad · · ·</small>
        <p>Master Web Development</p>
        <div>
          <User size={60} />
          <img src="/images/mi-logo.png" alt="mi-logo" />
        </div>
        <b>Brand and Demand in Xiaomi</b>
        <a href="#" className="ad-link">Learn More</a>
      </div>

      <div className="sidebar-useful-links">
        <a href="#">About</a>
        <a href="#">Accessibility</a>
        <a href="#">Help Center</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Advertising</a>
        <a href="#">Get the App</a>
        <a href="#">More</a>

        <div className="copyright-msg">
          <img src="/images/logo.png" alt="logo" />
          <p>LinkedIn © 2022. All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
};

export default LinkedInRightSidebar;
