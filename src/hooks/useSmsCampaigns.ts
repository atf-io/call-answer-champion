import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface CampaignStep {
  id: string;
  campaign_id: string;
  step_order: number;
  delay_minutes: number;
  message_template: string;
  created_at: string;
}

export interface SmsCampaign {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  sms_agent_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  steps?: CampaignStep[];
}

export interface CreateCampaignData {
  name: string;
  description?: string;
  sms_agent_id?: string;
  is_active?: boolean;
}

export interface CreateStepData {
  campaign_id: string;
  step_order: number;
  delay_minutes: number;
  message_template: string;
}

export function useSmsCampaigns() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: campaigns = [],
    isLoading,
    error,
  } = useQuery<SmsCampaign[]>({
    queryKey: ["/api/sms-campaigns"],
    queryFn: () => api.get<SmsCampaign[]>("/api/sms-campaigns"),
  });

  const fetchCampaignWithSteps = (id: string) =>
    api.get<SmsCampaign>("/api/sms-campaigns/" + id);

  const createMutation = useMutation({
    mutationFn: (data: CreateCampaignData) =>
      api.post<SmsCampaign>("/api/sms-campaigns", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-campaigns"] });
      toast({ title: "Campaign created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create campaign", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCampaignData> }) =>
      api.patch<SmsCampaign>("/api/sms-campaigns/" + id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-campaigns"] });
      toast({ title: "Campaign updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update campaign", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete("/api/sms-campaigns/" + id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-campaigns"] });
      toast({ title: "Campaign deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete campaign", description: error.message, variant: "destructive" });
    },
  });

  const addStepMutation = useMutation({
    mutationFn: (data: CreateStepData) =>
      api.post<CampaignStep>("/api/sms-campaign-steps", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-campaigns"] });
      toast({ title: "Step added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add step", description: error.message, variant: "destructive" });
    },
  });

  const updateStepMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateStepData> }) =>
      api.patch<CampaignStep>("/api/sms-campaign-steps/" + id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-campaigns"] });
      toast({ title: "Step updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update step", description: error.message, variant: "destructive" });
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: (id: string) => api.delete("/api/sms-campaign-steps/" + id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-campaigns"] });
      toast({ title: "Step deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete step", description: error.message, variant: "destructive" });
    },
  });

  return {
    campaigns,
    isLoading,
    error,
    fetchCampaignWithSteps,
    createCampaign: createMutation.mutateAsync,
    updateCampaign: (id: string, data: Partial<CreateCampaignData>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteCampaign: deleteMutation.mutateAsync,
    addStep: addStepMutation.mutateAsync,
    updateStep: (id: string, data: Partial<CreateStepData>) =>
      updateStepMutation.mutateAsync({ id, data }),
    deleteStep: deleteStepMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
