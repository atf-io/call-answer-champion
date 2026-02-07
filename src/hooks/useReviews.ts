import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Review {
  id: string;
  googleReviewId: string | null;
  authorName: string;
  authorPhotoUrl: string | null;
  rating: number;
  reviewText: string | null;
  reviewDate: string;
  responseText: string | null;
  responseDate: string | null;
  status: "pending" | "responded" | "ignored";
  createdAt: string;
  updatedAt: string;
}

function mapReview(data: any): Review {
  return {
    id: data.id,
    googleReviewId: data.google_review_id,
    authorName: data.author_name,
    authorPhotoUrl: data.author_photo_url,
    rating: data.rating,
    reviewText: data.review_text,
    reviewDate: data.review_date,
    responseText: data.response_text,
    responseDate: data.response_date,
    status: data.status ?? 'pending',
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export const useReviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading: loading } = useQuery({
    queryKey: ['reviews', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('review_date', { ascending: false });
      
      if (error) {
        console.error('Error fetching reviews:', error);
        return [];
      }
      
      return data.map(mapReview);
    },
    enabled: !!user,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, responseText }: { id: string; responseText: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('reviews')
        .update({
          response_text: responseText,
          response_date: new Date().toISOString(),
          status: 'responded',
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return mapReview(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast({
        title: "Response Saved",
        description: "Your response has been saved.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save response",
      });
    },
  });

  const ignoreMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('reviews')
        .update({ status: 'ignored' })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      return mapReview(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });

  const respondToReview = async (id: string, responseText: string) => {
    try {
      return await respondMutation.mutateAsync({ id, responseText });
    } catch {
      return null;
    }
  };

  const ignoreReview = async (id: string) => {
    try {
      return await ignoreMutation.mutateAsync(id);
    } catch {
      return null;
    }
  };

  return {
    reviews,
    loading,
    respondToReview,
    ignoreReview,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['reviews'] }),
  };
};
