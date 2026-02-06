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
import { toast } from "sonner";

export type AgentType = "voice" | "speed-to-lead" | "reviews" | null;

export interface BusinessProfile {
  business_name: string;
  business_description: string;
  business_tagline: string;
  business_phone: string;
  business_email: string;
  business_address: string;
  business_website: string;
  business_logo_url: string;
  business_colors: Record<string, string>;
  business_services: string[];
  business_specialties: string[];
  business_equipment_brands: string[];
  business_certifications: string[];
  business_service_area: {
    cities?: string[];
    counties?: string[];
    states?: string[];
    zip_codes?: string[];
    radius?: string;
    description?: string;
  };
  business_hours: Record<string, string>;
  business_emergency_service: boolean;
  business_locations: Array<{
    name?: string;
    address?: string;
    phone?: string;
    hours?: string;
  }>;
  business_team_info: string;
  business_years_in_business: string;
  business_pricing_info: string;
  business_guarantees: string[];
  business_payment_methods: string[];
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
    business_tagline: "",
    business_phone: "",
    business_email: "",
    business_address: "",
    business_website: "",
    business_logo_url: "",
    business_colors: {},
    business_services: [],
    business_specialties: [],
    business_equipment_brands: [],
    business_certifications: [],
    business_service_area: {},
    business_hours: {},
    business_emergency_service: false,
    business_locations: [],
    business_team_info: "",
    business_years_in_business: "",
    business_pricing_info: "",
    business_guarantees: [],
    business_payment_methods: [],
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
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          businessName: businessProfile.business_name || null,
          businessDescription: businessProfile.business_description || null,
          businessPhone: businessProfile.business_phone || null,
          businessAddress: businessProfile.business_address || null,
          businessWebsite: businessProfile.business_website || null,
          businessLogoUrl: businessProfile.business_logo_url || null,
          businessColors: businessProfile.business_colors || null,
          businessServices: businessProfile.business_services.length > 0 ? businessProfile.business_services : null,
          businessTeamInfo: businessProfile.business_team_info || null,
          businessFaqs: businessProfile.business_faqs.length > 0 ? businessProfile.business_faqs : null,
          businessSocialLinks: businessProfile.business_social_links || null,
          onboardingCompleted: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to save profile");

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
