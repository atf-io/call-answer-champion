import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadAnalytics } from "@/hooks/useLeadAnalytics";
import {
  Users,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  Phone,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  PieChart,
  Smile,
  Meh,
  Frown
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

const COLORS = {
  primary: "hsl(var(--primary))",
  success: "hsl(142, 76%, 36%)",
  warning: "hsl(38, 92%, 50%)",
  destructive: "hsl(var(--destructive))",
  muted: "hsl(var(--muted-foreground))",
};

const LeadAnalytics = () => {
  const [dateRange, setDateRange] = useState(30);
  const { data: analytics, isLoading } = useLeadAnalytics(dateRange);

  const outcomeData = analytics ? [
    { name: "Converted", value: analytics.convertedLeads, color: COLORS.success },
    { name: "Pending", value: analytics.pendingLeads, color: COLORS.warning },
    { name: "Lost", value: analytics.lostLeads, color: COLORS.destructive },
  ] : [];

  const sourceData = analytics ? Object.entries(analytics.leadsBySource).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  })) : [];

  const sentimentData = analytics ? [
    { name: "Positive", value: analytics.sentimentBreakdown.positive, color: COLORS.success },
    { name: "Neutral", value: analytics.sentimentBreakdown.neutral, color: COLORS.muted },
    { name: "Negative", value: analytics.sentimentBreakdown.negative, color: COLORS.destructive },
  ] : [];

  return (
    <div className="space-y-6" data-testid="section-lead-analytics-tab">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold" data-testid="text-lead-analytics-heading">Lead Analytics</h2>
          <p className="text-muted-foreground">Track leads received and conversion outcomes</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <Button
              key={days}
              variant={dateRange === days ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRange(days)}
              data-testid={`button-range-${days}`}
            >
              {days}D
            </Button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold" data-testid="text-total-leads">{analytics?.totalLeads || 0}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            {!isLoading && analytics && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${
                analytics.weekOverWeekChange >= 0 ? "text-success" : "text-destructive"
              }`}>
                {analytics.weekOverWeekChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {Math.abs(analytics.weekOverWeekChange)}% vs last week
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold" data-testid="text-conversion-rate">{analytics?.conversionRate || 0}%</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
            {!isLoading && analytics && (
              <p className="text-sm text-muted-foreground mt-2">
                {analytics.convertedLeads} converted
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-sm text-muted-foreground">SMS Leads</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold" data-testid="text-sms-leads">{analytics?.smsLeads || 0}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
            </div>
            {!isLoading && analytics && analytics.totalLeads > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round((analytics.smsLeads / analytics.totalLeads) * 100)}% of total
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-sm text-muted-foreground">Voice Leads</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold" data-testid="text-voice-leads">{analytics?.voiceLeads || 0}</p>
                )}
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/50 flex items-center justify-center">
                <Phone className="w-6 h-6 text-accent-foreground" />
              </div>
            </div>
            {!isLoading && analytics && analytics.totalLeads > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {Math.round((analytics.voiceLeads / analytics.totalLeads) * 100)}% of total
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-success/20 bg-success/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-success" />
              <div>
                <p className="text-2xl font-bold" data-testid="text-converted-count">{analytics?.convertedLeads || 0}</p>
                <p className="text-sm text-muted-foreground">Converted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-warning" />
              <div>
                <p className="text-2xl font-bold" data-testid="text-pending-count">{analytics?.pendingLeads || 0}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold" data-testid="text-lost-count">{analytics?.lostLeads || 0}</p>
                <p className="text-sm text-muted-foreground">Lost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Lead Volume
            </CardTitle>
            <CardDescription>Daily leads by channel over the last {dateRange} days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : analytics?.leadsByDay && analytics.totalLeads > 0 ? (
              <ResponsiveContainer width="100%" height={256}>
                <AreaChart data={analytics.leadsByDay}>
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
                  <Area
                    type="monotone"
                    dataKey="sms"
                    stackId="1"
                    stroke="hsl(217, 91%, 60%)"
                    fill="hsl(217, 91%, 60%)"
                    fillOpacity={0.6}
                    name="SMS"
                  />
                  <Area
                    type="monotone"
                    dataKey="voice"
                    stackId="1"
                    stroke="hsl(270, 70%, 60%)"
                    fill="hsl(270, 70%, 60%)"
                    fillOpacity={0.6}
                    name="Voice"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center border rounded-md bg-muted/20">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No lead data yet
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Lead Outcomes
            </CardTitle>
            <CardDescription>Conversion status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : analytics?.totalLeads && analytics.totalLeads > 0 ? (
              <ResponsiveContainer width="100%" height={256}>
                <RechartsPie>
                  <Pie
                    data={outcomeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {outcomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Legend />
                </RechartsPie>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center border rounded-md bg-muted/20">
                <div className="text-center">
                  <PieChart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No outcome data yet
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>Where your leads are coming from</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={sourceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center border rounded-md bg-muted/20">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No source data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="w-5 h-5" />
              Sentiment Analysis
            </CardTitle>
            <CardDescription>How leads feel about interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-48 w-full" />
            ) : analytics && (sentimentData.some(s => s.value > 0)) ? (
              <div className="space-y-4">
                {sentimentData.map((item) => {
                  const total = sentimentData.reduce((sum, s) => sum + s.value, 0);
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  const Icon = item.name === "Positive" ? Smile : item.name === "Negative" ? Frown : Meh;
                  return (
                    <div key={item.name} className="flex items-center gap-3" data-testid={`sentiment-${item.name.toLowerCase()}`}>
                      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: item.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground">{item.value} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted/30">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center border rounded-md bg-muted/20">
                <div className="text-center">
                  <Meh className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No sentiment data yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadAnalytics;
