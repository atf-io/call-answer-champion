import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
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
      const data = await api.get<PhoneNumber[]>("/api/phone-numbers");
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
      const data = await api.post<{ message: string }>("/api/retell-sync", {
        action: "sync-phone-numbers",
      });
      
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
      const data = await api.post<{ message: string }>("/api/retell-sync", {
        action: "purchase-phone-number",
        area_code: options.area_code,
        nickname: options.nickname,
        inbound_agent_id: options.inbound_agent_id === "none" ? undefined : options.inbound_agent_id,
        outbound_agent_id: options.outbound_agent_id === "none" ? undefined : options.outbound_agent_id,
      });
      
      toast.success(data.message || "Phone number purchased successfully!");
      await fetchPhoneNumbers();
      return data;
    } catch (error) {
      console.error("Error purchasing phone number:", error);
      
      let errorMessage = "Failed to purchase phone number";
      if (error instanceof Error) {
        const msg = error.message;
        if (msg.includes("No phone numbers of this area code")) {
          errorMessage = "No phone numbers available for this area code. Please try a different area code.";
        } else if (msg.includes("area_code")) {
          errorMessage = "Invalid area code format. Please enter a valid 3-digit area code.";
        } else {
          errorMessage = msg;
        }
      }
      
      toast.error(errorMessage);
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
