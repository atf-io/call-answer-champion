import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, Send } from "lucide-react";

const SMS = () => {
  return (
    <AgentLayout
      title="SMS / Text"
      description="Manage your SMS and text messaging agents"
    >
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search messages..." className="pl-10" data-testid="input-search-sms" />
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No SMS agents configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Set up SMS agents to handle text message conversations with your customers automatically
            </p>
            <Button variant="outline" data-testid="button-create-sms-agent">
              <Send className="w-4 h-4 mr-2" />
              Create SMS Agent
            </Button>
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
};

export default SMS;
