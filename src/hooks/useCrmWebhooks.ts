import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { CrmType } from '@/lib/crm/types';

interface WebhookSecret {
  id: string;
  user_id: string;
  crm_type: CrmType;
  secret_key: string;
  is_active: boolean;
  created_at: string;
}

export function useCrmWebhooks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: webhookSecrets, isLoading } = useQuery({
    queryKey: ['crm-webhook-secrets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('crm_webhook_secrets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WebhookSecret[];
    },
    enabled: !!user?.id,
  });

  const generateWebhookUrl = (crmType: CrmType) => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${baseUrl}/functions/v1/crm-webhook?crm=${crmType}&user_id=${user?.id}`;
  };

  const createWebhookSecret = useMutation({
    mutationFn: async ({ crmType }: { crmType: CrmType }) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      // Generate a random secret
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const secretKey = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { data, error } = await supabase
        .from('crm_webhook_secrets')
        .upsert({
          user_id: user.id,
          crm_type: crmType,
          secret_key: secretKey,
          is_active: true,
        }, {
          onConflict: 'user_id,crm_type',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-webhook-secrets'] });
      toast.success('Webhook secret generated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate secret: ${error.message}`);
    }
  });

  const regenerateSecret = useMutation({
    mutationFn: async ({ secretId }: { secretId: string }) => {
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const secretKey = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const { error } = await supabase
        .from('crm_webhook_secrets')
        .update({ secret_key: secretKey })
        .eq('id', secretId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      return secretKey;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-webhook-secrets'] });
      toast.success('Webhook secret regenerated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to regenerate secret: ${error.message}`);
    }
  });

  const toggleWebhookActive = useMutation({
    mutationFn: async ({ secretId, isActive }: { secretId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('crm_webhook_secrets')
        .update({ is_active: isActive })
        .eq('id', secretId)
        .eq('user_id', user?.id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['crm-webhook-secrets'] });
      toast.success(variables.isActive ? 'Webhook enabled' : 'Webhook disabled');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update webhook: ${error.message}`);
    }
  });

  const getSecretForCrm = (crmType: CrmType) => {
    return webhookSecrets?.find(s => s.crm_type === crmType);
  };

  return {
    webhookSecrets: webhookSecrets || [],
    isLoading,
    generateWebhookUrl,
    createWebhookSecret,
    regenerateSecret,
    toggleWebhookActive,
    getSecretForCrm,
  };
}
