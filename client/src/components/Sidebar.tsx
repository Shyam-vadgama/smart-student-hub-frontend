import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  Code
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();

  if (!user) return null;

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      roles: ["student", "faculty", "hod"]
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
      name: "Social Feed",
      href: "/feed",
      icon: Users2,
      roles: ["student"]
    },
    {
      name: "Code Problems",
      href: "/leetcode",
      icon: Code,
      roles: ["student", "faculty", "hod"]
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
    }
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

  return (
    <div className={cn(
      "bg-card border-r border-border w-64 flex flex-col transition-transform duration-300",
      !isOpen && "lg:translate-x-0 -translate-x-full"
    )}>
      {/* Logo and Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Smart Student Hub</h1>
            <p className="text-sm text-muted-foreground">{getRoleDisplay(user.role)} Portal</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-foreground">
              {getUserInitials(user.name)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <li key={item.name}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handleNavigation(item.href)}
                  data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive/10"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          data-testid="button-logout"
        >
          <LogOut className="mr-3 h-4 w-4" />
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}