import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const SmsAnalytics = () => {
  return (
    <AgentLayout
      title="SMS Analytics"
      description="Track and analyze your SMS conversation performance"
    >
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2" data-testid="text-sms-analytics-empty">SMS analytics will appear here once you have conversations</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Start sending SMS messages to see detailed analytics and insights about your conversations.
          </p>
        </CardContent>
      </Card>
    </AgentLayout>
  );
};

export default SmsAnalytics;
