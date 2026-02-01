import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Review {
  id: string;
  google_review_id: string | null;
  author_name: string;
  author_photo_url: string | null;
  rating: number;
  review_text: string | null;
  review_date: string;
  response_text: string | null;
  response_date: string | null;
  status: "pending" | "responded" | "ignored";
  created_at: string;
  updated_at: string;
}

export const useReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReviews = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("review_date", { ascending: false });

      if (error) throw error;
      setReviews((data || []) as Review[]);
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
      const { data, error } = await supabase
        .from("reviews")
        .update({
          response_text: responseText,
          response_date: new Date().toISOString(),
          status: "responded",
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setReviews((prev) =>
        prev.map((review) => (review.id === id ? (data as Review) : review))
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
      const { data, error } = await supabase
        .from("reviews")
        .update({ status: "ignored" })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      setReviews((prev) =>
        prev.map((review) => (review.id === id ? (data as Review) : review))
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
