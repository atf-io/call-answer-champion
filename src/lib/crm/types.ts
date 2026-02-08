// CRM Types for VoiceHub integration

export type CrmType = 'jobber' | 'servicetitan' | 'housecall_pro';

export interface CrmConnection {
  id: string;
  user_id: string;
  crm_type: CrmType;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  tenant_id: string | null;
  is_active: boolean;
  sync_settings: CrmSyncSettings;
  created_at: string;
  updated_at: string;
}

export interface CrmSyncSettings {
  sync_sms: boolean;
  sync_calls: boolean;
  auto_sync: boolean;
  sync_contacts: boolean;
}

// Agent-level CRM configuration
export interface AgentCrmConfig {
  crm_type: CrmType;
  is_enabled: boolean;
  communication_settings: CommunicationSettings;
  sync_triggers: SyncTriggers;
  scheduling_config: AgentSchedulingConfig;
  field_mapping: FieldMapping[];
}

export interface CommunicationSettings {
  note_destination: 'client_notes' | 'job_notes' | 'request_notes' | 'custom_field';
  custom_field_id?: string;
  include_transcript: boolean;
  include_sentiment: boolean;
  note_prefix: string;
}

export interface SyncTriggers {
  on_message_sent: boolean;
  on_call_end: boolean;
  on_conversation_end: boolean;
  batch_sync_enabled: boolean;
  batch_sync_interval_minutes: number;
}

export interface AgentSchedulingConfig {
  enabled: boolean;
  default_product_or_service_id?: string;
  default_product_or_service_name?: string;
  technician_assignment: 'any_available' | 'round_robin' | 'specific';
  specific_technician_id?: string;
  specific_technician_name?: string;
  service_window_hours: number;
  require_confirmation: boolean;
  confirmation_message?: string;
}

export interface FieldMapping {
  voicehub_field: string;
  crm_field_id: string;
  crm_field_name: string;
  is_required: boolean;
}

export interface CrmSyncLog {
  id: string;
  user_id: string;
  crm_connection_id: string;
  sync_type: 'communication' | 'contact' | 'appointment';
  direction: 'push' | 'pull';
  entity_type: string;
  entity_id: string | null;
  crm_entity_id: string | null;
  status: 'success' | 'failed' | 'pending';
  error_message: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface CrmContactMapping {
  id: string;
  user_id: string;
  contact_id: string;
  crm_connection_id: string;
  crm_customer_id: string;
  crm_customer_data: Record<string, unknown>;
  last_synced_at: string | null;
  created_at: string;
}

export interface CrmSchedulingConfig {
  id: string;
  user_id: string;
  crm_connection_id: string;
  business_units: CrmBusinessUnit[];
  job_types: CrmJobType[];
  technicians: CrmTechnician[];
  scheduling_rules: CrmSchedulingRules;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmBusinessUnit {
  id: string;
  name: string;
  is_active: boolean;
}

export interface CrmJobType {
  id: string;
  name: string;
  duration_minutes: number;
  business_unit_id?: string;
}

export interface CrmTechnician {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  is_active: boolean;
}

export interface CrmSchedulingRules {
  buffer_minutes: number;
  max_days_ahead: number;
  default_duration_minutes: number;
}

export interface CrmWebhookSecret {
  id: string;
  user_id: string;
  crm_type: CrmType;
  secret_key: string;
  is_active: boolean;
  created_at: string;
}

// CRM Provider metadata
export interface CrmProvider {
  id: CrmType;
  name: string;
  description: string;
  logo: string;
  color: string;
  features: string[];
  docsUrl: string;
}

// OAuth flow types
export interface CrmOAuthInitRequest {
  crm_type: CrmType;
  redirect_uri: string;
}

export interface CrmOAuthCallbackRequest {
  crm_type: CrmType;
  code: string;
  state?: string;
}

export interface CrmOAuthResponse {
  success: boolean;
  connection_id?: string;
  error?: string;
}
