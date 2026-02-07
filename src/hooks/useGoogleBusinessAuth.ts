import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Google OAuth scopes for Business Profile API
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

export interface GoogleBusinessAuthState {
  isConnected: boolean;
  isLoading: boolean;
  businessName: string | null;
  lastSyncedAt: string | null;
}

interface OAuthConfig {
  configured: boolean;
  clientId?: string;
  message?: string;
}

export function useGoogleBusinessAuth() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [state, setState] = useState<GoogleBusinessAuthState>({
    isConnected: false,
    isLoading: true,
    businessName: null,
    lastSyncedAt: null,
  });
  const [oauthConfig, setOAuthConfig] = useState<OAuthConfig | null>(null);

  // Fetch OAuth config from backend
  const fetchOAuthConfig = useCallback(async () => {
    try {
      const response = await supabase.functions.invoke('google-oauth-config');
      if (response.error) {
        console.error('Error fetching OAuth config:', response.error);
        return;
      }
      setOAuthConfig(response.data);
    } catch (error) {
      console.error('Error fetching OAuth config:', error);
    }
  }, []);

  // Check connection status on mount
  const checkConnection = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('google_integrations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking Google connection:', error);
      }

      setState({
        isConnected: data?.is_connected ?? false,
        isLoading: false,
        businessName: data?.business_name ?? null,
        lastSyncedAt: data?.last_synced_at ?? null,
      });
    } catch (error) {
      console.error('Error checking Google connection:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  useEffect(() => {
    fetchOAuthConfig();
    checkConnection();
  }, [fetchOAuthConfig, checkConnection]);

  // Generate OAuth authorization URL
  const getAuthUrl = useCallback(() => {
    if (!oauthConfig?.configured || !oauthConfig?.clientId) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: oauthConfig?.message || 'Google OAuth is not configured. Please contact support.',
      });
      return null;
    }

    const redirectUri = `${window.location.origin}/auth/google/callback`;
    
    // Generate state for CSRF protection
    const csrfState = crypto.randomUUID().replace(/-/g, '');
    sessionStorage.setItem('google_oauth_state', csrfState);

    const params = new URLSearchParams({
      client_id: oauthConfig.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_SCOPES,
      state: csrfState,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }, [oauthConfig, toast]);

  // Initiate Google OAuth flow
  const connectGoogle = useCallback(() => {
    if (!oauthConfig?.configured || !oauthConfig?.clientId) {
      toast({
        variant: 'destructive',
        title: 'Configuration Required',
        description: oauthConfig?.message || 'Google OAuth credentials have not been configured yet.',
      });
      return;
    }
    const authUrl = getAuthUrl();
    if (authUrl) {
      window.location.href = authUrl;
    }
  }, [oauthConfig, getAuthUrl, toast]);

  // Handle OAuth callback
  const handleCallback = useCallback(async (code: string, returnedState: string) => {
    const storedState = sessionStorage.getItem('google_oauth_state');
    
    if (!returnedState || returnedState !== storedState) {
      toast({
        variant: 'destructive',
        title: 'Security Error',
        description: 'Invalid state parameter. Please try again.',
      });
      return false;
    }

    sessionStorage.removeItem('google_oauth_state');

    if (!session?.access_token) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Please log in to connect your Google account.',
      });
      return false;
    }

    try {
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      
      const response = await supabase.functions.invoke('google-oauth-exchange', {
        body: { code, redirectUri },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to exchange code');
      }

      toast({
        title: 'Connected!',
        description: 'Your Google Business Profile has been connected successfully.',
      });

      await checkConnection();
      return true;
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast({
        variant: 'destructive',
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Failed to connect Google account.',
      });
      return false;
    }
  }, [session, toast, checkConnection]);

  // Disconnect Google account
  const disconnectGoogle = useCallback(async () => {
    if (!session?.access_token) return false;

    try {
      const response = await supabase.functions.invoke('google-oauth-exchange', {
        body: { action: 'disconnect' },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: 'Disconnected',
        description: 'Your Google Business Profile has been disconnected.',
      });

      setState({
        isConnected: false,
        isLoading: false,
        businessName: null,
        lastSyncedAt: null,
      });

      return true;
    } catch (error) {
      console.error('Disconnect error:', error);
      toast({
        variant: 'destructive',
        title: 'Disconnect Failed',
        description: 'Failed to disconnect Google account.',
      });
      return false;
    }
  }, [session, toast]);

  return {
    ...state,
    connectGoogle,
    disconnectGoogle,
    handleCallback,
    refetch: checkConnection,
  };
}