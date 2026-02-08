import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Loader2, Volume2, Mic, Clock, Settings2, Phone, Trash2, RefreshCw, Wand2 } from "lucide-react";
import { useAgents, Agent } from "@/hooks/useAgents";
import { useBusinessProfile } from "@/hooks/useBusinessProfile";
import { generateAgentPrompt } from "@/lib/generateAgentPrompt";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  { id: "eleven_turbo_v2", name: "ElevenLabs Turbo v2" },
  { id: "eleven_flash_v2", name: "ElevenLabs Flash v2" },
  { id: "eleven_turbo_v2_5", name: "ElevenLabs Turbo v2.5" },
  { id: "eleven_flash_v2_5", name: "ElevenLabs Flash v2.5" },
  { id: "eleven_multilingual_v2", name: "ElevenLabs Multilingual v2" },
  { id: "sonic-2", name: "Cartesia Sonic 2" },
  { id: "sonic-3", name: "Cartesia Sonic 3" },
  { id: "sonic-3-latest", name: "Cartesia Sonic 3 (Latest)" },
  { id: "sonic-turbo", name: "Cartesia Sonic Turbo" },
  { id: "tts-1", name: "OpenAI TTS-1" },
  { id: "gpt-4o-mini-tts", name: "OpenAI GPT-4o Mini TTS" },
  { id: "speech-02-turbo", name: "Deepgram Speech 02 Turbo" },
  { id: "speech-2.8-turbo", name: "Deepgram Speech 2.8 Turbo" },
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

