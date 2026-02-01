import { Phone, Star, Clock, MessageSquare, BarChart3, Shield, Zap, Globe } from "lucide-react";

const features = [
  {
    icon: Phone,
    title: "AI Voice Agents",
    description: "Natural conversations powered by Retell.ai. Your callers won't know they're talking to AI.",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Never miss a lead. AI agents answer calls after hours, weekends, and holidays.",
  },
  {
    icon: Star,
    title: "Review Management",
    description: "Automatically monitor and respond to Google reviews with personalized messages.",
  },
  {
    icon: MessageSquare,
    title: "Smart Responses",
    description: "AI crafts thoughtful, brand-consistent replies that turn critics into advocates.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track call volumes, sentiment trends, and review performance in real-time.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 compliant with end-to-end encryption for all communications.",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description: "Connect your phone and Google Business Profile in minutes. No coding required.",
  },
  {
    icon: Globe,
    title: "Multi-Location",
    description: "Manage multiple business locations from a single, unified dashboard.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Powerful Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="text-gradient">Scale Customer Support</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            From AI-powered calls to automated review responses, we've got you covered.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group glass rounded-2xl p-6 hover:shadow-elevated transition-all duration-500 cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
