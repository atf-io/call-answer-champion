import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Agent {
  id: string;
  name: string;
  retellAgentId: string | null;
  voiceType: string;
  personality: string;
  greetingMessage: string;
  scheduleStart: string;
  scheduleEnd: string;
  scheduleDays: string[];
  isActive: boolean;
  totalCalls: number;
  avgDurationSeconds: number;
  satisfactionScore: number;
  createdAt: string;
  updatedAt: string;
  voiceId: string | null;
  voiceModel: string | null;
  voiceTemperature: number | null;
  voiceSpeed: number | null;
  volume: number | null;
  responsiveness: number | null;
  interruptionSensitivity: number | null;
  enableBackchannel: boolean | null;
  backchannelFrequency: number | null;
  ambientSound: string | null;
  ambientSoundVolume: number | null;
  language: string | null;
  enableVoicemailDetection: boolean | null;
  voicemailMessage: string | null;
  voicemailDetectionTimeoutMs: number | null;
  maxCallDurationMs: number | null;
  endCallAfterSilenceMs: number | null;
  beginMessageDelayMs: number | null;
  normalizeForSpeech: boolean | null;
  boostedKeywords: string[] | null;
  reminderTriggerMs: number | null;
  reminderMaxCount: number | null;
}

export interface CreateAgentData {
  name: string;
  voiceType?: string;
  personality?: string;
  greetingMessage?: string;
  scheduleStart?: string;
  scheduleEnd?: string;
  scheduleDays?: string[];
  voiceId?: string;
  voiceModel?: string;
  voiceTemperature?: number;
  voiceSpeed?: number;
  volume?: number;
  responsiveness?: number;
  interruptionSensitivity?: number;
  enableBackchannel?: boolean;
  backchannelFrequency?: number;
  ambientSound?: string;
  ambientSoundVolume?: number;
  language?: string;
  enableVoicemailDetection?: boolean;
  voicemailMessage?: string;
  voicemailDetectionTimeoutMs?: number;
  maxCallDurationMs?: number;
  endCallAfterSilenceMs?: number;
  beginMessageDelayMs?: number;
  normalizeForSpeech?: boolean;
  boostedKeywords?: string[];
  reminderTriggerMs?: number;
  reminderMaxCount?: number;
}

export const useAgents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agents = [], isLoading: loading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.get<Agent[]>("/api/agents"),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (agentData: CreateAgentData) => {
      const data = await api.post<{ agent: Agent }>("/api/retell-sync", {
        action: "create-agent",
        agentConfig: agentData,
      });
      return data.agent;
    },
    onSuccess: (agent, variables) => {
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
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Agent> }) => {
      const data = await api.post<{ agent: Agent }>("/api/retell-sync", {
        action: "update-agent",
        agentId: id,
        agentConfig: updates,
      });
      return data.agent;
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

  const updateAgent = async (id: string, updates: Partial<Agent>) => {
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
    return updateAgent(id, { isActive });
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
