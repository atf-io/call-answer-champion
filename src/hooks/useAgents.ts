import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Agent {
  id: string;
  name: string;
  retell_agent_id: string | null;
  voice_type: string;
  personality: string;
  greeting_message: string;
  schedule_start: string;
  schedule_end: string;
  schedule_days: string[];
  is_active: boolean;
  total_calls: number;
  avg_duration_seconds: number;
  satisfaction_score: number;
  created_at: string;
  updated_at: string;
  voice_id: string | null;
  voice_model: string | null;
  voice_temperature: number | null;
  voice_speed: number | null;
  volume: number | null;
  responsiveness: number | null;
  interruption_sensitivity: number | null;
  enable_backchannel: boolean | null;
  backchannel_frequency: number | null;
  ambient_sound: string | null;
  ambient_sound_volume: number | null;
  language: string | null;
  enable_voicemail_detection: boolean | null;
  voicemail_message: string | null;
  voicemail_detection_timeout_ms: number | null;
  max_call_duration_ms: number | null;
  end_call_after_silence_ms: number | null;
  begin_message_delay_ms: number | null;
  normalize_for_speech: boolean | null;
  boosted_keywords: string[] | null;
  reminder_trigger_ms: number | null;
  reminder_max_count: number | null;
}

export interface CreateAgentData {
  name: string;
  voice_type?: string;
  personality?: string;
  greeting_message?: string;
  schedule_start?: string;
  schedule_end?: string;
  schedule_days?: string[];
  voice_id?: string;
  voice_model?: string;
  voice_temperature?: number;
  voice_speed?: number;
  volume?: number;
  responsiveness?: number;
  interruption_sensitivity?: number;
  enable_backchannel?: boolean;
  backchannel_frequency?: number;
  ambient_sound?: string;
  ambient_sound_volume?: number;
  language?: string;
  enable_voicemail_detection?: boolean;
  voicemail_message?: string;
  voicemail_detection_timeout_ms?: number;
  max_call_duration_ms?: number;
  end_call_after_silence_ms?: number;
  begin_message_delay_ms?: number;
  normalize_for_speech?: boolean;
  boosted_keywords?: string[];
  reminder_trigger_ms?: number;
  reminder_max_count?: number;
}

function mapAgentFromDb(data: any): Agent {
  return {
    id: data.id,
    name: data.name,
    retell_agent_id: data.retell_agent_id,
    voice_type: data.voice_type ?? 'professional',
    personality: data.personality ?? '',
    greeting_message: data.greeting_message ?? '',
    schedule_start: data.schedule_start ?? '09:00',
    schedule_end: data.schedule_end ?? '17:00',
    schedule_days: data.schedule_days ?? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    is_active: data.is_active ?? false,
    total_calls: data.total_calls ?? 0,
    avg_duration_seconds: data.avg_duration_seconds ?? 0,
    satisfaction_score: data.satisfaction_score ?? 0,
    created_at: data.created_at,
    updated_at: data.updated_at,
    voice_id: data.voice_id,
    voice_model: data.voice_model,
    voice_temperature: data.voice_temperature,
    voice_speed: data.voice_speed,
    volume: data.volume,
    responsiveness: data.responsiveness,
    interruption_sensitivity: data.interruption_sensitivity,
    enable_backchannel: data.enable_backchannel,
    backchannel_frequency: data.backchannel_frequency,
    ambient_sound: data.ambient_sound,
    ambient_sound_volume: data.ambient_sound_volume,
    language: data.language,
    enable_voicemail_detection: data.enable_voicemail_detection,
    voicemail_message: data.voicemail_message,
    voicemail_detection_timeout_ms: data.voicemail_detection_timeout_ms,
    max_call_duration_ms: data.max_call_duration_ms,
    end_call_after_silence_ms: data.end_call_after_silence_ms,
    begin_message_delay_ms: data.begin_message_delay_ms,
    normalize_for_speech: data.normalize_for_speech,
    boosted_keywords: data.boosted_keywords,
    reminder_trigger_ms: data.reminder_trigger_ms,
    reminder_max_count: data.reminder_max_count,
  };
}

export const useAgents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agents = [], isLoading: loading } = useQuery({
    queryKey: ['agents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching agents:', error);
        return [];
      }
      return data.map(mapAgentFromDb);
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (agentData: CreateAgentData) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('ai_agents')
        .insert({
          user_id: user.id,
          name: agentData.name,
          voice_type: agentData.voice_type,
          personality: agentData.personality,
          greeting_message: agentData.greeting_message,
          schedule_start: agentData.schedule_start,
          schedule_end: agentData.schedule_end,
          schedule_days: agentData.schedule_days,
          voice_id: agentData.voice_id,
          voice_model: agentData.voice_model,
          voice_temperature: agentData.voice_temperature,
          voice_speed: agentData.voice_speed,
          volume: agentData.volume,
          responsiveness: agentData.responsiveness,
          interruption_sensitivity: agentData.interruption_sensitivity,
          enable_backchannel: agentData.enable_backchannel,
          backchannel_frequency: agentData.backchannel_frequency,
          ambient_sound: agentData.ambient_sound,
          ambient_sound_volume: agentData.ambient_sound_volume,
          language: agentData.language,
          enable_voicemail_detection: agentData.enable_voicemail_detection,
          voicemail_message: agentData.voicemail_message,
          voicemail_detection_timeout_ms: agentData.voicemail_detection_timeout_ms,
          max_call_duration_ms: agentData.max_call_duration_ms,
          end_call_after_silence_ms: agentData.end_call_after_silence_ms,
          begin_message_delay_ms: agentData.begin_message_delay_ms,
          normalize_for_speech: agentData.normalize_for_speech,
          boosted_keywords: agentData.boosted_keywords,
          reminder_trigger_ms: agentData.reminder_trigger_ms,
          reminder_max_count: agentData.reminder_max_count,
        })
        .select()
        .single();
      
      if (error) throw error;
      return mapAgentFromDb(data);
    },
    onSuccess: (_agent, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: "Agent Created",
        description: `${variables.name} has been created.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create agent",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateAgentData> }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('ai_agents')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return mapAgentFromDb(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: "Agent Updated",
        description: "Agent settings have been saved.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update agent",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: "Agent Deleted",
        description: "Agent has been removed.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete agent",
      });
    },
  });

  const createAgent = async (agentData: CreateAgentData) => {
    if (!user) return null;
    try {
      return await createMutation.mutateAsync(agentData);
    } catch {
      return null;
    }
  };

  const updateAgent = async (id: string, updates: Partial<CreateAgentData>) => {
    try {
      return await updateMutation.mutateAsync({ id, updates });
    } catch {
      return null;
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  const toggleAgentStatus = async (id: string, isActive: boolean) => {
    return updateAgent(id, { is_active: isActive } as any);
  };

  return {
    agents,
    loading,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
  };
};
