import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, ArrowLeft } from "lucide-react";
import { useAgents, CreateAgentData } from "@/hooks/useAgents";
import { AgentTypeSelector, AgentChannelType } from "./AgentTypeSelector";
import { VoiceAgentConfig } from "./VoiceAgentConfig";
import { TextAgentConfig, TextAgentFormData, defaultTextAgentData } from "./TextAgentConfig";
import { SpeedToLeadConfig, SpeedToLeadFormData, defaultSpeedToLeadData } from "./SpeedToLeadConfig";

type AgentSubType = "voice" | "speed-to-lead" | "reviews" | "text" | "sms" | null;

interface CreateAgentDialogProps {
  onCreateAgent?: (data: CreateAgentData) => Promise<any>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  agentType?: string | null;
  onSuccess?: () => void;
}

const defaultVoiceFormData: CreateAgentData = {
  name: "",
  voice_type: "Professional Female",
  personality: "friendly and professional",
  greeting_message: "Hello! Thank you for calling. How can I help you today?",
  schedule_start: "18:00",
  schedule_end: "08:00",
  schedule_days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  // Retell defaults
  voice_id: "11labs-Adrian",
  voice_model: "eleven_turbo_v2",
  voice_temperature: 1,
  voice_speed: 1,
  volume: 1,
  responsiveness: 1,
  interruption_sensitivity: 1,
  enable_backchannel: true,
  backchannel_frequency: 0.9,
  ambient_sound: "none",
  ambient_sound_volume: 1,
  language: "en-US",
  enable_voicemail_detection: true,
  voicemail_message: "Hi, please give us a callback.",
  voicemail_detection_timeout_ms: 30000,
  max_call_duration_ms: 3600000,
  end_call_after_silence_ms: 600000,
  begin_message_delay_ms: 1000,
  normalize_for_speech: true,
  boosted_keywords: [],
  reminder_trigger_ms: 10000,
  reminder_max_count: 2,
};

