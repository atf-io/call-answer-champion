import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PhoneNumber {
  id: string;
  retellPhoneNumberId: string | null;
  phoneNumber: string;
  nickname: string | null;
  areaCode: string | null;
  inboundAgentId: string | null;
  outboundAgentId: string | null;
  isActive: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
  inboundAgent?: { name: string } | null;
  outboundAgent?: { name: string } | null;
}

function mapPhoneNumber(data: any): PhoneNumber {
  return {
    id: data.id,
    retellPhoneNumberId: data.retell_phone_number_id,
    phoneNumber: data.phone_number,
    nickname: data.nickname,
    areaCode: data.area_code,
    inboundAgentId: data.inbound_agent_id,
    outboundAgentId: data.outbound_agent_id,
    isActive: data.is_active ?? true,
    lastSyncedAt: data.last_synced_at,
    createdAt: data.created_at,
    inboundAgent: data.inbound_agent ? { name: data.inbound_agent.name } : null,
    outboundAgent: data.outbound_agent ? { name: data.outbound_agent.name } : null,
  };
}

export const usePhoneNumbers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: phoneNumbers = [], isLoading: loading } = useQuery({
    queryKey: ['phone-numbers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('phone_numbers')
        .select(`
          *,
          inbound_agent:ai_agents!phone_numbers_inbound_agent_id_fkey(name),
          outbound_agent:ai_agents!phone_numbers_outbound_agent_id_fkey(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching phone numbers:', error);
        return [];
      }
      
      return data.map(mapPhoneNumber);
    },
    enabled: !!user,
  });

  const syncPhoneNumbers = async () => {
    if (!user) return;
    toast.info("Phone number sync requires Retell API integration");
  };

  const purchasePhoneNumber = async (options: {
    area_code?: string;
    nickname?: string;
    inbound_agent_id?: string;
    outbound_agent_id?: string;
  }) => {
    if (!user) return;
    toast.info("Phone number purchase requires Retell API integration");
  };

  return {
    phoneNumbers,
    loading,
    syncing: false,
    purchasing: false,
    syncPhoneNumbers,
    purchasePhoneNumber,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['phone-numbers'] }),
  };
};
