import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import LeadSourceSelector from "./LeadSourceSelector";
import { SmsAgent } from "@/hooks/useSmsAgents";
import { SmsCampaign } from "@/hooks/useSmsCampaigns";

interface EditCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: SmsCampaign | null;
  agents: SmsAgent[];
  onUpdateCampaign: (id: string, data: {
    name: string;
    description?: string;
    sms_agent_id?: string;
    lead_sources?: string[] | null;
  }) => Promise<unknown>;
  isUpdating: boolean;
  onCampaignUpdated?: (updates: Partial<SmsCampaign>) => void;
}

const EditCampaignDialog = ({
  open,
  onOpenChange,
  campaign,
  agents,
  onUpdateCampaign,
  isUpdating,
  onCampaignUpdated,
}: EditCampaignDialogProps) => {
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAgentId, setEditAgentId] = useState("");
  const [editLeadSources, setEditLeadSources] = useState<string[]>([]);

  useEffect(() => {
    if (campaign) {
      setEditName(campaign.name);
      setEditDescription(campaign.description || "");
      setEditAgentId(campaign.sms_agent_id || "");
      setEditLeadSources(campaign.lead_sources || []);
    }
  }, [campaign]);

  const handleEditSave = async () => {
    if (!campaign || !editName.trim()) return;
    await onUpdateCampaign(campaign.id, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
      sms_agent_id: editAgentId || undefined,
      lead_sources: editLeadSources.length > 0 ? editLeadSources : null,
    });
    onCampaignUpdated?.({
      name: editName.trim(),
      description: editDescription.trim() || null,
      sms_agent_id: editAgentId || null,
      lead_sources: editLeadSources.length > 0 ? editLeadSources : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
          <DialogDescription>
            Update the campaign details.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-campaign-name">Campaign Name *</Label>
            <Input
              id="edit-campaign-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Campaign name"
              data-testid="input-edit-campaign-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-campaign-description">Description</Label>
            <Textarea
              id="edit-campaign-description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Describe the purpose of this campaign..."
              rows={2}
              data-testid="textarea-edit-campaign-description"
            />
          </div>
          <div className="space-y-2">
            <Label>SMS Agent</Label>
            <Select value={editAgentId} onValueChange={setEditAgentId}>
              <SelectTrigger data-testid="select-edit-sms-agent">
                <SelectValue placeholder="Select an SMS agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Lead Sources</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select which lead platforms should trigger this campaign automatically.
            </p>
            <LeadSourceSelector
              selectedSources={editLeadSources}
              onSelectionChange={setEditLeadSources}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-edit">
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            disabled={isUpdating || !editName.trim()}
            data-testid="button-confirm-edit-campaign"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCampaignDialog;
