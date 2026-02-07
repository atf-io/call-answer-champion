-- Create alert_rules table for storing Retell AI-style alerting configurations
CREATE TABLE public.alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  -- Metric configuration
  metric_type TEXT NOT NULL, -- call_count, concurrency_used, call_success_rate, negative_sentiment_rate, custom_function_latency, custom_function_failure_count, transfer_call_failure_count, total_call_cost, api_error_count
  
  -- Threshold configuration
  threshold_type TEXT NOT NULL DEFAULT 'absolute', -- absolute, relative
  threshold_value NUMERIC NOT NULL,
  comparator TEXT NOT NULL DEFAULT '>', -- >, <, >=, <=, =
  
  -- Evaluation timing
  evaluation_window TEXT NOT NULL DEFAULT '1h', -- 1m, 5m, 30m, 1h, 12h, 24h, 3d, 7d
  evaluation_frequency TEXT NOT NULL DEFAULT '1h', -- 1m, 5m, 30m, 1h, 12h, 24h
  
  -- Filters (optional)
  agent_filter UUID[], -- specific agents to monitor
  disconnection_reason_filter TEXT[], -- user_hangup, agent_hangup, error, etc.
  error_code_filter TEXT[], -- for API error count metric
  
  -- Notification channels
  email_recipients TEXT[],
  webhook_url TEXT,
  webhook_secret TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_evaluated_at TIMESTAMP WITH TIME ZONE,
  last_triggered_at TIMESTAMP WITH TIME ZONE
);

-- Create alert_incidents table for tracking triggered alerts
CREATE TABLE public.alert_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_rule_id UUID NOT NULL REFERENCES public.alert_rules(id) ON DELETE CASCADE,
  
  -- Incident details
  status TEXT NOT NULL DEFAULT 'triggered', -- triggered, active, resolved
  current_value NUMERIC NOT NULL,
  threshold_value NUMERIC NOT NULL,
  
  -- Timestamps
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_incidents ENABLE ROW LEVEL SECURITY;

-- RLS policies for alert_rules
CREATE POLICY "Users can view their own alert rules"
  ON public.alert_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alert rules"
  ON public.alert_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert rules"
  ON public.alert_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alert rules"
  ON public.alert_rules FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for alert_incidents
CREATE POLICY "Users can view their own alert incidents"
  ON public.alert_incidents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alert incidents"
  ON public.alert_incidents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert incidents"
  ON public.alert_incidents FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_alert_rules_updated_at
  BEFORE UPDATE ON public.alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();