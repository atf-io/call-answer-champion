-- Add crm_config JSONB column to ai_agents table
-- This stores the full AgentCrmConfig object per agent for CRM scheduling context

ALTER TABLE public.ai_agents
ADD COLUMN crm_config jsonb DEFAULT NULL;