import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Phone, Star, Clock, TrendingUp, Plus, ArrowRight, MessageSquare } from "lucide-react";

const stats = [
  {
    title: "Total Calls Handled",
    value: "2,847",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: Phone,
  },
  {
    title: "Reviews Responded",
    value: "432",
    change: "+8.2%",
    changeType: "positive" as const,
    icon: Star,
  },
  {
    title: "Avg Response Time",
    value: "< 2 min",
    change: "-15%",
    changeType: "positive" as const,
    icon: Clock,
  },
  {
    title: "Customer Satisfaction",
    value: "4.8/5",
    change: "+0.3",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
];

const recentCalls = [
  { id: 1, caller: "+1 (555) 123-4567", duration: "3:42", status: "completed", time: "2 min ago" },
  { id: 2, caller: "+1 (555) 987-6543", duration: "5:18", status: "completed", time: "15 min ago" },
  { id: 3, caller: "+1 (555) 456-7890", duration: "2:05", status: "voicemail", time: "1 hr ago" },
  { id: 4, caller: "+1 (555) 321-0987", duration: "4:22", status: "completed", time: "2 hrs ago" },
];

const recentReviews = [
  { id: 1, author: "Sarah M.", rating: 5, snippet: "Excellent service! The AI response was...", status: "responded", time: "5 min ago" },
  { id: 2, author: "John D.", rating: 4, snippet: "Good experience overall, would recommend...", status: "pending", time: "30 min ago" },
  { id: 3, author: "Mike R.", rating: 3, snippet: "Average service, room for improvement...", status: "pending", time: "1 hr ago" },
];

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              View Reports
            </Button>
            <Button variant="hero">
              <Plus className="w-4 h-4" />
              Add Agent
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Calls */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Recent Calls</h2>
                  <p className="text-sm text-muted-foreground">Handled by AI agents</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{call.caller}</p>
                      <p className="text-xs text-muted-foreground">{call.duration} • {call.time}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    call.status === "completed" 
                      ? "bg-success/10 text-success" 
                      : "bg-warning/10 text-warning"
                  }`}>
                    {call.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Recent Reviews</h2>
                  <p className="text-sm text-muted-foreground">Google Business reviews</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div key={review.id} className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
                        {review.author.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{review.author}</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating ? "text-warning fill-warning" : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      review.status === "responded" 
                        ? "bg-success/10 text-success" 
                        : "bg-warning/10 text-warning"
                    }`}>
                      {review.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{review.snippet}</p>
                  {review.status === "pending" && (
                    <Button variant="ghost" size="sm" className="mt-2 h-8 text-xs">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Generate Response
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
