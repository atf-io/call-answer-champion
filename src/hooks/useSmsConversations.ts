import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export interface SmsMessage {
  id: string;
  conversation_id: string;
  sender_type: string;
  content: string;
  created_at: string;
  is_greeting: boolean | null;
  is_follow_up: boolean | null;
  metadata: Record<string, unknown> | null;
}

export interface SmsConversation {
  id: string;
  user_id: string;
  sms_agent_id: string;
  contact_id: string | null;
  lead_phone: string;
  lead_name: string | null;
  lead_email: string | null;
  lead_source: string | null;
  status: string;
  sentiment: string | null;
  message_count: number | null;
  last_message_at: string | null;
  is_escalated: boolean | null;
  escalated_at: string | null;
  escalation_reason: string | null;
  service_details: string | null;
  address_collected: string | null;
  appointment_scheduled: boolean | null;
  appointment_date: string | null;
  conversion_status: string | null;
  created_at: string;
  updated_at: string;
  ended_at: string | null;
  sms_agents?: {
    id: string;
    name: string;
  };
}

export function useSmsConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: conversations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sms-conversations', user?.id],
    queryFn: async (): Promise<SmsConversation[]> => {
      const { data, error } = await supabase
        .from('sms_conversations')
        .select(`
          *,
          sms_agents(id, name)
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as SmsConversation[];
    },
    enabled: !!user,
  });

  // Set up realtime subscription for new conversations
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('sms-conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sms_conversations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sms-conversations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    conversations,
    isLoading,
    error,
    refetch,
  };
}

export function useSmsMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['sms-messages', conversationId],
    queryFn: async (): Promise<SmsMessage[]> => {
      if (!conversationId) return [];
      
      const { data, error } = await supabase
        .from('sms_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as SmsMessage[];
    },
    enabled: !!conversationId,
  });

  // Set up realtime subscription for new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`sms-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sms_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['sms-messages', conversationId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return {
    messages,
    isLoading,
    error,
    refetch,
  };
}
