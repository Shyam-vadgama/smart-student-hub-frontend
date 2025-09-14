import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, Users, Briefcase, Calendar } from "lucide-react"

interface FeedFilterProps {
  activeFilter: string
  onFilterChange: (filter: string) => void
}

export function FeedFilter({ activeFilter, onFilterChange }: FeedFilterProps) {
  const filters = [
    { id: "all", label: "All", icon: TrendingUp },
    { id: "following", label: "Following", icon: Users },
    { id: "jobs", label: "Jobs", icon: Briefcase },
    { id: "events", label: "Events", icon: Calendar },
  ]

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Sort by:</h3>
          <div className="space-y-1">
            {filters.map((filter, index) => (
              <div key={filter.id}>
                <Button
                  variant={activeFilter === filter.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => onFilterChange(filter.id)}
                  className="w-full justify-start gap-2"
                >
                  <filter.icon className="h-4 w-4" />
                  {filter.label}
                </Button>
                {index < filters.length - 1 && <Separator className="my-1" />}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
