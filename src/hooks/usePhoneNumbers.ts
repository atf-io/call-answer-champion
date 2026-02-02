import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PhoneNumber {
  id: string;
  retell_phone_number_id: string | null;
  phone_number: string;
  nickname: string | null;
  area_code: string | null;
  inbound_agent_id: string | null;
  outbound_agent_id: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
  inbound_agent?: { name: string } | null;
  outbound_agent?: { name: string } | null;
}

export const usePhoneNumbers = () => {
  const { user } = useAuth();
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const fetchPhoneNumbers = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("phone_numbers")
        .select(`
          *,
          inbound_agent:ai_agents!phone_numbers_inbound_agent_id_fkey(name),
          outbound_agent:ai_agents!phone_numbers_outbound_agent_id_fkey(name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPhoneNumbers(data || []);
    } catch (error) {
      console.error("Error fetching phone numbers:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const syncPhoneNumbers = async () => {
    if (!user) return;
    
    try {
      setSyncing(true);
      const { data, error } = await supabase.functions.invoke("retell-sync", {
        body: { action: "sync-phone-numbers" },
      });

      if (error) throw error;
      
      toast.success(data.message || "Phone numbers synced successfully");
      await fetchPhoneNumbers();
      return data;
    } catch (error) {
      console.error("Error syncing phone numbers:", error);
      toast.error("Failed to sync phone numbers from Retell");
      throw error;
    } finally {
      setSyncing(false);
    }
  };

  const purchasePhoneNumber = async (options: {
    area_code?: string;
    nickname?: string;
    inbound_agent_id?: string;
    outbound_agent_id?: string;
  }) => {
    if (!user) return;
    
    try {
      setPurchasing(true);
      const { data, error } = await supabase.functions.invoke("retell-sync", {
        body: { 
          action: "purchase-phone-number",
          area_code: options.area_code,
          nickname: options.nickname,
          inbound_agent_id: options.inbound_agent_id === "none" ? undefined : options.inbound_agent_id,
          outbound_agent_id: options.outbound_agent_id === "none" ? undefined : options.outbound_agent_id,
        },
      });

      if (error) throw error;
      
      toast.success(data.message || "Phone number purchased successfully!");
      await fetchPhoneNumbers();
      return data;
    } catch (error) {
      console.error("Error purchasing phone number:", error);
      toast.error(error instanceof Error ? error.message : "Failed to purchase phone number");
      throw error;
    } finally {
      setPurchasing(false);
    }
  };

  useEffect(() => {
    fetchPhoneNumbers();
  }, [fetchPhoneNumbers]);

  return {
    phoneNumbers,
    loading,
    syncing,
    purchasing,
    syncPhoneNumbers,
    purchasePhoneNumber,
    refetch: fetchPhoneNumbers,
  };
};
