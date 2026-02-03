import { useState, useEffect } from "react";
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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAgents = async () => {
    if (!user) return;
    
    try {
      const data = await api.get<Agent[]>("/api/agents");
      setAgents(data || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load agents",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agentData: CreateAgentData) => {
    if (!user) return null;

    try {
      const data = await api.post<{ agent: Agent }>("/api/retell-sync", {
        action: "create-agent",
        agentConfig: agentData,
      });
      
      if (data?.agent) {
        setAgents((prev) => [data.agent, ...prev]);
        toast({
          title: "Agent Created",
          description: `${agentData.name} has been created and synced to Retell.`,
        });
        return data.agent;
      }
      
      return null;
    } catch (error) {
      console.error("Error creating agent:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create agent",
      });
      return null;
    }
  };

  const updateAgent = async (id: string, updates: Partial<Agent>) => {
    try {
      const data = await api.post<{ agent: Agent }>("/api/retell-sync", {
        action: "update-agent",
        agentId: id,
        agentConfig: updates,
      });
      
      if (data?.agent) {
        setAgents((prev) =>
          prev.map((agent) => (agent.id === id ? data.agent : agent))
        );
        
        toast({
          title: "Agent Updated",
          description: "Agent settings have been saved and synced to Retell.",
        });
        
        return data.agent;
      }
      
      return null;
    } catch (error) {
      console.error("Error updating agent:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update agent",
      });
      return null;
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      await api.post("/api/retell-sync", {
        action: "delete-agent",
        agentId: id,
      });
      
      setAgents((prev) => prev.filter((agent) => agent.id !== id));
      
      toast({
        title: "Agent Deleted",
        description: "Agent has been removed from Retell.",
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete agent",
      });
      return false;
    }
  };

  const toggleAgentStatus = async (id: string, isActive: boolean) => {
    return updateAgent(id, { isActive });
  };

  useEffect(() => {
    fetchAgents();
  }, [user]);

  return {
    agents,
    loading,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
    refetch: fetchAgents,
  };
};
