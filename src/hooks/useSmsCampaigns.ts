import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CampaignStep {
  id: string;
  campaign_id: string;
  step_order: number;
  delay_days: number;
  delay_hours: number;
  message_template: string;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface SmsCampaign {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  sms_agent_id: string | null;
  is_active: boolean | null;
  lead_sources: string[] | null;
  trigger_type: string | null;
  created_at: string;
  updated_at: string;
  steps?: CampaignStep[];
}

export interface CreateCampaignData {
  name: string;
  description?: string;
  sms_agent_id?: string;
  is_active?: boolean;
  lead_sources?: string[];
  trigger_type?: string;
}

export interface CreateStepData {
  campaign_id: string;
  step_order: number;
  delay_minutes: number;
  message_template: string;
}

export function useSmsCampaigns() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: campaigns = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['sms-campaigns', user?.id],
    queryFn: async (): Promise<SmsCampaign[]> => {
      const { data, error } = await supabase
        .from('sms_campaigns')
        .select(`
          *,
          steps:sms_campaign_steps(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(campaign => ({
        ...campaign,
        steps: (campaign.steps as CampaignStep[] | undefined)?.sort((a, b) => a.step_order - b.step_order),
      })) as SmsCampaign[];
    },
    enabled: !!user,
  });

  const fetchCampaignWithSteps = async (id: string): Promise<SmsCampaign> => {
    const { data, error } = await supabase
      .from('sms_campaigns')
      .select(`
        *,
        steps:sms_campaign_steps(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return {
      ...data,
      steps: (data.steps as CampaignStep[] | undefined)?.sort((a, b) => a.step_order - b.step_order),
    } as SmsCampaign;
  };

  const createMutation = useMutation({
    mutationFn: async (data: CreateCampaignData) => {
      const { data: campaign, error } = await supabase
        .from('sms_campaigns')
        .insert({
          user_id: user!.id,
          name: data.name,
          description: data.description,
          sms_agent_id: data.sms_agent_id,
          is_active: data.is_active ?? false,
          lead_sources: data.lead_sources ?? [],
          trigger_type: data.trigger_type ?? 'manual',
        })
        .select()
        .single();

      if (error) throw error;
      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] });
      toast({ title: "Campaign created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create campaign", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateCampaignData> }) => {
      const { data: campaign, error } = await supabase
        .from('sms_campaigns')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] });
      toast({ title: "Campaign updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update campaign", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sms_campaigns')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] });
      toast({ title: "Campaign deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete campaign", description: error.message, variant: "destructive" });
    },
  });

  const addStepMutation = useMutation({
    mutationFn: async (data: CreateStepData) => {
      // Convert delay_minutes to days/hours
      const totalMinutes = data.delay_minutes;
      const days = Math.floor(totalMinutes / 1440);
      const hours = Math.floor((totalMinutes % 1440) / 60);

      const { data: step, error } = await supabase
        .from('sms_campaign_steps')
        .insert({
          campaign_id: data.campaign_id,
          step_order: data.step_order,
          delay_days: days,
          delay_hours: hours,
          message_template: data.message_template,
        })
        .select()
        .single();

      if (error) throw error;
      return step;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] });
      toast({ title: "Step added successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add step", description: error.message, variant: "destructive" });
    },
  });

  const updateStepMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateStepData> }) => {
      const updateData: Record<string, unknown> = {};
      
      if (data.delay_minutes !== undefined) {
        updateData.delay_days = Math.floor(data.delay_minutes / 1440);
        updateData.delay_hours = Math.floor((data.delay_minutes % 1440) / 60);
      }
      if (data.message_template) updateData.message_template = data.message_template;
      if (data.step_order) updateData.step_order = data.step_order;

      const { data: step, error } = await supabase
        .from('sms_campaign_steps')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return step;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] });
      toast({ title: "Step updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update step", description: error.message, variant: "destructive" });
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sms_campaign_steps')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-campaigns'] });
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
