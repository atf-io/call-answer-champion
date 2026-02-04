import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Volume2, Mic, Clock, Settings2, Phone } from "lucide-react";
import { CreateAgentData } from "@/hooks/useAgents";

// Retell voice options
const voiceOptions = [
  { id: "11labs-Adrian", name: "Adrian (Male)", provider: "ElevenLabs" },
  { id: "11labs-Amy", name: "Amy (Female)", provider: "ElevenLabs" },
  { id: "11labs-Brian", name: "Brian (Male)", provider: "ElevenLabs" },
  { id: "11labs-Emma", name: "Emma (Female)", provider: "ElevenLabs" },
  { id: "openai-Alloy", name: "Alloy", provider: "OpenAI" },
  { id: "openai-Echo", name: "Echo", provider: "OpenAI" },
  { id: "openai-Fable", name: "Fable", provider: "OpenAI" },
  { id: "openai-Onyx", name: "Onyx", provider: "OpenAI" },
  { id: "openai-Nova", name: "Nova", provider: "OpenAI" },
  { id: "openai-Shimmer", name: "Shimmer", provider: "OpenAI" },
  { id: "deepgram-Angus", name: "Angus", provider: "Deepgram" },
  { id: "deepgram-Athena", name: "Athena", provider: "Deepgram" },
];

const voiceModels = [
  { id: "eleven_turbo_v2", name: "ElevenLabs Turbo v2 (Fast)" },
  { id: "eleven_multilingual_v2", name: "ElevenLabs Multilingual v2" },
  { id: "eleven_monolingual_v1", name: "ElevenLabs Monolingual v1" },
];

const ambientSounds = [
  { id: "none", name: "None" },
  { id: "coffee-shop", name: "Coffee Shop" },
  { id: "convention-hall", name: "Convention Hall" },
  { id: "summer-outdoor", name: "Summer Outdoor" },
  { id: "mountain-outdoor", name: "Mountain Outdoor" },
  { id: "static", name: "Static" },
  { id: "call-center", name: "Call Center" },
];

