import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import LeadAnalytics from "@/components/dashboard/LeadAnalytics";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Star, Clock, TrendingUp, Plus, ArrowRight, Loader2, BarChart3 } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { useReviews } from "@/hooks/useReviews";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { agents, loading: agentsLoading } = useAgents();
  const { reviews, loading: reviewsLoading } = useReviews();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalCalls = agents.reduce((acc, agent) => acc + (agent.total_calls || 0), 0);
  const respondedReviews = reviews.filter((r) => r.status === "responded").length;
  const pendingReviews = reviews.filter((r) => r.status === "pending").length;
  const avgSatisfaction = agents.length > 0
    ? (agents.reduce((acc, agent) => acc + Number(agent.satisfaction_score || 0), 0) / agents.length).toFixed(1)
    : "0";

  const stats = [
    {
      title: "Total Calls Handled",
      value: totalCalls.toLocaleString(),
      change: "+12.5%",
      changeType: "positive" as const,
      icon: Phone,
    },
    {
      title: "Reviews Responded",
      value: respondedReviews.toString(),
      change: `${pendingReviews} pending`,
      changeType: "neutral" as const,
      icon: Star,
    },
    {
      title: "Active Agents",
      value: agents.filter((a) => a.is_active).length.toString(),
      change: `${agents.length} total`,
      changeType: "neutral" as const,
      icon: Clock,
    },
    {
      title: "Avg Satisfaction",
      value: `${avgSatisfaction}/5`,
      change: "+0.3",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-dashboard-title">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild data-testid="link-view-reviews">
              <Link to="/dashboard/reviews">View Reviews</Link>
            </Button>
            <Button variant="hero" asChild data-testid="link-add-agent">
              <Link to="/dashboard/agents">
                <Plus className="w-4 h-4" />
                Add Agent
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
              <TrendingUp className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4" />
              Lead Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <StatsCard key={stat.title} {...stat} />
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">AI Agents</h2>
                      <p className="text-sm text-muted-foreground">Your voice agents</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild data-testid="link-view-all-agents">
                    <Link to="/dashboard/agents">
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>

                {agentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : agents.length === 0 ? (
                  <div className="text-center py-8">
                    <Phone className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">No agents yet</p>
                    <Button size="sm" asChild>
                      <Link to="/dashboard/agents">Create Agent</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agents.slice(0, 4).map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/30" data-testid={`card-agent-${agent.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                            <Phone className="w-4 h-4 text-primary-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{agent.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {agent.total_calls} calls
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          agent.is_active
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {agent.is_active ? "active" : "inactive"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Star className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">Recent Reviews</h2>
                      <p className="text-sm text-muted-foreground">Google Business reviews</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild data-testid="link-view-all-reviews">
                    <Link to="/dashboard/reviews">
                      View All
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>

                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-3">No reviews yet</p>
                    <Button size="sm" asChild>
                      <Link to="/dashboard/settings">Connect Google</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviews.slice(0, 4).map((review) => (
                      <div key={review.id} className="p-3 rounded-xl bg-muted/30" data-testid={`card-review-${review.id}`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-semibold text-primary-foreground">
                              {review.authorName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{review.authorName}</p>
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
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {review.reviewText || "No review text"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <LeadAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
