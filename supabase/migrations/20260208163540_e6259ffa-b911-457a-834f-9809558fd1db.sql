-- Add prompt column to ai_agents table for storing system prompts
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS prompt text;