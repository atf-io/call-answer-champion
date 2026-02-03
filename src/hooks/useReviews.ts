import { useState, useEffect } from "react";
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReviews = async () => {
    if (!user) return;
    
    try {
      const data = await api.get<Review[]>("/api/reviews");
      setReviews(data || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load reviews",
      });
    } finally {
      setLoading(false);
    }
  };

  const respondToReview = async (id: string, responseText: string) => {
    try {
      const data = await api.patch<Review>(`/api/reviews/${id}`, {
        responseText,
        responseDate: new Date().toISOString(),
        status: "responded",
      });
      
      setReviews((prev) =>
        prev.map((review) => (review.id === id ? data : review))
      );
      
      toast({
        title: "Response Saved",
        description: "Your response has been saved.",
      });
      
      return data;
    } catch (error) {
      console.error("Error responding to review:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save response",
      });
      return null;
    }
  };

  const ignoreReview = async (id: string) => {
    try {
      const data = await api.patch<Review>(`/api/reviews/${id}`, { status: "ignored" });
      
      setReviews((prev) =>
        prev.map((review) => (review.id === id ? data : review))
      );
      
      return data;
    } catch (error) {
      console.error("Error ignoring review:", error);
      return null;
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user]);

  return {
    reviews,
    loading,
    respondToReview,
    ignoreReview,
    refetch: fetchReviews,
  };
};
