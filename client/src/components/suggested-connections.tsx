import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, X } from "lucide-react"
import { type User, getUsers, getCurrentUser, saveUser } from "@/lib/storage"

export function SuggestedConnections() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [suggestions, setSuggestions] = useState<User[]>([])

  useEffect(() => {
    const current = getCurrentUser()
    setCurrentUser(current)

    if (current) {
      const allUsers = getUsers()
      const suggested = allUsers.filter(
        (user) =>
          user.id !== current.id && !current.connections.includes(user.id) && !current.following.includes(user.id),
      )
      setSuggestions(suggested.slice(0, 3))
    }
  }, [])

  const handleConnect = (targetUserId: string) => {
    if (!currentUser) return

    const users = getUsers()
    const targetUser = users.find((u) => u.id === targetUserId)
    if (!targetUser) return

    const updatedCurrentUser = {
      ...currentUser,
      connections: [...currentUser.connections, targetUserId],
    }

    const updatedTargetUser = {
      ...targetUser,
      connections: [...targetUser.connections, currentUser.id],
    }

    saveUser(updatedCurrentUser)
    saveUser(updatedTargetUser)
    setCurrentUser(updatedCurrentUser)

    // Remove from suggestions
    setSuggestions((prev) => prev.filter((user) => user.id !== targetUserId))
  }

  const handleDismiss = (userId: string) => {
    setSuggestions((prev) => prev.filter((user) => user.id !== userId))
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">People you may know</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestions.map((user) => (
          <div key={user.id} className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{user.name}</h4>
              <p className="text-xs text-muted-foreground truncate">{user.title}</p>
              <p className="text-xs text-muted-foreground truncate">{user.company}</p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" onClick={() => handleConnect(user.id)} className="h-8 px-3">
                <UserPlus className="h-3 w-3 mr-1" />
                Connect
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleDismiss(user.id)} className="h-8 w-8 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
