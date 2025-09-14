import { useState, useEffect } from "react"
import { Link, useLocation } from "wouter"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Home, Users, MessageCircle, Briefcase, Search, Menu } from "lucide-react"
import { type User, getCurrentUser } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { NotificationsDropdown } from "./notifications-dropdown"

export function Navigation() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [pathname] = useLocation()

  useEffect(() => {
    setCurrentUser(getCurrentUser())
  }, [])

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/network", icon: Users, label: "My Network" },
    { href: "/jobs", icon: Briefcase, label: "Jobs" },
    { href: "/messaging", icon: MessageCircle, label: "Messaging" },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo and Search */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <a className="text-2xl font-bold text-primary">LinkedPro</a>
            </Link>
            <div className="hidden md:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-10 w-64" />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("flex flex-col items-center gap-1 h-12 px-3", isActive && "text-primary")}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="text-xs">{item.label}</span>
                    </Button>
                  </a>
                </Link>
              )
            })}
            <NotificationsDropdown />
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2">
            {currentUser && (
              <Link href="/profile">
                <a>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                      <AvatarFallback className="text-xs">
                        {currentUser.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-xs text-foreground font-medium">Me</span>
                  </Button>
                </a>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-2">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}>
                    <a>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("w-full justify-start gap-3", isActive && "text-primary bg-primary/10")}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Button>
                    </a>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
