-- Add comprehensive business profile fields to the profiles table

-- Business Identity & Authority
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_license_numbers text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_insurance_status text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_value_propositions text[] DEFAULT '{}';

-- Service Logic & Constraints  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_service_categories text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_sub_services text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_brands_serviced text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_brands_sold text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_exclusions text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_emergency_definition text;

-- Geographic & Operational Data
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_dispatch_address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_after_hours_policy text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_dispatch_fee text;

-- Lead Qualification / Intake
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_safety_triggers text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_diagnostic_questions text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_property_types text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_equipment_locations text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_urgency_levels jsonb DEFAULT '{}';

-- Sales & Finance
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_pricing_model text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_financing_options jsonb DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_active_promotions jsonb DEFAULT '[]';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_discounts jsonb DEFAULT '{}';

-- Brand Voice & Tone
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_communication_style text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_key_phrases text[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_review_themes text[] DEFAULT '{}';