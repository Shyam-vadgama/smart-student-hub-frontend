export interface User {
  id: string
  name: string
  title: string
  company: string
  location: string
  avatar: string
  coverImage: string
  bio: string
  connections: string[]
  followers: string[]
  following: string[]
  posts: string[]
  createdAt: string
}

export interface Post {
  id: string
  userId: string
  content: string
  images: string[]
  likes: string[]
  comments: Comment[]
  shares: number
  createdAt: string
  updatedAt: string
}

export interface Comment {
  id: string
  userId: string
  content: string
  likes: string[]
  createdAt: string
}

// Storage keys
const STORAGE_KEYS = {
  USERS: "linkedin_users",
  POSTS: "linkedin_posts",
  CURRENT_USER: "linkedin_current_user",
} as const

// User management
export const getUsers = (): User[] => {
  if (typeof window === "undefined") return []
  const users = localStorage.getItem(STORAGE_KEYS.USERS)
  return users ? JSON.parse(users) : []
}

export const saveUser = (user: User): void => {
  if (typeof window === "undefined") return
  const users = getUsers()
  const existingIndex = users.findIndex((u) => u.id === user.id)

  if (existingIndex >= 0) {
    users[existingIndex] = user
  } else {
    users.push(user)
  }

  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null
  const currentUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
  if (!currentUserId) return null

  const users = getUsers()
  return users.find((u) => u.id === currentUserId) || null
}

export const setCurrentUser = (userId: string): void => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId)
}

// Post management
export const getPosts = (): Post[] => {
  if (typeof window === "undefined") return []
  const posts = localStorage.getItem(STORAGE_KEYS.POSTS)
  return posts ? JSON.parse(posts) : []
}

export const savePost = (post: Post): void => {
  if (typeof window === "undefined") return
  const posts = getPosts()
  const existingIndex = posts.findIndex((p) => p.id === post.id)

  if (existingIndex >= 0) {
    posts[existingIndex] = post
  } else {
    posts.unshift(post) // Add new posts to the beginning
  }

  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts))
}

export const deletePost = (postId: string): void => {
  if (typeof window === "undefined") return
  const posts = getPosts().filter((p) => p.id !== postId)
  localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts))
}

// Initialize with sample data
export const initializeSampleData = (): void => {
  if (typeof window === "undefined") return

  const existingUsers = getUsers()
  if (existingUsers.length > 0) return // Already initialized

  const sampleUsers: User[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      title: "Senior Software Engineer",
      company: "TechCorp",
      location: "San Francisco, CA",
      avatar: "/professional-woman-avatar.png",
      coverImage: "/professional-office-background.jpg",
      bio: "Passionate about building scalable web applications and mentoring junior developers. 5+ years of experience in React, Node.js, and cloud technologies.",
      connections: ["2", "3"],
      followers: ["2", "3", "4"],
      following: ["2", "4"],
      posts: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Michael Chen",
      title: "Product Manager",
      company: "InnovateLabs",
      location: "New York, NY",
      avatar: "/professional-man-avatar.png",
      coverImage: "/modern-office.png",
      bio: "Product strategist with a focus on user experience and data-driven decisions. Leading cross-functional teams to deliver impactful products.",
      connections: ["1", "3"],
      followers: ["1", "3"],
      following: ["1", "3", "4"],
      posts: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      title: "UX Designer",
      company: "DesignStudio",
      location: "Austin, TX",
      avatar: "/professional-woman-designer-avatar.png",
      coverImage: "/creative-workspace-design.jpg",
      bio: "Creating intuitive and beautiful user experiences. Specializing in mobile-first design and accessibility. Always learning and sharing design insights.",
      connections: ["1", "2"],
      followers: ["1", "2", "4"],
      following: ["1", "2"],
      posts: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "4",
      name: "David Kim",
      title: "Marketing Director",
      company: "GrowthCo",
      location: "Seattle, WA",
      avatar: "/professional-man-marketing-avatar.jpg",
      coverImage: "/marketing-team-workspace.jpg",
      bio: "Growth-focused marketing leader with expertise in digital campaigns, brand strategy, and customer acquisition. Helping startups scale effectively.",
      connections: [],
      followers: ["1", "2", "3"],
      following: ["1", "2", "3"],
      posts: [],
      createdAt: new Date().toISOString(),
    },
  ]

  sampleUsers.forEach(saveUser)
  setCurrentUser("1") // Set Sarah as the current user
}
