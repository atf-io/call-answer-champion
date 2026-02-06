import { useState, useEffect, useCallback, useRef } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  Settings2, 
  MessageSquare,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Trash2,
  Download
} from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { RetellWebClient } from "retell-client-js-sdk";
import { formatDistanceToNow } from "date-fns";
import { api } from "@/lib/api";

// Voice options from AgentEdit
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

const languages = [
  { id: "en-US", name: "English (US)" },
  { id: "en-GB", name: "English (UK)" },
  { id: "es-ES", name: "Spanish (Spain)" },
  { id: "fr-FR", name: "French" },
  { id: "de-DE", name: "German" },
];

interface TranscriptEntry {
  role: "agent" | "user";
  content: string;
  timestamp: Date;
}

interface CallRecording {
  id: string;
  callId: string;
  agentName: string;
  voiceId: string;
  duration: number;
  recordingUrl: string | null;
  transcript: TranscriptEntry[];
  createdAt: Date;
  status: "completed" | "failed" | "pending";
}

const RECORDINGS_STORAGE_KEY = "playground_recordings";

const Playground = () => {
  const { agents, loading: agentsLoading } = useAgents();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Configuration state
  const [selectedAgentId, setSelectedAgentId] = useState<string>("custom");
  const [customPrompt, setCustomPrompt] = useState("");
  const [greetingMessage, setGreetingMessage] = useState("Hello! How can I help you today?");
  const [selectedVoice, setSelectedVoice] = useState("11labs-Adrian");
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");
  const [voiceTemperature, setVoiceTemperature] = useState(1);
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  
  // Call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [retellClient, setRetellClient] = useState<RetellWebClient | null>(null);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  
  // Recording state
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [playingRecordingId, setPlayingRecordingId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [loadingRecording, setLoadingRecording] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Load recordings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECORDINGS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecordings(parsed.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          transcript: r.transcript || [],
        })));
      } catch (e) {
        console.error("Failed to parse recordings:", e);
      }
    }
  }, []);
  
  // Save recordings to localStorage
  const saveRecordings = useCallback((newRecordings: CallRecording[]) => {
    setRecordings(newRecordings);
    localStorage.setItem(RECORDINGS_STORAGE_KEY, JSON.stringify(newRecordings));
  }, []);
  
  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  // Load agent config when selected
  useEffect(() => {
    if (selectedAgentId && selectedAgentId !== "custom") {
      const agent = agents.find(a => a.id === selectedAgentId);
      if (agent) {
        setCustomPrompt(agent.personality || "");
        setGreetingMessage(agent.greetingMessage || "Hello! How can I help you today?");
        setSelectedVoice(agent.voiceId || "11labs-Adrian");
        setSelectedLanguage(agent.language || "en-US");
        setVoiceTemperature(Number(agent.voiceTemperature) || 1);
        setVoiceSpeed(Number(agent.voiceSpeed) || 1);
      }
    }
  }, [selectedAgentId, agents]);
  
  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleTimeUpdate = () => {
      setAudioProgress(audio.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };
    
    const handleEnded = () => {
      setPlayingRecordingId(null);
      setAudioProgress(0);
    };
    
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
  const getAgentName = () => {
    if (selectedAgentId && selectedAgentId !== "custom") {
      const agent = agents.find(a => a.id === selectedAgentId);
      return agent?.name || "Unknown Agent";
    }
    return "Custom Test";
  };

  const fetchRecordingUrl = useCallback(async (callId: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const callData = await api.post<any>("/api/retell-sync", {
        action: "get-call",
        agentId: callId,
      });
      return callData.recording_url || null;
    } catch (error) {
      console.error("Failed to fetch recording:", error);
      return null;
    }
  }, [user]);

  const startCall = useCallback(async () => {
    if (!user) {
      toast({ title: "Please sign in to test agents", variant: "destructive" });
      return;
    }

    setIsConnecting(true);
    setTranscript([]);
    setCallDuration(0);

    try {
      const callResponse = await api.post<{ access_token: string; call_id: string }>("/api/retell-sync", {
        action: "create-web-call",
        agentId: selectedAgentId !== "custom" ? selectedAgentId : undefined,
        testConfig: selectedAgentId === "custom" ? {
          voice_id: selectedVoice,
          language: selectedLanguage,
          prompt: customPrompt,
          greeting_message: greetingMessage,
          voice_temperature: voiceTemperature,
          voice_speed: voiceSpeed,
        } : undefined,
      });

      const { access_token, call_id } = callResponse;
      setCurrentCallId(call_id);

      // Initialize Retell client
      const client = new RetellWebClient();
      setRetellClient(client);

      // Set up event listeners
      client.on("call_started", () => {
        console.log("Call started");
        setIsCallActive(true);
        setIsConnecting(false);
        toast({ title: "Call connected!" });
      });

      client.on("call_ended", async () => {
        console.log("Call ended");
        setIsCallActive(false);
        setIsConnecting(false);
        setAgentSpeaking(false);
        toast({ title: "Call ended" });
        
        // Save recording with pending status
        if (call_id) {
          const newRecording: CallRecording = {
            id: crypto.randomUUID(),
            callId: call_id,
            agentName: getAgentName(),
            voiceId: selectedVoice,
            duration: callDuration,
            recordingUrl: null,
            transcript: [...transcript],
            createdAt: new Date(),
            status: "pending",
          };
          
          const updated = [newRecording, ...recordings];
          saveRecordings(updated);
          
          // Try to fetch recording URL (may not be ready immediately)
          setTimeout(async () => {
            const recordingUrl = await fetchRecordingUrl(call_id);
            if (recordingUrl) {
              const updatedRecordings = recordings.map(r => 
                r.callId === call_id 
                  ? { ...r, recordingUrl, status: "completed" as const }
                  : r
              );
              saveRecordings([{ ...newRecording, recordingUrl, status: "completed" }, ...recordings]);
            }
          }, 3000);
        }
      });

      client.on("agent_start_talking", () => {
        setAgentSpeaking(true);
      });

      client.on("agent_stop_talking", () => {
        setAgentSpeaking(false);
      });

      client.on("update", (update) => {
        if (update.transcript) {
          const entries: TranscriptEntry[] = update.transcript.map((t: any) => ({
            role: t.role,
            content: t.content,
            timestamp: new Date(),
          }));
          setTranscript(entries);
        }
      });

      client.on("error", (error) => {
        console.error("Retell error:", error);
        toast({ title: "Call error occurred", variant: "destructive" });
        setIsCallActive(false);
        setIsConnecting(false);
      });

      await client.startCall({
        accessToken: access_token,
        sampleRate: 24000,
        captureDeviceId: "default",
      });

    } catch (error) {
      console.error("Failed to start call:", error);
      toast({ title: error instanceof Error ? error.message : "Failed to start call", variant: "destructive" });
      setIsConnecting(false);
    }
  }, [user, toast, selectedAgentId, selectedVoice, selectedLanguage, customPrompt, greetingMessage, voiceTemperature, voiceSpeed, recordings, saveRecordings, fetchRecordingUrl, callDuration, transcript]);

  const endCall = useCallback(() => {
    if (retellClient) {
      retellClient.stopCall();
      setRetellClient(null);
    }
    setIsCallActive(false);
    setAgentSpeaking(false);
  }, [retellClient]);

  const toggleMute = useCallback(() => {
    if (retellClient) {
      if (isMuted) {
        retellClient.unmute();
      } else {
        retellClient.mute();
      }
      setIsMuted(!isMuted);
    }
  }, [retellClient, isMuted]);
  
  const playRecording = useCallback(async (recording: CallRecording) => {
    if (!audioRef.current) return;
    
    if (playingRecordingId === recording.id) {
      // Pause
      audioRef.current.pause();
      setPlayingRecordingId(null);
      return;
    }
    
    // If no recording URL, try to fetch it
    if (!recording.recordingUrl) {
      setLoadingRecording(recording.id);
      const url = await fetchRecordingUrl(recording.callId);
      setLoadingRecording(null);
      
      if (url) {
        const updated = recordings.map(r => 
          r.id === recording.id 
            ? { ...r, recordingUrl: url, status: "completed" as const }
            : r
        );
        saveRecordings(updated);
        audioRef.current.src = url;
      } else {
        toast({ title: "Recording not available yet. Please try again later.", variant: "destructive" });
        return;
      }
    } else {
      audioRef.current.src = recording.recordingUrl;
    }
    
    try {
      await audioRef.current.play();
      setPlayingRecordingId(recording.id);
    } catch (error) {
      console.error("Failed to play recording:", error);
      toast({ title: "Failed to play recording", variant: "destructive" });
    }
  }, [playingRecordingId, recordings, saveRecordings, fetchRecordingUrl]);
  
  const seekAudio = useCallback((value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setAudioProgress(value[0]);
    }
  }, []);
  
  const deleteRecording = useCallback((id: string) => {
    const updated = recordings.filter(r => r.id !== id);
    saveRecordings(updated);
    if (playingRecordingId === id) {
      audioRef.current?.pause();
      setPlayingRecordingId(null);
    }
    toast({ title: "Recording deleted" });
  }, [recordings, saveRecordings, playingRecordingId]);
  
  const retryFetchRecording = useCallback(async (recording: CallRecording) => {
    setLoadingRecording(recording.id);
    const url = await fetchRecordingUrl(recording.callId);
    setLoadingRecording(null);
    
    if (url) {
      const updated = recordings.map(r => 
        r.id === recording.id 
          ? { ...r, recordingUrl: url, status: "completed" as const }
          : r
      );
      saveRecordings(updated);
      toast({ title: "Recording loaded" });
    } else {
      toast({ title: "Recording still not available. It may take a few minutes.", variant: "destructive" });
    }
  }, [recordings, saveRecordings, fetchRecordingUrl]);

  return (
    <AgentLayout 
      title="Agent Playground" 
      description="Test and troubleshoot your voice agents in real-time"
    >
      {/* Hidden audio element for playback */}
      <audio ref={audioRef} className="hidden" />
      
      <Tabs defaultValue="test" className="space-y-6">
        <TabsList>
          <TabsTrigger value="test" className="gap-2">
            <Phone className="w-4 h-4" />
            Test Call
          </TabsTrigger>
          <TabsTrigger value="recordings" className="gap-2">
            <Play className="w-4 h-4" />
            Recordings ({recordings.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="test">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Configuration Panel */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5" />
                    Configuration
                  </CardTitle>
                  <CardDescription>
                    Select an existing agent or configure a custom test
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Agent Selection */}
                  <div className="space-y-2">
                    <Label>Select Agent (Optional)</Label>
                    <Select
                      value={selectedAgentId}
                      onValueChange={setSelectedAgentId}
                      disabled={isCallActive}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an agent or configure custom settings" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Custom Configuration</SelectItem>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name} {agent.retellAgentId && "(Synced)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Voice Selection */}
                  <div className="space-y-2">
                    <Label>Voice</Label>
                    <Select
                      value={selectedVoice}
                      onValueChange={setSelectedVoice}
                      disabled={isCallActive}
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

                  {/* Language */}
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={selectedLanguage}
                      onValueChange={setSelectedLanguage}
                      disabled={isCallActive}
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

                  {/* Voice Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Temperature</Label>
                        <span className="text-sm text-muted-foreground">{voiceTemperature.toFixed(1)}</span>
                      </div>
                      <Slider
                        value={[voiceTemperature]}
                        onValueChange={([v]) => setVoiceTemperature(v)}
                        min={0}
                        max={2}
                        step={0.1}
                        disabled={isCallActive}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Speed</Label>
                        <span className="text-sm text-muted-foreground">{voiceSpeed.toFixed(1)}x</span>
                      </div>
                      <Slider
                        value={[voiceSpeed]}
                        onValueChange={([v]) => setVoiceSpeed(v)}
                        min={0.5}
                        max={2}
                        step={0.1}
                        disabled={isCallActive}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Greeting Message */}
                  <div className="space-y-2">
                    <Label>Greeting Message</Label>
                    <Input
                      value={greetingMessage}
                      onChange={(e) => setGreetingMessage(e.target.value)}
                      placeholder="Hello! How can I help you today?"
                      disabled={isCallActive}
                    />
                  </div>

                  {/* Custom Prompt */}
                  <div className="space-y-2">
                    <Label>Agent Prompt / Personality</Label>
                    <Textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="You are a friendly customer service agent for a home services company. Be helpful, professional, and try to schedule appointments when possible."
                      className="min-h-[120px]"
                      disabled={isCallActive}
                    />
                    <p className="text-xs text-muted-foreground">
                      Describe how the agent should behave and what it should do
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Call Panel */}
            <div className="space-y-6">
              {/* Call Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Test Call
                    </div>
                    {isCallActive && (
                      <Badge variant="default" className="gap-1 animate-pulse">
                        <span className="w-2 h-2 bg-green-400 rounded-full" />
                        Live
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Start a test call to hear your agent in action
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Call Status Display */}
                  <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/30">
                    {/* Voice Animation */}
                    <div className={`relative w-24 h-24 mb-4 ${agentSpeaking ? 'animate-pulse' : ''}`}>
                      <div className={`absolute inset-0 rounded-full bg-primary/20 ${agentSpeaking ? 'animate-ping' : ''}`} />
                      <div className="absolute inset-2 rounded-full bg-primary/40" />
                      <div className="absolute inset-4 rounded-full bg-primary/60 flex items-center justify-center">
                        {isCallActive ? (
                          agentSpeaking ? (
                            <Volume2 className="w-8 h-8 text-primary-foreground" />
                          ) : (
                            <Mic className="w-8 h-8 text-primary-foreground" />
                          )
                        ) : (
                          <Phone className="w-8 h-8 text-primary-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Status Text */}
                    <div className="text-center mb-4">
                      {isConnecting ? (
                        <p className="text-muted-foreground">Connecting...</p>
                      ) : isCallActive ? (
                        <>
                          <p className="font-medium">
                            {agentSpeaking ? "Agent is speaking..." : "Listening..."}
                          </p>
                          <p className="text-2xl font-mono mt-2">{formatDuration(callDuration)}</p>
                        </>
                      ) : (
                        <p className="text-muted-foreground">Ready to start test call</p>
                      )}
                    </div>

                    {/* Call Controls */}
                    <div className="flex gap-3">
                      {!isCallActive ? (
                        <Button
                          size="lg"
                          onClick={startCall}
                          disabled={isConnecting}
                          className="gap-2"
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5" />
                              Start Call
                            </>
                          )}
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={toggleMute}
                            className={isMuted ? "bg-destructive/10" : ""}
                          >
                            {isMuted ? (
                              <MicOff className="w-5 h-5" />
                            ) : (
                              <Mic className="w-5 h-5" />
                            )}
                          </Button>
                          <Button
                            variant="destructive"
                            size="lg"
                            onClick={endCall}
                            className="gap-2"
                          >
                            <PhoneOff className="w-5 h-5" />
                            End Call
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Microphone Permission Note */}
                  {!isCallActive && (
                    <p className="text-xs text-muted-foreground text-center">
                      You'll need to allow microphone access when starting the call
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Transcript */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Live Transcript
                  </CardTitle>
                  <CardDescription>
                    Real-time conversation transcript
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    {transcript.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <p>Transcript will appear here during the call</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {transcript.map((entry, index) => (
                          <div
                            key={index}
                            className={`flex gap-3 ${
                              entry.role === "agent" ? "justify-start" : "justify-end"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                entry.role === "agent"
                                  ? "bg-muted"
                                  : "bg-primary text-primary-foreground"
                              }`}
                            >
                              <p className="text-xs font-medium mb-1 opacity-70">
                                {entry.role === "agent" ? "Agent" : "You"}
                              </p>
                              <p className="text-sm">{entry.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="recordings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Call Recordings
              </CardTitle>
              <CardDescription>
                Review and replay your test calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recordings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Volume2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-2">No recordings yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Complete a test call to see it here. Recordings are automatically saved when calls end.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recordings.map((recording) => (
                    <div
                      key={recording.id}
                      className={`border rounded-lg p-4 transition-colors ${
                        playingRecordingId === recording.id ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{recording.agentName}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(recording.duration)}
                            </span>
                            <span>
                              {formatDistanceToNow(recording.createdAt, { addSuffix: true })}
                            </span>
                            <Badge variant={recording.status === "completed" ? "default" : "secondary"}>
                              {recording.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {recording.recordingUrl && (
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                            >
                              <a href={recording.recordingUrl} download target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRecording(recording.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Audio Player */}
                      <div className="flex items-center gap-3 mb-3">
                        {recording.status === "pending" && !recording.recordingUrl ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retryFetchRecording(recording)}
                            disabled={loadingRecording === recording.id}
                            className="gap-2"
                          >
                            {loadingRecording === recording.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                            Load Recording
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => playRecording(recording)}
                              disabled={loadingRecording === recording.id}
                            >
                              {loadingRecording === recording.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : playingRecordingId === recording.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                            
                            {playingRecordingId === recording.id && (
                              <div className="flex-1 flex items-center gap-2">
                                <span className="text-xs text-muted-foreground w-10">
                                  {formatDuration(audioProgress)}
                                </span>
                                <Slider
                                  value={[audioProgress]}
                                  onValueChange={seekAudio}
                                  max={audioDuration || 100}
                                  step={0.1}
                                  className="flex-1"
                                />
                                <span className="text-xs text-muted-foreground w-10">
                                  {formatDuration(audioDuration)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      {/* Transcript Preview */}
                      {recording.transcript.length > 0 && (
                        <div className="border-t pt-3 mt-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Transcript</p>
                          <ScrollArea className="h-[100px]">
                            <div className="space-y-2">
                              {recording.transcript.slice(0, 4).map((entry, idx) => (
                                <p key={idx} className="text-sm">
                                  <span className="font-medium">
                                    {entry.role === "agent" ? "Agent: " : "You: "}
                                  </span>
                                  {entry.content}
                                </p>
                              ))}
                              {recording.transcript.length > 4 && (
                                <p className="text-xs text-muted-foreground">
                                  +{recording.transcript.length - 4} more messages
                                </p>
                              )}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AgentLayout>
  );
};

export default Playground;
