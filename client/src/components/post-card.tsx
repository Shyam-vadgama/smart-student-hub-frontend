import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageCircle, Repeat2, Send, MoreHorizontal, Bookmark } from "lucide-react"
import { type Post, type User, type Comment, getUsers, getCurrentUser, savePost } from "@/lib/storage"
import { formatDistanceToNow } from "date-fns"
import { ShareDialog } from "./share-dialog"

interface PostCardProps {
  post: Post
  onPostUpdate?: (post: Post) => void
}

export function PostCard({ post, onPostUpdate }: PostCardProps) {
  const [postAuthor, setPostAuthor] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isCommenting, setIsCommenting] = useState(false)

  useEffect(() => {
    const users = getUsers()
    const author = users.find((u) => u.id === post.userId)
    setPostAuthor(author || null)

    const current = getCurrentUser()
    setCurrentUser(current)

    if (current) {
      setIsLiked(post.likes.includes(current.id))
    }
  }, [post.userId, post.likes])

  const handleLike = () => {
    if (!currentUser) return

    const updatedPost = { ...post }

    if (isLiked) {
      updatedPost.likes = updatedPost.likes.filter((id) => id !== currentUser.id)
    } else {
      updatedPost.likes.push(currentUser.id)
    }

    updatedPost.updatedAt = new Date().toISOString()
    savePost(updatedPost)
    setIsLiked(!isLiked)
    onPostUpdate?.(updatedPost)
  }

  const handleComment = async () => {
    if (!newComment.trim() || !currentUser) return

    setIsCommenting(true)

    const comment: Comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      content: newComment.trim(),
      likes: [],
      createdAt: new Date().toISOString(),
    }

    const updatedPost = {
      ...post,
      comments: [...post.comments, comment],
      updatedAt: new Date().toISOString(),
    }

    savePost(updatedPost)
    setNewComment("")
    setIsCommenting(false)
    onPostUpdate?.(updatedPost)
  }

  const handleShare = () => {
    const updatedPost = {
      ...post,
      shares: post.shares + 1,
      updatedAt: new Date().toISOString(),
    }

    savePost(updatedPost)
    onPostUpdate?.(updatedPost)
  }

  if (!postAuthor) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={postAuthor.avatar || "/placeholder.svg"} alt={postAuthor.name} />
              <AvatarFallback>
                {postAuthor.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold hover:text-primary cursor-pointer">{postAuthor.name}</h3>
              <p className="text-sm text-muted-foreground">{postAuthor.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Content */}
        {post.content && <p className="text-pretty leading-relaxed">{post.content}</p>}

        {/* Post Images */}
        {post.images.length > 0 && (
          <div className={`grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {post.images.map((image, index) => (
              <img
                key={index}
                src={image || "/placeholder.svg"}
                alt={`Post image ${index + 1}`}
                className="w-full rounded-lg border object-cover max-h-96"
              />
            ))}
          </div>
        )}

        {/* Engagement Stats */}
        {(post.likes.length > 0 || post.comments.length > 0 || post.shares > 0) && (
          <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-3">
            <div className="flex items-center gap-4">
              {post.likes.length > 0 && (
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  {post.likes.length}
                </span>
              )}
              {post.comments.length > 0 && <span>{post.comments.length} comments</span>}
              {post.shares > 0 && <span>{post.shares} shares</span>}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex items-center gap-2 ${isLiked ? "text-red-500" : "text-muted-foreground"}`}
          >
            <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
            Like
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <MessageCircle className="h-5 w-5" />
            Comment
          </Button>
          <ShareDialog post={post} postAuthor={postAuthor}>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
              <Repeat2 className="h-5 w-5" />
              Repost
            </Button>
          </ShareDialog>
          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
            <Send className="h-5 w-5" />
            Send
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Bookmark className="h-5 w-5" />
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-4 border-t pt-4">
            {/* Add Comment */}
            {currentUser && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
                  <AvatarFallback className="text-xs">
                    {currentUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] resize-none"
                  />
                  <div className="flex justify-end">
                    <Button size="sm" onClick={handleComment} disabled={!newComment.trim() || isCommenting}>
                      {isCommenting ? "Posting..." : "Post"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            {post.comments.map((comment) => {
              const commentAuthor = getUsers().find((u) => u.id === comment.userId)
              if (!commentAuthor) return null

              return (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={commentAuthor.avatar || "/placeholder.svg"} alt={commentAuthor.name} />
                    <AvatarFallback className="text-xs">
                      {commentAuthor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{commentAuthor.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-pretty">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-6 px-2">
                        Like
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-6 px-2">
                        Reply
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
