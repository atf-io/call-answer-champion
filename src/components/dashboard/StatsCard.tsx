import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
}

const StatsCard = ({ title, value, change, changeType, icon: Icon }: StatsCardProps) => {
  return (
    <div className="glass rounded-2xl p-6 hover:shadow-elevated transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-sm font-medium",
          changeType === "positive" && "text-success",
          changeType === "negative" && "text-destructive",
          changeType === "neutral" && "text-muted-foreground"
        )}>
          {changeType === "positive" && <TrendingUp className="w-4 h-4" />}
          {changeType === "negative" && <TrendingDown className="w-4 h-4" />}
          {change}
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-1">{value}</h3>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
};

export default StatsCard;
