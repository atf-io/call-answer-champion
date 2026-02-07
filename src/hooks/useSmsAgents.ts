import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface SmsAgent {
  id: string;
  user_id: string;
  name: string;
  agent_type: string;
  prompt: string | null;
  greeting_message: string | null;
  personality: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSmsAgentData {
  name: string;
  agent_type?: string;
  prompt?: string;
  greeting_message?: string;
  personality?: string;
  is_active?: boolean;
}

function mapSmsAgent(data: any): SmsAgent {
  return {
    id: data.id,
    user_id: data.user_id,
    name: data.name,
    agent_type: data.agent_type ?? 'speed_to_lead',
    prompt: data.prompt,
    greeting_message: data.greeting_message,
    personality: data.personality,
    is_active: data.is_active ?? true,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export function useSmsAgents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: agents = [],
    isLoading,
    error,
  } = useQuery<SmsAgent[]>({
    queryKey: ['sms-agents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('sms_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching SMS agents:', error);
        return [];
      }
      
      return data.map(mapSmsAgent);
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateSmsAgentData) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: created, error } = await supabase
        .from('sms_agents')
        .insert({
          user_id: user.id,
          name: data.name,
          agent_type: data.agent_type ?? 'speed_to_lead',
          prompt: data.prompt,
          greeting_message: data.greeting_message,
          personality: data.personality,
          is_active: data.is_active ?? true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return mapSmsAgent(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-agents'] });
      toast({ title: "SMS agent created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create SMS agent", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateSmsAgentData> }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: updated, error } = await supabase
        .from('sms_agents')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return mapSmsAgent(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-agents'] });
      toast({ title: "SMS agent updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update SMS agent", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('sms_agents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-agents'] });
      toast({ title: "SMS agent deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete SMS agent", description: error.message, variant: "destructive" });
    },
  });

  const getSmsAgent = async (id: string) => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('sms_agents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error) return null;
    return mapSmsAgent(data);
  };

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
