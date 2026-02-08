export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_function_assignments: {
        Row: {
          created_at: string
          custom_failure_message: string | null
          custom_success_message: string | null
          function_id: string
          id: string
          is_enabled: boolean | null
          sms_agent_id: string | null
          voice_agent_id: string | null
        }
        Insert: {
          created_at?: string
          custom_failure_message?: string | null
          custom_success_message?: string | null
          function_id: string
          id?: string
          is_enabled?: boolean | null
          sms_agent_id?: string | null
          voice_agent_id?: string | null
        }
        Update: {
          created_at?: string
          custom_failure_message?: string | null
          custom_success_message?: string | null
          function_id?: string
          id?: string
          is_enabled?: boolean | null
          sms_agent_id?: string | null
          voice_agent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_function_assignments_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "agent_functions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_function_assignments_sms_agent_id_fkey"
            columns: ["sms_agent_id"]
            isOneToOne: false
            referencedRelation: "sms_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_function_assignments_voice_agent_id_fkey"
            columns: ["voice_agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_functions: {
        Row: {
          category: string
          created_at: string
          description: string
          display_name: string
          failure_message: string | null
          id: string
          is_active: boolean | null
          is_predefined: boolean | null
          name: string
          parameters: Json | null
          success_message: string | null
          updated_at: string
          user_id: string
          webhook_headers: Json | null
          webhook_method: string | null
          webhook_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          display_name: string
          failure_message?: string | null
          id?: string
          is_active?: boolean | null
          is_predefined?: boolean | null
          name: string
          parameters?: Json | null
          success_message?: string | null
          updated_at?: string
          user_id: string
          webhook_headers?: Json | null
          webhook_method?: string | null
          webhook_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          display_name?: string
          failure_message?: string | null
          id?: string
          is_active?: boolean | null
          is_predefined?: boolean | null
          name?: string
          parameters?: Json | null
          success_message?: string | null
          updated_at?: string
          user_id?: string
          webhook_headers?: Json | null
          webhook_method?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      ai_agents: {
        Row: {
          ambient_sound: string | null
          ambient_sound_volume: number | null
          avg_duration_seconds: number | null
          backchannel_frequency: number | null
          begin_message_delay_ms: number | null
          boosted_keywords: string[] | null
          created_at: string
          enable_backchannel: boolean | null
          enable_voicemail_detection: boolean | null
          end_call_after_silence_ms: number | null
          greeting_message: string | null
          id: string
          interruption_sensitivity: number | null
          is_active: boolean | null
          language: string | null
          max_call_duration_ms: number | null
          name: string
          normalize_for_speech: boolean | null
          personality: string | null
          prompt: string | null
          reminder_max_count: number | null
          reminder_trigger_ms: number | null
          responsiveness: number | null
          retell_agent_id: string | null
          satisfaction_score: number | null
          schedule_days: string[] | null
          schedule_end: string | null
          schedule_start: string | null
          total_calls: number | null
          updated_at: string
          user_id: string
          voice_id: string | null
          voice_model: string | null
          voice_speed: number | null
          voice_temperature: number | null
          voice_type: string | null
          voicemail_detection_timeout_ms: number | null
          voicemail_message: string | null
          volume: number | null
        }
        Insert: {
          ambient_sound?: string | null
          ambient_sound_volume?: number | null
          avg_duration_seconds?: number | null
          backchannel_frequency?: number | null
          begin_message_delay_ms?: number | null
          boosted_keywords?: string[] | null
          created_at?: string
          enable_backchannel?: boolean | null
          enable_voicemail_detection?: boolean | null
          end_call_after_silence_ms?: number | null
          greeting_message?: string | null
          id?: string
          interruption_sensitivity?: number | null
          is_active?: boolean | null
          language?: string | null
          max_call_duration_ms?: number | null
          name: string
          normalize_for_speech?: boolean | null
          personality?: string | null
          prompt?: string | null
          reminder_max_count?: number | null
          reminder_trigger_ms?: number | null
          responsiveness?: number | null
          retell_agent_id?: string | null
          satisfaction_score?: number | null
          schedule_days?: string[] | null
          schedule_end?: string | null
          schedule_start?: string | null
          total_calls?: number | null
          updated_at?: string
          user_id: string
          voice_id?: string | null
          voice_model?: string | null
          voice_speed?: number | null
          voice_temperature?: number | null
          voice_type?: string | null
          voicemail_detection_timeout_ms?: number | null
          voicemail_message?: string | null
          volume?: number | null
        }
        Update: {
          ambient_sound?: string | null
          ambient_sound_volume?: number | null
          avg_duration_seconds?: number | null
          backchannel_frequency?: number | null
          begin_message_delay_ms?: number | null
          boosted_keywords?: string[] | null
          created_at?: string
          enable_backchannel?: boolean | null
          enable_voicemail_detection?: boolean | null
          end_call_after_silence_ms?: number | null
          greeting_message?: string | null
          id?: string
          interruption_sensitivity?: number | null
          is_active?: boolean | null
          language?: string | null
          max_call_duration_ms?: number | null
          name?: string
          normalize_for_speech?: boolean | null
          personality?: string | null
          prompt?: string | null
          reminder_max_count?: number | null
          reminder_trigger_ms?: number | null
          responsiveness?: number | null
          retell_agent_id?: string | null
          satisfaction_score?: number | null
          schedule_days?: string[] | null
          schedule_end?: string | null
          schedule_start?: string | null
          total_calls?: number | null
          updated_at?: string
          user_id?: string
          voice_id?: string | null
          voice_model?: string | null
          voice_speed?: number | null
          voice_temperature?: number | null
          voice_type?: string | null
          voicemail_detection_timeout_ms?: number | null
          voicemail_message?: string | null
          volume?: number | null
        }
        Relationships: []
      }
      alert_incidents: {
        Row: {
          alert_rule_id: string
          created_at: string
          current_value: number
          id: string
          resolved_at: string | null
          status: string
          threshold_value: number
          triggered_at: string
          user_id: string
        }
        Insert: {
          alert_rule_id: string
          created_at?: string
          current_value: number
          id?: string
          resolved_at?: string | null
          status?: string
          threshold_value: number
          triggered_at?: string
          user_id: string
        }
        Update: {
          alert_rule_id?: string
          created_at?: string
          current_value?: number
          id?: string
          resolved_at?: string | null
          status?: string
          threshold_value?: number
          triggered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_incidents_alert_rule_id_fkey"
            columns: ["alert_rule_id"]
            isOneToOne: false
            referencedRelation: "alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          agent_filter: string[] | null
          comparator: string
          created_at: string
          description: string | null
          disconnection_reason_filter: string[] | null
          email_recipients: string[] | null
          error_code_filter: string[] | null
          evaluation_frequency: string
          evaluation_window: string
          id: string
          is_active: boolean | null
          last_evaluated_at: string | null
          last_triggered_at: string | null
          metric_type: string
          name: string
          threshold_type: string
          threshold_value: number
          updated_at: string
          user_id: string
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          agent_filter?: string[] | null
          comparator?: string
          created_at?: string
          description?: string | null
          disconnection_reason_filter?: string[] | null
          email_recipients?: string[] | null
          error_code_filter?: string[] | null
          evaluation_frequency?: string
          evaluation_window?: string
          id?: string
          is_active?: boolean | null
          last_evaluated_at?: string | null
          last_triggered_at?: string | null
          metric_type: string
          name: string
          threshold_type?: string
          threshold_value: number
          updated_at?: string
          user_id: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          agent_filter?: string[] | null
          comparator?: string
          created_at?: string
          description?: string | null
          disconnection_reason_filter?: string[] | null
          email_recipients?: string[] | null
          error_code_filter?: string[] | null
          evaluation_frequency?: string
          evaluation_window?: string
          id?: string
          is_active?: boolean | null
          last_evaluated_at?: string | null
          last_triggered_at?: string | null
          metric_type?: string
          name?: string
          threshold_type?: string
          threshold_value?: number
          updated_at?: string
          user_id?: string
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      call_logs: {
        Row: {
          agent_id: string | null
          caller_number: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          retell_call_id: string | null
          sentiment: string | null
          status: string | null
          transcript: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          caller_number?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          retell_call_id?: string | null
          sentiment?: string | null
          status?: string | null
          transcript?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          caller_number?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          retell_call_id?: string | null
          sentiment?: string | null
          status?: string | null
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          last_contacted_at: string | null
          name: string
          notes: string | null
          phone: string
          service_requested: string | null
          source: string
          status: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          name: string
          notes?: string | null
          phone: string
          service_requested?: string | null
          source?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          name?: string
          notes?: string | null
          phone?: string
          service_requested?: string | null
          source?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_integrations: {
        Row: {
          business_name: string
          created_at: string
          google_place_id: string | null
          id: string
          is_connected: boolean | null
          last_synced_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name: string
          created_at?: string
          google_place_id?: string | null
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string
          created_at?: string
          google_place_id?: string | null
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          refresh_token: string | null
          scope: string | null
          token_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_base_entries: {
        Row: {
          agent_id: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          source_type: string
          source_url: string | null
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          source_type: string
          source_url?: string | null
          summary?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          source_type?: string
          source_url?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_entries_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_numbers: {
        Row: {
          area_code: string | null
          created_at: string
          id: string
          inbound_agent_id: string | null
          is_active: boolean | null
          last_synced_at: string | null
          nickname: string | null
          outbound_agent_id: string | null
          phone_number: string
          retell_phone_number_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area_code?: string | null
          created_at?: string
          id?: string
          inbound_agent_id?: string | null
          is_active?: boolean | null
          last_synced_at?: string | null
          nickname?: string | null
          outbound_agent_id?: string | null
          phone_number: string
          retell_phone_number_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area_code?: string | null
          created_at?: string
          id?: string
          inbound_agent_id?: string | null
          is_active?: boolean | null
          last_synced_at?: string | null
          nickname?: string | null
          outbound_agent_id?: string | null
          phone_number?: string
          retell_phone_number_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_numbers_inbound_agent_id_fkey"
            columns: ["inbound_agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_numbers_outbound_agent_id_fkey"
            columns: ["outbound_agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_active_promotions: Json | null
          business_address: string | null
          business_after_hours_policy: string | null
          business_brands_serviced: string[] | null
          business_brands_sold: string[] | null
          business_certifications: string[] | null
          business_colors: Json | null
          business_communication_style: string | null
          business_description: string | null
          business_diagnostic_questions: string[] | null
          business_discounts: Json | null
          business_dispatch_address: string | null
          business_dispatch_fee: string | null
          business_email: string | null
          business_emergency_definition: string | null
          business_emergency_service: boolean | null
          business_equipment_brands: string[] | null
          business_equipment_locations: string[] | null
          business_exclusions: string[] | null
          business_faqs: Json | null
          business_financing_options: Json | null
          business_guarantees: string[] | null
          business_hours: Json | null
          business_insurance_status: string | null
          business_key_phrases: string[] | null
          business_license_numbers: string[] | null
          business_locations: Json | null
          business_logo_url: string | null
          business_name: string | null
          business_payment_methods: string[] | null
          business_phone: string | null
          business_pricing_info: string | null
          business_pricing_model: string | null
          business_property_types: string[] | null
          business_review_themes: string[] | null
          business_safety_triggers: string[] | null
          business_service_area: Json | null
          business_service_categories: string[] | null
          business_services: string[] | null
          business_social_links: Json | null
          business_specialties: string[] | null
          business_sub_services: string[] | null
          business_tagline: string | null
          business_team_info: string | null
          business_urgency_levels: Json | null
          business_value_propositions: string[] | null
          business_website: string | null
          business_years_in_business: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          business_active_promotions?: Json | null
          business_address?: string | null
          business_after_hours_policy?: string | null
          business_brands_serviced?: string[] | null
          business_brands_sold?: string[] | null
          business_certifications?: string[] | null
          business_colors?: Json | null
          business_communication_style?: string | null
          business_description?: string | null
          business_diagnostic_questions?: string[] | null
          business_discounts?: Json | null
          business_dispatch_address?: string | null
          business_dispatch_fee?: string | null
          business_email?: string | null
          business_emergency_definition?: string | null
          business_emergency_service?: boolean | null
          business_equipment_brands?: string[] | null
          business_equipment_locations?: string[] | null
          business_exclusions?: string[] | null
          business_faqs?: Json | null
          business_financing_options?: Json | null
          business_guarantees?: string[] | null
          business_hours?: Json | null
          business_insurance_status?: string | null
          business_key_phrases?: string[] | null
          business_license_numbers?: string[] | null
          business_locations?: Json | null
          business_logo_url?: string | null
          business_name?: string | null
          business_payment_methods?: string[] | null
          business_phone?: string | null
          business_pricing_info?: string | null
          business_pricing_model?: string | null
          business_property_types?: string[] | null
          business_review_themes?: string[] | null
          business_safety_triggers?: string[] | null
          business_service_area?: Json | null
          business_service_categories?: string[] | null
          business_services?: string[] | null
          business_social_links?: Json | null
          business_specialties?: string[] | null
          business_sub_services?: string[] | null
          business_tagline?: string | null
          business_team_info?: string | null
          business_urgency_levels?: Json | null
          business_value_propositions?: string[] | null
          business_website?: string | null
          business_years_in_business?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          business_active_promotions?: Json | null
          business_address?: string | null
          business_after_hours_policy?: string | null
          business_brands_serviced?: string[] | null
          business_brands_sold?: string[] | null
          business_certifications?: string[] | null
          business_colors?: Json | null
          business_communication_style?: string | null
          business_description?: string | null
          business_diagnostic_questions?: string[] | null
          business_discounts?: Json | null
          business_dispatch_address?: string | null
          business_dispatch_fee?: string | null
          business_email?: string | null
          business_emergency_definition?: string | null
          business_emergency_service?: boolean | null
          business_equipment_brands?: string[] | null
          business_equipment_locations?: string[] | null
          business_exclusions?: string[] | null
          business_faqs?: Json | null
          business_financing_options?: Json | null
          business_guarantees?: string[] | null
          business_hours?: Json | null
          business_insurance_status?: string | null
          business_key_phrases?: string[] | null
          business_license_numbers?: string[] | null
          business_locations?: Json | null
          business_logo_url?: string | null
          business_name?: string | null
          business_payment_methods?: string[] | null
          business_phone?: string | null
          business_pricing_info?: string | null
          business_pricing_model?: string | null
          business_property_types?: string[] | null
          business_review_themes?: string[] | null
          business_safety_triggers?: string[] | null
          business_service_area?: Json | null
          business_service_categories?: string[] | null
          business_services?: string[] | null
          business_social_links?: Json | null
          business_specialties?: string[] | null
          business_sub_services?: string[] | null
          business_tagline?: string | null
          business_team_info?: string | null
          business_urgency_levels?: Json | null
          business_value_propositions?: string[] | null
          business_website?: string | null
          business_years_in_business?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_name: string
          author_photo_url: string | null
          created_at: string
          google_integration_id: string | null
          google_review_id: string | null
          id: string
          rating: number
          response_date: string | null
          response_text: string | null
          review_date: string
          review_text: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name: string
          author_photo_url?: string | null
          created_at?: string
          google_integration_id?: string | null
          google_review_id?: string | null
          id?: string
          rating: number
          response_date?: string | null
          response_text?: string | null
          review_date?: string
          review_text?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string
          author_photo_url?: string | null
          created_at?: string
          google_integration_id?: string | null
          google_review_id?: string | null
          id?: string
          rating?: number
          response_date?: string | null
          response_text?: string | null
          review_date?: string
          review_text?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_google_integration_id_fkey"
            columns: ["google_integration_id"]
            isOneToOne: false
            referencedRelation: "google_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_agents: {
        Row: {
          agent_type: string
          auto_end_after_minutes: number | null
          avg_response_time_seconds: number | null
          collect_address: boolean | null
          collect_appointment: boolean | null
          collect_service_details: boolean | null
          conversion_rate: number | null
          created_at: string
          escalation_keywords: string[] | null
          escalation_phone: string | null
          follow_up_delay_minutes: number | null
          follow_up_enabled: boolean | null
          follow_up_message: string | null
          greeting_message: string | null
          id: string
          is_active: boolean | null
          lead_sources: string[] | null
          max_follow_ups: number | null
          max_messages_per_conversation: number | null
          name: string
          personality: string | null
          prompt: string | null
          response_delay_ms: number | null
          response_time_seconds: number | null
          total_conversations: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type?: string
          auto_end_after_minutes?: number | null
          avg_response_time_seconds?: number | null
          collect_address?: boolean | null
          collect_appointment?: boolean | null
          collect_service_details?: boolean | null
          conversion_rate?: number | null
          created_at?: string
          escalation_keywords?: string[] | null
          escalation_phone?: string | null
          follow_up_delay_minutes?: number | null
          follow_up_enabled?: boolean | null
          follow_up_message?: string | null
          greeting_message?: string | null
          id?: string
          is_active?: boolean | null
          lead_sources?: string[] | null
          max_follow_ups?: number | null
          max_messages_per_conversation?: number | null
          name: string
          personality?: string | null
          prompt?: string | null
          response_delay_ms?: number | null
          response_time_seconds?: number | null
          total_conversations?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          auto_end_after_minutes?: number | null
          avg_response_time_seconds?: number | null
          collect_address?: boolean | null
          collect_appointment?: boolean | null
          collect_service_details?: boolean | null
          conversion_rate?: number | null
          created_at?: string
          escalation_keywords?: string[] | null
          escalation_phone?: string | null
          follow_up_delay_minutes?: number | null
          follow_up_enabled?: boolean | null
          follow_up_message?: string | null
          greeting_message?: string | null
          id?: string
          is_active?: boolean | null
          lead_sources?: string[] | null
          max_follow_ups?: number | null
          max_messages_per_conversation?: number | null
          name?: string
          personality?: string | null
          prompt?: string | null
          response_delay_ms?: number | null
          response_time_seconds?: number | null
          total_conversations?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sms_campaign_enrollments: {
        Row: {
          campaign_id: string
          completed_at: string | null
          conversation_id: string
          created_at: string
          current_step_order: number
          id: string
          lead_name: string | null
          lead_phone: string
          lead_source: string | null
          metadata: Json | null
          next_message_at: string | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          conversation_id: string
          created_at?: string
          current_step_order?: number
          id?: string
          lead_name?: string | null
          lead_phone: string
          lead_source?: string | null
          metadata?: Json | null
          next_message_at?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          conversation_id?: string
          created_at?: string
          current_step_order?: number
          id?: string
          lead_name?: string | null
          lead_phone?: string
          lead_source?: string | null
          metadata?: Json | null
          next_message_at?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_campaign_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sms_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_campaign_enrollments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "sms_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_campaign_steps: {
        Row: {
          campaign_id: string
          created_at: string
          delay_days: number
          delay_hours: number
          id: string
          is_active: boolean | null
          message_template: string
          step_order: number
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          delay_days?: number
          delay_hours?: number
          id?: string
          is_active?: boolean | null
          message_template: string
          step_order: number
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          delay_days?: number
          delay_hours?: number
          id?: string
          is_active?: boolean | null
          message_template?: string
          step_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_campaign_steps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sms_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_campaigns: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          lead_sources: string[] | null
          name: string
          sms_agent_id: string | null
          trigger_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          lead_sources?: string[] | null
          name: string
          sms_agent_id?: string | null
          trigger_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          lead_sources?: string[] | null
          name?: string
          sms_agent_id?: string | null
          trigger_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_campaigns_sms_agent_id_fkey"
            columns: ["sms_agent_id"]
            isOneToOne: false
            referencedRelation: "sms_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_conversations: {
        Row: {
          address_collected: string | null
          appointment_date: string | null
          appointment_scheduled: boolean | null
          contact_id: string | null
          conversion_status: string | null
          created_at: string
          ended_at: string | null
          escalated_at: string | null
          escalation_reason: string | null
          follow_up_count: number | null
          id: string
          is_escalated: boolean | null
          last_message_at: string | null
          lead_email: string | null
          lead_name: string | null
          lead_phone: string
          lead_source: string | null
          message_count: number | null
          metadata: Json | null
          sentiment: string | null
          service_details: string | null
          sms_agent_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_collected?: string | null
          appointment_date?: string | null
          appointment_scheduled?: boolean | null
          contact_id?: string | null
          conversion_status?: string | null
          created_at?: string
          ended_at?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
          follow_up_count?: number | null
          id?: string
          is_escalated?: boolean | null
          last_message_at?: string | null
          lead_email?: string | null
          lead_name?: string | null
          lead_phone: string
          lead_source?: string | null
          message_count?: number | null
          metadata?: Json | null
          sentiment?: string | null
          service_details?: string | null
          sms_agent_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_collected?: string | null
          appointment_date?: string | null
          appointment_scheduled?: boolean | null
          contact_id?: string | null
          conversion_status?: string | null
          created_at?: string
          ended_at?: string | null
          escalated_at?: string | null
          escalation_reason?: string | null
          follow_up_count?: number | null
          id?: string
          is_escalated?: boolean | null
          last_message_at?: string | null
          lead_email?: string | null
          lead_name?: string | null
          lead_phone?: string
          lead_source?: string | null
          message_count?: number | null
          metadata?: Json | null
          sentiment?: string | null
          service_details?: string | null
          sms_agent_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_conversations_sms_agent_id_fkey"
            columns: ["sms_agent_id"]
            isOneToOne: false
            referencedRelation: "sms_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          delivered_at: string | null
          delivery_error: string | null
          delivery_status: string | null
          id: string
          is_follow_up: boolean | null
          is_greeting: boolean | null
          max_retries: number | null
          metadata: Json | null
          next_retry_at: string | null
          response_time_ms: number | null
          retell_message_id: string | null
          retry_count: number | null
          sender_type: string
          tokens_used: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          delivery_error?: string | null
          delivery_status?: string | null
          id?: string
          is_follow_up?: boolean | null
          is_greeting?: boolean | null
          max_retries?: number | null
          metadata?: Json | null
          next_retry_at?: string | null
          response_time_ms?: number | null
          retell_message_id?: string | null
          retry_count?: number | null
          sender_type: string
          tokens_used?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          delivery_error?: string | null
          delivery_status?: string | null
          id?: string
          is_follow_up?: boolean | null
          is_greeting?: boolean | null
          max_retries?: number | null
          metadata?: Json | null
          next_retry_at?: string | null
          response_time_ms?: number | null
          retell_message_id?: string | null
          retry_count?: number | null
          sender_type?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "sms_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          auto_respond_reviews: boolean | null
          created_at: string
          google_api_configured: boolean | null
          id: string
          lead_webhook_secret: string | null
          notification_email: boolean | null
          notification_sms: boolean | null
          retell_api_key_configured: boolean | null
          review_response_tone: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_respond_reviews?: boolean | null
          created_at?: string
          google_api_configured?: boolean | null
          id?: string
          lead_webhook_secret?: string | null
          notification_email?: boolean | null
          notification_sms?: boolean | null
          retell_api_key_configured?: boolean | null
          review_response_tone?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_respond_reviews?: boolean | null
          created_at?: string
          google_api_configured?: boolean | null
          id?: string
          lead_webhook_secret?: string | null
          notification_email?: boolean | null
          notification_sms?: boolean | null
          retell_api_key_configured?: boolean | null
          review_response_tone?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
