import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search } from "lucide-react";

const ChatHistory = () => {
  return (
    <AgentLayout
      title="Chat History"
      description="View chat conversations from your text-based agents"
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search conversations..." className="pl-10" />
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No chat history yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">
              Chat conversations with your AI agents will appear here
            </p>
            <Button variant="outline">Learn About Chat Agents</Button>
          </CardContent>
        </Card>
      </div>
    </AgentLayout>
  );
};

export default ChatHistory;
