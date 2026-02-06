import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface KnowledgeBaseEntry {
  id: string;
  userId: number;
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

export const useKnowledgeBase = (agentId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ['knowledge-base', agentId],
    queryFn: async () => {
      if (!user) return [];
      const url = agentId ? `/api/knowledge-base?agentId=${agentId}` : '/api/knowledge-base';
      return api.get<KnowledgeBaseEntry[]>(url);
    },
    enabled: !!user,
  });

  const scrapeUrlMutation = useMutation({
    mutationFn: async ({ url, agentId }: { url: string; agentId?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const scraped = await api.post<{ success: boolean; data: any; error?: string }>('/api/scrape-knowledge-base', { url });

      if (!scraped.success) throw new Error(scraped.error || 'Failed to scrape URL');

      const entry = await api.post<KnowledgeBaseEntry>('/api/knowledge-base', {
        agentId: agentId || null,
        title: scraped.data.title,
        sourceType: 'url',
        sourceUrl: scraped.data.source_url,
        content: scraped.data.content,
        summary: scraped.data.summary,
        metadata: scraped.data.metadata,
      });

      return entry;
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

      return api.post<KnowledgeBaseEntry>('/api/knowledge-base', {
        agentId: agentId || null,
        title,
        sourceType: 'text',
        content,
      });
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
      await api.delete(`/api/knowledge-base/${entryId}`);
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
      await api.patch(`/api/knowledge-base/${entryId}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-base'] });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, data }: { entryId: string; data: { title?: string; content?: string; summary?: string } }) => {
      return api.patch<KnowledgeBaseEntry>(`/api/knowledge-base/${entryId}`, data);
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
