import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Phone, Clock, TrendingUp, Users, Calendar } from "lucide-react";

const AgentAnalytics = () => {
  return (
    <AgentLayout
      title="Analytics"
      description="Monitor performance metrics across all your AI agents"
    >
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Total Calls</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">0:00</p>
                <p className="text-xs text-muted-foreground mt-1">Minutes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">0%</p>
                <p className="text-xs text-muted-foreground mt-1">Completed calls</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Leads Captured</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Appointments</p>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col">
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                <p className="text-2xl font-bold">N/A</p>
                <p className="text-xs text-muted-foreground mt-1">Avg rating</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Placeholder */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Call Volume
              </CardTitle>
              <CardDescription>Daily call volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/20">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Charts will appear once you have call data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Call Duration
              </CardTitle>
              <CardDescription>Average call duration by agent</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border rounded-lg bg-muted/20">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Charts will appear once you have call data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AgentLayout>
  );
};

export default AgentAnalytics;
