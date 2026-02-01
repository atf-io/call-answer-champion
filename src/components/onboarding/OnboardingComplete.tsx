import { Button } from "@/components/ui/button";
import { Check, Loader2, PartyPopper, Phone, Zap, Star, Building2 } from "lucide-react";
import type { AgentType, BusinessProfile } from "@/pages/Onboarding";

interface OnboardingCompleteProps {
  businessProfile: BusinessProfile;
  selectedAgent: AgentType;
  onComplete: () => void;
  saving: boolean;
}

const AGENT_INFO = {
  voice: { name: "Voice AI Agent", icon: Phone, color: "from-blue-500 to-cyan-500" },
  "speed-to-lead": { name: "Speed to Lead Agent", icon: Zap, color: "from-orange-500 to-amber-500" },
  reviews: { name: "Google Reviews Agent", icon: Star, color: "from-purple-500 to-pink-500" },
};

const OnboardingComplete = ({ 
  businessProfile, 
  selectedAgent, 
  onComplete, 
  saving 
}: OnboardingCompleteProps) => {
  const agent = selectedAgent ? AGENT_INFO[selectedAgent] : null;
  const AgentIcon = agent?.icon || Phone;

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-bounce">
        <PartyPopper className="w-10 h-10 text-primary" />
      </div>

      <h2 className="text-3xl font-bold mb-3">You're All Set! 🎉</h2>
      <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
        Your account is ready to go. Here's a summary of what we've set up:
      </p>

      <div className="max-w-md mx-auto space-y-4 text-left">
        {/* Business Profile Summary */}
        {businessProfile.business_name && (
          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Business Profile</h3>
              <p className="text-sm text-muted-foreground">{businessProfile.business_name}</p>
              {businessProfile.business_services.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {businessProfile.business_services.length} services configured
                </p>
              )}
            </div>
            <Check className="w-5 h-5 text-success mt-0.5" />
          </div>
        )}

        {/* Agent Summary */}
        {agent && (
          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 border border-border">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${agent.color} flex items-center justify-center flex-shrink-0`}>
              <AgentIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{agent.name}</h3>
              <p className="text-sm text-muted-foreground">Ready to activate</p>
            </div>
            <Check className="w-5 h-5 text-success mt-0.5" />
          </div>
        )}

        {/* No setup message */}
        {!businessProfile.business_name && !selectedAgent && (
          <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
            <p className="text-muted-foreground">
              You can configure your business and agents anytime from the dashboard.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <Button
          onClick={onComplete}
          disabled={saving}
          variant="hero"
          size="xl"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Go to Dashboard
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        You can always update these settings later in your dashboard
      </p>
    </div>
  );
};

export default OnboardingComplete;
