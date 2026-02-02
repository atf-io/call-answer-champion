import { useEffect, useState } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Phone, Clock, TrendingUp, Users, Calendar, RefreshCw, CheckCircle, Smile } from "lucide-react";
import { useRetell, RetellAnalytics } from "@/hooks/useRetell";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { format, subDays } from "date-fns";

const AgentAnalytics = () => {
  const { analytics, loading, fetchAnalytics, syncCalls, syncing } = useRetell();
  const [chartData, setChartData] = useState<{ date: string; calls: number }[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (analytics?.callsByDay) {
      // Generate last 30 days of data
      const data = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        data.push({
          date: format(date, "MMM d"),
          calls: analytics.callsByDay[dateStr] || 0,
        });
      }
      setChartData(data);
    }
  }, [analytics]);

  const handleSync = async () => {
    await syncCalls();
    await fetchAnalytics();
  };

  return (
    <AgentLayout
      title="Analytics"
      description="Monitor performance metrics across all your AI agents"
    >
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleSync} disabled={syncing || loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Data"}
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Total Calls</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{analytics?.totalCalls || 0}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">All time</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">This Month</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{analytics?.thisMonthCalls || 0}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{analytics?.avgDurationFormatted || "0:00"}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Minutes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Success Rate</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{analytics?.successRate || 0}%</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Completed calls</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{analytics?.satisfactionRate || 0}%</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Positive sentiment</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Active Agents</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">
                    {analytics?.activeAgents || 0}/{analytics?.totalAgents || 0}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Online now</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Call Volume
              </CardTitle>
              <CardDescription>Daily call volume over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : chartData.length > 0 && analytics?.totalCalls ? (
                <ResponsiveContainer width="100%" height={256}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar 
                      dataKey="calls" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/20">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Charts will appear once you have call data
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Performance Overview
              </CardTitle>
              <CardDescription>Key metrics at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : analytics?.totalCalls ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <span className="font-medium">Total Calls</span>
                    </div>
                    <span className="text-2xl font-bold">{analytics.totalCalls}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="font-medium">Average Duration</span>
                    </div>
                    <span className="text-2xl font-bold">{analytics.avgDurationFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="font-medium">Success Rate</span>
                    </div>
                    <span className="text-2xl font-bold">{analytics.successRate}%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Smile className="w-5 h-5 text-yellow-500" />
                      <span className="font-medium">Customer Satisfaction</span>
                    </div>
                    <span className="text-2xl font-bold">{analytics.satisfactionRate}%</span>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/20">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Sync your Retell data to see performance metrics
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentAnalytics;
