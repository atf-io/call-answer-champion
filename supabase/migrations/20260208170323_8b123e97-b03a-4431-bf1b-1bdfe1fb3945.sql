-- Add delivery tracking to sms_messages
ALTER TABLE public.sms_messages ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';
ALTER TABLE public.sms_messages ADD COLUMN IF NOT EXISTS delivery_error TEXT;
ALTER TABLE public.sms_messages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.sms_messages ADD COLUMN IF NOT EXISTS retell_message_id TEXT;

-- Add unique constraint to prevent duplicate enrollments (same phone + campaign)
-- Using DO block to check if constraint exists first
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_phone_campaign'
  ) THEN
    ALTER TABLE public.sms_campaign_enrollments 
    ADD CONSTRAINT unique_phone_campaign UNIQUE (lead_phone, campaign_id);
  END IF;
END $$;

-- Create index for faster enrollment lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_next_message 
ON public.sms_campaign_enrollments (next_message_at) 
WHERE status = 'active' AND next_message_at IS NOT NULL;

-- Create index for conversation phone lookups
CREATE INDEX IF NOT EXISTS idx_conversations_phone_status 
ON public.sms_conversations (lead_phone, status);