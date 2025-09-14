import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, X, Upload, AlertCircle } from "lucide-react"
import { mockCloudinaryUpload, type CloudinaryUploadResult } from "@/lib/cloudinary"
import { cn } from "@/lib/utils"

interface ImageUploaderProps {
  onImagesUploaded: (urls: string[]) => void
  maxFiles?: number
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
  className?: string
}

interface UploadingFile {
  file: File
  progress: number
  status: "uploading" | "completed" | "error"
  result?: CloudinaryUploadResult
  error?: string
}

export function ImageUploader({
  onImagesUploaded,
  maxFiles = 5,
  maxFileSize = 10,
  acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  className,
}: ImageUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported`
    }

    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`
    }

    return null
  }

  const handleFiles = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files)

      // Validate files
      const validFiles: File[] = []
      const errors: string[] = []

      for (const file of fileArray) {
        const error = validateFile(file)
        if (error) {
          errors.push(`${file.name}: ${error}`)
        } else {
          validFiles.push(file)
        }
      }

      // Check total file count
      if (uploadingFiles.length + validFiles.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`)
        return
      }

      if (errors.length > 0) {
        console.error("File validation errors:", errors)
        return
      }

      // Initialize uploading files
      const newUploadingFiles: UploadingFile[] = validFiles.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const,
      }))

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles])

      // Upload files
      const uploadPromises = validFiles.map(async (file, index) => {
        try {
          // Use mock upload for demo purposes
          // In production, you would use: cloudinaryUploader.uploadFile(file, {...})
          const result = await mockCloudinaryUpload(file)

          setUploadingFiles((prev) =>
            prev.map((uf) =>
              uf.file === file
                ? {
                    ...uf,
                    progress: 100,
                    status: "completed" as const,
                    result,
                  }
                : uf,
            ),
          )

          return result.secure_url
        } catch (error) {
          setUploadingFiles((prev) =>
            prev.map((uf) =>
              uf.file === file
                ? {
                    ...uf,
                    status: "error" as const,
                    error: error instanceof Error ? error.message : "Upload failed",
                  }
                : uf,
            ),
          )
          return null
        }
      })

      const results = await Promise.all(uploadPromises)
      const successfulUrls = results.filter((url): url is string => url !== null)

      if (successfulUrls.length > 0) {
        onImagesUploaded(successfulUrls)
      }
    },
    [uploadingFiles.length, maxFiles, maxFileSize, acceptedTypes, onImagesUploaded],
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    },
    [handleFiles],
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const removeUploadingFile = (file: File) => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.file !== file))
  }

  const clearCompleted = () => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.status !== "completed"))
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          "hover:border-primary hover:bg-primary/5 cursor-pointer",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="space-y-2">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-muted-foreground">
              {acceptedTypes.map((type) => type.split("/")[1].toUpperCase()).join(", ")} up to {maxFileSize}MB each
            </p>
          </div>
          <Button variant="outline" size="sm" className="mt-2">
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </div>
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Uploading Files</h4>
            <Button variant="ghost" size="sm" onClick={clearCompleted} className="text-xs">
              Clear Completed
            </Button>
          </div>

          {uploadingFiles.map((uploadingFile, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex-shrink-0">
                {uploadingFile.file.type.startsWith("image/") && (
                  <img
                    src={URL.createObjectURL(uploadingFile.file) || "/placeholder.svg"}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium truncate">{uploadingFile.file.name}</p>
                  <Badge
                    variant={
                      uploadingFile.status === "completed"
                        ? "default"
                        : uploadingFile.status === "error"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-xs"
                  >
                    {uploadingFile.status}
                  </Badge>
                </div>

                {uploadingFile.status === "uploading" && <Progress value={uploadingFile.progress} className="h-2" />}

                {uploadingFile.status === "error" && (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    <p className="text-xs">{uploadingFile.error}</p>
                  </div>
                )}

                {uploadingFile.status === "completed" && uploadingFile.result && (
                  <p className="text-xs text-muted-foreground">
                    {(uploadingFile.result.bytes / 1024 / 1024).toFixed(2)} MB • {uploadingFile.result.width}x
                    {uploadingFile.result.height}
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeUploadingFile(uploadingFile.file)}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
