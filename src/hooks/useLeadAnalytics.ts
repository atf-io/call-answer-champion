import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LeadAnalytics {
  totalLeads: number;
  smsLeads: number;
  voiceLeads: number;
  convertedLeads: number;
  pendingLeads: number;
  lostLeads: number;
  conversionRate: number;
  avgResponseTime: number;
  leadsBySource: Record<string, number>;
  leadsByDay: { date: string; sms: number; voice: number; total: number }[];
  outcomesByDay: { date: string; converted: number; pending: number; lost: number }[];
  sentimentBreakdown: { positive: number; neutral: number; negative: number };
  thisWeekLeads: number;
  lastWeekLeads: number;
  weekOverWeekChange: number;
}

const emptyAnalytics: LeadAnalytics = {
  totalLeads: 0,
  smsLeads: 0,
  voiceLeads: 0,
  convertedLeads: 0,
  pendingLeads: 0,
  lostLeads: 0,
  conversionRate: 0,
  avgResponseTime: 0,
  leadsBySource: {},
  leadsByDay: [],
  outcomesByDay: [],
  sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
  thisWeekLeads: 0,
  lastWeekLeads: 0,
  weekOverWeekChange: 0,
};

export const useLeadAnalytics = (dateRange: number = 30) => {
  const { user } = useAuth();

  return useQuery<LeadAnalytics>({
    queryKey: ["lead-analytics", user?.id, dateRange],
    queryFn: async () => {
      if (!user) return emptyAnalytics;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      const startDateStr = startDate.toISOString();

      // Fetch SMS conversations
      const { data: smsConversations } = await supabase
        .from('sms_conversations')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDateStr);

      // Fetch call logs
      const { data: callLogs } = await supabase
        .from('call_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDateStr);

      const conversations = smsConversations || [];
      const calls = callLogs || [];

      const smsLeads = conversations.length;
      const voiceLeads = calls.length;
      const totalLeads = smsLeads + voiceLeads;

      const convertedConversations = conversations.filter(c => c.conversion_status === 'converted');
      const pendingConversations = conversations.filter(c => 
        c.conversion_status === 'pending' || c.status === 'active' || !c.conversion_status
      );
      const lostConversations = conversations.filter(c => c.conversion_status === 'lost');

      const convertedLeads = convertedConversations.length;
      const pendingLeads = pendingConversations.length;
      const lostLeads = lostConversations.length;

      const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

      // Calculate leads by source
      const leadsBySource: Record<string, number> = {};
      conversations.forEach(c => {
        const source = c.lead_source || 'unknown';
        leadsBySource[source] = (leadsBySource[source] || 0) + 1;
      });
      if (calls.length > 0) {
        leadsBySource['voice_call'] = calls.length;
      }

      // Calculate leads by day
      const leadsByDay: { date: string; sms: number; voice: number; total: number }[] = [];
      const outcomesByDay: { date: string; converted: number; pending: number; lost: number }[] = [];

      for (let i = dateRange - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const daySms = conversations.filter(c => 
          c.created_at && c.created_at.startsWith(dateStr)
        ).length;

        const dayVoice = calls.filter(c => 
          c.created_at && c.created_at.startsWith(dateStr)
        ).length;

        leadsByDay.push({ date: displayDate, sms: daySms, voice: dayVoice, total: daySms + dayVoice });

        const dayConversations = conversations.filter(c => 
          c.created_at && c.created_at.startsWith(dateStr)
        );

        outcomesByDay.push({
          date: displayDate,
          converted: dayConversations.filter(c => c.conversion_status === 'converted').length,
          pending: dayConversations.filter(c => c.conversion_status === 'pending' || !c.conversion_status).length,
          lost: dayConversations.filter(c => c.conversion_status === 'lost').length,
        });
      }

      // Sentiment breakdown from calls
      const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
      calls.forEach(c => {
        if (c.sentiment === 'positive') sentimentBreakdown.positive++;
        else if (c.sentiment === 'negative') sentimentBreakdown.negative++;
        else sentimentBreakdown.neutral++;
      });

      // Week over week
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 14);

      const thisWeekLeads = [
        ...conversations.filter(c => new Date(c.created_at) >= thisWeekStart),
        ...calls.filter(c => new Date(c.created_at) >= thisWeekStart),
      ].length;

      const lastWeekLeads = [
        ...conversations.filter(c => {
          const d = new Date(c.created_at);
          return d >= lastWeekStart && d < thisWeekStart;
        }),
        ...calls.filter(c => {
          const d = new Date(c.created_at);
          return d >= lastWeekStart && d < thisWeekStart;
        }),
      ].length;

      const weekOverWeekChange = lastWeekLeads > 0
        ? Math.round(((thisWeekLeads - lastWeekLeads) / lastWeekLeads) * 100)
        : thisWeekLeads > 0 ? 100 : 0;

      return {
        totalLeads,
        smsLeads,
        voiceLeads,
        convertedLeads,
        pendingLeads,
        lostLeads,
        conversionRate,
        avgResponseTime: 0,
        leadsBySource,
        leadsByDay,
        outcomesByDay,
        sentimentBreakdown,
        thisWeekLeads,
        lastWeekLeads,
        weekOverWeekChange,
      };
    },
    enabled: !!user,
  });
};
