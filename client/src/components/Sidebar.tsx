// src/components/layout/Sidebar.tsx
import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  LayoutDashboard, 
  Trophy, 
  ClipboardCheck, 
  FileText, 
  BarChart3, 
  Users, 
  LogOut,
  Users2,
  Code,
  ChevronDown,
  ChevronRight,
  X
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  const [practiceOpen, setPracticeOpen] = useState(false);

  if (!user) return null;

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      roles: ["faculty", "hod"]
    },
    {
      name: "Dashboard",
      href: "/student-dashboard",
      icon: LayoutDashboard,
      roles: ["student"]
    },
    {
      name: "My Achievements",
      href: "/achievements",
      icon: Trophy,
      roles: ["student"]
    },
    {
      name: "Available Forms",
      href: "/student/forms",
      icon: FileText,
      roles: ["student"]
    },
    {
      name: "My Attendance",
      href: "/student-dashboard?tab=attendance",
      icon: ClipboardCheck,
      roles: ["student"]
    },
    {
      name: "Social Feed",
      href: "/feed",
      icon: Users2,
      roles: ["student"]
    },
    {
      name: "Resume Builder",
      href: "/resume-builder",
      icon: Users,
      roles: ["student"]
    },
    {
      name: "Review Achievements",
      href: "/review",
      icon: ClipboardCheck,
      roles: ["faculty", "hod"]
    },
    {
      name: "Dynamic Forms",
      href: "/forms",
      icon: FileText,
      roles: ["faculty", "hod"]
    },
    {
      name: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      roles: ["hod"]
    },
    {
      name: "User Management",
      href: "/users",
      icon: Users,
      roles: ["hod"]
    },
    {
      name: "Admin Dashboard",
      href: "/admin-dashboard",
      icon: LayoutDashboard,
      roles: ["shiksan_mantri"]
    },
    {
      name: "Create College",
      href: "/create-college",
      icon: FileText,
      roles: ["shiksan_mantri"]
    },
    {
      name: "Create Department",
      href: "/create-department",
      icon: FileText,
      roles: ["principal"]
    },
    {
      name: "Create Classroom",
      href: "/create-classroom",
      icon: FileText,
      roles: ["hod"]
    },
    {
      name: "Create Subject",
      href: "/create-subject",
      icon: FileText,
      roles: ["hod"]
    },
    {
      name: "Student Attendance",
      href: "/attendance",
      icon: LayoutDashboard,
      roles: ["faculty"]
    },
    {
      name: "Management",
      href: "/hod-dashboard",
      icon: LayoutDashboard,
      roles: ["hod"]
    },
    
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user.role)
  );

  const handleNavigation = (href: string) => {
    setLocation(href);
    if (onClose) onClose();
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'hod': return 'Head of Department';
      case 'faculty': return 'Faculty';
      case 'student': return 'Student';
      default: return role;
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'hod': return 'bg-purple-100 text-purple-800';
      case 'faculty': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPracticeLinks = (department?: string) => {
    const baseLinks = [
      { name: "Stock Trading", href: "/stock-trading" },
      { name: "Business Problems", href: "/business-problems" },
    ];

    switch (department) {
      case "ec/electric":
        return [{ name: "Circuit", href: "/circuit" }];
      case "mechanical":
        return [{ name: "Quiz", href: "/quiz" }];
      case "computer":
        return [{ name: "Leetcode", href: "/leetcode" }];
      case "bba/bcom":
        return baseLinks;
      default:
        return baseLinks;
    }
  };

  

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out shadow-lg",
        !isOpen && "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo and Brand */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Smart Student Hub</h1>
                <p className="text-xs text-gray-500">{getRoleDisplay(user.role)} Portal</p>
              </div>
            </div>
            
            {/* Mobile close button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <span className="text-sm font-bold text-gray-800">
                {getUserInitials(user.name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <Badge className={cn("mt-1 text-xs", getRoleColor(user.role))}>
                {user.role.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <li key={item.name}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start font-normal",
                      isActive 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md" 
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    onClick={() => handleNavigation(item.href)}
                    data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Button>
                </li>
              );
            })}

            {/* Practice collapsible section */}
            {(["student"].includes(user.role)) && (
              <li>
                <Button
                  variant={practiceOpen ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-between font-normal",
                    practiceOpen
                      ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md" 
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  onClick={() => setPracticeOpen(v => !v)}
                >
                  <span className="flex items-center">
                    <Code className="mr-3 h-5 w-5" />
                    Practice
                  </span>
                  {practiceOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                {practiceOpen && (
                  <ul className="mt-1 ml-2 space-y-1 pl-2 border-l-2 border-gray-200">
                    {getPracticeLinks(user.department).map(link => (
                      <li key={link.href}>
                        <Button
                          variant={location === link.href ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start font-normal",
                            location === link.href
                              ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md" 
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          )}
                          onClick={() => handleNavigation(link.href)}
                        >
                          {link.name}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 font-normal"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="mr-3 h-5 w-5" />
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </>
  );
}