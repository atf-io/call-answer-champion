-- Create table for phone numbers synced from Retell
CREATE TABLE public.phone_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  retell_phone_number_id TEXT UNIQUE,
  phone_number TEXT NOT NULL,
  nickname TEXT,
  area_code TEXT,
  inbound_agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  outbound_agent_id UUID REFERENCES public.ai_agents(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own phone numbers" 
ON public.phone_numbers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own phone numbers" 
ON public.phone_numbers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own phone numbers" 
ON public.phone_numbers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own phone numbers" 
ON public.phone_numbers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_phone_numbers_updated_at
BEFORE UPDATE ON public.phone_numbers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();