import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Zap, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SpeedToLeadSettings } from "../AgentConfigStep";
import type { BusinessProfile } from "@/pages/Onboarding";

interface SpeedToLeadConfigProps {
  settings: SpeedToLeadSettings;
  onSettingsChange: (settings: SpeedToLeadSettings) => void;
  businessProfile: BusinessProfile;
}

const VOICE_OPTIONS = [
  { id: "11labs-Adrian", name: "Adrian - Professional Male", provider: "ElevenLabs" },
  { id: "11labs-Amy", name: "Amy - Friendly Female", provider: "ElevenLabs" },
  { id: "11labs-Brian", name: "Brian - Warm Male", provider: "ElevenLabs" },
  { id: "11labs-Emma", name: "Emma - Professional Female", provider: "ElevenLabs" },
  { id: "openai-Alloy", name: "Alloy - Neutral", provider: "OpenAI" },
  { id: "openai-Echo", name: "Echo - Conversational Male", provider: "OpenAI" },
  { id: "openai-Nova", name: "Nova - Friendly Female", provider: "OpenAI" },
  { id: "openai-Shimmer", name: "Shimmer - Warm Female", provider: "OpenAI" },
  { id: "openai-Onyx", name: "Onyx - Deep Male", provider: "OpenAI" },
];

const COMMON_SOURCES = [
  "HomeAdvisor",
  "Angi",
  "Thumbtack",
  "Yelp",
  "Google Ads",
  "Facebook Ads",
  "Zillow",
  "Realtor.com",
];

const SpeedToLeadConfig = ({ settings, onSettingsChange, businessProfile }: SpeedToLeadConfigProps) => {
  const [newSource, setNewSource] = useState("");

  const handleChange = (field: keyof SpeedToLeadSettings, value: string | number | string[]) => {
    onSettingsChange({ ...settings, [field]: value });
  };

  const addSource = (source: string) => {
    if (source && !settings.leadSources.includes(source)) {
      handleChange("leadSources", [...settings.leadSources, source]);
    }
    setNewSource("");
  };

  const removeSource = (source: string) => {
    handleChange("leadSources", settings.leadSources.filter((s) => s !== source));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Configure Speed to Lead Agent</h2>
        <p className="text-muted-foreground">
          Set up instant callbacks for leads from 3rd party aggregators
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="agent-name">Agent Name</Label>
          <Input
            id="agent-name"
            value={settings.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Speed to Lead Agent"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="voice-type">Voice</Label>
          <Select
            value={settings.voiceType}
            onValueChange={(value) => handleChange("voiceType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select voice" />
            </SelectTrigger>
            <SelectContent>
              {VOICE_OPTIONS.map((voice) => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <Label>Response Time (seconds): {settings.responseTime}s</Label>
          <Slider
            value={[settings.responseTime]}
            onValueChange={(value) => handleChange("responseTime", value[0])}
            min={5}
            max={120}
            step={5}
          />
          <p className="text-xs text-muted-foreground">
            How quickly to call leads after receiving notification
          </p>
        </div>

        <div className="space-y-4">
          <Label>Max Call Attempts: {settings.maxAttempts}</Label>
          <Slider
            value={[settings.maxAttempts]}
            onValueChange={(value) => handleChange("maxAttempts", value[0])}
            min={1}
            max={5}
            step={1}
          />
          <p className="text-xs text-muted-foreground">
            Number of callback attempts if lead doesn't answer
          </p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="script">Qualification Script</Label>
          <Textarea
            id="script"
            value={settings.qualificationScript}
            onChange={(e) => handleChange("qualificationScript", e.target.value)}
            rows={4}
            placeholder="Hi, this is [Your Business]. I'm calling about..."
          />
        </div>

        <div className="space-y-3 md:col-span-2">
          <Label>Lead Sources</Label>
          <div className="flex flex-wrap gap-2 mb-3">
            {settings.leadSources.map((source) => (
              <Badge key={source} variant="secondary" className="px-3 py-1">
                {source}
                <button
                  onClick={() => removeSource(source)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="Add custom source..."
              onKeyDown={(e) => e.key === "Enter" && addSource(newSource)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => addSource(newSource)}
              disabled={!newSource.trim()}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-sm text-muted-foreground mr-2">Quick add:</span>
            {COMMON_SOURCES.filter((s) => !settings.leadSources.includes(s)).slice(0, 5).map((source) => (
              <Badge
                key={source}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => addSource(source)}
              >
                + {source}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeedToLeadConfig;
