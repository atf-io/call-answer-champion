import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { CrmConnection, CrmType, CrmSyncSettings } from '@/lib/crm/types';
import type { Json } from '@/integrations/supabase/types';

// Helper to safely parse sync settings from JSON
function parseSyncSettings(json: Json | null): CrmSyncSettings {
  const defaults: CrmSyncSettings = {
    sync_sms: true,
    sync_calls: true,
    auto_sync: true,
    sync_contacts: true
  };
  
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return defaults;
  }
  
  const obj = json as Record<string, Json>;
  return {
    sync_sms: typeof obj.sync_sms === 'boolean' ? obj.sync_sms : defaults.sync_sms,
    sync_calls: typeof obj.sync_calls === 'boolean' ? obj.sync_calls : defaults.sync_calls,
    auto_sync: typeof obj.auto_sync === 'boolean' ? obj.auto_sync : defaults.auto_sync,
    sync_contacts: typeof obj.sync_contacts === 'boolean' ? obj.sync_contacts : defaults.sync_contacts,
  };
}

export function useCrmConnections() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: connections, isLoading, error } = useQuery({
    queryKey: ['crm-connections', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('crm_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Map database rows to typed CrmConnection
      return (data || []).map(row => ({
        ...row,
        crm_type: row.crm_type as CrmType,
        sync_settings: parseSyncSettings(row.sync_settings)
      })) as CrmConnection[];
    },
    enabled: !!user?.id,
  });

  const initiateOAuth = useMutation({
    mutationFn: async ({ crmType, redirectUri }: { crmType: CrmType; redirectUri: string }) => {
      const { data, error } = await supabase.functions.invoke('crm-oauth', {
        body: {
          action: 'initiate',
          crm_type: crmType,
          redirect_uri: redirectUri
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.auth_url) {
        // Open OAuth in a popup window to avoid iframe restrictions
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.auth_url,
          'jobber-oauth',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );
        
        if (!popup) {
          // Popup was blocked, fall back to redirect
          toast.info('Popup blocked - redirecting to Jobber...');
          window.open(data.auth_url, '_blank');
        } else {
          toast.info('Complete authorization in the popup window');
        }
      } else if (data.success) {
        // Demo mode - refresh connections
        queryClient.invalidateQueries({ queryKey: ['crm-connections'] });
        toast.success('CRM connected successfully!');
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to start OAuth: ${error.message}`);
    }
  });

  const handleOAuthCallback = useMutation({
    mutationFn: async ({ crmType, code, state }: { crmType: CrmType; code: string; state?: string }) => {
      const { data, error } = await supabase.functions.invoke('crm-oauth', {
        body: {
          action: 'callback',
          crm_type: crmType,
          code,
          state
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-connections'] });
      toast.success('CRM connected successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to connect CRM: ${error.message}`);
    }
  });

  const disconnectCrm = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('crm_connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-connections'] });
      toast.success('CRM disconnected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    }
  });

  const updateSyncSettings = useMutation({
    mutationFn: async ({ connectionId, settings }: { connectionId: string; settings: Partial<CrmSyncSettings> }) => {
      // Get current settings first
      const { data: current, error: fetchError } = await supabase
        .from('crm_connections')
        .select('sync_settings')
        .eq('id', connectionId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentSettings = parseSyncSettings(current.sync_settings);
      const updatedSettings = { ...currentSettings, ...settings };
      
      const { error } = await supabase
        .from('crm_connections')
        .update({ sync_settings: updatedSettings })
        .eq('id', connectionId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-connections'] });
      toast.success('Sync settings updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update settings: ${error.message}`);
    }
  });

  const toggleConnection = useMutation({
    mutationFn: async ({ connectionId, isActive }: { connectionId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('crm_connections')
        .update({ is_active: isActive })
        .eq('id', connectionId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm-connections'] });
      toast.success(variables.isActive ? 'CRM sync enabled' : 'CRM sync paused');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update connection: ${error.message}`);
    }
  });

  const getConnectionByType = (crmType: CrmType) => {
    return connections?.find(c => c.crm_type === crmType);
  };

  return {
    connections: connections || [],
    isLoading,
    error,
    initiateOAuth,
    handleOAuthCallback,
    disconnectCrm,
    updateSyncSettings,
    toggleConnection,
    getConnectionByType
  };
}
