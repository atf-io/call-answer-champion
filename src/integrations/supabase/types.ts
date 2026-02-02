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
          business_address: string | null
          business_colors: Json | null
          business_description: string | null
          business_faqs: Json | null
          business_logo_url: string | null
          business_name: string | null
          business_phone: string | null
          business_services: string[] | null
          business_social_links: Json | null
          business_team_info: string | null
          business_website: string | null
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
          business_address?: string | null
          business_colors?: Json | null
          business_description?: string | null
          business_faqs?: Json | null
          business_logo_url?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_services?: string[] | null
          business_social_links?: Json | null
          business_team_info?: string | null
          business_website?: string | null
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
          business_address?: string | null
          business_colors?: Json | null
          business_description?: string | null
          business_faqs?: Json | null
          business_logo_url?: string | null
          business_name?: string | null
          business_phone?: string | null
          business_services?: string[] | null
          business_social_links?: Json | null
          business_team_info?: string | null
          business_website?: string | null
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
      user_settings: {
        Row: {
          auto_respond_reviews: boolean | null
          created_at: string
          google_api_configured: boolean | null
          id: string
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
