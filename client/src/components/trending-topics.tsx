import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp } from "lucide-react"

export function TrendingTopics() {
  const topics = [
    { name: "React 19", posts: "2,847 posts" },
    { name: "AI Development", posts: "1,923 posts" },
    { name: "Remote Work", posts: "3,156 posts" },
    { name: "Web3", posts: "892 posts" },
    { name: "TypeScript", posts: "1,445 posts" },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {topics.map((topic, index) => (
          <div
            key={index}
            className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg cursor-pointer"
          >
            <div>
              <div className="font-medium">#{topic.name}</div>
              <div className="text-sm text-muted-foreground">{topic.posts}</div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Trending
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
