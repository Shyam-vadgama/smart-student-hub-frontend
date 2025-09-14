import React, { useState } from 'react';
import { User, Package, Crown, Clock, Users, Hash } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { profileApi, followApi, achievementApi } from '@/lib/api';

const LinkedInLeftSidebar = () => {
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);
  const { user } = useAuth();

  // Fetch user profile data
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
    enabled: !!user,
  });

  // Fetch user's achievements for stats
  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => achievementApi.getAll(),
    enabled: !!user,
  });

  // Fetch following count
  const { data: following = [] } = useQuery({
    queryKey: ['following'],
    queryFn: () => followApi.getFollowing(user?._id || ''),
    enabled: !!user?._id,
  });

  // Fetch followers count
  const { data: followers = [] } = useQuery({
    queryKey: ['followers'],
    queryFn: () => followApi.getFollowers(user?._id || ''),
    enabled: !!user?._id,
  });

  const toggleActivity = () => {
    setIsActivityExpanded(!isActivityExpanded);
  };

  // Calculate stats
  const profileViews = Math.floor(Math.random() * 100) + 20; // Mock data for now
  const postViews = achievements.length * 15; // Estimate based on achievements
  const connections = following.length;

  return (
    <div className="left-sidebar">
      <div className="sidebar-profile-box">
        <img src="/images/cover-pic.png" width="100%" alt="cover" />
        <div className="sidebar-profile-info">
          <User size={90} />
          <h1>{user?.name || 'User'}</h1>
          <h3>
            {profile?.course && profile?.batch 
              ? `${profile.course} - Batch ${profile.batch}`
              : user?.role === 'student' 
                ? 'Student'
                : user?.role === 'faculty'
                  ? 'Faculty Member'
                  : 'Head of Department'
            }
          </h3>
          <ul>
            <li>Your profile views <span>{profileViews}</span></li>
            <li>Your post views <span>{postViews}</span></li>
            <li>Your Connections <span>{connections}</span></li>
          </ul>
        </div>
        <div className="sidebar-profile-link">
          <a href="#">
            <Package size={20} />
            My Items
          </a>
          <a href="#">
            <Crown size={20} />
            Try Premium
          </a>
        </div>
      </div>

      <div className={`sidebar-activity ${isActivityExpanded ? 'open-activity' : ''}`} id="sidebarActivity">
        <h3>RECENT</h3>
        <a href="#">
          <Clock size={20} />
          Data Analysis
        </a>
        <a href="#">
          <Clock size={20} />
          UI UX Design
        </a>
        <a href="#">
          <Clock size={20} />
          Web Development
        </a>
        <a href="#">
          <Clock size={20} />
          Object Oriented Programming
        </a>
        <a href="#">
          <Clock size={20} />
          Operating Systems
        </a>
        <a href="#">
          <Clock size={20} />
          Platform technologies
        </a>
        
        <h3>GROUPS</h3>
        <a href="#">
          <Users size={20} />
          Data Analyst group
        </a>
        <a href="#">
          <Users size={20} />
          Learn NumPy
        </a>
        <a href="#">
          <Users size={20} />
          Machine Learning group
        </a>
        <a href="#">
          <Users size={20} />
          Data Science Aspirants
        </a>
        
        <h3>HASHTAG</h3>
        <a href="#">
          <Hash size={20} />
          dataanalyst
        </a>
        <a href="#">
          <Hash size={20} />
          numpy
        </a>
        <a href="#">
          <Hash size={20} />
          machinelearning
        </a>
        <a href="#">
          <Hash size={20} />
          datascience
        </a>
        
        <div className="discover-more-link">
          <a href="#">Discover More</a>
        </div>
      </div>
      
      <p id="showMoreLink" onClick={toggleActivity}>
        {isActivityExpanded ? 'Show less -' : 'Show more +'}
      </p>
    </div>
  );
};

export default LinkedInLeftSidebar;
