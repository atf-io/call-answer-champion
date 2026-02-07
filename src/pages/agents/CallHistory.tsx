import { useEffect, useState } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { History, Search, Phone, Clock, ThumbsUp, ThumbsDown, Play, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCallLogs } from "@/hooks/useCallLogs";
import { useRetell } from "@/hooks/useRetell";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const CallHistory = () => {
  const { callLogs, loading, stats, refetch, formatDuration } = useCallLogs();
  const { syncCalls, syncing } = useRetell();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCall, setExpandedCall] = useState<string | null>(null);

  const handleSync = async () => {
    await syncCalls();
    refetch();
  };

  const filteredLogs = callLogs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.callerNumber?.toLowerCase().includes(query) ||
      log.agent?.name?.toLowerCase().includes(query) ||
      log.transcript?.toLowerCase().includes(query) ||
      log.status?.toLowerCase().includes(query)
    );
  });

  const getSentimentBadge = (sentiment: string | null) => {
    if (!sentiment) return null;
    const lower = sentiment.toLowerCase();
    if (lower === "positive") {
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Positive</Badge>;
    } else if (lower === "negative") {
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Negative</Badge>;
    }
    return <Badge variant="secondary">{sentiment}</Badge>;
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    const lower = status.toLowerCase();
    if (lower === "completed" || lower === "ended") {
      return <Badge variant="outline" className="text-green-600">Completed</Badge>;
    } else if (lower === "ongoing") {
      return <Badge className="bg-blue-500 text-white">Live</Badge>;
    } else if (lower === "failed" || lower === "error") {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

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
            <Input 
              placeholder="Search by caller, agent, or transcript..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync from Retell"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Calls</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stats.totalCalls}</p>
                  )}
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
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</p>
                  )}
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
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stats.positiveRate}%</p>
                  )}
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
                  {loading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stats.negativeRate}%</p>
                  )}
                </div>
                <ThumbsDown className="w-8 h-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call List */}
        {loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <History className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No calls yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                When your AI agents start handling calls, you'll see the complete history here. 
                Click "Sync from Retell" to import your existing call data.
              </p>
              <Button variant="outline" onClick={handleSync} disabled={syncing}>
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                Sync from Retell
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <Card key={log.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedCall(expandedCall === log.id ? null : log.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.callerNumber || "Unknown Caller"}</span>
                          {getStatusBadge(log.status)}
                          {getSentimentBadge(log.sentiment)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.agent?.name || "Unknown Agent"} • {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{formatDuration(log.durationSeconds)}</p>
                        <p className="text-xs text-muted-foreground">Duration</p>
                      </div>
                      {expandedCall === log.id ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  
                  {expandedCall === log.id && log.transcript && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium mb-2">Transcript</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                        {log.transcript}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AgentLayout>
  );
};

export default CallHistory;
