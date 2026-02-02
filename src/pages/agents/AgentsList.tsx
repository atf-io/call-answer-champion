import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Bot, Zap, Star, Phone, Clock, TrendingUp, Activity, CircleDot, Settings, RefreshCw, Loader2, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useAgents } from "@/hooks/useAgents";
import { useRetell } from "@/hooks/useRetell";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateAgentDialog } from "@/components/agents/CreateAgentDialog";

const agentTypes = [
  {
    name: "Voice Agent",
    description: "Handle after-hours calls with natural AI conversations",
    icon: Bot,
    color: "from-primary to-primary/80",
    type: "voice",
  },
  {
    name: "Speed to Lead",
    description: "Instantly call leads from aggregators like Angi & Thumbtack",
    icon: Zap,
    color: "from-orange-500 to-amber-500",
    type: "speed-to-lead",
  },
  {
    name: "Reviews Agent",
    description: "Automatically respond to Google reviews",
    icon: Star,
    color: "from-yellow-500 to-orange-500",
    type: "reviews",
  },
];

const AgentsList = () => {
  const navigate = useNavigate();
  const { agents, loading, toggleAgentStatus, updateAgent, refetch } = useAgents();
  const { liveCalls, fetchLiveStatus, fetchAgents: fetchRetellAgents, loading: retellLoading } = useRetell();
  const [selectedAgentType, setSelectedAgentType] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [syncingAgentId, setSyncingAgentId] = useState<string | null>(null);

  useEffect(() => {
    fetchLiveStatus();
    // Refresh live status every 30 seconds
    const interval = setInterval(fetchLiveStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateAgent = (type: string) => {
    setSelectedAgentType(type);
    setIsCreateOpen(true);
  };

  const handleAgentCreated = () => {
    setIsCreateOpen(false);
    setSelectedAgentType(null);
    refetch();
  };

  const handleSyncToRetell = async (agentId: string) => {
    setSyncingAgentId(agentId);
    const agent = agents.find(a => a.id === agentId);
    if (agent) {
      await updateAgent(agentId, { name: agent.name }); // Trigger sync by updating
    }
    setSyncingAgentId(null);
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isAgentLive = (retellAgentId: string | null) => {
    if (!retellAgentId) return false;
    return liveCalls.some(call => call.agentId === retellAgentId);
  };

  return (
    <AgentLayout
      title="Agents"
      description="Create and manage your AI agents"
    >
      <div className="space-y-6">
        {/* Live Status Banner */}
        {liveCalls.length > 0 && (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Activity className="w-5 h-5 text-green-500" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    {liveCalls.length} Active Call{liveCalls.length > 1 ? "s" : ""} in Progress
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {liveCalls.map(c => c.callerNumber).join(", ")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create New Agent */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Create New Agent</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              Choose from Voice, Speed to Lead, or Reviews agents to automate your business communications
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              {agentTypes.map((type) => (
                <Button 
                  key={type.name} 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => handleCreateAgent(type.type)}
                >
                  <type.icon className="w-4 h-4" />
                  {type.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Existing Agents */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-5 w-1/2 mt-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : agents.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Your Agents</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => {
                const isLive = isAgentLive(agent.retell_agent_id);
                return (
                  <Card key={agent.id} className={`relative overflow-hidden ${isLive ? "ring-2 ring-green-500" : ""}`}>
                    {isLive && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500 text-white gap-1">
                          <CircleDot className="w-3 h-3 animate-pulse" />
                          Live
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                          <Bot className="w-6 h-6 text-white" />
                        </div>
                        <Switch
                          checked={agent.is_active}
                          onCheckedChange={(checked) => toggleAgentStatus(agent.id, checked)}
                        />
                      </div>
                      <CardTitle className="text-lg mt-2">{agent.name}</CardTitle>
                      <CardDescription>
                        {agent.personality} • {agent.voice_type}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-muted/50">
                          <Phone className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-lg font-bold">{agent.total_calls}</p>
                          <p className="text-xs text-muted-foreground">Calls</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-lg font-bold">{formatDuration(agent.avg_duration_seconds)}</p>
                          <p className="text-xs text-muted-foreground">Avg</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/50">
                          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-lg font-bold">{agent.satisfaction_score}%</p>
                          <p className="text-xs text-muted-foreground">Happy</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/dashboard/agents/${agent.id}/edit`)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="flex-1"
                          onClick={() => handleSyncToRetell(agent.id)}
                          disabled={syncingAgentId === agent.id}
                        >
                          {syncingAgentId === agent.id ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-1" />
                          )}
                          Sync
                        </Button>
                      </div>
                      {agent.retell_agent_id && (
                        <p className="text-xs text-muted-foreground mt-2 truncate">
                          Retell ID: {agent.retell_agent_id}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                        <History className="w-3 h-3" />
                        <span>
                          Synced {formatDistanceToNow(new Date(agent.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Agent Types Grid */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Agent Types</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {agentTypes.map((type) => (
              <Card 
                key={type.name} 
                className="hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => handleCreateAgent(type.type)}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                    <type.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full">
                    Configure Agent →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <CreateAgentDialog 
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        agentType={selectedAgentType}
        onSuccess={handleAgentCreated}
      />
    </AgentLayout>
  );
};

export default AgentsList;
