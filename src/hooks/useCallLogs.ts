import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCalls: 0,
    avgDuration: 0,
    positiveRate: 0,
    negativeRate: 0,
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCallLogs = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const logs = await api.get<CallLog[]>("/api/call-logs");
      setCallLogs(logs || []);

      const totalCalls = logs.length;
      const totalDuration = logs.reduce((acc, log) => acc + (log.durationSeconds || 0), 0);
      const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

      const positiveCount = logs.filter(log => 
        log.sentiment?.toLowerCase() === "positive"
      ).length;
      const negativeCount = logs.filter(log => 
        log.sentiment?.toLowerCase() === "negative"
      ).length;

      setStats({
        totalCalls,
        avgDuration,
        positiveRate: totalCalls > 0 ? Math.round((positiveCount / totalCalls) * 100) : 0,
        negativeRate: totalCalls > 0 ? Math.round((negativeCount / totalCalls) * 100) : 0,
      });
    } catch (error) {
      console.error("Error fetching call logs:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load call history",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCallLogs();
  }, [fetchCallLogs]);

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
    refetch: fetchCallLogs,
    formatDuration,
  };
};
