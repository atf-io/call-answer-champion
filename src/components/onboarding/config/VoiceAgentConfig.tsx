import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Phone } from "lucide-react";
import type { VoiceAgentSettings } from "../AgentConfigStep";
import type { BusinessProfile } from "@/pages/Onboarding";

interface VoiceAgentConfigProps {
  settings: VoiceAgentSettings;
  onSettingsChange: (settings: VoiceAgentSettings) => void;
  businessProfile: BusinessProfile;
}

const VOICE_TYPES = [
  "Professional Female",
  "Professional Male",
  "Friendly Female",
  "Friendly Male",
  "Warm Female",
  "Warm Male",
];

const DAYS = [
  { id: "monday", label: "Mon" },
  { id: "tuesday", label: "Tue" },
  { id: "wednesday", label: "Wed" },
  { id: "thursday", label: "Thu" },
  { id: "friday", label: "Fri" },
  { id: "saturday", label: "Sat" },
  { id: "sunday", label: "Sun" },
];

const VoiceAgentConfig = ({ settings, onSettingsChange, businessProfile }: VoiceAgentConfigProps) => {
  const handleChange = (field: keyof VoiceAgentSettings, value: string | string[]) => {
    onSettingsChange({ ...settings, [field]: value });
  };

  const toggleDay = (day: string) => {
    const days = settings.scheduleDays.includes(day)
      ? settings.scheduleDays.filter((d) => d !== day)
      : [...settings.scheduleDays, day];
    handleChange("scheduleDays", days);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Configure Voice AI Agent</h2>
        <p className="text-muted-foreground">
          Set up how your AI agent will handle incoming calls
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="agent-name">Agent Name</Label>
          <Input
            id="agent-name"
            value={settings.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="My Voice Agent"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="voice-type">Voice Type</Label>
          <Select
            value={settings.voiceType}
            onValueChange={(value) => handleChange("voiceType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              {VOICE_TYPES.map((voice) => (
                <SelectItem key={voice} value={voice}>
                  {voice}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="personality">Personality</Label>
          <Select
            value={settings.personality}
            onValueChange={(value) => handleChange("personality", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select personality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="friendly and professional">Friendly & Professional</SelectItem>
              <SelectItem value="warm and empathetic">Warm & Empathetic</SelectItem>
              <SelectItem value="efficient and direct">Efficient & Direct</SelectItem>
              <SelectItem value="casual and conversational">Casual & Conversational</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Active Hours</Label>
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={settings.scheduleStart}
              onChange={(e) => handleChange("scheduleStart", e.target.value)}
              className="flex-1"
            />
            <span className="text-muted-foreground">to</span>
            <Input
              type="time"
              value={settings.scheduleEnd}
              onChange={(e) => handleChange("scheduleEnd", e.target.value)}
              className="flex-1"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Hours when AI handles calls (e.g., after business hours)
          </p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="greeting">Greeting Message</Label>
          <Textarea
            id="greeting"
            value={settings.greeting}
            onChange={(e) => handleChange("greeting", e.target.value)}
            rows={3}
            placeholder="Hello! Thank you for calling..."
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>Active Days</Label>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <label
                key={day.id}
                className={`flex items-center justify-center w-12 h-10 rounded-lg border cursor-pointer transition-all ${
                  settings.scheduleDays.includes(day.id)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 border-border hover:border-primary/50"
                }`}
              >
                <Checkbox
                  checked={settings.scheduleDays.includes(day.id)}
                  onCheckedChange={() => toggleDay(day.id)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{day.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAgentConfig;
