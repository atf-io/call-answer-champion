import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BusinessProfile {
  // Business Identity & Authority
  businessName: string | null;
  businessDescription: string | null;
  businessTagline: string | null;
  businessWebsite: string | null;
  businessLogoUrl: string | null;
  businessYearsInBusiness: string | null;
  businessCertifications: string[];
  businessLicenseNumbers: string[];
  businessInsuranceStatus: string | null;
  businessValuePropositions: string[];
  businessGuarantees: string[];

  // Contact & Location
  businessPhone: string | null;
  businessEmail: string | null;
  businessAddress: string | null;
  businessDispatchAddress: string | null;
  businessLocations: Array<{ name?: string; address?: string; phone?: string; hours?: string }>;

  // Service Logic & Constraints
  businessServiceCategories: string[];
  businessServices: string[];
  businessSubServices: string[];
  businessSpecialties: string[];
  businessEquipmentBrands: string[];
  businessBrandsServiced: string[];
  businessBrandsSold: string[];
  businessExclusions: string[];
  businessEmergencyDefinition: string | null;

  // Geographic & Operational Data
  businessServiceArea: {
    cities?: string[];
    counties?: string[];
    states?: string[];
    zipCodes?: string[];
    radius?: string;
    description?: string;
  };
  businessHours: Record<string, string>;
  businessEmergencyService: boolean;
  businessAfterHoursPolicy: string | null;
  businessDispatchFee: string | null;

  // Lead Qualification / Intake
  businessSafetyTriggers: string[];
  businessDiagnosticQuestions: string[];
  businessPropertyTypes: string[];
  businessEquipmentLocations: string[];
  businessUrgencyLevels: Record<string, string>;

  // Sales & Finance
  businessPricingModel: string | null;
  businessPricingInfo: string | null;
  businessPaymentMethods: string[];
  businessFinancingOptions: { partners?: string[]; minimumAmount?: string; details?: string };
  businessActivePromotions: Array<{ name?: string; description?: string; validUntil?: string }>;
  businessDiscounts: { senior?: string; military?: string; other?: string };

  // Brand Voice & Tone
  businessCommunicationStyle: string | null;
  businessKeyPhrases: string[];
  businessReviewThemes: string[];
  businessTeamInfo: string | null;

  // FAQs & Social
  businessFaqs: Array<{ question: string; answer: string }>;
  businessSocialLinks: Record<string, string>;
  businessColors: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProfileFromDb(data: any): BusinessProfile | null {
  if (!data) return null;
  return {
    businessName: data.business_name,
    businessDescription: data.business_description,
    businessTagline: data.business_tagline,
    businessWebsite: data.business_website,
    businessLogoUrl: data.business_logo_url,
    businessYearsInBusiness: data.business_years_in_business,
    businessCertifications: data.business_certifications ?? [],
    businessLicenseNumbers: data.business_license_numbers ?? [],
    businessInsuranceStatus: data.business_insurance_status,
    businessValuePropositions: data.business_value_propositions ?? [],
    businessGuarantees: data.business_guarantees ?? [],

    businessPhone: data.business_phone,
    businessEmail: data.business_email,
    businessAddress: data.business_address,
    businessDispatchAddress: data.business_dispatch_address,
    businessLocations: data.business_locations ?? [],

    businessServiceCategories: data.business_service_categories ?? [],
    businessServices: data.business_services ?? [],
    businessSubServices: data.business_sub_services ?? [],
    businessSpecialties: data.business_specialties ?? [],
    businessEquipmentBrands: data.business_equipment_brands ?? [],
    businessBrandsServiced: data.business_brands_serviced ?? [],
    businessBrandsSold: data.business_brands_sold ?? [],
    businessExclusions: data.business_exclusions ?? [],
    businessEmergencyDefinition: data.business_emergency_definition,

    businessServiceArea: data.business_service_area ?? {},
    businessHours: data.business_hours ?? {},
    businessEmergencyService: data.business_emergency_service ?? false,
    businessAfterHoursPolicy: data.business_after_hours_policy,
    businessDispatchFee: data.business_dispatch_fee,

    businessSafetyTriggers: data.business_safety_triggers ?? [],
    businessDiagnosticQuestions: data.business_diagnostic_questions ?? [],
    businessPropertyTypes: data.business_property_types ?? [],
    businessEquipmentLocations: data.business_equipment_locations ?? [],
    businessUrgencyLevels: data.business_urgency_levels ?? {},

    businessPricingModel: data.business_pricing_model,
    businessPricingInfo: data.business_pricing_info,
    businessPaymentMethods: data.business_payment_methods ?? [],
    businessFinancingOptions: data.business_financing_options ?? {},
    businessActivePromotions: data.business_active_promotions ?? [],
    businessDiscounts: data.business_discounts ?? {},

    businessCommunicationStyle: data.business_communication_style,
    businessKeyPhrases: data.business_key_phrases ?? [],
    businessReviewThemes: data.business_review_themes ?? [],
    businessTeamInfo: data.business_team_info,

    businessFaqs: data.business_faqs ?? [],
    businessSocialLinks: data.business_social_links ?? {},
    businessColors: data.business_colors ?? {},
  };
}

function mapProfileToDb(updates: Partial<BusinessProfile>): Record<string, unknown> {
  const dbUpdates: Record<string, unknown> = {};
  
  if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName;
  if (updates.businessDescription !== undefined) dbUpdates.business_description = updates.businessDescription;
  if (updates.businessTagline !== undefined) dbUpdates.business_tagline = updates.businessTagline;
  if (updates.businessWebsite !== undefined) dbUpdates.business_website = updates.businessWebsite;
  if (updates.businessLogoUrl !== undefined) dbUpdates.business_logo_url = updates.businessLogoUrl;
  if (updates.businessYearsInBusiness !== undefined) dbUpdates.business_years_in_business = updates.businessYearsInBusiness;
  if (updates.businessCertifications !== undefined) dbUpdates.business_certifications = updates.businessCertifications;
  if (updates.businessLicenseNumbers !== undefined) dbUpdates.business_license_numbers = updates.businessLicenseNumbers;
  if (updates.businessInsuranceStatus !== undefined) dbUpdates.business_insurance_status = updates.businessInsuranceStatus;
  if (updates.businessValuePropositions !== undefined) dbUpdates.business_value_propositions = updates.businessValuePropositions;
  if (updates.businessGuarantees !== undefined) dbUpdates.business_guarantees = updates.businessGuarantees;

  if (updates.businessPhone !== undefined) dbUpdates.business_phone = updates.businessPhone;
  if (updates.businessEmail !== undefined) dbUpdates.business_email = updates.businessEmail;
  if (updates.businessAddress !== undefined) dbUpdates.business_address = updates.businessAddress;
  if (updates.businessDispatchAddress !== undefined) dbUpdates.business_dispatch_address = updates.businessDispatchAddress;
  if (updates.businessLocations !== undefined) dbUpdates.business_locations = updates.businessLocations;

  if (updates.businessServiceCategories !== undefined) dbUpdates.business_service_categories = updates.businessServiceCategories;
  if (updates.businessServices !== undefined) dbUpdates.business_services = updates.businessServices;
  if (updates.businessSubServices !== undefined) dbUpdates.business_sub_services = updates.businessSubServices;
  if (updates.businessSpecialties !== undefined) dbUpdates.business_specialties = updates.businessSpecialties;
  if (updates.businessEquipmentBrands !== undefined) dbUpdates.business_equipment_brands = updates.businessEquipmentBrands;
  if (updates.businessBrandsServiced !== undefined) dbUpdates.business_brands_serviced = updates.businessBrandsServiced;
  if (updates.businessBrandsSold !== undefined) dbUpdates.business_brands_sold = updates.businessBrandsSold;
  if (updates.businessExclusions !== undefined) dbUpdates.business_exclusions = updates.businessExclusions;
  if (updates.businessEmergencyDefinition !== undefined) dbUpdates.business_emergency_definition = updates.businessEmergencyDefinition;

  if (updates.businessServiceArea !== undefined) dbUpdates.business_service_area = updates.businessServiceArea;
  if (updates.businessHours !== undefined) dbUpdates.business_hours = updates.businessHours;
  if (updates.businessEmergencyService !== undefined) dbUpdates.business_emergency_service = updates.businessEmergencyService;
  if (updates.businessAfterHoursPolicy !== undefined) dbUpdates.business_after_hours_policy = updates.businessAfterHoursPolicy;
  if (updates.businessDispatchFee !== undefined) dbUpdates.business_dispatch_fee = updates.businessDispatchFee;

  if (updates.businessSafetyTriggers !== undefined) dbUpdates.business_safety_triggers = updates.businessSafetyTriggers;
  if (updates.businessDiagnosticQuestions !== undefined) dbUpdates.business_diagnostic_questions = updates.businessDiagnosticQuestions;
  if (updates.businessPropertyTypes !== undefined) dbUpdates.business_property_types = updates.businessPropertyTypes;
  if (updates.businessEquipmentLocations !== undefined) dbUpdates.business_equipment_locations = updates.businessEquipmentLocations;
  if (updates.businessUrgencyLevels !== undefined) dbUpdates.business_urgency_levels = updates.businessUrgencyLevels;

  if (updates.businessPricingModel !== undefined) dbUpdates.business_pricing_model = updates.businessPricingModel;
  if (updates.businessPricingInfo !== undefined) dbUpdates.business_pricing_info = updates.businessPricingInfo;
  if (updates.businessPaymentMethods !== undefined) dbUpdates.business_payment_methods = updates.businessPaymentMethods;
  if (updates.businessFinancingOptions !== undefined) dbUpdates.business_financing_options = updates.businessFinancingOptions;
  if (updates.businessActivePromotions !== undefined) dbUpdates.business_active_promotions = updates.businessActivePromotions;
  if (updates.businessDiscounts !== undefined) dbUpdates.business_discounts = updates.businessDiscounts;

  if (updates.businessCommunicationStyle !== undefined) dbUpdates.business_communication_style = updates.businessCommunicationStyle;
  if (updates.businessKeyPhrases !== undefined) dbUpdates.business_key_phrases = updates.businessKeyPhrases;
  if (updates.businessReviewThemes !== undefined) dbUpdates.business_review_themes = updates.businessReviewThemes;
  if (updates.businessTeamInfo !== undefined) dbUpdates.business_team_info = updates.businessTeamInfo;

  if (updates.businessFaqs !== undefined) dbUpdates.business_faqs = updates.businessFaqs;
  if (updates.businessSocialLinks !== undefined) dbUpdates.business_social_links = updates.businessSocialLinks;
  if (updates.businessColors !== undefined) dbUpdates.business_colors = updates.businessColors;

  return dbUpdates;
}

export const useBusinessProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile = null, isLoading, error } = useQuery({
    queryKey: ['business-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching business profile:', error);
        return null;
      }
      return mapProfileFromDb(data);
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<BusinessProfile>) => {
      if (!user) throw new Error('Not authenticated');
      
      const dbUpdates = mapProfileToDb(updates);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return mapProfileFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-profile'] });
      toast.success('Business profile updated');
    },
    onError: (error) => {
      console.error('Error updating profile:', error);
      toast.error('Failed to update business profile');
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile: updateMutation.mutate,
    updateProfileAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};