const languages = [
  { id: "en-US", name: "English (US)" },
  { id: "en-GB", name: "English (UK)" },
  { id: "en-AU", name: "English (Australia)" },
  { id: "es-ES", name: "Spanish (Spain)" },
  { id: "es-MX", name: "Spanish (Mexico)" },
  { id: "fr-FR", name: "French" },
  { id: "de-DE", name: "German" },
  { id: "it-IT", name: "Italian" },
  { id: "pt-BR", name: "Portuguese (Brazil)" },
  { id: "ja-JP", name: "Japanese" },
  { id: "zh-CN", name: "Chinese (Mandarin)" },
  { id: "ko-KR", name: "Korean" },
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

interface VoiceAgentConfigProps {
  formData: CreateAgentData;
  onChange: (data: CreateAgentData) => void;
  keywordsInput: string;
  onKeywordsChange: (value: string) => void;
  agentType?: string | null;
}

export const VoiceAgentConfig = ({ 
  formData, 
  onChange, 
  keywordsInput, 
  onKeywordsChange,
  agentType 
}: VoiceAgentConfigProps) => {
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

  const msToMinutes = (ms: number | undefined) => Math.round((ms || 0) / 60000);
  const minutesToMs = (min: number) => min * 60000;
  const msToSeconds = (ms: number | undefined) => Math.round((ms || 0) / 1000);
  const secondsToMs = (sec: number) => sec * 1000;

  return (
    <Tabs defaultValue="basic" className="w-full">
      <div className="px-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="text-xs">
            <Settings2 className="w-3 h-3 mr-1" />
            Basic
          </TabsTrigger>
          <TabsTrigger value="voice" className="text-xs">
            <Volume2 className="w-3 h-3 mr-1" />
            Voice
          </TabsTrigger>
          <TabsTrigger value="behavior" className="text-xs">
            <Mic className="w-3 h-3 mr-1" />
            Behavior
          </TabsTrigger>
          <TabsTrigger value="timing" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Timing
          </TabsTrigger>
          <TabsTrigger value="call" className="text-xs">
            <Phone className="w-3 h-3 mr-1" />
            Call
          </TabsTrigger>
        </TabsList>
      </div>

      <ScrollArea className="h-[400px] px-6 py-4">
        {/* Basic Tab */}
        <TabsContent value="basic" className="space-y-4 mt-0">
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              placeholder="After Hours Support"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="personality">Personality</Label>
            <Input
              id="personality"
              value={formData.personality}
              onChange={(e) => onChange({ ...formData, personality: e.target.value })}
              placeholder="friendly and professional"
            />
          </div>

          {agentType !== "reviews" && (
            <div className="space-y-2">
              <Label htmlFor="greeting">Greeting Message</Label>
              <Textarea
                id="greeting"
                value={formData.greeting_message}
                onChange={(e) => onChange({ ...formData, greeting_message: e.target.value })}
                placeholder="Hello! How can I help you today?"
                className="min-h-[80px]"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Language</Label>
            <Select
              value={formData.language}
              onValueChange={(value) => onChange({ ...formData, language: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.id} value={lang.id}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Label htmlFor="schedule_start">Schedule Start</Label>
              <Input
                id="schedule_start"
                type="time"
                value={formData.schedule_start}
                onChange={(e) => onChange({ ...formData, schedule_start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule_end">Schedule End</Label>
              <Input
                id="schedule_end"
                type="time"
                value={formData.schedule_end}
                onChange={(e) => onChange({ ...formData, schedule_end: e.target.value })}
              />
            </div>
          </div>
        </TabsContent>

        {/* Voice Tab */}
        <TabsContent value="voice" className="space-y-4 mt-0">
          <div className="space-y-2">
            <Label>Voice</Label>
            <Select
              value={formData.voice_id}
              onValueChange={(value) => onChange({ ...formData, voice_id: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {voiceOptions.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name} ({voice.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Voice Model</Label>
            <Select
              value={formData.voice_model}
              onValueChange={(value) => onChange({ ...formData, voice_model: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {voiceModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Voice Temperature</Label>
              <span className="text-sm text-muted-foreground">{formData.voice_temperature?.toFixed(1)}</span>
            </div>
            <Slider
              value={[formData.voice_temperature || 1]}
              onValueChange={([value]) => onChange({ ...formData, voice_temperature: value })}
              min={0}
              max={2}
              step={0.1}
            />
            <p className="text-xs text-muted-foreground">Higher = more expressive, lower = more consistent</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Voice Speed</Label>
              <span className="text-sm text-muted-foreground">{formData.voice_speed?.toFixed(1)}x</span>
            </div>
            <Slider
              value={[formData.voice_speed || 1]}
              onValueChange={([value]) => onChange({ ...formData, voice_speed: value })}
              min={0.5}
              max={2}
              step={0.1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Volume</Label>
              <span className="text-sm text-muted-foreground">{((formData.volume || 1) * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[formData.volume || 1]}
              onValueChange={([value]) => onChange({ ...formData, volume: value })}
              min={0}
              max={2}
              step={0.1}
            />
          </div>

          <div className="space-y-2">
            <Label>Ambient Sound</Label>
            <Select
              value={formData.ambient_sound || "none"}
              onValueChange={(value) => onChange({ ...formData, ambient_sound: value === "none" ? undefined : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                {ambientSounds.map((sound) => (
                  <SelectItem key={sound.id} value={sound.id}>
                    {sound.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.ambient_sound && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Ambient Sound Volume</Label>
                <span className="text-sm text-muted-foreground">{((formData.ambient_sound_volume || 1) * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[formData.ambient_sound_volume || 1]}
                onValueChange={([value]) => onChange({ ...formData, ambient_sound_volume: value })}
                min={0}
                max={2}
                step={0.1}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label>Normalize for Speech</Label>
              <p className="text-xs text-muted-foreground">Optimize text for natural speech</p>
            </div>
            <Switch
              checked={formData.normalize_for_speech}
              onCheckedChange={(checked) => onChange({ ...formData, normalize_for_speech: checked })}
            />
          </div>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-4 mt-0">
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Responsiveness</Label>
              <span className="text-sm text-muted-foreground">{((formData.responsiveness || 1) * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[formData.responsiveness || 1]}
              onValueChange={([value]) => onChange({ ...formData, responsiveness: value })}
              min={0}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">How quickly the agent responds</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Interruption Sensitivity</Label>
              <span className="text-sm text-muted-foreground">{((formData.interruption_sensitivity || 1) * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[formData.interruption_sensitivity || 1]}
              onValueChange={([value]) => onChange({ ...formData, interruption_sensitivity: value })}
              min={0}
              max={1}
              step={0.05}
            />
            <p className="text-xs text-muted-foreground">How sensitive to user interruptions</p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Backchannel</Label>
              <p className="text-xs text-muted-foreground">Agent says "uh-huh", "yeah" while listening</p>
            </div>
            <Switch
              checked={formData.enable_backchannel}
              onCheckedChange={(checked) => onChange({ ...formData, enable_backchannel: checked })}
            />
          </div>

          {formData.enable_backchannel && (
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Backchannel Frequency</Label>
                <span className="text-sm text-muted-foreground">{((formData.backchannel_frequency || 0.9) * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[formData.backchannel_frequency || 0.9]}
                onValueChange={([value]) => onChange({ ...formData, backchannel_frequency: value })}
                min={0}
                max={1}
                step={0.1}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Boosted Keywords</Label>
            <Input
              value={keywordsInput}
              onChange={(e) => onKeywordsChange(e.target.value)}
              placeholder="Enter keywords separated by commas"
            />
            <p className="text-xs text-muted-foreground">Words the agent should recognize better (e.g., brand names, technical terms)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reminder Trigger (seconds)</Label>
              <Input
                type="number"
                value={msToSeconds(formData.reminder_trigger_ms)}
                onChange={(e) => onChange({ ...formData, reminder_trigger_ms: secondsToMs(parseInt(e.target.value) || 10) })}
                min={5}
                max={60}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Reminders</Label>
              <Input
                type="number"
                value={formData.reminder_max_count || 2}
                onChange={(e) => onChange({ ...formData, reminder_max_count: parseInt(e.target.value) || 2 })}
                min={0}
                max={10}
              />
            </div>
          </div>
        </TabsContent>

        {/* Timing Tab */}
        <TabsContent value="timing" className="space-y-4 mt-0">
          <div className="space-y-2">
            <Label>Begin Message Delay (ms)</Label>
            <Input
              type="number"
              value={formData.begin_message_delay_ms || 1000}
              onChange={(e) => onChange({ ...formData, begin_message_delay_ms: parseInt(e.target.value) || 1000 })}
              min={0}
              max={5000}
              step={100}
            />
            <p className="text-xs text-muted-foreground">Delay before agent speaks after call connects</p>
          </div>

          <div className="space-y-2">
            <Label>End Call After Silence (minutes)</Label>
            <Input
              type="number"
              value={msToMinutes(formData.end_call_after_silence_ms)}
              onChange={(e) => onChange({ ...formData, end_call_after_silence_ms: minutesToMs(parseInt(e.target.value) || 10) })}
              min={1}
              max={60}
            />
            <p className="text-xs text-muted-foreground">End call after this duration of silence</p>
          </div>

          <div className="space-y-2">
            <Label>Max Call Duration (minutes)</Label>
            <Input
              type="number"
              value={msToMinutes(formData.max_call_duration_ms)}
              onChange={(e) => onChange({ ...formData, max_call_duration_ms: minutesToMs(parseInt(e.target.value) || 60) })}
              min={1}
              max={180}
            />
            <p className="text-xs text-muted-foreground">Maximum duration for any call</p>
          </div>
        </TabsContent>

        {/* Call Tab */}
        <TabsContent value="call" className="space-y-4 mt-0">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Voicemail Detection</Label>
              <p className="text-xs text-muted-foreground">Detect when call goes to voicemail</p>
            </div>
            <Switch
              checked={formData.enable_voicemail_detection}
              onCheckedChange={(checked) => onChange({ ...formData, enable_voicemail_detection: checked })}
            />
          </div>

          {formData.enable_voicemail_detection && (
            <>
              <div className="space-y-2">
                <Label>Voicemail Message</Label>
                <Textarea
                  value={formData.voicemail_message || ""}
                  onChange={(e) => onChange({ ...formData, voicemail_message: e.target.value })}
                  placeholder="Hi, please give us a callback."
                  className="min-h-[60px]"
                />
                <p className="text-xs text-muted-foreground">Message to leave on voicemail</p>
              </div>

              <div className="space-y-2">
                <Label>Voicemail Detection Timeout (seconds)</Label>
                <Input
                  type="number"
                  value={msToSeconds(formData.voicemail_detection_timeout_ms)}
                  onChange={(e) => onChange({ ...formData, voicemail_detection_timeout_ms: secondsToMs(parseInt(e.target.value) || 30) })}
                  min={10}
                  max={60}
                />
                <p className="text-xs text-muted-foreground">Time to wait before determining voicemail</p>
              </div>
            </>
          )}
        </TabsContent>
      </ScrollArea>
    </Tabs>
  );
};
