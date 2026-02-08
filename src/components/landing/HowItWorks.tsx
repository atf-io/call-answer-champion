import { Phone, Settings, Rocket, BarChart3 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Settings,
    title: "Connect Your Accounts",
    description: "Link your phone system and Google Business Profile in just a few clicks.",
  },
  {
    number: "02",
    icon: Phone,
    title: "Configure Your AI Agent",
    description: "Customize your AI's voice, personality, and responses to match your brand.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Go Live",
    description: "Activate your AI agents and start handling calls, web leads, and reviews automatically.",
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Monitor & Optimize",
    description: "Track performance and fine-tune your AI for even better results.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-gradient mb-6">
            <Rocket className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Simple Process</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Get started in <span className="text-gradient">minutes</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            No technical expertise required. Our guided setup makes it easy.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-full h-px bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                
                <div className="group text-center">
                  {/* Step Number */}
                  <div className="relative inline-block mb-6">
                    <div className="w-24 h-24 rounded-2xl glass border border-border/50 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                      <step.icon className="w-10 h-10 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {step.number}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
