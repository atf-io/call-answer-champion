import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function mapAgentFromApi(raw: any): Agent {
  const mapped: any = {};
  for (const key of Object.keys(raw)) {
    mapped[camelToSnake(key)] = raw[key];
  }
  return mapped as Agent;
}

export const useAgents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agents = [], isLoading: loading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const rawAgents = await api.get<any[]>("/api/agents");
      return rawAgents.map(mapAgentFromApi);
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (agentData: CreateAgentData) => {
      const data = await api.post<{ agent: any }>("/api/retell-sync", {
        action: "create-agent",
        agentConfig: agentData,
      });
      return data.agent ? mapAgentFromApi(data.agent) : null;
    },
    onSuccess: (_agent, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: "Agent Created",
        description: `${variables.name} has been created and synced to Retell.`,
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
      const data = await api.post<{ agent: any }>("/api/retell-sync", {
        action: "update-agent",
        agentId: id,
        agentConfig: updates,
      });
      return data.agent ? mapAgentFromApi(data.agent) : null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: "Agent Updated",
        description: "Agent settings have been saved and synced to Retell.",
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
      await api.post("/api/retell-sync", {
        action: "delete-agent",
        agentId: id,
      });
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: "Agent Deleted",
        description: "Agent has been removed from Retell.",
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
