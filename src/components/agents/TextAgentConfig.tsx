import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings2, MessageSquare, AlertTriangle, Clock } from "lucide-react";
import VariableInserter from "@/components/shared/VariableInserter";

export interface TextAgentFormData {
  name: string;
  prompt: string;
  greeting_message: string;
  personality: string;
  response_delay_ms: number;
  max_messages_per_conversation: number;
  auto_end_after_minutes: number;
  escalation_keywords: string[];
  escalation_phone: string;
  enable_after_hours_only: boolean;
  schedule_start: string;
  schedule_end: string;
  schedule_days: string[];
}

export const defaultTextAgentData: TextAgentFormData = {
  name: "",
  prompt: `You are a helpful AI assistant for a home services business. Your goal is to:
1. Qualify leads by asking about their service needs
2. Collect their contact information
3. Schedule appointments when possible
4. Answer common questions about services and pricing

Always be professional, friendly, and helpful. If you don't know the answer to something specific, offer to have a team member follow up.`,
  greeting_message: "Hi! Thanks for reaching out. How can I help you today?",
  personality: "friendly and professional",
  response_delay_ms: 2000,
  max_messages_per_conversation: 20,
  auto_end_after_minutes: 30,
  escalation_keywords: ["urgent", "emergency", "speak to human", "real person"],
  escalation_phone: "",
  enable_after_hours_only: false,
  schedule_start: "09:00",
  schedule_end: "17:00",
  schedule_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
};

const daysOfWeek = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

interface TextAgentConfigProps {
  formData: TextAgentFormData;
  onChange: (data: TextAgentFormData) => void;
  escalationKeywordsInput: string;
  onEscalationKeywordsChange: (value: string) => void;
}

