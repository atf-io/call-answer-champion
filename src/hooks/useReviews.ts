import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
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

export const useReviews = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading: loading } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => api.get<Review[]>("/api/reviews"),
    enabled: !!user,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, responseText }: { id: string; responseText: string }) => {
      return api.patch<Review>(`/api/reviews/${id}`, {
        responseText,
        responseDate: new Date().toISOString(),
        status: "responded",
      });
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
      return api.patch<Review>(`/api/reviews/${id}`, { status: "ignored" });
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
