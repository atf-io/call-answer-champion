import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus } from "lucide-react";

const Campaigns = () => {
  return (
    <AgentLayout
      title="Campaigns"
      description="Create and manage automated SMS campaigns"
    >
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Megaphone className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2" data-testid="text-campaigns-empty">No campaigns yet</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            Create automated SMS campaigns to engage with your contacts at scale.
          </p>
          <Button data-testid="button-create-campaign">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </CardContent>
      </Card>
    </AgentLayout>
  );
};

export default Campaigns;
