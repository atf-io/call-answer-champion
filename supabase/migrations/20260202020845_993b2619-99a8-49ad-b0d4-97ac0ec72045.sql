-- Add Retell voice agent configuration columns to ai_agents table
ALTER TABLE public.ai_agents
ADD COLUMN IF NOT EXISTS voice_id text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS voice_model text DEFAULT 'eleven_turbo_v2',
ADD COLUMN IF NOT EXISTS voice_temperature numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS voice_speed numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS volume numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS responsiveness numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS interruption_sensitivity numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS enable_backchannel boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS backchannel_frequency numeric DEFAULT 0.9,
ADD COLUMN IF NOT EXISTS ambient_sound text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ambient_sound_volume numeric DEFAULT 1,
ADD COLUMN IF NOT EXISTS language text DEFAULT 'en-US',
ADD COLUMN IF NOT EXISTS enable_voicemail_detection boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS voicemail_message text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS voicemail_detection_timeout_ms integer DEFAULT 30000,
ADD COLUMN IF NOT EXISTS max_call_duration_ms integer DEFAULT 3600000,
ADD COLUMN IF NOT EXISTS end_call_after_silence_ms integer DEFAULT 600000,
ADD COLUMN IF NOT EXISTS begin_message_delay_ms integer DEFAULT 1000,
ADD COLUMN IF NOT EXISTS normalize_for_speech boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS boosted_keywords text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS reminder_trigger_ms integer DEFAULT 10000,
ADD COLUMN IF NOT EXISTS reminder_max_count integer DEFAULT 2;

-- Add comment for documentation
COMMENT ON COLUMN public.ai_agents.voice_id IS 'Retell voice ID (e.g., 11labs-Adrian)';
COMMENT ON COLUMN public.ai_agents.voice_temperature IS 'Voice temperature 0-2, default 1';
COMMENT ON COLUMN public.ai_agents.voice_speed IS 'Voice speed 0.5-2, default 1';
COMMENT ON COLUMN public.ai_agents.responsiveness IS 'How responsive the agent is 0-1';
COMMENT ON COLUMN public.ai_agents.interruption_sensitivity IS 'How sensitive to interruptions 0-1';