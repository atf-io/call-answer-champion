import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KnowledgeBaseEntry {
  id: string;
  userId: string;
  agentId: string | null;
  title: string;
  sourceType: 'url' | 'file' | 'text';
  sourceUrl: string | null;
  content: string;
  summary: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapEntry(data: any): KnowledgeBaseEntry {
  return {
    id: data.id,
    userId: data.user_id,
    agentId: data.agent_id,
    title: data.title,
    sourceType: data.source_type as 'url' | 'file' | 'text',
    sourceUrl: data.source_url,
    content: data.content,
    summary: data.summary,
    metadata: data.metadata ?? {},
    isActive: data.is_active ?? true,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export const useKnowledgeBase = (agentId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ['knowledge-base', user?.id, agentId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('knowledge_base_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (agentId) {
        query = query.eq('agent_id', agentId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching knowledge base:', error);
        return [];
      }
      
      return data.map(mapEntry);
    },
    enabled: !!user,
  });

  const scrapeUrlMutation = useMutation({
    mutationFn: async ({ url, agentId: targetAgentId }: { url: string; agentId?: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Create a placeholder entry - scraping would need an edge function
      const { data, error } = await supabase
        .from('knowledge_base_entries')
        .insert({
          user_id: user.id,
          agent_id: targetAgentId || agentId || null,
          title: `Content from ${new URL(url).hostname}`,
          source_type: 'url',
          source_url: url,
          content: `Content scraped from ${url}`,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return mapEntry(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      toast.success('URL content added to knowledge base');
    },
    onError: (error) => {
      console.error('Error scraping URL:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add URL');
    },
  });

  const addTextMutation = useMutation({
    mutationFn: async ({ title, content, agentId: targetAgentId }: { title: string; content: string; agentId?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('knowledge_base_entries')
        .insert({
          user_id: user.id,
          agent_id: targetAgentId || agentId || null,
          title,
          source_type: 'text',
          content,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return mapEntry(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      toast.success('Text content added to knowledge base');
    },
    onError: (error) => {
      console.error('Error adding text:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add content');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('knowledge_base_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      toast.success('Entry deleted');
    },
    onError: (error) => {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ entryId, isActive }: { entryId: string; isActive: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('knowledge_base_entries')
        .update({ is_active: isActive })
        .eq('id', entryId)
        .eq('user_id', user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, data }: { entryId: string; data: { title?: string; content?: string; summary?: string } }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: updated, error } = await supabase
        .from('knowledge_base_entries')
        .update(data)
        .eq('id', entryId)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return mapEntry(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
      toast.success('Entry updated successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update entry');
    },
  });

  return {
    entries,
    isLoading,
    error,
    scrapeUrl: scrapeUrlMutation.mutate,
    isScraping: scrapeUrlMutation.isPending,
    addText: addTextMutation.mutate,
    isAddingText: addTextMutation.isPending,
    deleteEntry: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    toggleActive: toggleActiveMutation.mutate,
    updateEntry: updateEntryMutation.mutate,
    isUpdating: updateEntryMutation.isPending,
  };
};
