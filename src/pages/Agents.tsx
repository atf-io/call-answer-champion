import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Phone, Plus, Settings, Power, MoreHorizontal, Mic, Clock, CheckCircle2 } from "lucide-react";

const agents = [
  {
    id: 1,
    name: "After Hours Support",
    status: "active",
    calls: 1247,
    avgDuration: "3:45",
    satisfaction: 4.9,
    voice: "Professional Female",
    schedule: "6PM - 8AM",
  },
  {
    id: 2,
    name: "Weekend Handler",
    status: "active",
    calls: 856,
    avgDuration: "4:12",
    satisfaction: 4.7,
    voice: "Friendly Male",
    schedule: "Sat & Sun",
  },
  {
    id: 3,
    name: "Holiday Support",
    status: "inactive",
    calls: 234,
    avgDuration: "3:20",
    satisfaction: 4.8,
    voice: "Professional Male",
    schedule: "Holidays Only",
  },
];

const Agents = () => {
  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">AI Agents</h1>
            <p className="text-muted-foreground">Manage your Retell.ai voice agents</p>
          </div>
          <Button variant="hero">
            <Plus className="w-4 h-4" />
            Create Agent
          </Button>
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
                        agent.status === "active" ? "bg-success" : "bg-muted-foreground"
                      }`} />
                      <span className="text-xs text-muted-foreground capitalize">{agent.status}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Total Calls</p>
                  <p className="text-lg font-semibold">{agent.calls.toLocaleString()}</p>
                </div>
                <div className="bg-muted/30 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Avg Duration</p>
                  <p className="text-lg font-semibold">{agent.avgDuration}</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Mic className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Voice:</span>
                  <span className="font-medium">{agent.voice}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Schedule:</span>
                  <span className="font-medium">{agent.schedule}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Satisfaction:</span>
                  <span className="font-medium">{agent.satisfaction}/5</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Settings className="w-4 h-4" />
                  Configure
                </Button>
                <Button 
                  variant={agent.status === "active" ? "outline" : "default"} 
                  size="sm" 
                  className="flex-1"
                >
                  <Power className="w-4 h-4" />
                  {agent.status === "active" ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          ))}

          {/* Create New Agent Card */}
          <div className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] hover:border-primary/50 transition-colors cursor-pointer group">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <h3 className="font-semibold mb-2">Create New Agent</h3>
            <p className="text-sm text-muted-foreground text-center">
              Set up a new AI voice agent with custom voice and behavior
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Agents;
