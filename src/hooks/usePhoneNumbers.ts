import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  const { data: phoneNumbers = [], isLoading: loading } = useQuery({
    queryKey: ['phone-numbers'],
    queryFn: () => api.get<PhoneNumber[]>("/api/phone-numbers"),
    enabled: !!user,
  });

  const syncMutation = useMutation({
    mutationFn: () => api.post<{ message: string }>("/api/retell-sync", { action: "sync-phone-numbers" }),
    onSuccess: (data) => {
      toast.success(data.message || "Phone numbers synced successfully");
      queryClient.invalidateQueries({ queryKey: ['phone-numbers'] });
    },
    onError: () => {
      toast.error("Failed to sync phone numbers from Retell");
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: (options: {
      area_code?: string;
      nickname?: string;
      inbound_agent_id?: string;
      outbound_agent_id?: string;
    }) => api.post<{ message: string }>("/api/retell-sync", {
      action: "purchase-phone-number",
      area_code: options.area_code,
      nickname: options.nickname,
      inbound_agent_id: options.inbound_agent_id === "none" ? undefined : options.inbound_agent_id,
      outbound_agent_id: options.outbound_agent_id === "none" ? undefined : options.outbound_agent_id,
    }),
    onSuccess: (data) => {
      toast.success(data.message || "Phone number purchased successfully!");
      queryClient.invalidateQueries({ queryKey: ['phone-numbers'] });
    },
    onError: (error) => {
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
    },
  });

  const syncPhoneNumbers = async () => {
    if (!user) return;
    try {
      return await syncMutation.mutateAsync();
    } catch (error) {
      throw error;
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
      return await purchaseMutation.mutateAsync(options);
    } catch (error) {
      throw error;
    }
  };

  return {
    phoneNumbers,
    loading,
    syncing: syncMutation.isPending,
    purchasing: purchaseMutation.isPending,
    syncPhoneNumbers,
    purchasePhoneNumber,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['phone-numbers'] }),
  };
};
