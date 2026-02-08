import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { CrmSyncLog, CrmType } from '@/lib/crm/types';

export function useCrmSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch recent sync logs
  const { data: syncLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['crm-sync-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('crm_sync_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as CrmSyncLog[];
    },
    enabled: !!user?.id,
  });

  // Sync a single SMS message to CRM
  const syncMessage = useMutation({
    mutationFn: async ({ messageId, crmType }: { messageId: string; crmType?: CrmType }) => {
      const { data, error } = await supabase.functions.invoke('crm-sync', {
        body: {
          action: 'sync_message',
          entity_type: 'sms_message',
          entity_id: messageId,
          crm_type: crmType
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['crm-sync-logs'] });
      if (data.success) {
        toast.success('Message synced to CRM');
      } else {
        toast.error('Some syncs failed', { description: data.results?.find((r: any) => !r.success)?.error });
      }
    },
    onError: (error: Error) => {
      toast.error(`Sync failed: ${error.message}`);
    }
  });

  // Sync a single call log to CRM
  const syncCall = useMutation({
    mutationFn: async ({ callId, crmType }: { callId: string; crmType?: CrmType }) => {
      const { data, error } = await supabase.functions.invoke('crm-sync', {
        body: {
          action: 'sync_call',
          entity_type: 'call_log',
          entity_id: callId,
          crm_type: crmType
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['crm-sync-logs'] });
      if (data.success) {
        toast.success('Call synced to CRM');
      } else {
        toast.error('Some syncs failed', { description: data.results?.find((r: any) => !r.success)?.error });
      }
    },
    onError: (error: Error) => {
      toast.error(`Sync failed: ${error.message}`);
    }
  });

  // Batch sync multiple items
  const batchSync = useMutation({
    mutationFn: async ({ entityType, entityIds, crmType }: { 
      entityType: 'sms_message' | 'call_log'; 
      entityIds: string[]; 
      crmType?: CrmType 
    }) => {
      const { data, error } = await supabase.functions.invoke('crm-sync', {
        body: {
          action: 'batch_sync',
          entity_type: entityType,
          entity_ids: entityIds,
          crm_type: crmType
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['crm-sync-logs'] });
      toast.success(`Queued ${data.queued} items for sync`);
    },
    onError: (error: Error) => {
      toast.error(`Batch sync failed: ${error.message}`);
    }
  });

  // Get sync stats
  const getSyncStats = () => {
    if (!syncLogs) return { total: 0, success: 0, failed: 0, pending: 0 };
    
    return {
      total: syncLogs.length,
      success: syncLogs.filter(l => l.status === 'success').length,
      failed: syncLogs.filter(l => l.status === 'failed').length,
      pending: syncLogs.filter(l => l.status === 'pending').length,
    };
  };

  // Get logs for a specific entity
  const getLogsForEntity = (entityId: string) => {
    return syncLogs?.filter(l => l.entity_id === entityId) || [];
  };

  return {
    syncLogs: syncLogs || [],
    logsLoading,
    syncMessage,
    syncCall,
    batchSync,
    getSyncStats,
    getLogsForEntity
  };
}
