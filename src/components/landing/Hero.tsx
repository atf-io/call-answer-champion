import { Button } from "@/components/ui/button";
import { Phone, Star, ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero pt-16">
      {/* Background Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/5 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-muted-foreground">AI-Powered Business Communication</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-slide-up">
            Never Miss a Call.
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            AI agents that handle your after-hours calls and respond to Google reviews automatically. 
            Keep your customers happy 24/7.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/dashboard">
              <Button variant="hero" size="xl">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="heroOutline" size="xl">
              <Play className="w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          {/* Feature Cards Preview */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="glass rounded-2xl p-6 text-left hover:shadow-elevated transition-all duration-300 group cursor-pointer">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Phone className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">After-Hours AI Agents</h3>
              <p className="text-sm text-muted-foreground">
                Powered by Retell.ai, our agents handle calls naturally, book appointments, and capture leads while you sleep.
              </p>
            </div>

            <div className="glass rounded-2xl p-6 text-left hover:shadow-elevated transition-all duration-300 group cursor-pointer">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Star className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Google Review Responses</h3>
              <p className="text-sm text-muted-foreground">
                Automatically respond to Google reviews with personalized, professional messages that strengthen your reputation.
              </p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-border/30 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <p className="text-sm text-muted-foreground mb-4">Trusted by growing businesses</p>
            <div className="flex items-center justify-center gap-8 opacity-60">
              <div className="text-xl font-bold">500+ Companies</div>
              <div className="w-px h-6 bg-border" />
              <div className="text-xl font-bold">1M+ Calls Handled</div>
              <div className="w-px h-6 bg-border hidden sm:block" />
              <div className="text-xl font-bold hidden sm:block">50K+ Reviews</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
