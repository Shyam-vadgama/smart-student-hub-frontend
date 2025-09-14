import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, UserPlus, Briefcase } from "lucide-react"
import { type User, getUsers, getPosts, getCurrentUser } from "@/lib/storage"
import { formatDistanceToNow } from "date-fns"

interface Activity {
  id: string
  type: "like" | "comment" | "connection" | "post"
  userId: string
  targetId?: string
  content?: string
  timestamp: string
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    const current = getCurrentUser()
    setCurrentUser(current)

    if (current) {
      // Generate mock activities based on current data
      const users = getUsers()
      const posts = getPosts()
      const mockActivities: Activity[] = []

      // Recent connections
      current.connections.slice(-3).forEach((connectionId, index) => {
        mockActivities.push({
          id: `connection-${index}`,
          type: "connection",
          userId: connectionId,
          timestamp: new Date(Date.now() - index * 3600000).toISOString(),
        })
      })

      // Recent likes on posts
      posts.slice(0, 5).forEach((post, index) => {
        if (post.likes.length > 0) {
          mockActivities.push({
            id: `like-${index}`,
            type: "like",
            userId: post.likes[0],
            targetId: post.id,
            timestamp: new Date(Date.now() - index * 1800000).toISOString(),
          })
        }
      })

      // Recent posts
      posts.slice(0, 3).forEach((post, index) => {
        mockActivities.push({
          id: `post-${index}`,
          type: "post",
          userId: post.userId,
          targetId: post.id,
          content: post.content.slice(0, 100),
          timestamp: post.createdAt,
        })
      })

      // Sort by timestamp
      mockActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setActivities(mockActivities.slice(0, 8))
    }
  }, [])

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />
      case "connection":
        return <UserPlus className="h-4 w-4 text-green-500" />
      case "post":
        return <Briefcase className="h-4 w-4 text-purple-500" />
    }
  }

  const getActivityText = (activity: Activity) => {
    const users = getUsers()
    const user = users.find((u) => u.id === activity.userId)
    if (!user) return ""

    switch (activity.type) {
      case "like":
        return `${user.name} liked a post`
      case "comment":
        return `${user.name} commented on a post`
      case "connection":
        return `${user.name} connected with you`
      case "post":
        return `${user.name} shared a new post`
      default:
        return ""
    }
  }

  if (!currentUser || activities.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity) => {
          const users = getUsers()
          const user = users.find((u) => u.id === activity.userId)
          if (!user) return null

          return (
            <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="text-xs">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {getActivityIcon(activity.type)}
                  <span className="text-sm font-medium">{getActivityText(activity)}</span>
                </div>
                {activity.content && <p className="text-xs text-muted-foreground truncate">{activity.content}...</p>}
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
