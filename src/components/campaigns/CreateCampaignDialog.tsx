import { useState } from "react";
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
import { Plus, Loader2 } from "lucide-react";
import LeadSourceSelector from "./LeadSourceSelector";
import { SmsAgent } from "@/hooks/useSmsAgents";

interface CampaignPreset {
  name: string;
  description: string;
  steps: { delay_minutes: number; message_template: string }[];
}

const campaignPresets: CampaignPreset[] = [
  {
    name: "Speed to Lead",
    description: "Reach new leads within minutes of receiving their inquiry.",
    steps: [
      { delay_minutes: 1, message_template: "Hi {{first_name}}, thanks for reaching out about {{service_category}}! This is {{agent_name}} from {{business_name}}. How can we help you today?" },
      { delay_minutes: 30, message_template: "Hi {{first_name}}, just following up on your inquiry about {{service_category}}. We'd love to help - would you like to schedule a quick call?" },
      { delay_minutes: 1440, message_template: "Hey {{first_name}}, we wanted to check in one more time. If you're still looking for help with {{service_category}}, reply here or give us a call. We're happy to assist!" },
    ],
  },
  {
    name: "Appointment Reminder",
    description: "Automated reminders before a scheduled appointment.",
    steps: [
      { delay_minutes: 1440, message_template: "Hi {{first_name}}, this is {{business_name}} reminding you about your upcoming {{service_category}} appointment tomorrow. Reply YES to confirm or call us to reschedule." },
      { delay_minutes: 2880, message_template: "{{first_name}}, your appointment with {{business_name}} is coming up soon. We look forward to seeing you!" },
    ],
  },
  {
    name: "Follow-Up After Service",
    description: "Check in with customers after completing a service.",
    steps: [
      { delay_minutes: 60, message_template: "Hi {{first_name}}, thanks for choosing {{business_name}} for your {{service_category}} needs! We hope everything went well." },
      { delay_minutes: 4320, message_template: "Hey {{first_name}}, it's been a few days since your {{service_category}} service. How is everything? We'd love your feedback!" },
      { delay_minutes: 10080, message_template: "Hi {{first_name}}, if you were happy with our {{service_category}} work, we'd really appreciate a quick review. It helps small businesses like ours a lot! Thank you - {{business_name}}" },
    ],
  },
  {
    name: "Re-Engagement",
    description: "Win back leads that went cold or didn't convert.",
    steps: [
      { delay_minutes: 0, message_template: "Hi {{first_name}}, it's {{agent_name}} from {{business_name}}. We noticed you were interested in {{service_category}} a while back. Are you still looking for help?" },
      { delay_minutes: 4320, message_template: "{{first_name}}, just a friendly check-in from {{business_name}}. We have availability for {{service_category}} this week if you're interested!" },
    ],
  },
];

const formatDelay = (totalMinutes: number) => {
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  return parts.join(" ");
};

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: SmsAgent[];
  onCreateCampaign: (data: {
    name: string;
    description?: string;
    sms_agent_id?: string;
    lead_sources?: string[];
  }) => Promise<{ id: string } | null | undefined>;
  onAddStep: (data: {
    campaign_id: string;
    step_order: number;
    delay_minutes: number;
    message_template: string;
  }) => Promise<unknown>;
  isCreating: boolean;
  onCampaignCreated?: (campaign: { id: string }) => void;
}

const CreateCampaignDialog = ({
  open,
  onOpenChange,
  agents,
  onCreateCampaign,
  onAddStep,
  isCreating,
  onCampaignCreated,
}: CreateCampaignDialogProps) => {
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAgentId, setNewAgentId] = useState("");
  const [newLeadSources, setNewLeadSources] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<CampaignPreset | null>(null);
  const [isCreatingPresetSteps, setIsCreatingPresetSteps] = useState(false);

  const applyPreset = (preset: CampaignPreset) => {
    setSelectedPreset(preset);
    setNewName(preset.name);
    setNewDescription(preset.description);
  };

  const clearPreset = () => {
    setSelectedPreset(null);
    setNewName("");
    setNewDescription("");
  };

  const resetForm = () => {
    setNewName("");
    setNewDescription("");
    setNewAgentId("");
    setNewLeadSources([]);
    setSelectedPreset(null);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const campaign = await onCreateCampaign({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        sms_agent_id: newAgentId || undefined,
        lead_sources: newLeadSources.length > 0 ? newLeadSources : undefined,
      });
      if (selectedPreset && campaign?.id) {
        setIsCreatingPresetSteps(true);
        try {
          for (let i = 0; i < selectedPreset.steps.length; i++) {
            const s = selectedPreset.steps[i];
            await onAddStep({
              campaign_id: campaign.id,
              step_order: i + 1,
              delay_minutes: s.delay_minutes,
              message_template: s.message_template,
            });
          }
        } finally {
          setIsCreatingPresetSteps(false);
        }
      }
      resetForm();
      onOpenChange(false);
      if (campaign?.id) {
        onCampaignCreated?.(campaign);
      }
    } catch {}
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
          <DialogDescription>
            Start from a template or build your own from scratch.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 overflow-y-auto flex-1 min-h-0 pr-1">
          <div className="space-y-2">
            <Label>Quick Start Templates</Label>
            <div className="grid grid-cols-2 gap-2">
              {campaignPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className={`text-left p-3 rounded-md border text-sm transition-colors hover:bg-muted/50 ${
                    selectedPreset?.name === preset.name
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  data-testid={`button-preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span className="font-medium block mb-0.5">{preset.name}</span>
                  <span className="text-xs text-muted-foreground line-clamp-2">{preset.description}</span>
                  <span className="text-xs text-muted-foreground mt-1 block">{preset.steps.length} steps</span>
                </button>
              ))}
            </div>
            {selectedPreset && (
              <Button variant="ghost" size="sm" onClick={clearPreset} data-testid="button-clear-preset">
                Clear template
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-name">Campaign Name *</Label>
            <Input
              id="campaign-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Welcome Series"
              data-testid="input-campaign-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campaign-description">Description</Label>
            <Textarea
              id="campaign-description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe the purpose of this campaign..."
              rows={2}
              data-testid="textarea-campaign-description"
            />
          </div>
          <div className="space-y-2">
            <Label>SMS Agent</Label>
            <Select value={newAgentId} onValueChange={setNewAgentId}>
              <SelectTrigger data-testid="select-sms-agent">
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
              selectedSources={newLeadSources}
              onSelectionChange={setNewLeadSources}
            />
          </div>
          {selectedPreset && (
            <div className="space-y-2">
              <Label>Pre-loaded Steps Preview</Label>
              <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {selectedPreset.steps.map((s, i) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <span className="font-medium text-muted-foreground">Step {i + 1} ({formatDelay(s.delay_minutes)} delay)</span>
                    <p className="text-foreground whitespace-pre-wrap">{s.message_template}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">You can edit these steps after creating the campaign.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} data-testid="button-cancel-create">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || isCreatingPresetSteps || !newName.trim()}
            data-testid="button-confirm-create-campaign"
          >
            {(isCreating || isCreatingPresetSteps) ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isCreatingPresetSteps ? "Setting up steps..." : "Create Campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaignDialog;