export const CreateAgentDialog = ({ 
  onCreateAgent, 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  agentType: preselectedAgentType,
  onSuccess 
}: CreateAgentDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keywordsInput, setKeywordsInput] = useState("");
  const [escalationKeywordsInput, setEscalationKeywordsInput] = useState("urgent, emergency, speak to human, real person");
  const { createAgent } = useAgents();
  
  // Step management: "type-select" or "configure"
  const [step, setStep] = useState<"type-select" | "configure">("type-select");
  const [selectedChannelType, setSelectedChannelType] = useState<AgentChannelType | null>(null);
  const [agentSubType, setAgentSubType] = useState<AgentSubType>(null);
  
  // Form data for each type
  const [voiceFormData, setVoiceFormData] = useState<CreateAgentData>({ ...defaultVoiceFormData });
  const [textFormData, setTextFormData] = useState<TextAgentFormData>({ ...defaultTextAgentData });
  const [speedToLeadFormData, setSpeedToLeadFormData] = useState<SpeedToLeadFormData>({ ...defaultSpeedToLeadData });
  const [stlEscalationKeywordsInput, setStlEscalationKeywordsInput] = useState("urgent, emergency, speak to human, real person, call me");
  
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

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      // If a preselected type is provided, skip type selection
      if (preselectedAgentType === "speed-to-lead") {
        // Speed to Lead uses SMS, not voice
        setSelectedChannelType("text");
        setAgentSubType("speed-to-lead");
        setStep("configure");
      } else if (preselectedAgentType === "voice" || preselectedAgentType === "reviews") {
        setSelectedChannelType("voice");
        setAgentSubType(preselectedAgentType as AgentSubType);
        setStep("configure");
        setVoiceFormData(prev => ({
          ...prev,
          personality: getDefaultPersonality(preselectedAgentType),
          greeting_message: getDefaultGreeting(preselectedAgentType),
        }));
      } else if (preselectedAgentType === "text" || preselectedAgentType === "sms") {
        setSelectedChannelType("text");
        setAgentSubType(preselectedAgentType as AgentSubType);
        setStep("configure");
      } else {
        setStep("type-select");
        setSelectedChannelType(null);
        setAgentSubType(null);
      }
    } else {
      // Reset when closing
      setStep("type-select");
      setSelectedChannelType(null);
      setAgentSubType(null);
      setVoiceFormData({ ...defaultVoiceFormData });
      setTextFormData({ ...defaultTextAgentData });
      setSpeedToLeadFormData({ ...defaultSpeedToLeadData });
      setStlEscalationKeywordsInput("urgent, emergency, speak to human, real person, call me");
      setKeywordsInput("");
      setEscalationKeywordsInput("urgent, emergency, speak to human, real person");
    }
  }, [open, preselectedAgentType]);

  const handleChannelSelect = (type: AgentChannelType) => {
    setSelectedChannelType(type);
    setAgentSubType(type);
    setStep("configure");
  };

  const handleBack = () => {
    setStep("type-select");
    setSelectedChannelType(null);
    setAgentSubType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    let dataToSubmit: CreateAgentData;
    
    if (agentSubType === "speed-to-lead") {
      if (!speedToLeadFormData.name.trim()) {
        setLoading(false);
        return;
      }
      
      dataToSubmit = {
        name: speedToLeadFormData.name,
        personality: speedToLeadFormData.personality,
        greeting_message: speedToLeadFormData.greeting_message,
        schedule_days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        schedule_start: "00:00",
        schedule_end: "23:59",
        voice_type: "Speed to Lead",
        voice_id: "sms-agent",
        voice_model: "sms",
        language: "en-US",
      };
    } else if (selectedChannelType === "voice") {
      if (!voiceFormData.name.trim()) {
        setLoading(false);
        return;
      }
      
      const keywords = keywordsInput.split(",").map(k => k.trim()).filter(Boolean);
      dataToSubmit = { ...voiceFormData, boosted_keywords: keywords.length > 0 ? keywords : undefined };
    } else if (selectedChannelType === "text") {
      if (!textFormData.name.trim()) {
        setLoading(false);
        return;
      }
      
      dataToSubmit = {
        name: textFormData.name,
        personality: textFormData.personality,
        greeting_message: textFormData.greeting_message,
        schedule_start: textFormData.schedule_start,
        schedule_end: textFormData.schedule_end,
        schedule_days: textFormData.schedule_days,
        voice_type: "Text Agent",
        voice_id: "text-agent",
        voice_model: "text",
        language: "en-US",
      };
    } else {
      setLoading(false);
      return;
    }
    
    const handler = onCreateAgent || createAgent;
    const result = await handler(dataToSubmit);
    
    setLoading(false);
    
    if (result) {
      setOpen(false);
      onSuccess?.();
    }
  };

  const getTitle = () => {
    if (step === "type-select") {
      return "Create New Agent";
    }
    switch (agentSubType) {
      case "speed-to-lead":
        return "Create Speed to Lead Agent";
      case "reviews":
        return "Create Reviews Agent";
      case "text":
      case "sms":
        return "Create Text/SMS Agent";
      default:
        return "Create Voice Agent";
    }
  };

  const canSubmit = () => {
    if (agentSubType === "speed-to-lead") {
      return speedToLeadFormData.name.trim().length > 0;
    }
    if (selectedChannelType === "voice") {
      return voiceFormData.name.trim().length > 0;
    }
    if (selectedChannelType === "text") {
      return textFormData.name.trim().length > 0;
    }
    return false;
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
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3">
            {step === "configure" && (
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleBack}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle>{getTitle()}</DialogTitle>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          {step === "type-select" ? (
            <div className="p-6">
              <AgentTypeSelector 
                selectedType={selectedChannelType}
                onSelect={handleChannelSelect}
              />
            </div>
          ) : (
            <>
              {agentSubType === "speed-to-lead" && (
                <SpeedToLeadConfig
                  formData={speedToLeadFormData}
                  onChange={setSpeedToLeadFormData}
                  escalationKeywordsInput={stlEscalationKeywordsInput}
                  onEscalationKeywordsChange={setStlEscalationKeywordsInput}
                />
              )}
              
              {selectedChannelType === "voice" && agentSubType !== "speed-to-lead" && (
                <VoiceAgentConfig
                  formData={voiceFormData}
                  onChange={setVoiceFormData}
                  keywordsInput={keywordsInput}
                  onKeywordsChange={setKeywordsInput}
                  agentType={preselectedAgentType}
                />
              )}
              
              {selectedChannelType === "text" && agentSubType !== "speed-to-lead" && (
                <TextAgentConfig
                  formData={textFormData}
                  onChange={setTextFormData}
                  escalationKeywordsInput={escalationKeywordsInput}
                  onEscalationKeywordsChange={setEscalationKeywordsInput}
                />
              )}

              <div className="flex justify-end gap-3 p-6 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="hero" disabled={loading || !canSubmit()}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Agent"}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAgentDialog;
