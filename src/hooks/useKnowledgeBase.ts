import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KnowledgeBaseEntry {
  id: string;
  user_id: string;
  agent_id: string | null;
  title: string;
  source_type: 'url' | 'file' | 'text';
  source_url: string | null;
  content: string;
  summary: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useKnowledgeBase = (agentId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ['knowledge-base', agentId],
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
      
      if (error) throw error;
      return data as KnowledgeBaseEntry[];
    },
    enabled: !!user,
  });

  const scrapeUrlMutation = useMutation({
    mutationFn: async ({ url, agentId }: { url: string; agentId?: string }) => {
      if (!user) throw new Error('Not authenticated');

      // Call the edge function to scrape the URL
      const { data: scraped, error: scrapeError } = await supabase.functions.invoke('scrape-knowledge-base', {
        body: { url },
      });

      if (scrapeError) throw scrapeError;
      if (!scraped.success) throw new Error(scraped.error || 'Failed to scrape URL');

      // Store the scraped content in the database
      const { data, error } = await supabase
        .from('knowledge_base_entries')
        .insert({
          user_id: user.id,
          agent_id: agentId || null,
          title: scraped.data.title,
          source_type: 'url',
          source_url: scraped.data.source_url,
          content: scraped.data.content,
          summary: scraped.data.summary,
          metadata: scraped.data.metadata,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
    mutationFn: async ({ title, content, agentId }: { title: string; content: string; agentId?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('knowledge_base_entries')
        .insert({
          user_id: user.id,
          agent_id: agentId || null,
          title,
          source_type: 'text',
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { error } = await supabase
        .from('knowledge_base_entries')
        .delete()
        .eq('id', entryId);

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
      const { error } = await supabase
        .from('knowledge_base_entries')
        .update({ is_active: isActive })
        .eq('id', entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
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
  };
};
