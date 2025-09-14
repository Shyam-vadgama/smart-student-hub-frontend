// Cloudinary configuration and upload utilities
export interface CloudinaryConfig {
  cloudName: string
  uploadPreset: string
}

// Default configuration - in a real app, these would come from environment variables
const CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_CLOUDINARY_CLOUD_NAME) || (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string) || "demo",
  uploadPreset: (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_CLOUDINARY_UPLOAD_PRESET) || (process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string) || "ml_default",
}

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: string
  created_at: string
  bytes: number
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export class CloudinaryUploader {
  private config: CloudinaryConfig

  constructor(config?: Partial<CloudinaryConfig>) {
    this.config = { ...CLOUDINARY_CONFIG, ...config }
  }

  /**
   * Upload a single file to Cloudinary
   */
  async uploadFile(
    file: File,
    options?: {
      folder?: string
      transformation?: string
      onProgress?: (progress: UploadProgress) => void
    },
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", this.config.uploadPreset)

      if (options?.folder) {
        formData.append("folder", options.folder)
      }

      if (options?.transformation) {
        formData.append("transformation", options.transformation)
      }

      const xhr = new XMLHttpRequest()

      // Track upload progress
      if (options?.onProgress) {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            }
            options.onProgress!(progress)
          }
        })
      }

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const result = JSON.parse(xhr.responseText) as CloudinaryUploadResult
            resolve(result)
          } catch (error) {
            reject(new Error("Failed to parse Cloudinary response"))
          }
        } else {
          reject(new Error(`Upload failed with status: ${xhr.status}`))
        }
      })

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"))
      })

      xhr.open("POST", `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`)
      xhr.send(formData)
    })
  }

  /**
   * Upload multiple files to Cloudinary
   */
  async uploadFiles(
    files: File[],
    options?: {
      folder?: string
      transformation?: string
      onProgress?: (fileIndex: number, progress: UploadProgress) => void
      onFileComplete?: (fileIndex: number, result: CloudinaryUploadResult) => void
    },
  ): Promise<CloudinaryUploadResult[]> {
    const results: CloudinaryUploadResult[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const result = await this.uploadFile(file, {
          folder: options?.folder,
          transformation: options?.transformation,
          onProgress: (progress) => options?.onProgress?.(i, progress),
        })
        results.push(result)
        options?.onFileComplete?.(i, result)
      } catch (error) {
        console.error(`Failed to upload file ${i}:`, error)
        throw error
      }
    }

    return results
  }

  /**
   * Generate optimized image URL with transformations
   */
  getOptimizedUrl(
    publicId: string,
    options?: {
      width?: number
      height?: number
      crop?: "fill" | "fit" | "scale" | "crop" | "thumb"
      quality?: "auto" | number
      format?: "auto" | "webp" | "jpg" | "png"
      gravity?: "auto" | "face" | "center"
    },
  ): string {
    const baseUrl = `https://res.cloudinary.com/${this.config.cloudName}/image/upload`
    const transformations: string[] = []

    if (options?.width) transformations.push(`w_${options.width}`)
    if (options?.height) transformations.push(`h_${options.height}`)
    if (options?.crop) transformations.push(`c_${options.crop}`)
    if (options?.quality) transformations.push(`q_${options.quality}`)
    if (options?.format) transformations.push(`f_${options.format}`)
    if (options?.gravity) transformations.push(`g_${options.gravity}`)

    const transformationString = transformations.length > 0 ? `${transformations.join(",")}` : ""

    return `${baseUrl}/${transformationString}/${publicId}`
  }

  /**
   * Delete an image from Cloudinary (server-side only)
   * Note: This requires server-side implementation with API key
   */
  async deleteImage(publicId: string): Promise<void> {
    console.warn("Image deletion requires server-side implementation with API key for security")
    console.log(`To delete image with public_id: ${publicId}, implement a server action`)
  }
}

// Default uploader instance
export const cloudinaryUploader = new CloudinaryUploader()

// Utility functions
export const isCloudinaryUrl = (url: string): boolean => {
  return url.includes("cloudinary.com") || url.includes("res.cloudinary.com")
}

export const extractPublicId = (cloudinaryUrl: string): string | null => {
  const match = cloudinaryUrl.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)$/i)
  return match ? match[1] : null
}

// Mock Cloudinary for demo purposes when no real config is provided
export const mockCloudinaryUpload = async (file: File): Promise<CloudinaryUploadResult> => {
  // Simulate upload delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

  // Create a mock result
  const mockResult: CloudinaryUploadResult = {
    public_id: `demo/${Date.now()}_${file.name.replace(/\.[^/.]+$/, "")}`,
    secure_url: URL.createObjectURL(file), // Use blob URL for demo
    width: 800,
    height: 600,
    format: file.type.split("/")[1] || "jpg",
    resource_type: "image",
    created_at: new Date().toISOString(),
    bytes: file.size,
  }

  return mockResult
}