const AgentEdit = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { agents, loading, updateAgent, deleteAgent, refetch } = useAgents();
  const { profile: businessProfile } = useBusinessProfile();
  
  const [formData, setFormData] = useState<Partial<Agent>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [keywordsInput, setKeywordsInput] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  const agent = agents.find(a => a.id === agentId);
  
  // Determine agent type - Chat agents map to Retell Chat Agent settings
  const isChatAgent = agent?.voice_type === "Chat Agent" || agent?.voice_model === "chat" || agent?.voice_id === "chat-agent";
  const isSpeedToLead = agent?.voice_type === "Speed to Lead" || agent?.voice_id === "sms-agent" || agent?.voice_model === "sms";
  const isVoiceAgent = !isChatAgent && !isSpeedToLead;

  useEffect(() => {
    if (agent) {
      setFormData(agent);
      setKeywordsInput(agent.boosted_keywords?.join(", ") || "");
    }
  }, [agent]);

  const handleChange = (updates: Partial<Agent>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleImportFromBusinessProfile = () => {
    if (!businessProfile) {
      toast.error("No business profile found. Please configure your Business Profile first.");
      return;
    }
    
    const agentType = isVoiceAgent ? 'voice' : 'sms';
    const generatedPrompt = generateAgentPrompt({
      agentType,
      profile: businessProfile,
      includeCalendar: true,
      includeTransfer: true,
    });
    
    handleChange({ prompt: generatedPrompt });
    toast.success(`${isVoiceAgent ? 'Voice' : 'SMS'} prompt imported from Business Profile`);
  };

  const toggleDay = (day: string) => {
    const currentDays = formData.schedule_days || [];
    if (currentDays.includes(day)) {
      handleChange({ schedule_days: currentDays.filter((d) => d !== day) });
    } else {
      handleChange({ schedule_days: [...currentDays, day] });
    }
  };

  const handleSave = async () => {
    if (!agentId) return;
    
    setSaving(true);
    
    // Parse keywords from input
    const keywords = keywordsInput.split(",").map(k => k.trim()).filter(Boolean);
    const dataToSubmit = { 
      ...formData, 
      boosted_keywords: keywords.length > 0 ? keywords : null 
    };
    
    const result = await updateAgent(agentId, dataToSubmit);
    
    setSaving(false);
    
    if (result) {
      setHasChanges(false);
      toast.success("Agent settings saved and synced to Retell");
    }
  };

  const handleDelete = async () => {
    if (!agentId) return;
    
    setDeleting(true);
    const success = await deleteAgent(agentId);
    setDeleting(false);
    
    if (success) {
      navigate("/dashboard/agents");
    }
  };

  const msToMinutes = (ms: number | null | undefined) => Math.round((ms || 0) / 60000);
  const minutesToMs = (min: number) => min * 60000;
  const msToSeconds = (ms: number | null | undefined) => Math.round((ms || 0) / 1000);
  const secondsToMs = (sec: number) => sec * 1000;

  if (loading) {
    return (
      <AgentLayout title="Edit Agent" description="Loading...">
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AgentLayout>
    );
  }

  if (!agent) {
    return (
      <AgentLayout title="Agent Not Found" description="The requested agent could not be found">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground mb-4">This agent doesn't exist or you don't have access to it.</p>
            <Button onClick={() => navigate("/dashboard/agents")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Agents
            </Button>
          </CardContent>
        </Card>
      </AgentLayout>
    );
  }

  // Determine the appropriate description based on agent type
  const getAgentDescription = () => {
    if (isChatAgent) return "Configure Retell AI Chat Agent settings";
    if (isSpeedToLead) return "Configure Speed to Lead settings (mirrors Retell Chat Agent)";
    return "Configure all Retell AI settings for this agent";
  };

  return (
    <AgentLayout
      title={`Edit: ${agent.name}`}
      description={getAgentDescription()}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/dashboard/agents")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Agents
          </Button>
          <div className="flex items-center gap-2">
            {(isChatAgent || isSpeedToLead) && (
              <Badge variant="secondary" className="gap-1">
                {isChatAgent ? "Chat Agent" : "Speed to Lead"}
              </Badge>
            )}
            {agent.retell_agent_id && (
              <Badge variant="outline" className="gap-1">
                <RefreshCw className="w-3 h-3" />
                Synced to Retell
              </Badge>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Agent?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{agent.name}" and remove it from Retell. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Settings Tabs - Different for Voice vs Chat/Speed-to-Lead agents */}
        {isVoiceAgent ? (
          // Voice Agent Tabs (Full Retell Voice AI settings)
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="gap-1">
                <Settings2 className="w-4 h-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="voice" className="gap-1">
                <Volume2 className="w-4 h-4" />
                Voice
              </TabsTrigger>
              <TabsTrigger value="behavior" className="gap-1">
                <Mic className="w-4 h-4" />
                Behavior
              </TabsTrigger>
              <TabsTrigger value="timing" className="gap-1">
                <Clock className="w-4 h-4" />
                Timing
              </TabsTrigger>
              <TabsTrigger value="call" className="gap-1">
                <Phone className="w-4 h-4" />
                Call
              </TabsTrigger>
            </TabsList>

          {/* Basic Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Settings</CardTitle>
                <CardDescription>Core agent configuration and scheduling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Agent Name</Label>
                    <Input
                      id="name"
                      value={formData.name || ""}
                      onChange={(e) => handleChange({ name: e.target.value })}
                      placeholder="After Hours Support"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={formData.language || "en-US"}
                      onValueChange={(value) => handleChange({ language: value })}
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="personality">Personality</Label>
                  <Input
                    id="personality"
                    value={formData.personality || ""}
                    onChange={(e) => handleChange({ personality: e.target.value })}
                    placeholder="friendly and professional"
                  />
                  <p className="text-sm text-muted-foreground">
                    Describe how the agent should behave (e.g., "friendly and professional", "calm and reassuring")
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="greeting">Greeting Message</Label>
                  <Textarea
                    id="greeting"
                    value={formData.greeting_message || ""}
                    onChange={(e) => handleChange({ greeting_message: e.target.value })}
                    placeholder="Hello! How can I help you today?"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt">System Prompt</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleImportFromBusinessProfile}
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      Import from Business Profile
                    </Button>
                  </div>
                  <Textarea
                    id="prompt"
                    value={formData.prompt || ""}
                    onChange={(e) => handleChange({ prompt: e.target.value })}
                    placeholder="You are a helpful customer service agent for [Business Name]. Your goal is to..."
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <p className="text-sm text-muted-foreground">
                    The complete system prompt that governs how the AI agent behaves. This defines the agent's instructions, personality, and capabilities.
                  </p>
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

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="schedule_start">Schedule Start</Label>
                    <Input
                      id="schedule_start"
                      type="time"
                      value={formData.schedule_start || "18:00"}
                      onChange={(e) => handleChange({ schedule_start: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule_end">Schedule End</Label>
                    <Input
                      id="schedule_end"
                      type="time"
                      value={formData.schedule_end || "08:00"}
                      onChange={(e) => handleChange({ schedule_end: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Agent Active</Label>
                    <p className="text-sm text-muted-foreground">Enable or disable this agent</p>
                  </div>
                  <Switch
                    checked={formData.is_active || false}
                    onCheckedChange={(checked) => handleChange({ is_active: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voice Tab */}
          <TabsContent value="voice">
            <Card>
              <CardHeader>
                <CardTitle>Voice Settings</CardTitle>
                <CardDescription>Configure the agent's voice and audio output</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Voice</Label>
                    <Select
                      value={formData.voice_id || "11labs-Adrian"}
                      onValueChange={(value) => handleChange({ voice_id: value })}
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
                      value={formData.voice_model || "eleven_turbo_v2"}
                      onValueChange={(value) => handleChange({ voice_model: value })}
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
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Voice Temperature</Label>
                    <span className="text-sm text-muted-foreground">{Number(formData.voice_temperature ?? 1).toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[Number(formData.voice_temperature ?? 1)]}
                    onValueChange={([value]) => handleChange({ voice_temperature: value })}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">Higher = more expressive and varied, lower = more consistent</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Voice Speed</Label>
                    <span className="text-sm text-muted-foreground">{Number(formData.voice_speed ?? 1).toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[Number(formData.voice_speed ?? 1)]}
                    onValueChange={([value]) => handleChange({ voice_speed: value })}
                    min={0.5}
                    max={2}
                    step={0.1}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Volume</Label>
                    <span className="text-sm text-muted-foreground">{(Number(formData.volume ?? 1) * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[Number(formData.volume ?? 1)]}
                    onValueChange={([value]) => handleChange({ volume: value })}
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Ambient Sound</Label>
                    <Select
                      value={formData.ambient_sound || "none"}
                      onValueChange={(value) => handleChange({ ambient_sound: value === "none" ? null : value })}
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

                  {formData.ambient_sound && formData.ambient_sound !== "none" && (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label>Ambient Volume</Label>
                        <span className="text-sm text-muted-foreground">{(Number(formData.ambient_sound_volume ?? 1) * 100).toFixed(0)}%</span>
                      </div>
                      <Slider
                        value={[Number(formData.ambient_sound_volume ?? 1)]}
                        onValueChange={([value]) => handleChange({ ambient_sound_volume: value })}
                        min={0}
                        max={2}
                        step={0.1}
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Normalize for Speech</Label>
                    <p className="text-sm text-muted-foreground">Optimize text for natural speech (numbers, dates, etc.)</p>
                  </div>
                  <Switch
                    checked={formData.normalize_for_speech ?? true}
                    onCheckedChange={(checked) => handleChange({ normalize_for_speech: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Behavior Tab */}
          <TabsContent value="behavior">
            <Card>
              <CardHeader>
                <CardTitle>Behavior Settings</CardTitle>
                <CardDescription>Control how the agent responds and interacts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Responsiveness</Label>
                    <span className="text-sm text-muted-foreground">{Number(formData.responsiveness ?? 1).toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[Number(formData.responsiveness ?? 1)]}
                    onValueChange={([value]) => handleChange({ responsiveness: value })}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">Higher = quicker responses, lower = more deliberate pauses</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Interruption Sensitivity</Label>
                    <span className="text-sm text-muted-foreground">{Number(formData.interruption_sensitivity ?? 1).toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[Number(formData.interruption_sensitivity ?? 1)]}
                    onValueChange={([value]) => handleChange({ interruption_sensitivity: value })}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                  <p className="text-xs text-muted-foreground">Higher = easier to interrupt, lower = harder to interrupt</p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Enable Backchannel</Label>
                    <p className="text-sm text-muted-foreground">Agent says "uh-huh", "I see", etc. while listening</p>
                  </div>
                  <Switch
                    checked={formData.enable_backchannel ?? true}
                    onCheckedChange={(checked) => handleChange({ enable_backchannel: checked })}
                  />
                </div>

                {formData.enable_backchannel && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Backchannel Frequency</Label>
                      <span className="text-sm text-muted-foreground">{Number(formData.backchannel_frequency ?? 0.9).toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[Number(formData.backchannel_frequency ?? 0.9)]}
                      onValueChange={([value]) => handleChange({ backchannel_frequency: value })}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">How often the agent provides verbal acknowledgments</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Boosted Keywords</Label>
                  <Input
                    value={keywordsInput}
                    onChange={(e) => {
                      setKeywordsInput(e.target.value);
                      setHasChanges(true);
                    }}
                    placeholder="e.g., HVAC, plumbing, emergency, appointment"
                  />
                  <p className="text-sm text-muted-foreground">
                    Comma-separated keywords to boost recognition accuracy
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Reminder Trigger (seconds)</Label>
                      <span className="text-sm text-muted-foreground">{msToSeconds(formData.reminder_trigger_ms)}s</span>
                    </div>
                    <Slider
                      value={[msToSeconds(formData.reminder_trigger_ms)]}
                      onValueChange={([value]) => handleChange({ reminder_trigger_ms: secondsToMs(value) })}
                      min={5}
                      max={30}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">Time before agent prompts for response</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Max Reminder Count</Label>
                      <span className="text-sm text-muted-foreground">{formData.reminder_max_count ?? 2}</span>
                    </div>
                    <Slider
                      value={[formData.reminder_max_count ?? 2]}
                      onValueChange={([value]) => handleChange({ reminder_max_count: value })}
                      min={0}
                      max={5}
                      step={1}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timing Tab */}
          <TabsContent value="timing">
            <Card>
              <CardHeader>
                <CardTitle>Timing Settings</CardTitle>
                <CardDescription>Configure delays and timeout values</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Begin Message Delay (seconds)</Label>
                    <span className="text-sm text-muted-foreground">{msToSeconds(formData.begin_message_delay_ms)}s</span>
                  </div>
                  <Slider
                    value={[msToSeconds(formData.begin_message_delay_ms)]}
                    onValueChange={([value]) => handleChange({ begin_message_delay_ms: secondsToMs(value) })}
                    min={0}
                    max={5}
                    step={0.5}
                  />
                  <p className="text-xs text-muted-foreground">Delay before agent speaks the greeting</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>End Call After Silence (minutes)</Label>
                    <span className="text-sm text-muted-foreground">{msToMinutes(formData.end_call_after_silence_ms)} min</span>
                  </div>
                  <Slider
                    value={[msToMinutes(formData.end_call_after_silence_ms)]}
                    onValueChange={([value]) => handleChange({ end_call_after_silence_ms: minutesToMs(value) })}
                    min={1}
                    max={30}
                    step={1}
                  />
                  <p className="text-xs text-muted-foreground">Hang up after this much silence</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Max Call Duration (minutes)</Label>
                    <span className="text-sm text-muted-foreground">{msToMinutes(formData.max_call_duration_ms)} min</span>
                  </div>
                  <Slider
                    value={[msToMinutes(formData.max_call_duration_ms)]}
                    onValueChange={([value]) => handleChange({ max_call_duration_ms: minutesToMs(value) })}
                    min={5}
                    max={120}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">Maximum time for a single call</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Call Tab */}
          <TabsContent value="call">
            <Card>
              <CardHeader>
                <CardTitle>Call Settings</CardTitle>
                <CardDescription>Voicemail detection and call handling options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label>Enable Voicemail Detection</Label>
                    <p className="text-sm text-muted-foreground">Detect voicemails and leave a message</p>
                  </div>
                  <Switch
                    checked={formData.enable_voicemail_detection ?? true}
                    onCheckedChange={(checked) => handleChange({ enable_voicemail_detection: checked })}
                  />
                </div>

                {formData.enable_voicemail_detection && (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label>Voicemail Detection Timeout (seconds)</Label>
                        <span className="text-sm text-muted-foreground">{msToSeconds(formData.voicemail_detection_timeout_ms)}s</span>
                      </div>
                      <Slider
                        value={[msToSeconds(formData.voicemail_detection_timeout_ms)]}
                        onValueChange={([value]) => handleChange({ voicemail_detection_timeout_ms: secondsToMs(value) })}
                        min={10}
                        max={60}
                        step={5}
                      />
                      <p className="text-xs text-muted-foreground">Time to wait before determining it's a voicemail</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="voicemail_message">Voicemail Message</Label>
                      <Textarea
                        id="voicemail_message"
                        value={formData.voicemail_message || ""}
                        onChange={(e) => handleChange({ voicemail_message: e.target.value })}
                        placeholder="Hi, please give us a callback."
                        className="min-h-[100px]"
                      />
                      <p className="text-sm text-muted-foreground">Message to leave when voicemail is detected</p>
                    </div>
                  </>
                )}

                {/* Agent Stats */}
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Agent Statistics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{agent.total_calls}</p>
                      <p className="text-sm text-muted-foreground">Total Calls</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{Math.floor((agent.avg_duration_seconds || 0) / 60)}:{String((agent.avg_duration_seconds || 0) % 60).padStart(2, '0')}</p>
                      <p className="text-sm text-muted-foreground">Avg Duration</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-bold">{agent.satisfaction_score}%</p>
                      <p className="text-sm text-muted-foreground">Satisfaction</p>
                    </div>
                  </div>
                </div>

                {agent.retell_agent_id && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <Label className="text-muted-foreground">Retell Agent ID</Label>
                    <p className="font-mono text-sm mt-1">{agent.retell_agent_id}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        ) : (
          // Chat Agent / Speed to Lead Tabs (mirrors Retell Chat Agent settings)
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic" className="gap-1">
                <Settings2 className="w-4 h-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="behavior" className="gap-1">
                <Mic className="w-4 h-4" />
                Behavior
              </TabsTrigger>
              <TabsTrigger value="advanced" className="gap-1">
                <Phone className="w-4 h-4" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* Basic Tab - Chat Agent */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Settings</CardTitle>
                  <CardDescription>
                    Core {isChatAgent ? "Chat Agent" : "Speed to Lead"} configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Agent Name</Label>
                      <Input
                        id="name"
                        value={formData.name || ""}
                        onChange={(e) => handleChange({ name: e.target.value })}
                        placeholder="Lead Qualifier Bot"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Language</Label>
                      <Select
                        value={formData.language || "en-US"}
                        onValueChange={(value) => handleChange({ language: value })}
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
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="personality">Agent Personality</Label>
                    <Input
                      id="personality"
                      value={formData.personality || ""}
                      onChange={(e) => handleChange({ personality: e.target.value })}
                      placeholder="friendly and professional"
                    />
                    <p className="text-sm text-muted-foreground">
                      Describe how the agent should behave in conversations
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="greeting">Greeting Message</Label>
                    <Textarea
                      id="greeting"
                      value={formData.greeting_message || ""}
                      onChange={(e) => handleChange({ greeting_message: e.target.value })}
                      placeholder="Hi! Thanks for reaching out. How can I help you today?"
                      className="min-h-[100px]"
                    />
                    <p className="text-sm text-muted-foreground">
                      The first message sent when a conversation starts
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="prompt-chat">System Prompt</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleImportFromBusinessProfile}
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        Import from Business Profile
                      </Button>
                    </div>
                    <Textarea
                      id="prompt-chat"
                      value={formData.prompt || ""}
                      onChange={(e) => handleChange({ prompt: e.target.value })}
                      placeholder="You are a customer service representative for [Business Name]. Your goal is to quickly and accurately gather information from potential customers..."
                      className="min-h-[200px] font-mono text-sm"
                    />
                    <p className="text-sm text-muted-foreground">
                      The complete system prompt that governs how the AI agent behaves. This defines the agent's instructions, personality, and capabilities.
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <Label>Agent Active</Label>
                      <p className="text-sm text-muted-foreground">Enable or disable this agent</p>
                    </div>
                    <Switch
                      checked={formData.is_active || false}
                      onCheckedChange={(checked) => handleChange({ is_active: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Behavior Tab - Chat Agent */}
            <TabsContent value="behavior">
              <Card>
                <CardHeader>
                  <CardTitle>Behavior Settings</CardTitle>
                  <CardDescription>Control how the agent responds and interacts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Responsiveness</Label>
                      <span className="text-sm text-muted-foreground">{Number(formData.responsiveness ?? 1).toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[Number(formData.responsiveness ?? 1)]}
                      onValueChange={([value]) => handleChange({ responsiveness: value })}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">Higher = quicker responses, lower = more deliberate pauses</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Response Temperature</Label>
                      <span className="text-sm text-muted-foreground">{Number(formData.voice_temperature ?? 1).toFixed(1)}</span>
                    </div>
                    <Slider
                      value={[Number(formData.voice_temperature ?? 1)]}
                      onValueChange={([value]) => handleChange({ voice_temperature: value })}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                    <p className="text-xs text-muted-foreground">Higher = more creative and varied, lower = more consistent</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Boosted Keywords</Label>
                    <Input
                      value={keywordsInput}
                      onChange={(e) => {
                        setKeywordsInput(e.target.value);
                        setHasChanges(true);
                      }}
                      placeholder="e.g., HVAC, plumbing, emergency, appointment"
                    />
                    <p className="text-sm text-muted-foreground">
                      Comma-separated keywords to boost recognition accuracy
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label>Reminder Trigger (seconds)</Label>
                        <span className="text-sm text-muted-foreground">{msToSeconds(formData.reminder_trigger_ms)}s</span>
                      </div>
                      <Slider
                        value={[msToSeconds(formData.reminder_trigger_ms)]}
                        onValueChange={([value]) => handleChange({ reminder_trigger_ms: secondsToMs(value) })}
                        min={5}
                        max={30}
                        step={1}
                      />
                      <p className="text-xs text-muted-foreground">Time before agent prompts for response</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label>Max Reminder Count</Label>
                        <span className="text-sm text-muted-foreground">{formData.reminder_max_count ?? 2}</span>
                      </div>
                      <Slider
                        value={[formData.reminder_max_count ?? 2]}
                        onValueChange={([value]) => handleChange({ reminder_max_count: value })}
                        min={0}
                        max={5}
                        step={1}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Tab - Chat Agent */}
            <TabsContent value="advanced">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>Session timing and agent metadata</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Begin Message Delay (seconds)</Label>
                      <span className="text-sm text-muted-foreground">{msToSeconds(formData.begin_message_delay_ms)}s</span>
                    </div>
                    <Slider
                      value={[msToSeconds(formData.begin_message_delay_ms)]}
                      onValueChange={([value]) => handleChange({ begin_message_delay_ms: secondsToMs(value) })}
                      min={0}
                      max={5}
                      step={0.5}
                    />
                    <p className="text-xs text-muted-foreground">Delay before agent sends the greeting</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>End Session After Silence (minutes)</Label>
                      <span className="text-sm text-muted-foreground">{msToMinutes(formData.end_call_after_silence_ms)} min</span>
                    </div>
                    <Slider
                      value={[msToMinutes(formData.end_call_after_silence_ms)]}
                      onValueChange={([value]) => handleChange({ end_call_after_silence_ms: minutesToMs(value) })}
                      min={1}
                      max={30}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">End conversation after this much inactivity</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Max Session Duration (minutes)</Label>
                      <span className="text-sm text-muted-foreground">{msToMinutes(formData.max_call_duration_ms)} min</span>
                    </div>
                    <Slider
                      value={[msToMinutes(formData.max_call_duration_ms)]}
                      onValueChange={([value]) => handleChange({ max_call_duration_ms: minutesToMs(value) })}
                      min={5}
                      max={120}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">Maximum time for a single conversation</p>
                  </div>

                  {/* Agent Stats */}
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="text-lg font-semibold mb-4">Agent Statistics</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <p className="text-2xl font-bold">{agent.total_calls}</p>
                        <p className="text-sm text-muted-foreground">Total Sessions</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <p className="text-2xl font-bold">{Math.floor((agent.avg_duration_seconds || 0) / 60)}:{String((agent.avg_duration_seconds || 0) % 60).padStart(2, '0')}</p>
                        <p className="text-sm text-muted-foreground">Avg Duration</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <p className="text-2xl font-bold">{agent.satisfaction_score}%</p>
                        <p className="text-sm text-muted-foreground">Satisfaction</p>
                      </div>
                    </div>
                  </div>

                  {agent.retell_agent_id && (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <Label className="text-muted-foreground">Retell Agent ID</Label>
                      <p className="font-mono text-sm mt-1">{agent.retell_agent_id}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AgentLayout>
  );
};

export default AgentEdit;
