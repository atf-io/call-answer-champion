import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

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

export const useLeadAnalytics = (dateRange: number = 30) => {
  return useQuery<LeadAnalytics>({
    queryKey: ["/api/lead-analytics", dateRange],
    queryFn: () => api.get<LeadAnalytics>(`/api/lead-analytics?days=${dateRange}`),
  });
};
