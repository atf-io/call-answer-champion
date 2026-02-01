import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Globe, Loader2, Sparkles, Building2, Phone, MapPin, X, Plus, Mail, Clock, Award, Wrench, BadgeCheck, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { BusinessProfile } from "@/pages/Onboarding";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          business_tagline: scraped.tagline || profile.business_tagline,
          business_phone: scraped.phone || profile.business_phone,
          business_email: scraped.email || profile.business_email,
          business_address: scraped.address || profile.business_address,
          business_website: scraped.website || url,
          business_logo_url: scraped.logo_url || profile.business_logo_url,
          business_colors: scraped.colors || profile.business_colors,
          business_services: scraped.services || profile.business_services,
          business_specialties: scraped.specialties || profile.business_specialties,
          business_equipment_brands: scraped.equipment_brands || profile.business_equipment_brands,
          business_certifications: scraped.certifications || profile.business_certifications,
          business_service_area: scraped.service_area || profile.business_service_area,
          business_hours: scraped.business_hours || profile.business_hours,
          business_emergency_service: scraped.emergency_service || profile.business_emergency_service,
          business_locations: scraped.locations || profile.business_locations,
          business_team_info: scraped.team_info || profile.business_team_info,
          business_years_in_business: scraped.years_in_business || profile.business_years_in_business,
          business_pricing_info: scraped.pricing_info || profile.business_pricing_info,
          business_guarantees: scraped.guarantees || profile.business_guarantees,
          business_payment_methods: scraped.payment_methods || profile.business_payment_methods,
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

  const handleFieldChange = (field: keyof BusinessProfile, value: unknown) => {
    onProfileChange({ ...profile, [field]: value });
  };

  const addToArray = (field: keyof BusinessProfile) => {
    const current = profile[field];
    if (Array.isArray(current)) {
      onProfileChange({
        ...profile,
        [field]: [...current, ""],
      });
    }
  };

  const updateArrayItem = (field: keyof BusinessProfile, index: number, value: string) => {
    const current = profile[field];
    if (Array.isArray(current)) {
      const updated = [...current];
      updated[index] = value;
      onProfileChange({ ...profile, [field]: updated });
    }
  };

  const removeArrayItem = (field: keyof BusinessProfile, index: number) => {
    const current = profile[field];
    if (Array.isArray(current)) {
      const updated = current.filter((_, i) => i !== index);
      onProfileChange({ ...profile, [field]: updated });
    }
  };

  const ArrayFieldEditor = ({ 
    field, 
    label, 
    placeholder, 
    icon: Icon 
  }: { 
    field: keyof BusinessProfile; 
    label: string; 
    placeholder: string;
    icon?: React.ElementType;
  }) => {
    const items = profile[field] as string[];
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
          {label}
        </Label>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={placeholder}
                value={item}
                onChange={(e) => updateArrayItem(field, index, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeArrayItem(field, index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addToArray(field)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add {label.replace(/s$/, '')}
          </Button>
        </div>
      </div>
    );
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
          We'll extract services, hours, service area, certifications, and more
        </p>
      </div>

      {/* Tabbed Form */}
      <Tabs defaultValue="basic" className="mt-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="social">Social & Reviews</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
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
              <Label htmlFor="business_tagline">Tagline / Slogan</Label>
              <Input
                id="business_tagline"
                placeholder="Your trusted partner since 1990"
                value={profile.business_tagline}
                onChange={(e) => handleFieldChange("business_tagline", e.target.value)}
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

            <div className="space-y-2">
              <Label htmlFor="business_email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="business_email"
                  placeholder="info@yourbusiness.com"
                  value={profile.business_email}
                  onChange={(e) => handleFieldChange("business_email", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="business_description">Business Description</Label>
              <Textarea
                id="business_description"
                placeholder="Tell us about your business, what you do, and your mission..."
                value={profile.business_description}
                onChange={(e) => handleFieldChange("business_description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="business_address">Primary Address</Label>
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

            <div className="space-y-2">
              <Label htmlFor="years_in_business">Years in Business</Label>
              <Input
                id="years_in_business"
                placeholder="e.g., 15+ years"
                value={profile.business_years_in_business}
                onChange={(e) => handleFieldChange("business_years_in_business", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_info">Team Info</Label>
              <Input
                id="team_info"
                placeholder="e.g., 25+ certified technicians"
                value={profile.business_team_info}
                onChange={(e) => handleFieldChange("business_team_info", e.target.value)}
              />
            </div>
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <ArrayFieldEditor
              field="business_services"
              label="Services Offered"
              placeholder="e.g., HVAC Repair, Installation"
              icon={Wrench}
            />

            <ArrayFieldEditor
              field="business_specialties"
              label="Specialties"
              placeholder="e.g., Commercial HVAC, Geothermal"
              icon={Award}
            />

            <ArrayFieldEditor
              field="business_equipment_brands"
              label="Equipment / Brands"
              placeholder="e.g., Carrier, Lennox, Trane"
              icon={Wrench}
            />

            <ArrayFieldEditor
              field="business_certifications"
              label="Certifications & Licenses"
              placeholder="e.g., EPA Certified, NATE Certified"
              icon={BadgeCheck}
            />

            <ArrayFieldEditor
              field="business_guarantees"
              label="Guarantees & Warranties"
              placeholder="e.g., 100% Satisfaction Guarantee"
              icon={Award}
            />

            <ArrayFieldEditor
              field="business_payment_methods"
              label="Payment Methods"
              placeholder="e.g., Cash, Credit Cards, Financing"
              icon={CreditCard}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pricing_info">Pricing Information</Label>
            <Textarea
              id="pricing_info"
              placeholder="Any pricing details, financing options, or special offers..."
              value={profile.business_pricing_info}
              onChange={(e) => handleFieldChange("business_pricing_info", e.target.value)}
              rows={2}
            />
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Service Area */}
            <div className="space-y-4 md:col-span-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Service Area
              </Label>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Cities Served</Label>
                  <Textarea
                    placeholder="Austin, Round Rock, Cedar Park, Georgetown..."
                    value={profile.business_service_area.cities?.join(", ") || ""}
                    onChange={(e) => handleFieldChange("business_service_area", {
                      ...profile.business_service_area,
                      cities: e.target.value.split(",").map(c => c.trim()).filter(Boolean)
                    })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Service Radius</Label>
                  <Input
                    placeholder="e.g., 50 miles from Austin"
                    value={profile.business_service_area.radius || ""}
                    onChange={(e) => handleFieldChange("business_service_area", {
                      ...profile.business_service_area,
                      radius: e.target.value
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Business Hours
                </Label>
                <div className="flex items-center gap-2">
                  <Label htmlFor="emergency" className="text-sm">24/7 Emergency Service</Label>
                  <Switch
                    id="emergency"
                    checked={profile.business_emergency_service}
                    onCheckedChange={(checked) => handleFieldChange("business_emergency_service", checked)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <div key={day} className="space-y-1">
                    <Label className="text-xs capitalize">{day}</Label>
                    <Input
                      placeholder="8AM - 6PM"
                      value={profile.business_hours[day] || ""}
                      onChange={(e) => handleFieldChange("business_hours", {
                        ...profile.business_hours,
                        [day]: e.target.value
                      })}
                      className="text-sm"
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Input
                    placeholder="Holiday hours..."
                    value={profile.business_hours.notes || ""}
                    onChange={(e) => handleFieldChange("business_hours", {
                      ...profile.business_hours,
                      notes: e.target.value
                    })}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Social Tab */}
        <TabsContent value="social" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourbusiness' },
              { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourbusiness' },
              { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourbusiness' },
              { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourbusiness' },
              { key: 'yelp', label: 'Yelp', placeholder: 'https://yelp.com/biz/yourbusiness' },
              { key: 'google_business', label: 'Google Business', placeholder: 'Your Google Business URL' },
              { key: 'bbb', label: 'BBB', placeholder: 'https://bbb.org/yourbusiness' },
              { key: 'angi', label: 'Angi', placeholder: 'https://angi.com/yourbusiness' },
              { key: 'homeadvisor', label: 'HomeAdvisor', placeholder: 'https://homeadvisor.com/yourbusiness' },
              { key: 'nextdoor', label: 'Nextdoor', placeholder: 'Your Nextdoor URL' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1">
                <Label className="text-sm">{label}</Label>
                <Input
                  placeholder={placeholder}
                  value={profile.business_social_links[key] || ""}
                  onChange={(e) => handleFieldChange("business_social_links", {
                    ...profile.business_social_links,
                    [key]: e.target.value
                  })}
                />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

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
