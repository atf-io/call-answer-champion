import { useState, useEffect, useRef } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageSquare, 
  Search, 
  Phone, 
  User, 
  Bot, 
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Calendar,
  MapPin,
  Wrench
} from "lucide-react";
import { useSmsConversations, useSmsMessages, SmsConversation } from "@/hooks/useSmsConversations";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

const ChatHistory = () => {
  const { conversations, isLoading: conversationsLoading } = useSmsConversations();
  const [selectedConversation, setSelectedConversation] = useState<SmsConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { messages, isLoading: messagesLoading } = useSmsMessages(selectedConversation?.id || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredConversations = conversations.filter((conv) => {
    const query = searchQuery.toLowerCase();
    return (
      conv.lead_name?.toLowerCase().includes(query) ||
      conv.lead_phone.includes(query) ||
      conv.lead_source?.toLowerCase().includes(query) ||
      conv.service_details?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (conv: SmsConversation) => {
    if (conv.is_escalated) {
      return (
        <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Escalated
        </Badge>
      );
    }
    if (conv.status === "ended") {
      return (
        <Badge variant="secondary">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Ended
        </Badge>
      );
    }
    if (conv.appointment_scheduled) {
      return (
        <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30">
          <Calendar className="w-3 h-3 mr-1" />
          Booked
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30">
        Active
      </Badge>
    );
  };

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive":
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  if (conversationsLoading) {
    return (
      <AgentLayout title="Chat History">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AgentLayout>
    );
  }

  // Mobile: show detail view if conversation selected
  if (selectedConversation) {
    return (
      <AgentLayout title="Chat History">
        <div className="h-[calc(100vh-12rem)] flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b bg-card rounded-t-lg">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedConversation(null)}
              className="lg:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {selectedConversation.lead_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">
                  {selectedConversation.lead_name || "Unknown"}
                </h3>
                {getStatusBadge(selectedConversation)}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {selectedConversation.lead_phone}
                </span>
                {selectedConversation.lead_source && (
                  <Badge variant="outline" className="capitalize text-xs">
                    {selectedConversation.lead_source}
                  </Badge>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedConversation(null)}
              className="hidden lg:flex"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>

          {/* Conversation Details */}
          {(selectedConversation.service_details || selectedConversation.address_collected || selectedConversation.appointment_date) && (
            <div className="p-3 border-b bg-muted/30 flex flex-wrap gap-4 text-sm">
              {selectedConversation.service_details && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{selectedConversation.service_details}</span>
                </div>
              )}
              {selectedConversation.address_collected && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedConversation.address_collected}</span>
                </div>
              )}
              {selectedConversation.appointment_date && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{format(new Date(selectedConversation.appointment_date), "MMM d, yyyy 'at' h:mm a")}</span>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-2 opacity-30" />
                <p>No messages yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isAgent = message.sender_type === "agent";
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        isAgent ? "justify-start" : "justify-end"
                      )}
                    >
                      {isAgent && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2.5",
                          isAgent
                            ? "bg-muted text-foreground rounded-tl-sm"
                            : "bg-primary text-primary-foreground rounded-tr-sm"
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            isAgent ? "text-muted-foreground" : "text-primary-foreground/70"
                          )}
                        >
                          {format(new Date(message.created_at), "h:mm a")}
                        </p>
                      </div>
                      {!isAgent && (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-secondary">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Escalation Banner */}
          {selectedConversation.is_escalated && (
            <div className="p-3 bg-red-500/10 border-t border-red-500/20 flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span>
                Escalated{" "}
                {selectedConversation.escalated_at &&
                  formatDistanceToNow(new Date(selectedConversation.escalated_at), { addSuffix: true })}
                {selectedConversation.escalation_reason && `: ${selectedConversation.escalation_reason}`}
              </span>
            </div>
          )}
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout
      title="Chat History"
      description="View SMS conversations between your agents and contacts"
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name, phone, or source..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Conversation List */}
        {filteredConversations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? "No matching conversations" : "No chat history yet"}
              </h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {searchQuery 
                  ? "Try adjusting your search query"
                  : "SMS conversations with your AI agents will appear here"
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredConversations.map((conversation) => (
              <Card
                key={conversation.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedConversation(conversation)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {conversation.lead_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-semibold truncate">
                          {conversation.lead_name || "Unknown Contact"}
                        </h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {conversation.last_message_at
                            ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })
                            : "No messages"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {conversation.lead_phone}
                        </span>
                        {conversation.lead_source && (
                          <Badge variant="outline" className="capitalize text-xs">
                            {conversation.lead_source}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(conversation)}
                          {conversation.sms_agents && (
                            <Badge variant="secondary" className="text-xs">
                              <Bot className="w-3 h-3 mr-1" />
                              {conversation.sms_agents.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MessageSquare className="w-3 h-3" />
                          <span>{conversation.message_count || 0}</span>
                        </div>
                      </div>
                      {conversation.service_details && (
                        <p className="text-sm text-muted-foreground mt-2 truncate">
                          <Wrench className="w-3 h-3 inline mr-1" />
                          {conversation.service_details}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AgentLayout>
  );
};

export default ChatHistory;
