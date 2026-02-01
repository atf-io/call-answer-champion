import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, RefreshCw, Filter, CheckCircle2, Clock, Sparkles } from "lucide-react";

const reviews = [
  {
    id: 1,
    author: "Sarah Mitchell",
    rating: 5,
    text: "Absolutely fantastic service! The team was incredibly responsive and professional. Would highly recommend to anyone looking for quality work.",
    date: "2 hours ago",
    status: "responded",
    response: "Thank you so much for your kind words, Sarah! We're thrilled to hear you had a great experience with our team.",
  },
  {
    id: 2,
    author: "John Davidson",
    rating: 4,
    text: "Good overall experience. The work was completed on time and the quality was solid. Just a minor issue with communication that was quickly resolved.",
    date: "5 hours ago",
    status: "pending",
    response: null,
  },
  {
    id: 3,
    author: "Michael Roberts",
    rating: 3,
    text: "Average service. There's definitely room for improvement in terms of response time and follow-up. However, the final result was satisfactory.",
    date: "1 day ago",
    status: "pending",
    response: null,
  },
  {
    id: 4,
    author: "Emily Chen",
    rating: 5,
    text: "Exceptional work! They went above and beyond my expectations. The attention to detail was remarkable and the customer service was top-notch.",
    date: "2 days ago",
    status: "responded",
    response: "Thank you, Emily! Your feedback means the world to us. We look forward to serving you again!",
  },
  {
    id: 5,
    author: "David Wilson",
    rating: 2,
    text: "Disappointed with the service. Delays and miscommunication made the experience frustrating. Expected better based on reviews.",
    date: "3 days ago",
    status: "pending",
    response: null,
  },
];

const Reviews = () => {
  const [filter, setFilter] = useState<"all" | "pending" | "responded">("all");

  const filteredReviews = reviews.filter((review) => {
    if (filter === "all") return true;
    return review.status === filter;
  });

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

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
            <Button variant="outline">
              <RefreshCw className="w-4 h-4" />
              Sync Reviews
            </Button>
            <Button variant="hero">
              <Sparkles className="w-4 h-4" />
              Auto-Respond All
            </Button>
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
              <p className="text-xl font-bold">4.2</p>
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
            All Reviews
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
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-lg font-semibold text-primary-foreground">
                    {review.author.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{review.author}</h3>
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
                      <span className="text-xs text-muted-foreground">• {review.date}</span>
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

              <p className="text-foreground mb-4">{review.text}</p>

              {review.response ? (
                <div className="bg-muted/30 rounded-xl p-4 border-l-2 border-primary">
                  <p className="text-xs text-muted-foreground mb-2">Your Response:</p>
                  <p className="text-sm text-foreground">{review.response}</p>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button variant="default" size="sm">
                    <Sparkles className="w-4 h-4" />
                    Generate AI Response
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4" />
                    Write Manually
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reviews;
