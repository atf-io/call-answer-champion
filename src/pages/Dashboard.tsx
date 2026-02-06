import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Phone, Star, Clock, TrendingUp, Plus, ArrowRight, MessageSquare, Loader2, BarChart3, Users, Globe, PenLine } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { useReviews } from "@/hooks/useReviews";
import { useContacts } from "@/hooks/useContacts";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { agents, loading: agentsLoading } = useAgents();
  const { reviews, loading: reviewsLoading } = useReviews();
  const { contacts } = useContacts();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalCalls = agents.reduce((acc, agent) => acc + agent.totalCalls, 0);
  const respondedReviews = reviews.filter((r) => r.status === "responded").length;
  const pendingReviews = reviews.filter((r) => r.status === "pending").length;
  const avgSatisfaction = agents.length > 0
    ? (agents.reduce((acc, agent) => acc + Number(agent.satisfactionScore), 0) / agents.length).toFixed(1)
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
      value: agents.filter((a) => a.isActive).length.toString(),
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/dashboard/reviews">View Reviews</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/dashboard/agents">
                <Plus className="w-4 h-4" />
                Add Agent
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <StatsCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Lead Analytics */}
        {(() => {
          const funnelStages = [
            { key: "new", label: "New Leads", count: contacts.filter((c) => c.status?.toLowerCase() === "new").length, color: "bg-blue-500" },
            { key: "contacted", label: "Contacted", count: contacts.filter((c) => c.status?.toLowerCase() === "contacted").length, color: "bg-yellow-500" },
            { key: "qualified", label: "Qualified", count: contacts.filter((c) => c.status?.toLowerCase() === "qualified").length, color: "bg-orange-500" },
            { key: "converted", label: "Converted", count: contacts.filter((c) => c.status?.toLowerCase() === "converted").length, color: "bg-green-500" },
          ];
          const totalLeads = Math.max(contacts.length, 1);
          const sources = [
            { key: "voice_ai", label: "Voice AI", icon: Phone, count: contacts.filter((c) => c.source?.toLowerCase() === "voice_ai").length },
            { key: "sms", label: "SMS", icon: MessageSquare, count: contacts.filter((c) => c.source?.toLowerCase() === "sms").length },
            { key: "web_form", label: "Web Form", icon: Globe, count: contacts.filter((c) => c.source?.toLowerCase() === "web_form").length },
            { key: "manual", label: "Manual", icon: PenLine, count: contacts.filter((c) => c.source?.toLowerCase() === "manual").length },
          ];
          const maxSourceCount = Math.max(...sources.map((s) => s.count), 1);
          const funnelWidths = [100, 75, 50, 30];

          return (
            <div className="glass rounded-2xl p-6 mb-8" data-testid="section-lead-analytics">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold" data-testid="text-lead-analytics-title">Lead Analytics</h2>
                  <p className="text-sm text-muted-foreground">Funnel overview & lead sources</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div data-testid="section-lead-funnel">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">Conversion Funnel</h3>
                  </div>
                  <div className="space-y-3">
                    {funnelStages.map((stage, idx) => (
                      <div key={stage.key} data-testid={`funnel-stage-${stage.key}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{stage.label}</span>
                          <span className="text-sm text-muted-foreground" data-testid={`text-funnel-count-${stage.key}`}>{stage.count}</span>
                        </div>
                        <div className="h-3 rounded-full bg-muted/30" style={{ width: `${funnelWidths[idx]}%` }}>
                          <div
                            className={`h-full rounded-full ${stage.color} transition-all`}
                            style={{ width: contacts.length > 0 ? `${Math.max((stage.count / totalLeads) * 100, stage.count > 0 ? 8 : 0)}%` : "0%" }}
                            data-testid={`bar-funnel-${stage.key}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div data-testid="section-lead-sources">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">Lead Sources</h3>
                  </div>
                  <div className="space-y-3">
                    {sources.map((source) => (
                      <div key={source.key} className="flex items-center gap-3" data-testid={`source-row-${source.key}`}>
                        <div className="w-8 h-8 rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0">
                          <source.icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{source.label}</span>
                            <span className="text-sm text-muted-foreground" data-testid={`text-source-count-${source.key}`}>{source.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted/30">
                            <div
                              className="h-full rounded-full bg-primary/60 transition-all"
                              style={{ width: contacts.length > 0 ? `${(source.count / maxSourceCount) * 100}%` : "0%" }}
                              data-testid={`bar-source-${source.key}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Agents */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">AI Agents</h2>
                  <p className="text-sm text-muted-foreground">Your voice agents</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
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
                  <div key={agent.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                        <Phone className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {agent.totalCalls} calls • {agent.voiceType}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      agent.isActive 
                        ? "bg-success/10 text-success" 
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {agent.isActive ? "active" : "inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
              <Button variant="ghost" size="sm" asChild>
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
                  <div key={review.id} className="p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
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
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
