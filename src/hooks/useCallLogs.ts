import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CallLog {
  id: string;
  userId: string;
  agentId: string | null;
  retellCallId: string | null;
  callerNumber: string | null;
  durationSeconds: number | null;
  status: string | null;
  transcript: string | null;
  sentiment: string | null;
  createdAt: string;
  agent?: {
    name: string;
  };
}

function mapCallLog(data: any): CallLog {
  return {
    id: data.id,
    userId: data.user_id,
    agentId: data.agent_id,
    retellCallId: data.retell_call_id,
    callerNumber: data.caller_number,
    durationSeconds: data.duration_seconds,
    status: data.status,
    transcript: data.transcript,
    sentiment: data.sentiment,
    createdAt: data.created_at,
    agent: data.ai_agents ? { name: data.ai_agents.name } : undefined,
  };
}

export const useCallLogs = () => {
  const { user } = useAuth();

  const { data: callLogs = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['call-logs', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('call_logs')
        .select('*, ai_agents(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('Error fetching call logs:', error);
        return [];
      }
      
      return data.map(mapCallLog);
    },
    enabled: !!user,
  });

  const stats = {
    totalCalls: callLogs.length,
    avgDuration: callLogs.length > 0
      ? Math.round(callLogs.reduce((acc, log) => acc + (log.durationSeconds || 0), 0) / callLogs.length)
      : 0,
    positiveRate: callLogs.length > 0
      ? Math.round((callLogs.filter(log => log.sentiment?.toLowerCase() === "positive").length / callLogs.length) * 100)
      : 0,
    negativeRate: callLogs.length > 0
      ? Math.round((callLogs.filter(log => log.sentiment?.toLowerCase() === "negative").length / callLogs.length) * 100)
      : 0,
  };

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    callLogs,
    loading,
    stats,
    refetch,
    formatDuration,
  };
};
