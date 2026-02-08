-- Add retry tracking columns to sms_messages
ALTER TABLE public.sms_messages ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TABLE public.sms_messages ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;
ALTER TABLE public.sms_messages ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3;

-- Create index for retry processing
CREATE INDEX IF NOT EXISTS idx_messages_retry 
ON public.sms_messages (next_retry_at) 
WHERE delivery_status = 'failed' AND next_retry_at IS NOT NULL AND retry_count < 3;