import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Check, MessageSquare, Phone, Save, Variable } from "lucide-react";
import { BusinessProfile } from "@/hooks/useBusinessProfile";
import { generateAgentPrompt, AgentType } from "@/lib/generateAgentPrompt";
import { useSmsAgents } from "@/hooks/useSmsAgents";
import { toast } from "sonner";
import VariableInserter from "@/components/shared/VariableInserter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GeneratePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Partial<BusinessProfile>;
}

export function GeneratePromptDialog({ open, onOpenChange, profile }: GeneratePromptDialogProps) {
  const [agentType, setAgentType] = useState<AgentType>("sms");
  const [includeCalendar, setIncludeCalendar] = useState(true);
  const [includeTransfer, setIncludeTransfer] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  
  const { agents, updateSmsAgent, isUpdating } = useSmsAgents();

  const generatedPrompt = generateAgentPrompt({
    agentType,
    profile,
    includeCalendar,
    includeTransfer,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy prompt");
    }
  };

  const handleSaveToAgent = async () => {
    if (!selectedAgentId) {
      toast.error("Please select an agent first");
      return;
    }
    
    try {
      await updateSmsAgent(selectedAgentId, { prompt: generatedPrompt });
      toast.success("Prompt saved to agent!");
    } catch {
      toast.error("Failed to save prompt to agent");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Agent System Prompt</DialogTitle>
          <DialogDescription>
            Generate a comprehensive AI system prompt from your business profile data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <Tabs value={agentType} onValueChange={(v) => setAgentType(v as AgentType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sms" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                SMS / Chat Agent
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Voice Agent
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="include-calendar"
                checked={includeCalendar}
                onCheckedChange={setIncludeCalendar}
              />
              <Label htmlFor="include-calendar" className="text-sm cursor-pointer">
                Include calendar scheduling
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="include-transfer"
                checked={includeTransfer}
                onCheckedChange={setIncludeTransfer}
              />
              <Label htmlFor="include-transfer" className="text-sm cursor-pointer">
                Include transfer actions
              </Label>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Generated prompt with your business profile data
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Variable className="w-3 h-3" />
                      <span>Variables available</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[300px]">
                    <p className="text-xs">
                      Template variables like {"{{first_name}}"}, {"{{business_name}}"} are automatically 
                      replaced with real values during conversations.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              value={generatedPrompt}
              readOnly
              className="flex-1 min-h-[400px] font-mono text-xs resize-none"
            />
          </div>

          {agentType === "sms" && agents.length > 0 && (
            <div className="flex items-center gap-3 pt-2 border-t">
              <Label htmlFor="agent-select" className="text-sm whitespace-nowrap">
                Save to:
              </Label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger id="agent-select" className="flex-1">
                  <SelectValue placeholder="Select an SMS agent..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleSaveToAgent} 
                disabled={!selectedAgentId || isUpdating}
                size="sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {isUpdating ? "Saving..." : "Save"}
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Prompt
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
