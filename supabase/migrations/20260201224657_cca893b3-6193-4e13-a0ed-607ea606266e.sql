-- Add onboarding_completed flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS business_description text,
ADD COLUMN IF NOT EXISTS business_address text,
ADD COLUMN IF NOT EXISTS business_phone text,
ADD COLUMN IF NOT EXISTS business_website text,
ADD COLUMN IF NOT EXISTS business_logo_url text,
ADD COLUMN IF NOT EXISTS business_colors jsonb,
ADD COLUMN IF NOT EXISTS business_services text[],
ADD COLUMN IF NOT EXISTS business_team_info text,
ADD COLUMN IF NOT EXISTS business_faqs jsonb,
ADD COLUMN IF NOT EXISTS business_social_links jsonb;