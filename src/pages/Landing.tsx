import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import TrustLogos from "@/components/landing/TrustLogos";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/layout/Footer";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background theme-landing">
      <Navbar />
      <Hero />
      <TrustLogos />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
};

export default Landing;
