import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Share, MessageCircle, Link } from "lucide-react"
import { type Post, type User, getCurrentUser, savePost } from "@/lib/storage"

interface ShareDialogProps {
  post: Post
  postAuthor: User
  children?: React.ReactNode
}

// Simple toast replacement
const useToast = () => ({
  toast: (options: { title: string; description: string; variant?: string }) => {
    console.log(options.title, options.description)
  }
})

export function ShareDialog({ post, postAuthor, children }: ShareDialogProps) {
  const [shareComment, setShareComment] = useState("")
  const [isSharing, setIsSharing] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const handleShare = async () => {
    const currentUser = getCurrentUser()
    if (!currentUser) return

    setIsSharing(true)

    try {
      // Create a new post that shares the original
      const sharedPost: Post = {
        id: Date.now().toString(),
        userId: currentUser.id,
        content: shareComment.trim(),
        images: [],
        likes: [],
        comments: [],
        shares: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Update original post share count
      const updatedOriginalPost = {
        ...post,
        shares: post.shares + 1,
        updatedAt: new Date().toISOString(),
      }

      savePost(sharedPost)
      savePost(updatedOriginalPost)

      toast({
        title: "Post shared!",
        description: "Your post has been shared with your network.",
      })

      setShareComment("")
      setIsOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSharing(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
    toast({
      title: "Link copied!",
      description: "Post link has been copied to your clipboard.",
    })
  }

  const handleSendMessage = () => {
    toast({
      title: "Message feature",
      description: "Direct messaging feature would open here.",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
            <Share className="h-4 w-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this post</DialogTitle>
          <DialogDescription>Add your thoughts and share with your network</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share options */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex flex-col gap-1 h-auto py-3"
            >
              <Share className="h-5 w-5" />
              <span className="text-xs">Repost</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendMessage}
              className="flex flex-col gap-1 h-auto py-3"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs">Send</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="flex flex-col gap-1 h-auto py-3"
            >
              <Link className="h-5 w-5" />
              <span className="text-xs">Copy link</span>
            </Button>
          </div>

          <Separator />

          {/* Add comment */}
          <div className="space-y-3">
            <Textarea
              placeholder="Add a comment (optional)"
              value={shareComment}
              onChange={(e) => setShareComment(e.target.value)}
              className="min-h-[80px] resize-none"
            />

            {/* Original post preview */}
            <div className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={postAuthor.avatar || "/placeholder.svg"} alt={postAuthor.name} />
                  <AvatarFallback className="text-xs">
                    {postAuthor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-sm">{postAuthor.name}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
              {post.images.length > 0 && (
                <div className="mt-2">
                  <img
                    src={post.images[0] || "/placeholder.svg"}
                    alt="Post preview"
                    className="w-full h-20 object-cover rounded"
                  />
                  {post.images.length > 1 && (
                    <p className="text-xs text-muted-foreground mt-1">+{post.images.length - 1} more images</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleShare} disabled={isSharing}>
                {isSharing ? "Sharing..." : "Share"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
