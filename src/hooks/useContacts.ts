import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string;
  status: string;
  service_requested: string | null;
  address: string | null;
  tags: string[] | null;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateContactData {
  name: string;
  phone?: string;
  email?: string;
  source?: string;
  status?: string;
  service_requested?: string;
  address?: string;
  tags?: string[];
  notes?: string;
}

export function useContacts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: contacts = [],
    isLoading,
    error,
  } = useQuery<Contact[]>({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateContactData) => {
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          user_id: user!.id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          source: data.source || 'manual',
          status: data.status || 'new',
          service_requested: data.service_requested,
          address: data.address,
          tags: data.tags,
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: "Contact created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create contact", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateContactData> }) => {
      const { data: contact, error } = await supabase
        .from('contacts')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: "Contact updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update contact", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: "Contact deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete contact", description: error.message, variant: "destructive" });
    },
  });

  return {
    contacts,
    isLoading,
    error,
    createContact: createMutation.mutateAsync,
    updateContact: (id: string, data: Partial<CreateContactData>) =>
      updateMutation.mutateAsync({ id, data }),
    deleteContact: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
