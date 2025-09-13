import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Bell, Menu, User } from "lucide-react";

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'hod': return 'Head of Department';
      case 'faculty': return 'Faculty';
      case 'student': return 'Student';
      default: return role;
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={onMenuClick}
          data-testid="button-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold text-foreground" data-testid="header-title">
          {title}
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" className="relative" data-testid="button-notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </Button>

        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span data-testid="user-role">{user ? getRoleDisplay(user.role) : ''}</span>
        </div>
      </div>
    </header>
  );
}
