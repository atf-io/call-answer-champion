import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface JobberProductOrService {
  id: string;
  name: string;
  description: string | null;
  category: string;
  defaultUnitCost: number;
  durationMinutes: number | null;
}

export interface JobberCustomField {
  id: string;
  label: string;
  fieldType: string;
  valueType: string;
}

export interface JobberTeamMember {
  id: string;
  name: string;
  email: string | null;
  isActive: boolean;
}

export interface JobberSchemaData {
  productsOrServices: JobberProductOrService[];
  customFields: JobberCustomField[];
  teamMembers: JobberTeamMember[];
}

export function useJobberSchema(connectionId: string | undefined) {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['jobber-schema', connectionId],
    queryFn: async (): Promise<JobberSchemaData> => {
      if (!connectionId || !user?.id) {
        return { productsOrServices: [], customFields: [], teamMembers: [] };
      }

      const { data, error } = await supabase.functions.invoke('crm-sync', {
        body: {
          action: 'fetch_schema',
          crm_type: 'jobber',
          connection_id: connectionId
        }
      });

      if (error) throw error;
      return data || { productsOrServices: [], customFields: [], teamMembers: [] };
    },
    enabled: !!connectionId && !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1,
  });

  return {
    productsOrServices: data?.productsOrServices || [],
    customFields: data?.customFields || [],
    teamMembers: data?.teamMembers || [],
    isLoading,
    error,
    refetch
  };
}
