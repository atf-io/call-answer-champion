import { useState, useEffect } from "react";
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
  // Retell voice agent configuration
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
  // Retell voice agent configuration
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

export const useAgents = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAgents = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
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
      // Call edge function to create agent in Retell and database
      const { data, error } = await supabase.functions.invoke("retell-sync", {
        body: {
          action: "create-agent",
          agentConfig: agentData,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
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
      // Call edge function to update agent in Retell and database
      const { data, error } = await supabase.functions.invoke("retell-sync", {
        body: {
          action: "update-agent",
          agentId: id,
          agentConfig: updates,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
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
      // Call edge function to delete agent from Retell and database
      const { data, error } = await supabase.functions.invoke("retell-sync", {
        body: {
          action: "delete-agent",
          agentId: id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
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
    return updateAgent(id, { is_active: isActive });
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
