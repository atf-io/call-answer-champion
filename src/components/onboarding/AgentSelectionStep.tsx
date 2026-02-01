import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Phone, Zap, Star, Check } from "lucide-react";
import type { AgentType } from "@/pages/Onboarding";
import { cn } from "@/lib/utils";

interface AgentSelectionStepProps {
  selectedAgent: AgentType;
  onAgentSelect: (agent: AgentType) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const AGENTS = [
  {
    id: "voice" as const,
    name: "Voice AI Agent",
    description: "Handle incoming calls 24/7 with a natural-sounding AI voice assistant",
    icon: Phone,
    features: [
      "Answer calls outside business hours",
      "Book appointments automatically",
      "Transfer urgent calls to staff",
      "Transcribe all conversations",
    ],
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "speed-to-lead" as const,
    name: "Speed to Lead Agent",
    description: "Instantly respond to leads from 3rd party aggregators before competitors",
    icon: Zap,
    features: [
      "Real-time lead notifications",
      "Instant callback attempts",
      "Lead qualification scripts",
      "CRM integration ready",
    ],
    color: "from-orange-500 to-amber-500",
  },
  {
    id: "reviews" as const,
    name: "Google Reviews Agent",
    description: "Automatically respond to Google reviews to boost your reputation",
    icon: Star,
    features: [
      "AI-crafted personalized responses",
      "Maintain brand voice consistency",
      "Flag negative reviews for attention",
      "Analytics dashboard",
    ],
    color: "from-purple-500 to-pink-500",
  },
];

const AgentSelectionStep = ({ 
  selectedAgent, 
  onAgentSelect, 
  onNext, 
  onBack, 
  onSkip 
}: AgentSelectionStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Choose Your AI Agent</h2>
        <p className="text-muted-foreground">
          Select the agent that best fits your business needs. You can add more later.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {AGENTS.map((agent) => {
          const isSelected = selectedAgent === agent.id;
          const Icon = agent.icon;
          
          return (
            <button
              key={agent.id}
              onClick={() => onAgentSelect(agent.id)}
              className={cn(
                "relative p-6 rounded-xl border-2 text-left transition-all hover:scale-[1.02]",
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg"
                  : "border-border hover:border-primary/50 bg-card"
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br",
                agent.color
              )}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              <h3 className="font-semibold text-lg mb-2">{agent.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{agent.description}</p>
              
              <ul className="space-y-2">
                {agent.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

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
        <Button 
          onClick={onNext} 
          variant="hero"
          disabled={!selectedAgent}
        >
          Configure Agent
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AgentSelectionStep;
