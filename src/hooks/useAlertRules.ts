import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface AlertRule {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  metric_type: string;
  threshold_type: string;
  threshold_value: number;
  comparator: string;
  evaluation_window: string;
  evaluation_frequency: string;
  agent_filter: string[] | null;
  disconnection_reason_filter: string[] | null;
  error_code_filter: string[] | null;
  email_recipients: string[] | null;
  webhook_url: string | null;
  webhook_secret: string | null;
  created_at: string;
  updated_at: string;
  last_evaluated_at: string | null;
  last_triggered_at: string | null;
}

export interface AlertIncident {
  id: string;
  user_id: string;
  alert_rule_id: string;
  status: string;
  current_value: number;
  threshold_value: number;
  triggered_at: string;
  resolved_at: string | null;
  created_at: string;
}

export interface CreateAlertRuleData {
  name: string;
  description?: string;
  metric_type: string;
  threshold_type: string;
  threshold_value: number;
  comparator: string;
  evaluation_window: string;
  evaluation_frequency: string;
  agent_filter?: string[];
  disconnection_reason_filter?: string[];
  error_code_filter?: string[];
  email_recipients?: string[];
  webhook_url?: string;
}

export const METRIC_TYPES = [
  { id: "call_count", name: "Call Count", description: "Total number of calls within the evaluation window" },
  { id: "concurrency_used", name: "Concurrency Used", description: "Peak number of concurrent calls" },
  { id: "call_success_rate", name: "Call Success Rate", description: "Percentage of successful calls (0-100%)" },
  { id: "negative_sentiment_rate", name: "Negative Sentiment Rate", description: "Percentage of calls with negative sentiment (0-100%)" },
  { id: "custom_function_latency", name: "Custom Function Latency", description: "Average latency of custom function calls (ms)" },
  { id: "custom_function_failure_count", name: "Custom Function Failure Count", description: "Number of failed custom function calls" },
  { id: "transfer_call_failure_count", name: "Transfer Call Failure Count", description: "Number of failed call transfers" },
  { id: "total_call_cost", name: "Total Call Cost", description: "Total cost of calls (USD)" },
  { id: "api_error_count", name: "API Error Count", description: "Number of API errors" },
];

export const THRESHOLD_TYPES = [
  { id: "absolute", name: "Absolute", description: "Compare metric value directly against threshold" },
  { id: "relative", name: "Relative", description: "Compare percentage change from previous period" },
];

export const COMPARATORS = [
  { id: ">", name: "Greater than" },
  { id: ">=", name: "Greater than or equal" },
  { id: "<", name: "Less than" },
  { id: "<=", name: "Less than or equal" },
  { id: "=", name: "Equal to" },
];

export const EVALUATION_WINDOWS = [
  { id: "1m", name: "1 minute", frequencies: ["1m"] },
  { id: "5m", name: "5 minutes", frequencies: ["1m", "5m"] },
  { id: "30m", name: "30 minutes", frequencies: ["5m", "30m"] },
  { id: "1h", name: "1 hour", frequencies: ["5m", "30m", "1h"] },
  { id: "12h", name: "12 hours", frequencies: ["30m", "1h", "12h"] },
  { id: "24h", name: "24 hours", frequencies: ["1h", "12h", "24h"] },
  { id: "3d", name: "3 days", frequencies: ["12h", "24h"] },
  { id: "7d", name: "7 days", frequencies: ["24h"] },
];

export const FREQUENCIES = [
  { id: "1m", name: "Every 1 minute" },
  { id: "5m", name: "Every 5 minutes" },
  { id: "30m", name: "Every 30 minutes" },
  { id: "1h", name: "Every 1 hour" },
  { id: "12h", name: "Every 12 hours" },
  { id: "24h", name: "Every 24 hours" },
];

export const DISCONNECTION_REASONS = [
  { id: "user_hangup", name: "User Hangup" },
  { id: "agent_hangup", name: "Agent Hangup" },
  { id: "call_transfer", name: "Call Transfer" },
  { id: "voicemail_detected", name: "Voicemail Detected" },
  { id: "inactivity", name: "Inactivity" },
  { id: "max_duration", name: "Max Duration Reached" },
  { id: "error", name: "Error" },
];

export const useAlertRules = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [incidents, setIncidents] = useState<AlertIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRules = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("alert_rules")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRules((data as AlertRule[]) || []);
    } catch (error) {
      console.error("Error fetching alert rules:", error);
      toast.error("Failed to load alert rules");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchIncidents = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("alert_incidents")
        .select("*")
        .eq("user_id", user.id)
        .order("triggered_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setIncidents((data as AlertIncident[]) || []);
    } catch (error) {
      console.error("Error fetching alert incidents:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchRules();
    fetchIncidents();
  }, [fetchRules, fetchIncidents]);

  const createRule = async (data: CreateAlertRuleData): Promise<AlertRule | null> => {
    if (!user) return null;

    setSaving(true);
    try {
      const { data: newRule, error } = await supabase
        .from("alert_rules")
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Alert rule created");
      await fetchRules();
      return newRule as AlertRule;
    } catch (error) {
      console.error("Error creating alert rule:", error);
      toast.error("Failed to create alert rule");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateRule = async (id: string, updates: Partial<CreateAlertRuleData>): Promise<boolean> => {
    if (!user) return false;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("alert_rules")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Alert rule updated");
      await fetchRules();
      return true;
    } catch (error) {
      console.error("Error updating alert rule:", error);
      toast.error("Failed to update alert rule");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteRule = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("alert_rules")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Alert rule deleted");
      await fetchRules();
      return true;
    } catch (error) {
      console.error("Error deleting alert rule:", error);
      toast.error("Failed to delete alert rule");
      return false;
    }
  };

  const toggleRuleStatus = async (id: string, isActive: boolean): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("alert_rules")
        .update({ is_active: isActive })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(`Alert rule ${isActive ? "enabled" : "disabled"}`);
      await fetchRules();
      return true;
    } catch (error) {
      console.error("Error toggling alert rule:", error);
      toast.error("Failed to update alert rule");
      return false;
    }
  };

  const resolveIncident = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("alert_incidents")
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Incident resolved");
      await fetchIncidents();
      return true;
    } catch (error) {
      console.error("Error resolving incident:", error);
      toast.error("Failed to resolve incident");
      return false;
    }
  };

  return {
    rules,
    incidents,
    loading,
    saving,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleStatus,
    resolveIncident,
    refetch: fetchRules,
  };
};
