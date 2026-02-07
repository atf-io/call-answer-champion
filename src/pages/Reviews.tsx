import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare, RefreshCw, CheckCircle2, Clock, Sparkles, Loader2, Unlink } from "lucide-react";
import { useReviews } from "@/hooks/useReviews";
import { useGoogleBusinessAuth } from "@/hooks/useGoogleBusinessAuth";

const Reviews = () => {
  const { reviews, loading, respondToReview } = useReviews();
  const { isConnected, isLoading: authLoading, connectGoogle, disconnectGoogle, businessName } = useGoogleBusinessAuth();
  const [filter, setFilter] = useState<"all" | "pending" | "responded">("all");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const filteredReviews = reviews.filter((review) => {
    if (filter === "all") return true;
    return review.status === filter;
  });

  const pendingCount = reviews.filter((r) => r.status === "pending").length;
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;
    
    setSaving(true);
    await respondToReview(reviewId, responseText);
    setSaving(false);
    setRespondingTo(null);
    setResponseText("");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    await disconnectGoogle();
    setDisconnecting(false);
  };

  if (loading || authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Google Reviews</h1>
            <p className="text-muted-foreground">Manage and respond to customer reviews</p>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span className="text-sm text-success font-medium">
                    {businessName || 'Connected'}
                  </span>
                </div>
                <Button variant="outline" disabled={disconnecting} onClick={handleDisconnect}>
                  {disconnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlink className="w-4 h-4" />}
                  Disconnect
                </Button>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4" />
                  Sync Reviews
                </Button>
                <Button variant="hero">
                  <Sparkles className="w-4 h-4" />
                  Auto-Respond All
                </Button>
              </>
            ) : (
              <Button variant="hero" onClick={connectGoogle}>
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                Connect Google
              </Button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 mb-6 p-4 glass rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-bold">{pendingCount}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Responded</p>
              <p className="text-xl font-bold">{reviews.length - pendingCount}</p>
            </div>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Rating</p>
              <p className="text-xl font-bold">{avgRating}</p>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant={filter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All Reviews ({reviews.length})
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("pending")}
          >
            Pending ({pendingCount})
          </Button>
          <Button
            variant={filter === "responded" ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter("responded")}
          >
            Responded
          </Button>
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {isConnected ? 'No Reviews Yet' : 'Connect Google to Get Started'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isConnected 
                ? 'Reviews from your Google Business Profile will appear here'
                : 'Connect your Google Business Profile to start managing reviews'}
            </p>
            {!isConnected && (
              <Button variant="hero" onClick={connectGoogle}>
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                Connect Google
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <div key={review.id} className="glass rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-lg font-semibold text-primary-foreground">
                      {review.authorName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{review.authorName}</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? "text-warning fill-warning" : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          • {formatDate(review.reviewDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                    review.status === "responded" 
                      ? "bg-success/10 text-success" 
                      : "bg-warning/10 text-warning"
                  }`}>
                    {review.status === "responded" ? "Responded" : "Pending Response"}
                  </span>
                </div>

                <p className="text-foreground mb-4">{review.reviewText || "No review text"}</p>

                {review.responseText ? (
                  <div className="bg-muted/30 rounded-xl p-4 border-l-2 border-primary">
                    <p className="text-xs text-muted-foreground mb-2">Your Response:</p>
                    <p className="text-sm text-foreground">{review.responseText}</p>
                  </div>
                ) : respondingTo === review.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Write your response..."
                      className="bg-muted/50 min-h-[100px]"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRespond(review.id)}
                        disabled={saving || !responseText.trim()}
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Response"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRespondingTo(null);
                          setResponseText("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Button variant="default" size="sm">
                      <Sparkles className="w-4 h-4" />
                      Generate AI Response
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setRespondingTo(review.id)}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Write Manually
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reviews;
