import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Globe, Loader2, Sparkles, Building2, Phone, MapPin, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { BusinessProfile } from "@/pages/Onboarding";

interface BusinessProfileStepProps {
  profile: BusinessProfile;
  onProfileChange: (profile: BusinessProfile) => void;
  onNext: () => void;
  onSkip: () => void;
}

const BusinessProfileStep = ({ profile, onProfileChange, onNext, onSkip }: BusinessProfileStepProps) => {
  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scraped, setScraped] = useState(false);

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error("Please enter your website URL");
      return;
    }

    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-business", {
        body: { url },
      });

      if (error) throw error;

      if (data.success && data.data) {
        const scraped = data.data;
        onProfileChange({
          business_name: scraped.business_name || profile.business_name,
          business_description: scraped.business_description || profile.business_description,
          business_phone: scraped.phone || profile.business_phone,
          business_address: scraped.address || profile.business_address,
          business_website: scraped.website || url,
          business_logo_url: scraped.logo_url || profile.business_logo_url,
          business_colors: scraped.colors || profile.business_colors,
          business_services: scraped.services || profile.business_services,
          business_team_info: scraped.team_info || profile.business_team_info,
          business_faqs: scraped.faqs || profile.business_faqs,
          business_social_links: scraped.social_links || profile.business_social_links,
        });
        setScraped(true);
        toast.success("Business information extracted successfully!");
      } else {
        toast.error(data.error || "Failed to extract business information");
      }
    } catch (error) {
      console.error("Error scraping:", error);
      toast.error("Failed to scrape website. Please enter details manually.");
    } finally {
      setScraping(false);
    }
  };

  const handleFieldChange = (field: keyof BusinessProfile, value: string | string[]) => {
    onProfileChange({ ...profile, [field]: value });
  };

  const addService = () => {
    onProfileChange({
      ...profile,
      business_services: [...profile.business_services, ""],
    });
  };

  const updateService = (index: number, value: string) => {
    const updated = [...profile.business_services];
    updated[index] = value;
    onProfileChange({ ...profile, business_services: updated });
  };

  const removeService = (index: number) => {
    const updated = profile.business_services.filter((_, i) => i !== index);
    onProfileChange({ ...profile, business_services: updated });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Set Up Your Business Profile</h2>
        <p className="text-muted-foreground">
          Enter your website URL and we'll automatically extract your business information
        </p>
      </div>

      {/* URL Input */}
      <div className="max-w-lg mx-auto">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="url"
              placeholder="https://yourbusiness.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-10"
              disabled={scraping}
            />
          </div>
          <Button
            onClick={handleScrape}
            disabled={scraping || !url.trim()}
            variant="hero"
          >
            {scraping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Auto-Fill
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          We'll extract your business name, description, services, and more
        </p>
      </div>

      {/* Form Fields */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name</Label>
          <Input
            id="business_name"
            placeholder="Your Business Name"
            value={profile.business_name}
            onChange={(e) => handleFieldChange("business_name", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_phone">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="business_phone"
              placeholder="(555) 123-4567"
              value={profile.business_phone}
              onChange={(e) => handleFieldChange("business_phone", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="business_description">Business Description</Label>
          <Textarea
            id="business_description"
            placeholder="Tell us about your business..."
            value={profile.business_description}
            onChange={(e) => handleFieldChange("business_description", e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="business_address">Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              id="business_address"
              placeholder="123 Main St, City, State, ZIP"
              value={profile.business_address}
              onChange={(e) => handleFieldChange("business_address", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Services */}
        <div className="space-y-2 md:col-span-2">
          <Label>Services / Products</Label>
          <div className="space-y-2">
            {profile.business_services.map((service, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="e.g., HVAC Repair"
                  value={service}
                  onChange={(e) => updateService(index, e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeService(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addService}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Service
            </Button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-border/50">
        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
        <Button onClick={onNext} variant="hero">
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default BusinessProfileStep;
