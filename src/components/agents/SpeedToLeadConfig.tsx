import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings2, MessageSquare, Zap, AlertTriangle } from "lucide-react";

// Lead source platforms
const leadSources = [
  { id: "angi", name: "Angi", logo: "/src/assets/integrations/angi.svg" },
  { id: "thumbtack", name: "Thumbtack", logo: null },
  { id: "homeadvisor", name: "HomeAdvisor", logo: "/src/assets/integrations/homeadvisor.svg" },
  { id: "google-lsa", name: "Google LSA", logo: "/src/assets/integrations/google-lsa.png" },
  { id: "yelp", name: "Yelp", logo: "/src/assets/integrations/yelp.png" },
  { id: "nextdoor", name: "Nextdoor", logo: null },
  { id: "modernize", name: "Modernize", logo: null },
  { id: "zillow", name: "Zillow", logo: "/src/assets/integrations/zillow.svg" },
];

export interface SpeedToLeadFormData {
  name: string;
  prompt: string;
  greeting_message: string;
  personality: string;
  lead_sources: string[];
  response_time_seconds: number;
  follow_up_enabled: boolean;
  follow_up_delay_minutes: number;
  follow_up_message: string;
  max_follow_ups: number;
  response_delay_ms: number;
  max_messages_per_conversation: number;
  auto_end_after_minutes: number;
  escalation_keywords: string[];
  escalation_phone: string;
  collect_appointment: boolean;
  collect_address: boolean;
  collect_service_details: boolean;
}

export const defaultSpeedToLeadData: SpeedToLeadFormData = {
  name: "",
  prompt: `You are a fast-response SMS agent for a home services business. A new lead has just come in from a lead aggregator.

Your goals:
1. Respond IMMEDIATELY to acknowledge their inquiry
2. Qualify the lead by asking about their specific needs
3. Collect their preferred contact time and address
4. Attempt to schedule an appointment or callback
5. Answer basic questions about services and availability

Be enthusiastic but professional. Time is critical - the faster you engage, the more likely they'll choose us over competitors.

Important: If they ask for pricing, provide ranges when possible and emphasize that you'd love to give them an accurate quote after understanding their needs better.`,
  greeting_message: "Hi {first_name}! Thanks for reaching out about your {service_type} project. I'm here to help get you scheduled ASAP. Do you have a few minutes to share some details?",
  personality: "enthusiastic and helpful",
  lead_sources: ["angi", "thumbtack"],
  response_time_seconds: 30,
  follow_up_enabled: true,
  follow_up_delay_minutes: 15,
  follow_up_message: "Hey {first_name}, just wanted to make sure you saw my message! We'd love to help with your project. When works best to chat?",
  max_follow_ups: 2,
  response_delay_ms: 1000,
  max_messages_per_conversation: 25,
  auto_end_after_minutes: 60,
  escalation_keywords: ["urgent", "emergency", "speak to human", "real person", "call me"],
  escalation_phone: "",
  collect_appointment: true,
  collect_address: true,
  collect_service_details: true,
};

interface SpeedToLeadConfigProps {
  formData: SpeedToLeadFormData;
  onChange: (data: SpeedToLeadFormData) => void;
  escalationKeywordsInput: string;
  onEscalationKeywordsChange: (value: string) => void;
}

