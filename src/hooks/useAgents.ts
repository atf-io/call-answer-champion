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
}

export interface CreateAgentData {
  name: string;
  voice_type?: string;
  personality?: string;
  greeting_message?: string;
  schedule_start?: string;
  schedule_end?: string;
  schedule_days?: string[];
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
      const { data, error } = await supabase
        .from("ai_agents")
        .insert({
          user_id: user.id,
          ...agentData,
        })
        .select()
        .single();

      if (error) throw error;
      
      setAgents((prev) => [data, ...prev]);
      toast({
        title: "Agent Created",
        description: `${agentData.name} has been created successfully.`,
      });
      
      return data;
    } catch (error) {
      console.error("Error creating agent:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create agent",
      });
      return null;
    }
  };

  const updateAgent = async (id: string, updates: Partial<Agent>) => {
    try {
      const { data, error } = await supabase
        .from("ai_agents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setAgents((prev) =>
        prev.map((agent) => (agent.id === id ? data : agent))
      );
      
      toast({
        title: "Agent Updated",
        description: "Agent settings have been saved.",
      });
      
      return data;
    } catch (error) {
      console.error("Error updating agent:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update agent",
      });
      return null;
    }
  };

  const deleteAgent = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ai_agents")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setAgents((prev) => prev.filter((agent) => agent.id !== id));
      
      toast({
        title: "Agent Deleted",
        description: "Agent has been removed.",
      });
      
      return true;
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete agent",
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
