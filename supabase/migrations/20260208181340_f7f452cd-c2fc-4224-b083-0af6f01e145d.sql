-- CRM Connections - Stores OAuth credentials per user/CRM
CREATE TABLE public.crm_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  crm_type TEXT NOT NULL CHECK (crm_type IN ('jobber', 'servicetitan', 'housecall_pro')),
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  tenant_id TEXT,
  is_active BOOLEAN DEFAULT true,
  sync_settings JSONB DEFAULT '{
    "sync_sms": true,
    "sync_calls": true,
    "auto_sync": true,
    "sync_contacts": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, crm_type)
);

-- CRM Sync Logs - Audit trail for all sync operations
CREATE TABLE public.crm_sync_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  crm_connection_id UUID NOT NULL REFERENCES public.crm_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('communication', 'contact', 'appointment')),
  direction TEXT NOT NULL CHECK (direction IN ('push', 'pull')),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  crm_entity_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CRM Contact Mappings - Links VoiceHub contacts to CRM customers
CREATE TABLE public.crm_contact_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  crm_connection_id UUID NOT NULL REFERENCES public.crm_connections(id) ON DELETE CASCADE,
  crm_customer_id TEXT NOT NULL,
  crm_customer_data JSONB DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, crm_connection_id)
);

-- CRM Scheduling Config - Business units, job types, and scheduling rules
CREATE TABLE public.crm_scheduling_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  crm_connection_id UUID NOT NULL REFERENCES public.crm_connections(id) ON DELETE CASCADE UNIQUE,
  business_units JSONB DEFAULT '[]'::jsonb,
  job_types JSONB DEFAULT '[]'::jsonb,
  technicians JSONB DEFAULT '[]'::jsonb,
  scheduling_rules JSONB DEFAULT '{
    "buffer_minutes": 15,
    "max_days_ahead": 14,
    "default_duration_minutes": 60
  }'::jsonb,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- CRM Webhook Secrets - Webhook authentication per CRM
CREATE TABLE public.crm_webhook_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  crm_type TEXT NOT NULL CHECK (crm_type IN ('jobber', 'servicetitan', 'housecall_pro')),
  secret_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, crm_type)
);

-- Enable RLS on all tables
ALTER TABLE public.crm_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contact_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_scheduling_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_webhook_secrets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_connections
CREATE POLICY "Users can view their own CRM connections"
  ON public.crm_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own CRM connections"
  ON public.crm_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CRM connections"
  ON public.crm_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CRM connections"
  ON public.crm_connections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for crm_sync_logs
CREATE POLICY "Users can view their own sync logs"
  ON public.crm_sync_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync logs"
  ON public.crm_sync_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for crm_contact_mappings
CREATE POLICY "Users can view their own contact mappings"
  ON public.crm_contact_mappings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact mappings"
  ON public.crm_contact_mappings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact mappings"
  ON public.crm_contact_mappings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact mappings"
  ON public.crm_contact_mappings FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for crm_scheduling_config
CREATE POLICY "Users can view their own scheduling config"
  ON public.crm_scheduling_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduling config"
  ON public.crm_scheduling_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduling config"
  ON public.crm_scheduling_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduling config"
  ON public.crm_scheduling_config FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for crm_webhook_secrets
CREATE POLICY "Users can view their own webhook secrets"
  ON public.crm_webhook_secrets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhook secrets"
  ON public.crm_webhook_secrets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhook secrets"
  ON public.crm_webhook_secrets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhook secrets"
  ON public.crm_webhook_secrets FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_crm_connections_updated_at
  BEFORE UPDATE ON public.crm_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_scheduling_config_updated_at
  BEFORE UPDATE ON public.crm_scheduling_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();