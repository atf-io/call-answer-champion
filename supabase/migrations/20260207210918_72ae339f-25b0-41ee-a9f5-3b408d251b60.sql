-- Create table to store Google OAuth tokens for Business Profile access
CREATE TABLE public.google_oauth_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.google_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only view their own tokens
CREATE POLICY "Users can view their own tokens"
ON public.google_oauth_tokens
FOR SELECT
USING (auth.uid()::text = user_id::text);

-- Users can insert their own tokens
CREATE POLICY "Users can insert their own tokens"
ON public.google_oauth_tokens
FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own tokens
CREATE POLICY "Users can update their own tokens"
ON public.google_oauth_tokens
FOR UPDATE
USING (auth.uid()::text = user_id::text);

-- Users can delete their own tokens
CREATE POLICY "Users can delete their own tokens"
ON public.google_oauth_tokens
FOR DELETE
USING (auth.uid()::text = user_id::text);

-- Trigger for updated_at
CREATE TRIGGER update_google_oauth_tokens_updated_at
BEFORE UPDATE ON public.google_oauth_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();