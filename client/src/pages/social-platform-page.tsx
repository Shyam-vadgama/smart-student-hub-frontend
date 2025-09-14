import { useEffect, useState } from "react"
import { Navigation } from "@/components/navigation"
import { UserProfile } from "@/components/user-profile"
import { PostCreator } from "@/components/post-creator"
import { PostCard } from "@/components/post-card"
import { FeedFilter } from "@/components/feed-filter"
import { TrendingTopics } from "@/components/trending-topics"
import { SuggestedConnections } from "@/components/suggested-connections"
import { ActivityFeed } from "@/components/activity-feed"
import { initializeSampleData, getPosts, getCurrentUser, type Post } from "@/lib/storage"

export default function SocialPlatformPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [activeFilter, setActiveFilter] = useState("all")
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    initializeSampleData()
    const allPosts = getPosts()
    setPosts(allPosts)
    setFilteredPosts(allPosts)
    setCurrentUser(getCurrentUser())
  }, [])

  useEffect(() => {
    let filtered = [...posts]

    switch (activeFilter) {
      case "following":
        if (currentUser) {
          const followingIds = currentUser.following || []
          filtered = posts.filter((post) => followingIds.includes(post.userId))
        }
        break
      case "jobs":
        // Mock job-related posts filter
        filtered = posts.filter(
          (post) =>
            post.content.toLowerCase().includes("job") ||
            post.content.toLowerCase().includes("hiring") ||
            post.content.toLowerCase().includes("career"),
        )
        break
      case "events":
        // Mock event-related posts filter
        filtered = posts.filter(
          (post) =>
            post.content.toLowerCase().includes("event") ||
            post.content.toLowerCase().includes("conference") ||
            post.content.toLowerCase().includes("meetup"),
        )
        break
      default:
        filtered = posts
    }

    setFilteredPosts(filtered)
  }, [posts, activeFilter, currentUser])

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev])
  }

  const handlePostUpdate = (updatedPost: Post) => {
    setPosts((prev) => prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)))
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - User Profile */}
          <div className="lg:col-span-1 space-y-6">
            <UserProfile isCurrentUser={true} />
            <div className="hidden lg:block">
              <ActivityFeed />
            </div>
          </div>

          {/* Main Content - Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Creator */}
            <PostCreator onPostCreated={handlePostCreated} />

            {/* Feed Filter */}
            <FeedFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />

            {/* Posts Feed */}
            <div className="space-y-6">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">
                    {activeFilter === "all" ? "No posts yet" : `No ${activeFilter} posts found`}
                  </h3>
                  <p className="text-muted-foreground">
                    {activeFilter === "all"
                      ? "Be the first to share something with your network!"
                      : "Try changing your filter or create a new post."}
                  </p>
                </div>
              ) : (
                filteredPosts.map((post) => <PostCard key={post.id} post={post} onPostUpdate={handlePostUpdate} />)
              )}
            </div>
          </div>

          {/* Right Sidebar - Trending & Suggestions */}
          <div className="lg:col-span-1 space-y-6">
            <TrendingTopics />
            <SuggestedConnections />
          </div>
        </div>
      </main>
    </div>
  )
}
