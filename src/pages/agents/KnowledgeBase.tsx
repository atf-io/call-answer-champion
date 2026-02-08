import { useState, useEffect } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Sparkles, Globe, Loader2, Save, Building2, Phone, Mail, MapPin, Clock, 
  Shield, Wrench, DollarSign, MessageSquare, AlertTriangle, Truck, FileText,
  CheckCircle
} from "lucide-react";
import { useBusinessProfile, BusinessProfile } from "@/hooks/useBusinessProfile";
import { useKnowledgeBase } from "@/hooks/useKnowledgeBase";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProfileSection } from "@/components/business-profile/ProfileSection";
import { EditableField } from "@/components/business-profile/EditableField";
import { EditableTagList } from "@/components/business-profile/EditableTagList";

interface ScrapedBusinessData {
  business_name: string;
  tagline: string;
  business_description: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  services: string[];
  specialties: string[];
  equipment_brands: string[];
  certifications: string[];
  guarantees: string[];
  payment_methods: string[];
  team_info: string;
  years_in_business: string;
  pricing_info: string;
  business_hours: Record<string, string>;
  emergency_service: boolean;
  service_area: { cities?: string[]; counties?: string[]; states?: string[]; zip_codes?: string[]; radius?: string; description?: string };
  locations: Array<{ name?: string; address?: string; phone?: string; hours?: string }>;
  faqs: { question: string; answer: string }[];
  logo_url: string;
  colors: Record<string, unknown>;
  social_links: Record<string, string>;
}

