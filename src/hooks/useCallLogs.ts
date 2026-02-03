import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface CallLog {
  id: string;
  userId: number;
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

export const useCallLogs = () => {
  const { user } = useAuth();

  const { data: callLogs = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['call-logs'],
    queryFn: () => api.get<CallLog[]>("/api/call-logs"),
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
