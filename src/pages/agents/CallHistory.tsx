import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History, Search, Phone, Clock, ThumbsUp, ThumbsDown, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CallHistory = () => {
  return (
    <AgentLayout
      title="Call History"
      description="View and analyze all calls handled by your AI agents"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by caller, agent, or transcript..." className="pl-10" />
          </div>
          <Button variant="outline">Filter by Agent</Button>
          <Button variant="outline">Date Range</Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Calls</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Phone className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Duration</p>
                  <p className="text-2xl font-bold">0:00</p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Positive</p>
                  <p className="text-2xl font-bold">0%</p>
                </div>
                <ThumbsUp className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Negative</p>
                  <p className="text-2xl font-bold">0%</p>
                </div>
                <ThumbsDown className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <History className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No calls yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              When your AI agents start handling calls, you'll see the complete history here
            </p>
            <Button variant="outline">
              <Play className="w-4 h-4 mr-2" />
              Test Your Agent
            </Button>
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
};

export default CallHistory;
