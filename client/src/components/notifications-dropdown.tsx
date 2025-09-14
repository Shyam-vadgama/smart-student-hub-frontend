import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell, Heart, MessageCircle, UserPlus, Briefcase } from "lucide-react"
import { type User, getUsers, getCurrentUser, getPosts } from "@/lib/storage"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: "like" | "comment" | "connection" | "mention" | "job"
  userId: string
  content: string
  timestamp: string
  read: boolean
  postId?: string
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const current = getCurrentUser()
    setCurrentUser(current)

    if (current) {
      // Generate mock notifications
      const users = getUsers()
      const posts = getPosts()
      const mockNotifications: Notification[] = []

      // Connection notifications
      current.connections.slice(-2).forEach((connectionId, index) => {
        const user = users.find((u) => u.id === connectionId)
        if (user) {
          mockNotifications.push({
            id: `connection-${index}`,
            type: "connection",
            userId: connectionId,
            content: `${user.name} accepted your connection request`,
            timestamp: new Date(Date.now() - index * 3600000).toISOString(),
            read: Math.random() > 0.5,
          })
        }
      })

      // Like notifications
      posts.slice(0, 3).forEach((post, index) => {
        if (post.userId === current.id && post.likes.length > 0) {
          const likerId = post.likes[0]
          const liker = users.find((u) => u.id === likerId)
          if (liker) {
            mockNotifications.push({
              id: `like-${index}`,
              type: "like",
              userId: likerId,
              content: `${liker.name} liked your post`,
              timestamp: new Date(Date.now() - index * 1800000).toISOString(),
              read: Math.random() > 0.3,
              postId: post.id,
            })
          }
        }
      })

      // Comment notifications
      posts.slice(0, 2).forEach((post, index) => {
        if (post.userId === current.id && post.comments.length > 0) {
          const comment = post.comments[0]
          const commenter = users.find((u) => u.id === comment.userId)
          if (commenter) {
            mockNotifications.push({
              id: `comment-${index}`,
              type: "comment",
              userId: comment.userId,
              content: `${commenter.name} commented on your post`,
              timestamp: comment.createdAt,
              read: Math.random() > 0.4,
              postId: post.id,
            })
          }
        }
      })

      // Job notifications
      mockNotifications.push({
        id: "job-1",
        type: "job",
        userId: "system",
        content: "New job opportunities match your profile",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: false,
      })

      // Sort by timestamp
      mockNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setNotifications(mockNotifications.slice(0, 8))
    }
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case "connection":
        return <UserPlus className="h-4 w-4 text-green-500" />
      case "job":
        return <Briefcase className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => {
              const users = getUsers()
              const user = users.find((u) => u.id === notification.userId)

              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer ${!notification.read ? "bg-muted/50" : ""}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0">
                      {user && notification.type !== "job" ? (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback className="text-xs">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-pretty">{notification.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}
                  </div>
                </DropdownMenuItem>
              )
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
