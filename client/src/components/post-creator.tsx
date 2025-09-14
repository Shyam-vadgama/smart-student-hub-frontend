import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageIcon, Video, FileText, MoreHorizontal, X } from "lucide-react"
import { type User, type Post, getCurrentUser, savePost } from "@/lib/storage"
import { ImageUploader } from "./image-uploader"

interface PostCreatorProps {
  onPostCreated?: (post: Post) => void
}

export function PostCreator({ onPostCreated }: PostCreatorProps) {
  const [content, setContent] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [isPosting, setIsPosting] = useState(false)
  const [showImageUploader, setShowImageUploader] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useState(() => {
    setCurrentUser(getCurrentUser())
  })

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          setImages((prev) => [...prev, result])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const handleCloudinaryUpload = (urls: string[]) => {
    setImages((prev) => [...prev, ...urls])
    setShowImageUploader(false)
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePost = async () => {
    if (!content.trim() && images.length === 0) return
    if (!currentUser) return

    setIsPosting(true)

    try {
      const newPost: Post = {
        id: Date.now().toString(),
        userId: currentUser.id,
        content: content.trim(),
        images: images,
        likes: [],
        comments: [],
        shares: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      savePost(newPost)
      onPostCreated?.(newPost)

      // Reset form
      setContent("")
      setImages([])
      setShowImageUploader(false)
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setIsPosting(false)
    }
  }

  if (!currentUser) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={currentUser.avatar || "/placeholder.svg"} alt={currentUser.name} />
            <AvatarFallback>
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{currentUser.name}</h3>
            <p className="text-sm text-muted-foreground">{currentUser.title}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Textarea
          placeholder="What do you want to talk about?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-none border-none p-0 text-lg placeholder:text-muted-foreground focus-visible:ring-0"
        />

        {/* Cloudinary Image Uploader */}
        {showImageUploader && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Upload Images</h4>
              <Button variant="ghost" size="sm" onClick={() => setShowImageUploader(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <ImageUploader onImagesUploaded={handleCloudinaryUpload} maxFiles={4} />
          </div>
        )}

        {/* Image Preview */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image || "/placeholder.svg"}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowImageUploader(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ImageIcon className="h-5 w-5 mr-2" />
              Photo
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Video className="h-5 w-5 mr-2" />
              Video
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <FileText className="h-5 w-5 mr-2" />
              Document
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>

          <Button
            onClick={handlePost}
            disabled={(!content.trim() && images.length === 0) || isPosting}
            className="px-6"
          >
            {isPosting ? "Posting..." : "Post"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