export const SpeedToLeadConfig = ({ 
  formData, 
  onChange, 
  escalationKeywordsInput,
  onEscalationKeywordsChange 
}: SpeedToLeadConfigProps) => {
  const toggleLeadSource = (sourceId: string) => {
    const currentSources = formData.lead_sources || [];
    if (currentSources.includes(sourceId)) {
      onChange({
        ...formData,
        lead_sources: currentSources.filter((s) => s !== sourceId),
      });
    } else {
      onChange({
        ...formData,
        lead_sources: [...currentSources, sourceId],
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
          <TabsTrigger value="sources" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            Lead Sources
          </TabsTrigger>
          <TabsTrigger value="prompt" className="text-xs">
            <MessageSquare className="w-3 h-3 mr-1" />
            Messages
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
            <Label htmlFor="stl-name">Agent Name *</Label>
            <Input
              id="stl-name"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              placeholder="Speed to Lead Agent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stl-personality">Personality</Label>
            <Input
              id="stl-personality"
              value={formData.personality}
              onChange={(e) => onChange({ ...formData, personality: e.target.value })}
              placeholder="enthusiastic and helpful"
            />
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Response Speed
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Target Response Time</Label>
                <span className="text-sm font-medium text-primary">{formData.response_time_seconds}s</span>
              </div>
              <Slider
                value={[formData.response_time_seconds]}
                onValueChange={([value]) => onChange({ ...formData, response_time_seconds: value })}
                min={5}
                max={120}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                How quickly to send the first response after receiving a lead
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Lead Qualification</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Collect Service Details</Label>
                  <p className="text-xs text-muted-foreground">Ask about their specific project needs</p>
                </div>
                <Switch
                  checked={formData.collect_service_details}
                  onCheckedChange={(checked) => onChange({ ...formData, collect_service_details: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Collect Address</Label>
                  <p className="text-xs text-muted-foreground">Ask for service location</p>
                </div>
                <Switch
                  checked={formData.collect_address}
                  onCheckedChange={(checked) => onChange({ ...formData, collect_address: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Schedule Appointments</Label>
                  <p className="text-xs text-muted-foreground">Attempt to book appointments directly</p>
                </div>
                <Switch
                  checked={formData.collect_appointment}
                  onCheckedChange={(checked) => onChange({ ...formData, collect_appointment: checked })}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Lead Sources Tab */}
        <TabsContent value="sources" className="space-y-4 mt-0">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <h4 className="font-medium mb-2">Select Lead Sources</h4>
            <p className="text-sm text-muted-foreground">
              Choose which lead aggregator platforms this agent should respond to
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {leadSources.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => toggleLeadSource(source.id)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  formData.lead_sources.includes(source.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30 hover:bg-muted/30"
                }`}
              >
                <Checkbox 
                  checked={formData.lead_sources.includes(source.id)}
                  className="pointer-events-none"
                />
                <div className="flex-1">
                  <p className="font-medium">{source.name}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Follow-up Settings</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Follow-ups</Label>
                <p className="text-xs text-muted-foreground">Send reminders if no response</p>
              </div>
              <Switch
                checked={formData.follow_up_enabled}
                onCheckedChange={(checked) => onChange({ ...formData, follow_up_enabled: checked })}
              />
            </div>

            {formData.follow_up_enabled && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Follow-up Delay</Label>
                    <span className="text-sm text-muted-foreground">{formData.follow_up_delay_minutes} min</span>
                  </div>
                  <Slider
                    value={[formData.follow_up_delay_minutes]}
                    onValueChange={([value]) => onChange({ ...formData, follow_up_delay_minutes: value })}
                    min={5}
                    max={60}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Follow-ups</Label>
                  <Input
                    type="number"
                    value={formData.max_follow_ups}
                    onChange={(e) => onChange({ ...formData, max_follow_ups: parseInt(e.target.value) || 2 })}
                    min={1}
                    max={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Follow-up Message</Label>
                  <Textarea
                    value={formData.follow_up_message}
                    onChange={(e) => onChange({ ...formData, follow_up_message: e.target.value })}
                    placeholder="Hey, just checking in..."
                    className="min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{first_name}"} to personalize the message
                  </p>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="prompt" className="space-y-4 mt-0">
          <div className="space-y-2">
            <Label htmlFor="stl-greeting">Initial Greeting</Label>
            <Textarea
              id="stl-greeting"
              value={formData.greeting_message}
              onChange={(e) => onChange({ ...formData, greeting_message: e.target.value })}
              placeholder="Hi! Thanks for reaching out..."
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              First message sent when a lead comes in. Use {"{first_name}"} and {"{service_type}"} for personalization.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stl-prompt">System Prompt</Label>
            <Textarea
              id="stl-prompt"
              value={formData.prompt}
              onChange={(e) => onChange({ ...formData, prompt: e.target.value })}
              placeholder="You are a fast-response SMS agent..."
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Instructions that define how the agent behaves and qualifies leads
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Message Delay</Label>
              <span className="text-sm text-muted-foreground">{(formData.response_delay_ms / 1000).toFixed(1)}s</span>
            </div>
            <Slider
              value={[formData.response_delay_ms]}
              onValueChange={([value]) => onChange({ ...formData, response_delay_ms: value })}
              min={500}
              max={5000}
              step={500}
            />
            <p className="text-xs text-muted-foreground">Typing simulation delay between messages</p>
          </div>
        </TabsContent>

        {/* Escalation Tab */}
        <TabsContent value="escalation" className="space-y-4 mt-0">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <h4 className="font-medium mb-2">Human Handover</h4>
            <p className="text-sm text-muted-foreground">
              Configure when the AI should stop and notify a team member to take over
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

          <div className="space-y-2">
            <Label>Max Messages Per Lead</Label>
            <Input
              type="number"
              value={formData.max_messages_per_conversation}
              onChange={(e) => onChange({ ...formData, max_messages_per_conversation: parseInt(e.target.value) || 25 })}
              min={5}
              max={100}
            />
            <p className="text-xs text-muted-foreground">Auto-escalate after this many messages</p>
          </div>

          <div className="space-y-2">
            <Label>Conversation Timeout (minutes)</Label>
            <Input
              type="number"
              value={formData.auto_end_after_minutes}
              onChange={(e) => onChange({ ...formData, auto_end_after_minutes: parseInt(e.target.value) || 60 })}
              min={15}
              max={1440}
            />
            <p className="text-xs text-muted-foreground">End conversation after this period of inactivity</p>
          </div>
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
};
