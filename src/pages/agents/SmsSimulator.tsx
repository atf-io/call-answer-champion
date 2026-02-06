import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { TestTube } from "lucide-react";

const SmsSimulator = () => {
  return (
    <AgentLayout
      title="SMS Simulator"
      description="Test your SMS agents in a simulated conversation environment"
    >
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <TestTube className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2" data-testid="text-sms-simulator-empty">Configure an SMS agent to test conversations</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Create an SMS agent first, then use this simulator to test and refine your agent's responses.
          </p>
        </CardContent>
      </Card>
    </AgentLayout>
  );
};

export default SmsSimulator;
