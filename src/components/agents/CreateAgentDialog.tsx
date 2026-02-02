import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { useAgents, CreateAgentData } from "@/hooks/useAgents";

const voiceTypes = [
  "Professional Female",
  "Professional Male",
  "Friendly Female",
  "Friendly Male",
  "Casual Female",
  "Casual Male",
];

const daysOfWeek = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

interface CreateAgentDialogProps {
  onCreateAgent?: (data: CreateAgentData) => Promise<any>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  agentType?: string | null;
  onSuccess?: () => void;
}

export const CreateAgentDialog = ({ 
  onCreateAgent, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  agentType,
  onSuccess 
}: CreateAgentDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createAgent } = useAgents();
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange || (() => {})) : setInternalOpen;

  const getDefaultGreeting = (type?: string | null) => {
    switch (type) {
      case "speed-to-lead":
        return "Hi! This is a quick follow-up call about your recent inquiry. I'd love to help you get started. Do you have a few minutes to chat?";
      case "reviews":
        return "";
      default:
        return "Hello! Thank you for calling. How can I help you today?";
    }
  };

  const getDefaultPersonality = (type?: string | null) => {
    switch (type) {
      case "speed-to-lead":
        return "energetic and helpful";
      case "reviews":
        return "professional and appreciative";
      default:
        return "friendly and professional";
    }
  };

  const [formData, setFormData] = useState<CreateAgentData>({
    name: "",
    voice_type: "Professional Female",
    personality: getDefaultPersonality(agentType),
    greeting_message: getDefaultGreeting(agentType),
    schedule_start: "18:00",
    schedule_end: "08:00",
    schedule_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  });

  useEffect(() => {
    if (open) {
      setFormData(prev => ({
        ...prev,
        personality: getDefaultPersonality(agentType),
        greeting_message: getDefaultGreeting(agentType),
      }));
    }
  }, [agentType, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    setLoading(true);
    
    const handler = onCreateAgent || createAgent;
    const result = await handler(formData);
    
    setLoading(false);
    
    if (result) {
      setOpen(false);
      setFormData({
        name: "",
        voice_type: "Professional Female",
        personality: "friendly and professional",
        greeting_message: "Hello! Thank you for calling. How can I help you today?",
        schedule_start: "18:00",
        schedule_end: "08:00",
        schedule_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
      });
      onSuccess?.();
    }
  };

  const toggleDay = (day: string) => {
    const currentDays = formData.schedule_days || [];
    if (currentDays.includes(day)) {
      setFormData({
        ...formData,
        schedule_days: currentDays.filter((d) => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        schedule_days: [...currentDays, day],
      });
    }
  };

  const getTitle = () => {
    switch (agentType) {
      case "voice":
        return "Create Voice Agent";
      case "speed-to-lead":
        return "Create Speed to Lead Agent";
      case "reviews":
        return "Create Reviews Agent";
      default:
        return "Create New AI Agent";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="hero">
            <Plus className="w-4 h-4" />
            Create Agent
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg glass border-border">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="After Hours Support"
              className="bg-muted/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="voice_type">Voice Type</Label>
            <Select
              value={formData.voice_type}
              onValueChange={(value) => setFormData({ ...formData, voice_type: value })}
            >
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {voiceTypes.map((voice) => (
                  <SelectItem key={voice} value={voice}>
                    {voice}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="personality">Personality</Label>
            <Input
              id="personality"
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              placeholder="friendly and professional"
              className="bg-muted/50"
            />
          </div>

          {agentType !== "reviews" && (
            <div className="space-y-2">
              <Label htmlFor="greeting">Greeting Message</Label>
              <Textarea
                id="greeting"
                value={formData.greeting_message}
                onChange={(e) => setFormData({ ...formData, greeting_message: e.target.value })}
                placeholder="Hello! How can I help you today?"
                className="bg-muted/50 min-h-[80px]"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="schedule_start">Schedule Start</Label>
              <Input
                id="schedule_start"
                type="time"
                value={formData.schedule_start}
                onChange={(e) => setFormData({ ...formData, schedule_start: e.target.value })}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule_end">Schedule End</Label>
              <Input
                id="schedule_end"
                type="time"
                value={formData.schedule_end}
                onChange={(e) => setFormData({ ...formData, schedule_end: e.target.value })}
                className="bg-muted/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Active Days</Label>
            <div className="flex gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.schedule_days?.includes(day.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="hero" disabled={loading || !formData.name.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Agent"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAgentDialog;