export const TextAgentConfig = ({ 
  formData, 
  onChange, 
  escalationKeywordsInput,
  onEscalationKeywordsChange 
}: TextAgentConfigProps) => {
  const toggleDay = (day: string) => {
    const currentDays = formData.schedule_days || [];
    if (currentDays.includes(day)) {
      onChange({
        ...formData,
        schedule_days: currentDays.filter((d) => d !== day),
      });
    } else {
      onChange({
        ...formData,
        schedule_days: [...currentDays, day],
      });
    }
  };

  return (
    <Tabs defaultValue="basic" className="w-full">
      <div className="px-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic" className="text-xs">
            <Settings2 className="w-3 h-3 mr-1" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="prompt" className="text-xs">
            <MessageSquare className="w-3 h-3 mr-1" />
            Prompt
          </TabsTrigger>
          <TabsTrigger value="behavior" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Behavior
          </TabsTrigger>
          <TabsTrigger value="escalation" className="text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Escalation
          </TabsTrigger>
        </TabsList>
      </div>

      <ScrollArea className="h-[400px] px-6 py-4">
        {/* Basic Tab */}
        <TabsContent value="basic" className="space-y-4 mt-0">
          <div className="space-y-2">
            <Label htmlFor="text-name">Agent Name *</Label>
            <Input
              id="text-name"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              placeholder="SMS Support Agent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text-personality">Personality</Label>
            <Input
              id="text-personality"
              value={formData.personality}
              onChange={(e) => onChange({ ...formData, personality: e.target.value })}
              placeholder="friendly and professional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="text-greeting">Greeting Message</Label>
            <Textarea
              id="text-greeting"
              value={formData.greeting_message}
              onChange={(e) => onChange({ ...formData, greeting_message: e.target.value })}
              placeholder="Hi! Thanks for reaching out. How can I help you today?"
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">First message sent when starting a conversation</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>After-Hours Only</Label>
              <p className="text-xs text-muted-foreground">Only respond outside business hours</p>
            </div>
            <Switch
              checked={formData.enable_after_hours_only}
              onCheckedChange={(checked) => onChange({ ...formData, enable_after_hours_only: checked })}
            />
          </div>

          {formData.enable_after_hours_only && (
            <>
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
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="text-schedule-start">Business Hours Start</Label>
                  <Input
                    id="text-schedule-start"
                    type="time"
                    value={formData.schedule_start}
                    onChange={(e) => onChange({ ...formData, schedule_start: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="text-schedule-end">Business Hours End</Label>
                  <Input
                    id="text-schedule-end"
                    type="time"
                    value={formData.schedule_end}
                    onChange={(e) => onChange({ ...formData, schedule_end: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Prompt Tab */}
        <TabsContent value="prompt" className="space-y-4 mt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="text-prompt">System Prompt</Label>
              <VariableInserter 
                onInsert={(variable) => {
                  const textarea = document.getElementById('text-prompt') as HTMLTextAreaElement;
                  if (textarea) {
                    const start = textarea.selectionStart;
                    const end = textarea.selectionEnd;
                    const newValue = formData.prompt.substring(0, start) + variable + formData.prompt.substring(end);
                    onChange({ ...formData, prompt: newValue });
                    // Restore cursor position after React re-render
                    setTimeout(() => {
                      textarea.focus();
                      textarea.setSelectionRange(start + variable.length, start + variable.length);
                    }, 0);
                  }
                }}
                compact
                variant="ghost"
              />
            </div>
            <Textarea
              id="text-prompt"
              value={formData.prompt}
              onChange={(e) => onChange({ ...formData, prompt: e.target.value })}
              placeholder="You are a helpful AI assistant..."
              className="min-h-[280px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Instructions that define how the agent behaves. Use variables like {"{{first_name}}"} to personalize responses.
            </p>
          </div>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-4 mt-0">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Response Delay</Label>
              <span className="text-sm text-muted-foreground">{(formData.response_delay_ms / 1000).toFixed(1)}s</span>
            </div>
            <Slider
              value={[formData.response_delay_ms]}
              onValueChange={([value]) => onChange({ ...formData, response_delay_ms: value })}
              min={500}
              max={10000}
              step={500}
            />
            <p className="text-xs text-muted-foreground">Delay before sending a response (makes it feel more natural)</p>
          </div>

          <div className="space-y-2">
            <Label>Max Messages Per Conversation</Label>
            <Input
              type="number"
              value={formData.max_messages_per_conversation}
              onChange={(e) => onChange({ ...formData, max_messages_per_conversation: parseInt(e.target.value) || 20 })}
              min={5}
              max={100}
            />
            <p className="text-xs text-muted-foreground">Limit the number of messages to prevent runaway conversations</p>
          </div>

          <div className="space-y-2">
            <Label>Auto-End After (minutes)</Label>
            <Input
              type="number"
              value={formData.auto_end_after_minutes}
              onChange={(e) => onChange({ ...formData, auto_end_after_minutes: parseInt(e.target.value) || 30 })}
              min={5}
              max={1440}
            />
            <p className="text-xs text-muted-foreground">End conversation after this period of inactivity</p>
          </div>
        </TabsContent>

        {/* Escalation Tab */}
        <TabsContent value="escalation" className="space-y-4 mt-0">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <h4 className="font-medium mb-2">Human Handover</h4>
            <p className="text-sm text-muted-foreground">
              Configure when the AI should stop and notify a human to take over the conversation.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Escalation Keywords</Label>
            <Input
              value={escalationKeywordsInput}
              onChange={(e) => onEscalationKeywordsChange(e.target.value)}
              placeholder="urgent, emergency, speak to human"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated keywords that trigger human escalation
            </p>
          </div>

          <div className="space-y-2">
            <Label>Escalation Phone Number</Label>
            <Input
              value={formData.escalation_phone}
              onChange={(e) => onChange({ ...formData, escalation_phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
            <p className="text-xs text-muted-foreground">
              Phone number to notify when escalation is triggered
            </p>
          </div>
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
};
