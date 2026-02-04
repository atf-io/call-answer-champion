import { Phone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export type AgentChannelType = "voice" | "text";

interface AgentTypeSelectorProps {
  selectedType: AgentChannelType | null;
  onSelect: (type: AgentChannelType) => void;
}

const agentChannels = [
  {
    type: "voice" as const,
    name: "Voice Agent",
    description: "Handle phone calls with natural AI conversations",
    icon: Phone,
    features: [
      "After-hours call answering",
      "Natural voice conversations",
      "Voicemail detection",
      "Call scheduling"
    ]
  },
  {
    type: "text" as const,
    name: "Text/SMS Agent",
    description: "Automated text messaging with AI responses",
    icon: MessageSquare,
    features: [
      "Instant SMS responses",
      "Lead follow-up automation",
      "Keyword triggers",
      "Human handover escalation"
    ]
  }
];

export const AgentTypeSelector = ({ selectedType, onSelect }: AgentTypeSelectorProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">What type of agent do you want to create?</h3>
        <p className="text-sm text-muted-foreground">
          Choose the communication channel for your AI agent
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {agentChannels.map((channel) => (
          <button
            key={channel.type}
            type="button"
            onClick={() => onSelect(channel.type)}
            className={cn(
              "relative p-6 rounded-xl border-2 text-left transition-all duration-200",
              "hover:border-primary/50 hover:bg-muted/30",
              selectedType === channel.type
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
              selectedType === channel.type
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              <channel.icon className="w-6 h-6" />
            </div>
            
            <h4 className="font-semibold mb-1">{channel.name}</h4>
            <p className="text-sm text-muted-foreground mb-4">{channel.description}</p>
            
            <ul className="space-y-1.5">
              {channel.features.map((feature, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            
            {selectedType === channel.type && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
