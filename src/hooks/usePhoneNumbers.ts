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

  useEffect(() => {
    fetchPhoneNumbers();
  }, [fetchPhoneNumbers]);

  return {
    phoneNumbers,
    loading,
    syncing,
    syncPhoneNumbers,
    refetch: fetchPhoneNumbers,
  };
};
