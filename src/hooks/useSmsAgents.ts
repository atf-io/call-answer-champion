import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface SmsAgent {
  id: string;
  user_id: string;
  name: string;
  system_prompt: string;
  greeting_message: string;
  phone_number: string | null;
  is_active: boolean;
  max_tokens: number;
  temperature: number;
  model: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSmsAgentData {
  name: string;
  system_prompt?: string;
  greeting_message?: string;
  phone_number?: string;
  is_active?: boolean;
  max_tokens?: number;
  temperature?: number;
  model?: string;
}

export function useSmsAgents() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: agents = [],
    isLoading,
    error,
  } = useQuery<SmsAgent[]>({
    queryKey: ["/api/sms-agents"],
    queryFn: () => api.get<SmsAgent[]>("/api/sms-agents"),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSmsAgentData) =>
      api.post<SmsAgent>("/api/sms-agents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-agents"] });
      toast({ title: "SMS agent created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create SMS agent", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSmsAgentData> }) =>
      api.patch<SmsAgent>("/api/sms-agents/" + id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-agents"] });
      toast({ title: "SMS agent updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update SMS agent", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete("/api/sms-agents/" + id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-agents"] });
      toast({ title: "SMS agent deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete SMS agent", description: error.message, variant: "destructive" });
    },
  });

  const getSmsAgent = (id: string) =>
    api.get<SmsAgent>("/api/sms-agents/" + id);

  return {
    agents,
    isLoading,
    error,
    createSmsAgent: createMutation.mutateAsync,
    updateSmsAgent: (id: string, data: Partial<CreateSmsAgentData>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteSmsAgent: deleteMutation.mutateAsync,
    getSmsAgent,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
