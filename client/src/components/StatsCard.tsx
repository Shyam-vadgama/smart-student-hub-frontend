import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeColor?: 'positive' | 'negative' | 'neutral';
  iconBgColor?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeColor = 'neutral',
  iconBgColor = 'bg-primary/10'
}: StatsCardProps) {
  const changeColorClass = {
    positive: 'text-accent',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground'
  }[changeColor];

  return (
    <Card data-testid="stats-card">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm" data-testid="stats-title">{title}</p>
            <p className="text-2xl font-bold text-foreground" data-testid="stats-value">{value}</p>
            {change && (
              <p className={`text-sm ${changeColorClass}`} data-testid="stats-change">
                {change}
              </p>
            )}
          </div>
          <div className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
            <Icon className="h-6 w-6 text-primary" data-testid="stats-icon" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
