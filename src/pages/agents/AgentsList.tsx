import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Bot, Zap, Star } from "lucide-react";

const agentTypes = [
  {
    name: "Voice Agent",
    description: "Handle after-hours calls with natural AI conversations",
    icon: Bot,
    color: "from-primary to-primary/80",
  },
  {
    name: "Speed to Lead",
    description: "Instantly call leads from aggregators like Angi & Thumbtack",
    icon: Zap,
    color: "from-orange-500 to-amber-500",
  },
  {
    name: "Reviews Agent",
    description: "Automatically respond to Google reviews",
    icon: Star,
    color: "from-yellow-500 to-orange-500",
  },
];

const AgentsList = () => {
  return (
    <AgentLayout
      title="Agents"
      description="Create and manage your AI agents"
    >
      <div className="space-y-6">
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
            <div className="flex gap-3">
              {agentTypes.map((type) => (
                <Button key={type.name} variant="outline" className="gap-2">
                  <type.icon className="w-4 h-4" />
                  {type.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agent Types Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {agentTypes.map((type) => (
            <Card key={type.name} className="hover:shadow-lg transition-shadow cursor-pointer group">
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
    </AgentLayout>
  );
};

export default AgentsList;
