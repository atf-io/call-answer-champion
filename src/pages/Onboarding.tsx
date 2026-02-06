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

  const createKnowledgeBaseEntry = async (title: string, content: string, sourceUrl?: string) => {
    const response = await fetch("/api/knowledge-base", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title,
        sourceType: "url",
        sourceUrl: sourceUrl || businessProfile.business_website || "",
        content,
        summary: null,
        metadata: { scraped_from: businessProfile.business_website, auto_generated: true, source: "onboarding" },
      }),
    });
    if (!response.ok) {
      console.error(`Failed to save knowledge base entry: ${title}`);
    }
  };

  const saveBusinessProfileToKnowledgeBase = async () => {
    const bp = businessProfile;
    const hasContent = (val: unknown) => {
      if (!val) return false;
      if (typeof val === "string") return val.trim().length > 0;
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === "object") return Object.keys(val as object).length > 0;
      return Boolean(val);
    };

    if (hasContent(bp.business_name) || hasContent(bp.business_description)) {
      const parts = [];
      if (bp.business_name) parts.push(`Business Name: ${bp.business_name}`);
      if (bp.business_tagline) parts.push(`Tagline: ${bp.business_tagline}`);
      if (bp.business_description) parts.push(`\nDescription:\n${bp.business_description}`);
      if (bp.business_years_in_business) parts.push(`\nYears in Business: ${bp.business_years_in_business}`);
      if (bp.business_team_info) parts.push(`\nTeam: ${bp.business_team_info}`);
      await createKnowledgeBaseEntry(`${bp.business_name || "Business"} - Overview`, parts.join("\n"));
    }

    if (hasContent(bp.business_phone) || hasContent(bp.business_email) || hasContent(bp.business_address)) {
      const parts = [];
      if (bp.business_phone) parts.push(`Phone: ${bp.business_phone}`);
      if (bp.business_email) parts.push(`Email: ${bp.business_email}`);
      if (bp.business_address) parts.push(`Address: ${bp.business_address}`);
      if (bp.business_website) parts.push(`Website: ${bp.business_website}`);
      await createKnowledgeBaseEntry("Contact Information", parts.join("\n"));
    }

    if (hasContent(bp.business_services)) {
      let content = bp.business_services.map((s) => `- ${s}`).join("\n");
      if (hasContent(bp.business_specialties)) content += `\n\nSpecialties:\n${bp.business_specialties.map((s) => `- ${s}`).join("\n")}`;
      await createKnowledgeBaseEntry("Services Offered", content);
    }

    if (hasContent(bp.business_certifications) || hasContent(bp.business_equipment_brands)) {
      const parts = [];
      if (bp.business_certifications.length) parts.push(`Certifications & Licenses:\n${bp.business_certifications.map((c) => `- ${c}`).join("\n")}`);
      if (bp.business_equipment_brands.length) parts.push(`Equipment & Brands:\n${bp.business_equipment_brands.map((b) => `- ${b}`).join("\n")}`);
      await createKnowledgeBaseEntry("Certifications & Equipment", parts.join("\n\n"));
    }

    if (hasContent(bp.business_hours) || bp.business_emergency_service) {
      const parts = [];
      if (Object.keys(bp.business_hours).length) {
        parts.push("Business Hours:");
        Object.entries(bp.business_hours).forEach(([day, time]) => {
          parts.push(`  ${day.charAt(0).toUpperCase() + day.slice(1)}: ${time}`);
        });
      }
      if (bp.business_emergency_service) parts.push("\n24/7 Emergency Service Available");
      if (bp.business_service_area?.cities?.length) {
        parts.push(`\nService Area: ${bp.business_service_area.cities.join(", ")}`);
        if (bp.business_service_area.radius) parts.push(`Service Radius: ${bp.business_service_area.radius}`);
      }
      await createKnowledgeBaseEntry("Hours & Service Area", parts.join("\n"));
    }

    if (hasContent(bp.business_pricing_info) || hasContent(bp.business_payment_methods) || hasContent(bp.business_guarantees)) {
      const parts = [];
      if (bp.business_pricing_info) parts.push(`Pricing: ${bp.business_pricing_info}`);
      if (bp.business_payment_methods?.length) parts.push(`\nPayment Methods:\n${bp.business_payment_methods.map((p) => `- ${p}`).join("\n")}`);
      if (bp.business_guarantees?.length) parts.push(`\nGuarantees & Warranties:\n${bp.business_guarantees.map((g) => `- ${g}`).join("\n")}`);
      await createKnowledgeBaseEntry("Pricing & Payment", parts.join("\n"));
    }

    if (hasContent(bp.business_faqs)) {
      const content = bp.business_faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
      await createKnowledgeBaseEntry("Frequently Asked Questions", content);
    }

    if (hasContent(bp.business_social_links)) {
      const content = Object.entries(bp.business_social_links)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}: ${v}`)
        .join("\n");
      if (content) await createKnowledgeBaseEntry("Social Media & Review Profiles", content);
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

      const hasAnyBusinessData = businessProfile.business_name || businessProfile.business_description || 
        businessProfile.business_phone || businessProfile.business_services.length > 0;
      if (hasAnyBusinessData) {
        try {
          await saveBusinessProfileToKnowledgeBase();
        } catch (kbError) {
          console.error("Error saving to knowledge base:", kbError);
        }
      }

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
