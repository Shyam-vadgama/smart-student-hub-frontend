import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Building, MessageCircle, UserPlus } from "lucide-react"
import { type User, getCurrentUser, getUsers, saveUser } from "@/lib/storage"

interface UserProfileProps {
  userId?: string
  isCurrentUser?: boolean
}

export function UserProfile({ userId, isCurrentUser = false }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const current = getCurrentUser()
    setCurrentUser(current)

    if (isCurrentUser && current) {
      setUser(current)
    } else if (userId) {
      const users = getUsers()
      const targetUser = users.find((u) => u.id === userId)
      setUser(targetUser || null)

      if (current && targetUser) {
        setIsFollowing(current.following.includes(targetUser.id))
        setIsConnected(current.connections.includes(targetUser.id))
      }
    }
  }, [userId, isCurrentUser])

  const handleFollow = () => {
    if (!currentUser || !user) return

    const updatedCurrentUser = { ...currentUser }
    const updatedTargetUser = { ...user }

    if (isFollowing) {
      // Unfollow
      updatedCurrentUser.following = updatedCurrentUser.following.filter((id) => id !== user.id)
      updatedTargetUser.followers = updatedTargetUser.followers.filter((id) => id !== currentUser.id)
    } else {
      // Follow
      updatedCurrentUser.following.push(user.id)
      updatedTargetUser.followers.push(currentUser.id)
    }

    saveUser(updatedCurrentUser)
    saveUser(updatedTargetUser)
    setIsFollowing(!isFollowing)
    setUser(updatedTargetUser)
  }

  const handleConnect = () => {
    if (!currentUser || !user) return

    const updatedCurrentUser = { ...currentUser }
    const updatedTargetUser = { ...user }

    if (isConnected) {
      // Disconnect
      updatedCurrentUser.connections = updatedCurrentUser.connections.filter((id) => id !== user.id)
      updatedTargetUser.connections = updatedTargetUser.connections.filter((id) => id !== currentUser.id)
    } else {
      // Connect
      updatedCurrentUser.connections.push(user.id)
      updatedTargetUser.connections.push(currentUser.id)
    }

    saveUser(updatedCurrentUser)
    saveUser(updatedTargetUser)
    setIsConnected(!isConnected)
    setUser(updatedTargetUser)
  }

  if (!user) {
    return <div className="text-center py-8">User not found</div>
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <div
          className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-t-lg bg-cover bg-center"
          style={{ backgroundImage: `url(${user.coverImage})` }}
        />
        <Avatar className="absolute -bottom-12 left-6 h-24 w-24 border-4 border-background">
          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
          <AvatarFallback className="text-2xl">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
      </div>

      <CardHeader className="pt-16">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-balance">{user.name}</h1>
            <p className="text-lg text-muted-foreground">{user.title}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                {user.company}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {user.location}
              </div>
            </div>
          </div>

          {!isCurrentUser && (
            <div className="flex gap-2">
              <Button
                variant={isConnected ? "outline" : "default"}
                size="sm"
                onClick={handleConnect}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {isConnected ? "Connected" : "Connect"}
              </Button>
              <Button variant={isFollowing ? "outline" : "secondary"} size="sm" onClick={handleFollow}>
                {isFollowing ? "Following" : "Follow"}
              </Button>
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">About</h3>
          <p className="text-muted-foreground leading-relaxed text-pretty">{user.bio}</p>
        </div>

        <div className="flex gap-6">
          <div className="text-center">
            <div className="font-semibold text-lg">{user.connections.length}</div>
            <div className="text-sm text-muted-foreground">Connections</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">{user.followers.length}</div>
            <div className="text-sm text-muted-foreground">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">{user.following.length}</div>
            <div className="text-sm text-muted-foreground">Following</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
