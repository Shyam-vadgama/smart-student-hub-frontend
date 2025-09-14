import React, { useState } from 'react';
import { Search, Home, Users, Briefcase, MessageCircle, Bell, User, LogOut, Settings, HelpCircle, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/lib/api';

const LinkedInNavbar = () => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, logoutMutation } = useAuth();

  // Fetch user profile data
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.get,
    enabled: !!user,
  });

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsProfileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <a href="/" className="logo">
          <img src="/images/logo.png" alt="logo" />
        </a>
        <div className="search-box">
          <Search size={14} />
          <input type="text" placeholder="Search for anything" />
        </div>
      </div>
      
      <div className="navbar-center">
        <ul>
          <li>
            <a href="#" className="active-link">
              <Home size={30} />
              <span>Home</span>
            </a>
          </li>
          <li>
            <a href="#">
              <Users size={30} />
              <span>My Network</span>
            </a>
          </li>
          <li>
            <a href="#">
              <Briefcase size={30} />
              <span>Jobs</span>
            </a>
          </li>
          <li>
            <a href="#">
              <MessageCircle size={30} />
              <span>Messaging</span>
            </a>
          </li>
          <li>
            <a href="#">
              <Bell size={30} />
              <span>Notifications</span>
            </a>
          </li>
        </ul>
      </div>
      
      <div className="navbar-right">
        <div className="online">
          <User 
            size={40} 
            className="nav-profile-img" 
            onClick={toggleProfileMenu}
          />
        </div>
      </div>

      {/* Dropdown menu */}
      <div className={`profile-menu-wrap ${isProfileMenuOpen ? 'open-menu' : ''}`} id="profileMenu">
        <div className="profile-menu">
          <div className="user-info">
            <User size={50} />
            <div>
              <h3>{user?.name || 'User'}</h3>
              <a href="#">See your profile</a>
            </div>
          </div>
          <hr />
          <a href="#" className="profile-menu-link">
            <Eye size={35} />
            <p>Give Feedback</p>
            <span>&gt;</span>
          </a>
          <a href="#" className="profile-menu-link">
            <Settings size={35} />
            <p>Settings & Privacy</p>
            <span>&gt;</span>
          </a>
          <a href="#" className="profile-menu-link">
            <HelpCircle size={35} />
            <p>Help & Support</p>
            <span>&gt;</span>
          </a>
          <a href="#" className="profile-menu-link">
            <Settings size={35} />
            <p>Display & Accessibility</p>
            <span>&gt;</span>
          </a>
          <a href="#" className="profile-menu-link" onClick={handleLogout}>
            <LogOut size={35} />
            <p>Logout</p>
            <span>&gt;</span>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default LinkedInNavbar;
