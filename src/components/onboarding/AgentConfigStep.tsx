import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft } from "lucide-react";
import type { AgentType, BusinessProfile } from "@/pages/Onboarding";
import VoiceAgentConfig from "./config/VoiceAgentConfig";
import SpeedToLeadConfig from "./config/SpeedToLeadConfig";
import ReviewsAgentConfig from "./config/ReviewsAgentConfig";

interface AgentConfigStepProps {
  agentType: AgentType;
  businessProfile: BusinessProfile;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export interface VoiceAgentSettings {
  name: string;
  voiceType: string;
  personality: string;
  greeting: string;
  scheduleStart: string;
  scheduleEnd: string;
  scheduleDays: string[];
}

export interface SpeedToLeadSettings {
  name: string;
  responseTime: number;
  maxAttempts: number;
  voiceType: string;
  qualificationScript: string;
  leadSources: string[];
}

export interface ReviewsAgentSettings {
  name: string;
  tone: string;
  autoRespond: boolean;
  minRatingForAuto: number;
  signatureText: string;
}

const AgentConfigStep = ({ 
  agentType, 
  businessProfile, 
  onNext, 
  onBack, 
  onSkip 
}: AgentConfigStepProps) => {
  const [voiceSettings, setVoiceSettings] = useState<VoiceAgentSettings>({
    name: `${businessProfile.business_name || "My"} Voice Agent`,
    voiceType: "Professional Female",
    personality: "friendly and professional",
    greeting: `Hello! Thank you for calling ${businessProfile.business_name || "our business"}. How can I help you today?`,
    scheduleStart: "18:00",
    scheduleEnd: "08:00",
    scheduleDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  });

  const [speedToLeadSettings, setSpeedToLeadSettings] = useState<SpeedToLeadSettings>({
    name: `${businessProfile.business_name || "My"} Speed to Lead`,
    responseTime: 30,
    maxAttempts: 3,
    voiceType: "Professional Female",
    qualificationScript: `Hi, this is ${businessProfile.business_name || "our team"}. I'm calling about the inquiry you just submitted. Do you have a moment to discuss your needs?`,
    leadSources: [],
  });

  const [reviewsSettings, setReviewsSettings] = useState<ReviewsAgentSettings>({
    name: `${businessProfile.business_name || "My"} Reviews Agent`,
    tone: "professional",
    autoRespond: true,
    minRatingForAuto: 4,
    signatureText: `- The ${businessProfile.business_name || "Team"}`,
  });

  const renderConfig = () => {
    switch (agentType) {
      case "voice":
        return (
          <VoiceAgentConfig
            settings={voiceSettings}
            onSettingsChange={setVoiceSettings}
            businessProfile={businessProfile}
          />
        );
      case "speed-to-lead":
        return (
          <SpeedToLeadConfig
            settings={speedToLeadSettings}
            onSettingsChange={setSpeedToLeadSettings}
            businessProfile={businessProfile}
          />
        );
      case "reviews":
        return (
          <ReviewsAgentConfig
            settings={reviewsSettings}
            onSettingsChange={setReviewsSettings}
            businessProfile={businessProfile}
          />
        );
      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No agent selected. Please go back and select an agent.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderConfig()}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-border/50">
        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
        </div>
        <Button onClick={onNext} variant="hero">
          Complete Setup
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AgentConfigStep;
