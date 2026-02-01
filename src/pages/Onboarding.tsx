import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, ArrowRight, ArrowLeft, X, Loader2 } from "lucide-react";
import BusinessProfileStep from "@/components/onboarding/BusinessProfileStep";
import AgentSelectionStep from "@/components/onboarding/AgentSelectionStep";
import AgentConfigStep from "@/components/onboarding/AgentConfigStep";
import OnboardingComplete from "@/components/onboarding/OnboardingComplete";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AgentType = "voice" | "speed-to-lead" | "reviews" | null;

export interface BusinessProfile {
  business_name: string;
  business_description: string;
  business_phone: string;
  business_address: string;
  business_website: string;
  business_logo_url: string;
  business_colors: Record<string, string>;
  business_services: string[];
  business_team_info: string;
  business_faqs: Array<{ question: string; answer: string }>;
  business_social_links: Record<string, string>;
}

const STEPS = [
  { id: 1, name: "Business Profile", description: "Set up your business" },
  { id: 2, name: "Choose Agent", description: "Select your AI agent" },
  { id: 3, name: "Configure", description: "Customize settings" },
  { id: 4, name: "Complete", description: "You're all set!" },
];

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
    business_name: "",
    business_description: "",
    business_phone: "",
    business_address: "",
    business_website: "",
    business_logo_url: "",
    business_colors: {},
    business_services: [],
    business_team_info: "",
    business_faqs: [],
    business_social_links: {},
  });
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep === 1) {
      // Skip business profile, go to agent selection
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Skip agent selection, complete onboarding
      handleCompleteOnboarding();
    } else if (currentStep === 3) {
      // Skip agent config, complete onboarding
      handleCompleteOnboarding();
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Save business profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          business_name: businessProfile.business_name || null,
          business_description: businessProfile.business_description || null,
          business_phone: businessProfile.business_phone || null,
          business_address: businessProfile.business_address || null,
          business_website: businessProfile.business_website || null,
          business_logo_url: businessProfile.business_logo_url || null,
          business_colors: businessProfile.business_colors || null,
          business_services: businessProfile.business_services.length > 0 ? businessProfile.business_services : null,
          business_team_info: businessProfile.business_team_info || null,
          business_faqs: businessProfile.business_faqs.length > 0 ? businessProfile.business_faqs : null,
          business_social_links: businessProfile.business_social_links || null,
          onboarding_completed: true,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      toast.success("Onboarding complete! Welcome to your dashboard.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </div>
            <span className="font-semibold text-lg">Setup Wizard</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Exit Setup
          </Button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      currentStep > step.id
                        ? "bg-primary border-primary text-primary-foreground"
                        : currentStep === step.id
                        ? "border-primary text-primary bg-primary/10"
                        : "border-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <span className="font-semibold">{step.id}</span>
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-16 sm:w-24 h-0.5 mx-2 ${
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="glass rounded-2xl p-8 min-h-[400px]">
          {currentStep === 1 && (
            <BusinessProfileStep
              profile={businessProfile}
              onProfileChange={setBusinessProfile}
              onNext={handleNext}
              onSkip={handleSkip}
            />
          )}
          {currentStep === 2 && (
            <AgentSelectionStep
              selectedAgent={selectedAgent}
              onAgentSelect={setSelectedAgent}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
            />
          )}
          {currentStep === 3 && (
            <AgentConfigStep
              agentType={selectedAgent}
              businessProfile={businessProfile}
              onNext={handleNext}
              onBack={handleBack}
              onSkip={handleSkip}
            />
          )}
          {currentStep === 4 && (
            <OnboardingComplete
              businessProfile={businessProfile}
              selectedAgent={selectedAgent}
              onComplete={handleCompleteOnboarding}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
