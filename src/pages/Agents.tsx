import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Phone, Settings, Power, MoreHorizontal, Mic, Clock, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import CreateAgentDialog from "@/components/agents/CreateAgentDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatScheduleDays = (days: string[]) => {
  if (days.length === 7) return "Every day";
  if (days.length === 5 && !days.includes("saturday") && !days.includes("sunday")) {
    return "Weekdays";
  }
  if (days.length === 2 && days.includes("saturday") && days.includes("sunday")) {
    return "Weekends";
  }
  return days.map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3)).join(", ");
};

const Agents = () => {
  const { agents, loading, createAgent, toggleAgentStatus, deleteAgent } = useAgents();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">AI Agents</h1>
            <p className="text-muted-foreground">Manage your Retell.ai voice agents</p>
          </div>
          <CreateAgentDialog onCreateAgent={createAgent} />
        </div>

        {/* Agents Grid */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="glass rounded-2xl p-6 hover:shadow-elevated transition-all duration-300">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-2 h-2 rounded-full ${
                        agent.is_active ? "bg-success" : "bg-muted-foreground"
                      }`} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {agent.is_active ? "active" : "inactive"}
                      </span>
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Agent
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => deleteAgent(agent.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Agent
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Total Calls</p>
                  <p className="text-lg font-semibold">{agent.total_calls.toLocaleString()}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Avg Duration</p>
                  <p className="text-lg font-semibold">{formatDuration(agent.avg_duration_seconds)}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Mic className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Voice:</span>
                  <span className="font-medium">{agent.voice_type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Schedule:</span>
                  <span className="font-medium">
                    {agent.schedule_start} - {agent.schedule_end} ({formatScheduleDays(agent.schedule_days)})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Satisfaction:</span>
                  <span className="font-medium">{Number(agent.satisfaction_score).toFixed(1)}/5</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="w-4 h-4" />
                  Configure
                </Button>
                <Button 
                  variant={agent.is_active ? "outline" : "default"} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => toggleAgentStatus(agent.id, !agent.is_active)}
                >
                  <Power className="w-4 h-4" />
                  {agent.is_active ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          ))}

          {/* Create New Agent Card */}
          {agents.length === 0 && (
            <div className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] col-span-full">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Phone className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">No Agents Yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Create your first AI voice agent to start handling after-hours calls
              </p>
              <CreateAgentDialog onCreateAgent={createAgent} />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Agents;
