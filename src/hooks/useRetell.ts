import { useState, useCallback, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface RetellAgent {
  agent_id: string;
  agent_name: string;
  voice_id: string;
  language: string;
  last_modification_timestamp: number;
}

export interface RetellCall {
  call_id: string;
  agent_id: string;
  call_status: string;
  start_timestamp: number;
  end_timestamp: number;
  from_number?: string;
  to_number?: string;
  transcript?: string;
  call_analysis?: {
    user_sentiment?: string;
    call_summary?: string;
  };
}

export interface RetellAnalytics {
  totalCalls: number;
  avgDurationSeconds: number;
  avgDurationFormatted: string;
  successRate: number;
  satisfactionRate: number;
  activeAgents: number;
  totalAgents: number;
  callsByDay: Record<string, number>;
  thisMonthCalls: number;
}

export interface LiveCall {
  callId: string;
  agentId: string;
  status: string;
  startTime: number;
  callerNumber: string;
}

export const useRetell = () => {
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [agents, setAgents] = useState<RetellAgent[]>([]);
  const [calls, setCalls] = useState<RetellCall[]>([]);
  const [analytics, setAnalytics] = useState<RetellAnalytics | null>(null);
  const [liveCalls, setLiveCalls] = useState<LiveCall[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const invokeRetellSync = useCallback(async (action: string, params: Record<string, any> = {}) => {
    if (!user) {
      throw new Error("Not authenticated");
    }

    return api.post("/api/retell-sync", { action, ...params });
  }, [user]);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invokeRetellSync("list-agents") as { agents: RetellAgent[] };
      setAgents(data.agents || []);
      return data.agents;
    } catch (error) {
      console.error("Failed to fetch Retell agents:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch agents from Retell",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [invokeRetellSync, toast]);

  const fetchCalls = useCallback(async (agentId?: string, limit: number = 100) => {
    setLoading(true);
    try {
      const data = await invokeRetellSync("list-calls", { agentId, limit }) as { calls: RetellCall[] };
      setCalls(data.calls || []);
      return data.calls;
    } catch (error) {
      console.error("Failed to fetch Retell calls:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch calls from Retell",
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [invokeRetellSync, toast]);

  const syncCalls = useCallback(async (agentId?: string, limit: number = 100) => {
    setSyncing(true);
    try {
      const data = await invokeRetellSync("sync-calls", { agentId, limit }) as { message: string; synced: number };
      toast({
        title: "Sync Complete",
        description: data.message || `Synced ${data.synced} calls`,
      });
      return data;
    } catch (error) {
      console.error("Failed to sync calls:", error);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync calls",
      });
      return null;
    } finally {
      setSyncing(false);
    }
  }, [invokeRetellSync, toast]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invokeRetellSync("get-analytics") as RetellAnalytics;
      setAnalytics(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch analytics",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [invokeRetellSync, toast]);

  const fetchLiveStatus = useCallback(async () => {
    try {
      const data = await invokeRetellSync("get-live-status") as { activeCalls: LiveCall[]; count: number };
      setLiveCalls(data.activeCalls || []);
      return data;
    } catch (error) {
      console.error("Failed to fetch live status:", error);
      return { activeCalls: [], count: 0 };
    }
  }, [invokeRetellSync]);

  const getCallDetails = useCallback(async (callId: string) => {
    try {
      return await invokeRetellSync("get-call", { agentId: callId });
    } catch (error) {
      console.error("Failed to fetch call details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch call details",
      });
      return null;
    }
  }, [invokeRetellSync, toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (user && liveCalls.length > 0) {
      interval = setInterval(() => {
        fetchLiveStatus();
      }, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, liveCalls.length, fetchLiveStatus]);

  return {
    loading,
    syncing,
    agents,
    calls,
    analytics,
    liveCalls,
    fetchAgents,
    fetchCalls,
    syncCalls,
    fetchAnalytics,
    fetchLiveStatus,
    getCallDetails,
  };
};