const KnowledgeBase = () => {
  const { profile, isLoading, updateProfile, isUpdating } = useBusinessProfile();
  const { entries } = useKnowledgeBase();
  
  const [businessUrl, setBusinessUrl] = useState("");
  const [isScrapingBusiness, setIsScrapingBusiness] = useState(false);
  const [localProfile, setLocalProfile] = useState<Partial<BusinessProfile>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (profile) {
      setLocalProfile(profile);
    }
  }, [profile]);

  const updateLocalField = <K extends keyof BusinessProfile>(field: K, value: BusinessProfile[K]) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateProfile(localProfile);
    setHasChanges(false);
  };

  const handleScrapeBusinessWebsite = async () => {
    if (!businessUrl.trim()) return;
    setIsScrapingBusiness(true);
    try {
      const { data: result, error } = await supabase.functions.invoke<{ success: boolean; data: ScrapedBusinessData; error?: string }>('scrape-business', {
        body: { url: businessUrl.trim() }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        toast.error(error.message || 'Failed to scrape website');
        return;
      }
      
      if (result?.success && result.data) {
        // Map scraped data to profile fields
        const updates: Partial<BusinessProfile> = {
          businessName: result.data.business_name || localProfile.businessName,
          businessDescription: result.data.business_description || localProfile.businessDescription,
          businessTagline: result.data.tagline || localProfile.businessTagline,
          businessWebsite: result.data.website || businessUrl,
          businessLogoUrl: result.data.logo_url || localProfile.businessLogoUrl,
          businessPhone: result.data.phone || localProfile.businessPhone,
          businessEmail: result.data.email || localProfile.businessEmail,
          businessAddress: result.data.address || localProfile.businessAddress,
          businessYearsInBusiness: result.data.years_in_business || localProfile.businessYearsInBusiness,
          businessServices: result.data.services?.length ? result.data.services : localProfile.businessServices,
          businessSpecialties: result.data.specialties?.length ? result.data.specialties : localProfile.businessSpecialties,
          businessEquipmentBrands: result.data.equipment_brands?.length ? result.data.equipment_brands : localProfile.businessEquipmentBrands,
          businessCertifications: result.data.certifications?.length ? result.data.certifications : localProfile.businessCertifications,
          businessGuarantees: result.data.guarantees?.length ? result.data.guarantees : localProfile.businessGuarantees,
          businessPaymentMethods: result.data.payment_methods?.length ? result.data.payment_methods : localProfile.businessPaymentMethods,
          businessTeamInfo: result.data.team_info || localProfile.businessTeamInfo,
          businessPricingInfo: result.data.pricing_info || localProfile.businessPricingInfo,
          businessHours: Object.keys(result.data.business_hours || {}).length ? result.data.business_hours : localProfile.businessHours,
          businessEmergencyService: result.data.emergency_service ?? localProfile.businessEmergencyService,
          businessServiceArea: {
            cities: result.data.service_area?.cities || localProfile.businessServiceArea?.cities,
            counties: result.data.service_area?.counties || localProfile.businessServiceArea?.counties,
            states: result.data.service_area?.states || localProfile.businessServiceArea?.states,
            zipCodes: result.data.service_area?.zip_codes || localProfile.businessServiceArea?.zipCodes,
            radius: result.data.service_area?.radius || localProfile.businessServiceArea?.radius,
            description: result.data.service_area?.description || localProfile.businessServiceArea?.description,
          },
          businessLocations: result.data.locations?.length ? result.data.locations : localProfile.businessLocations,
          businessFaqs: result.data.faqs?.length ? result.data.faqs : localProfile.businessFaqs,
          businessSocialLinks: Object.keys(result.data.social_links || {}).length ? result.data.social_links : localProfile.businessSocialLinks,
          businessColors: Object.keys(result.data.colors || {}).length ? result.data.colors : localProfile.businessColors,
        };
        setLocalProfile(prev => ({ ...prev, ...updates }));
        setHasChanges(true);
        toast.success('Business information extracted! Review and save your changes.');
      } else {
        toast.error(result.error || 'Failed to extract business information');
      }
    } catch (error) {
      console.error('Error scraping business:', error);
      toast.error('Failed to scrape website. Please check the URL and try again.');
    } finally {
      setIsScrapingBusiness(false);
    }
  };

  if (isLoading) {
    return (
      <AgentLayout title="Business Profile" description="Configure your business information for AI agents">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout
      title="Business Profile"
      description="Configure your business information to power your AI agents"
    >
      <div className="space-y-6">
        {/* Website Scanner */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Scan Your Business Website</CardTitle>
                <CardDescription>
                  Enter your website URL to automatically extract business details
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="https://yourbusiness.com"
                  value={businessUrl}
                  onChange={(e) => setBusinessUrl(e.target.value)}
                  className="pl-10"
                  disabled={isScrapingBusiness}
                />
              </div>
              <Button onClick={handleScrapeBusinessWebsite} disabled={isScrapingBusiness || !businessUrl.trim()}>
                {isScrapingBusiness ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Scan Website
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save All Changes</>
              )}
            </Button>
          </div>
        )}

        {/* Profile Sections */}
        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="intake">Lead Intake</TabsTrigger>
            <TabsTrigger value="sales">Sales & Finance</TabsTrigger>
            <TabsTrigger value="voice">Voice & Tone</TabsTrigger>
          </TabsList>

          {/* Identity & Authority */}
          <TabsContent value="identity" className="space-y-6">
            <ProfileSection
              title="Business Identity & Authority"
              description="Core business information and credentials that establish trust"
              icon={Building2}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <EditableField
                  label="Legal Business Name"
                  value={localProfile.businessName ?? null}
                  onChange={(v) => updateLocalField('businessName', v)}
                  icon={Building2}
                  placeholder="Your Business Name"
                />
                <EditableField
                  label="Tagline/Slogan"
                  value={localProfile.businessTagline ?? null}
                  onChange={(v) => updateLocalField('businessTagline', v)}
                  placeholder="Your catchy tagline"
                />
                <EditableField
                  label="Website"
                  value={localProfile.businessWebsite ?? null}
                  onChange={(v) => updateLocalField('businessWebsite', v)}
                  icon={Globe}
                  placeholder="https://yourbusiness.com"
                />
                <EditableField
                  label="Years in Business"
                  value={localProfile.businessYearsInBusiness ?? null}
                  onChange={(v) => updateLocalField('businessYearsInBusiness', v)}
                  placeholder="e.g., 15 years, Since 2008"
                />
              </div>
              <EditableField
                label="Business Description"
                value={localProfile.businessDescription ?? null}
                onChange={(v) => updateLocalField('businessDescription', v)}
                placeholder="Describe what your business does, your mission, and value proposition..."
                multiline
              />
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" />
                  License Numbers
                </Label>
                <EditableTagList
                  tags={localProfile.businessLicenseNumbers ?? []}
                  onChange={(v) => updateLocalField('businessLicenseNumbers', v)}
                  placeholder="Add license (e.g., C-36 Plumbing)"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Certifications
                </Label>
                <EditableTagList
                  tags={localProfile.businessCertifications ?? []}
                  onChange={(v) => updateLocalField('businessCertifications', v)}
                  placeholder="Add certification (e.g., NATE, EPA)"
                />
              </div>

              <EditableField
                label="Insurance Status"
                value={localProfile.businessInsuranceStatus ?? null}
                onChange={(v) => updateLocalField('businessInsuranceStatus', v)}
                placeholder="e.g., Fully insured - General liability and worker's comp"
              />

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Value Propositions & Guarantees</Label>
                <EditableTagList
                  tags={[...(localProfile.businessValuePropositions ?? []), ...(localProfile.businessGuarantees ?? [])]}
                  onChange={(v) => {
                    updateLocalField('businessValuePropositions', v);
                    updateLocalField('businessGuarantees', []);
                  }}
                  placeholder="Add guarantee (e.g., 24-hour repair, No-Surprise Pricing)"
                />
              </div>
            </ProfileSection>

            <ProfileSection
              title="Contact Information"
              description="How customers can reach your business"
              icon={Phone}
            >
              <div className="grid md:grid-cols-2 gap-4">
                <EditableField
                  label="Phone"
                  value={localProfile.businessPhone ?? null}
                  onChange={(v) => updateLocalField('businessPhone', v)}
                  icon={Phone}
                  placeholder="(555) 123-4567"
                />
                <EditableField
                  label="Email"
                  value={localProfile.businessEmail ?? null}
                  onChange={(v) => updateLocalField('businessEmail', v)}
                  icon={Mail}
                  placeholder="info@yourbusiness.com"
                />
              </div>
              <EditableField
                label="Primary Address"
                value={localProfile.businessAddress ?? null}
                onChange={(v) => updateLocalField('businessAddress', v)}
                icon={MapPin}
                placeholder="123 Main St, City, State ZIP"
              />
              <EditableField
                label="Dispatch Center Address"
                value={localProfile.businessDispatchAddress ?? null}
                onChange={(v) => updateLocalField('businessDispatchAddress', v)}
                icon={Truck}
                placeholder="Dispatch location if different from primary"
              />
            </ProfileSection>
          </TabsContent>

          {/* Services */}
          <TabsContent value="services" className="space-y-6">
            <ProfileSection
              title="Service Logic & Constraints"
              description="What services you offer and don't offer"
              icon={Wrench}
            >
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Service Categories (Core Trades)</Label>
                <EditableTagList
                  tags={localProfile.businessServiceCategories ?? []}
                  onChange={(v) => updateLocalField('businessServiceCategories', v)}
                  placeholder="Add category (e.g., HVAC, Plumbing, Electrical)"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Specific Services</Label>
                <EditableTagList
                  tags={localProfile.businessServices ?? []}
                  onChange={(v) => updateLocalField('businessServices', v)}
                  placeholder="Add service (e.g., AC Repair, Water Heater Installation)"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Sub-Services / Specializations</Label>
                <EditableTagList
                  tags={localProfile.businessSubServices ?? []}
                  onChange={(v) => updateLocalField('businessSubServices', v)}
                  placeholder="Add sub-service (e.g., Slab Leak Detection, Panel Upgrades)"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Specialties</Label>
                <EditableTagList
                  tags={localProfile.businessSpecialties ?? []}
                  onChange={(v) => updateLocalField('businessSpecialties', v)}
                  placeholder="Add specialty"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Brands We Service</Label>
                  <EditableTagList
                    tags={localProfile.businessBrandsServiced ?? []}
                    onChange={(v) => updateLocalField('businessBrandsServiced', v)}
                    placeholder="Add brand we service"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Brands We Sell/Install</Label>
                  <EditableTagList
                    tags={localProfile.businessBrandsSold ?? []}
                    onChange={(v) => updateLocalField('businessBrandsSold', v)}
                    placeholder="Add brand we sell"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Equipment Brands</Label>
                <EditableTagList
                  tags={localProfile.businessEquipmentBrands ?? []}
                  onChange={(v) => updateLocalField('businessEquipmentBrands', v)}
                  placeholder="Add equipment brand"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Service Exclusions (What We DON'T Do)
                </Label>
                <EditableTagList
                  tags={localProfile.businessExclusions ?? []}
                  onChange={(v) => updateLocalField('businessExclusions', v)}
                  placeholder="Add exclusion (e.g., No commercial refrigeration)"
                />
              </div>

              <EditableField
                label="Emergency Definition"
                value={localProfile.businessEmergencyDefinition ?? null}
                onChange={(v) => updateLocalField('businessEmergencyDefinition', v)}
                placeholder="What triggers after-hours dispatch vs next-day appointment?"
                multiline
              />
            </ProfileSection>
          </TabsContent>

          {/* Operations */}
          <TabsContent value="operations" className="space-y-6">
            <ProfileSection
              title="Geographic & Operational Data"
              description="Where and when you operate"
              icon={MapPin}
            >
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Cities Served</Label>
                <EditableTagList
                  tags={localProfile.businessServiceArea?.cities ?? []}
                  onChange={(v) => updateLocalField('businessServiceArea', { ...localProfile.businessServiceArea, cities: v })}
                  placeholder="Add city"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Counties Served</Label>
                <EditableTagList
                  tags={localProfile.businessServiceArea?.counties ?? []}
                  onChange={(v) => updateLocalField('businessServiceArea', { ...localProfile.businessServiceArea, counties: v })}
                  placeholder="Add county"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <EditableField
                  label="Service Radius"
                  value={localProfile.businessServiceArea?.radius ?? null}
                  onChange={(v) => updateLocalField('businessServiceArea', { ...localProfile.businessServiceArea, radius: v })}
                  placeholder="e.g., 50 miles from downtown"
                />
                <EditableField
                  label="Dispatch Fee"
                  value={localProfile.businessDispatchFee ?? null}
                  onChange={(v) => updateLocalField('businessDispatchFee', v)}
                  placeholder="e.g., $89 trip charge (applied to repair)"
                />
              </div>
            </ProfileSection>

            <ProfileSection
              title="Business Hours"
              description="Standard operating hours and after-hours policy"
              icon={Clock}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                  <div key={day} className="space-y-1">
                    <Label className="text-xs capitalize text-muted-foreground">{day}</Label>
                    <Input
                      value={localProfile.businessHours?.[day] ?? ""}
                      onChange={(e) => updateLocalField('businessHours', { ...localProfile.businessHours, [day]: e.target.value })}
                      placeholder="9am-5pm"
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Switch
                  checked={localProfile.businessEmergencyService ?? false}
                  onCheckedChange={(v) => updateLocalField('businessEmergencyService', v)}
                />
                <Label>24/7 Emergency Service Available</Label>
              </div>

              <EditableField
                label="After-Hours Policy"
                value={localProfile.businessAfterHoursPolicy ?? null}
                onChange={(v) => updateLocalField('businessAfterHoursPolicy', v)}
                placeholder="Describe availability for nights, holidays, weekends..."
                multiline
              />
            </ProfileSection>
          </TabsContent>

          {/* Lead Intake */}
          <TabsContent value="intake" className="space-y-6">
            <ProfileSection
              title="Lead Qualification Questions"
              description="Information to collect during the intake process"
              icon={FileText}
            >
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  Safety Triggers (Red-Flag Keywords)
                </Label>
                <EditableTagList
                  tags={localProfile.businessSafetyTriggers ?? []}
                  onChange={(v) => updateLocalField('businessSafetyTriggers', v)}
                  placeholder="Add trigger (e.g., Smell of gas, Sparks, Total power loss)"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Diagnostic Questions to Ask</Label>
                <EditableTagList
                  tags={localProfile.businessDiagnosticQuestions ?? []}
                  onChange={(v) => updateLocalField('businessDiagnosticQuestions', v)}
                  placeholder="Add question (e.g., When did the issue start?)"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Property Types Served</Label>
                <EditableTagList
                  tags={localProfile.businessPropertyTypes ?? []}
                  onChange={(v) => updateLocalField('businessPropertyTypes', v)}
                  placeholder="Add type (e.g., Residential, Commercial, HOA, Multi-family)"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Equipment Locations to Ask About</Label>
                <EditableTagList
                  tags={localProfile.businessEquipmentLocations ?? []}
                  onChange={(v) => updateLocalField('businessEquipmentLocations', v)}
                  placeholder="Add location (e.g., Attic, Crawlspace, Rooftop, Basement)"
                />
              </div>
            </ProfileSection>
          </TabsContent>

          {/* Sales & Finance */}
          <TabsContent value="sales" className="space-y-6">
            <ProfileSection
              title="Pricing & Payment"
              description="Pricing model, payment methods, and financing options"
              icon={DollarSign}
            >
              <EditableField
                label="Pricing Model"
                value={localProfile.businessPricingModel ?? null}
                onChange={(v) => updateLocalField('businessPricingModel', v)}
                placeholder="e.g., Flat-rate pricing, Hourly rates, Starting at $X"
              />

              <EditableField
                label="Pricing Details"
                value={localProfile.businessPricingInfo ?? null}
                onChange={(v) => updateLocalField('businessPricingInfo', v)}
                placeholder="Additional pricing information, estimates, etc."
                multiline
              />

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Accepted Payment Methods</Label>
                <EditableTagList
                  tags={localProfile.businessPaymentMethods ?? []}
                  onChange={(v) => updateLocalField('businessPaymentMethods', v)}
                  placeholder="Add method (e.g., Cash, Check, Visa, Venmo)"
                />
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="financing">
                  <AccordionTrigger>Financing Options</AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <EditableField
                      label="Financing Partners"
                      value={localProfile.businessFinancingOptions?.partners?.join(', ') ?? null}
                      onChange={(v) => updateLocalField('businessFinancingOptions', { 
                        ...localProfile.businessFinancingOptions, 
                        partners: v.split(',').map(s => s.trim()).filter(Boolean) 
                      })}
                      placeholder="e.g., Synchrony, GoodLeap"
                    />
                    <EditableField
                      label="Minimum Project Amount for Financing"
                      value={localProfile.businessFinancingOptions?.minimumAmount ?? null}
                      onChange={(v) => updateLocalField('businessFinancingOptions', { 
                        ...localProfile.businessFinancingOptions, 
                        minimumAmount: v 
                      })}
                      placeholder="e.g., $1,000"
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="discounts">
                  <AccordionTrigger>Discounts</AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <EditableField
                      label="Senior Discount"
                      value={localProfile.businessDiscounts?.senior ?? null}
                      onChange={(v) => updateLocalField('businessDiscounts', { ...localProfile.businessDiscounts, senior: v })}
                      placeholder="e.g., 10% off for seniors 65+"
                    />
                    <EditableField
                      label="Military Discount"
                      value={localProfile.businessDiscounts?.military ?? null}
                      onChange={(v) => updateLocalField('businessDiscounts', { ...localProfile.businessDiscounts, military: v })}
                      placeholder="e.g., 15% off for veterans"
                    />
                    <EditableField
                      label="Other Discounts"
                      value={localProfile.businessDiscounts?.other ?? null}
                      onChange={(v) => updateLocalField('businessDiscounts', { ...localProfile.businessDiscounts, other: v })}
                      placeholder="e.g., First-time customer discount"
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </ProfileSection>
          </TabsContent>

          {/* Voice & Tone */}
          <TabsContent value="voice" className="space-y-6">
            <ProfileSection
              title="Brand Voice & Tone"
              description="How your AI agents should communicate"
              icon={MessageSquare}
            >
              <EditableField
                label="Communication Style"
                value={localProfile.businessCommunicationStyle ?? null}
                onChange={(v) => updateLocalField('businessCommunicationStyle', v)}
                placeholder="e.g., Professional & Direct, Neighborly & Casual, Warm & Empathetic"
              />

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Key Phrases & Scripts</Label>
                <EditableTagList
                  tags={localProfile.businessKeyPhrases ?? []}
                  onChange={(v) => updateLocalField('businessKeyPhrases', v)}
                  placeholder="Add phrase the AI should use"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Review Themes (Social Proof)</Label>
                <EditableTagList
                  tags={localProfile.businessReviewThemes ?? []}
                  onChange={(v) => updateLocalField('businessReviewThemes', v)}
                  placeholder="Add theme from top reviews (e.g., Fast response time)"
                />
              </div>

              <EditableField
                label="Team Information"
                value={localProfile.businessTeamInfo ?? null}
                onChange={(v) => updateLocalField('businessTeamInfo', v)}
                placeholder="Information about your team, staff, or company history..."
                multiline
              />
            </ProfileSection>
          </TabsContent>
        </Tabs>

        {/* Hidden Knowledge Base Entries Info */}
        {entries.length > 0 && (
          <Card className="border-dashed opacity-60">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground text-center">
                {entries.length} knowledge base entries stored (managed separately)
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AgentLayout>
  );
};

export default KnowledgeBase;
