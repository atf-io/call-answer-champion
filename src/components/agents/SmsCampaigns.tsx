import { Card, CardContent } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

interface SmsCampaignsProps {
  agentId: string;
}

const SmsCampaigns = ({ agentId }: SmsCampaignsProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16">
        <Megaphone className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold mb-2" data-testid="text-campaigns-placeholder">Campaign management coming soon</h3>
        <p className="text-muted-foreground text-center max-w-md">
          You'll be able to create and manage SMS campaigns for this agent here.
        </p>
      </CardContent>
    </Card>
  );
};

export default SmsCampaigns;
