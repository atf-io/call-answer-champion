import { useState, useRef, useEffect, useCallback } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, RotateCcw, Loader2, Bot, User, TestTube } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { useRetell } from "@/hooks/useRetell";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ChatMessage {
  role: "user" | "agent";
  content: string;
  timestamp: Date;
}

const SmsSimulator = () => {
  const { agents, loading: agentsLoading } = useAgents();
  const { toast } = useToast();
  const retell = useRetell();

  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [leadName, setLeadName] = useState("John");
  const [serviceType, setServiceType] = useState("HVAC repair");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Include both Chat Agents AND Speed to Lead/SMS agents
  const chatAgents = agents.filter(
    (a) => 
      a.voice_type === "Chat Agent" || 
      a.voice_model === "chat" || 
      a.voice_id === "chat-agent" ||
      a.voice_type === "Speed to Lead" ||
      a.voice_id === "sms-agent" ||
      a.voice_model === "sms"
  );

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  
  // Check if the selected agent is a Speed to Lead/SMS type (uses local AI instead of Retell)
  const isSpeedToLeadAgent = selectedAgent && (
    selectedAgent.voice_type === "Speed to Lead" ||
    selectedAgent.voice_id === "sms-agent" ||
    selectedAgent.voice_model === "sms"
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startChat = useCallback(async () => {
    if (isSpeedToLeadAgent) {
      // For Speed to Lead agents, use local AI simulation
      setIsLocalMode(true);
      setChatId("local-" + Date.now());
      setMessages([]);
      
      // Send greeting if available
      if (selectedAgent?.greeting_message) {
        const greeting = selectedAgent.greeting_message
          .replace(/\{lead_name\}/gi, leadName)
          .replace(/\{customer_name\}/gi, leadName)
          .replace(/\{name\}/gi, leadName)
          .replace(/\{service\}/gi, serviceType)
          .replace(/\{service_type\}/gi, serviceType)
          .replace(/\{[^}]+\}/g, "[Customer]");
        setMessages([{
          role: "agent",
          content: greeting,
          timestamp: new Date()
        }]);
      }
      
      toast({ title: "Chat started", description: `Testing ${selectedAgent?.name} locally` });
      return;
    }
    
    // For Retell Chat Agents
    if (!selectedAgent?.retell_agent_id) {
      toast({
        variant: "destructive",
        title: "Cannot start chat",
        description: "This agent doesn't have a Retell Agent ID. Sync from Retell first.",
      });
      return;
    }

    setIsStarting(true);
    try {
      const data = await retell.invokeRetellSync("create-chat", {
        chatAgentId: selectedAgent.retell_agent_id,
      });
      setChatId((data as any).chat_id);
      setIsLocalMode(false);
      setMessages([]);
      toast({ title: "Chat started", description: `Connected to ${selectedAgent.name}` });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to start chat",
        description: error instanceof Error ? error.message : "Could not connect to chat agent",
      });
    } finally {
      setIsStarting(false);
    }
  }, [selectedAgent, isSpeedToLeadAgent, retell, toast, leadName, serviceType]);

  const sendLocalMessage = useCallback(async (userMessage: string) => {
    if (!selectedAgent) return;
    
    // Build conversation history for context
    const conversationHistory = messages.map(msg => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content
    }));
    
    // Build the system prompt from agent config with lead context
    const basePrompt = selectedAgent.prompt || 
      `You are a helpful customer service agent for a home services business. Your personality is: ${selectedAgent.personality || "friendly and professional"}. Keep responses concise and helpful.`;
    
    const contextPrompt = `${basePrompt}\n\nCurrent lead information:\n- Lead Name: ${leadName}\n- Service Requested: ${serviceType}\n\nAddress the customer by their name when appropriate.`;
    
    try {
      const { data, error } = await supabase.functions.invoke("sms-simulator", {
        body: {
          messages: [
            { role: "system", content: contextPrompt },
            ...conversationHistory,
            { role: "user", content: userMessage }
          ]
        }
      });
      
      if (error) throw error;
      
      const agentResponse = data?.response || data?.content || "I apologize, but I couldn't generate a response. Please try again.";
      setMessages(prev => [...prev, { role: "agent", content: agentResponse, timestamp: new Date() }]);
    } catch (error) {
      console.error("Local AI error:", error);
      // Fallback response if edge function fails
      setMessages(prev => [...prev, { 
        role: "agent", 
        content: "I'm having trouble connecting. Please check that the SMS simulator edge function is deployed.", 
        timestamp: new Date() 
      }]);
    }
  }, [selectedAgent, messages, leadName, serviceType]);

  const sendMessage = useCallback(async () => {
    if (!chatId || !inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);
    setIsSending(true);

    try {
      if (isLocalMode) {
        await sendLocalMessage(userMessage);
      } else {
        const data = await retell.invokeRetellSync("send-chat-message", {
          chatId,
          message: userMessage,
        });
        const responseData = data as any;
        const agentMessages = responseData.messages || [];
        let hasAgentReply = false;
        for (const msg of agentMessages) {
          if ((msg.role === "agent" || msg.role === "assistant") && msg.content) {
            setMessages((prev) => [...prev, { role: "agent", content: msg.content, timestamp: new Date() }]);
            hasAgentReply = true;
          }
        }
        if (!hasAgentReply && responseData.content) {
          setMessages((prev) => [...prev, { role: "agent", content: responseData.content, timestamp: new Date() }]);
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Send failed",
        description: error instanceof Error ? error.message : "Failed to send message",
      });
    } finally {
      setIsSending(false);
    }
  }, [chatId, inputMessage, isLocalMode, retell, toast, sendLocalMessage]);

  const endChat = useCallback(async () => {
    if (!chatId) return;
    setIsEnding(true);
    try {
      if (!isLocalMode) {
        await retell.invokeRetellSync("end-chat", { chatId });
      }
      toast({ title: "Chat ended" });
    } catch (error) {
      console.error("Failed to end chat:", error);
    } finally {
      setChatId(null);
      setIsLocalMode(false);
      setIsEnding(false);
    }
  }, [chatId, isLocalMode, retell, toast]);

  const resetChat = useCallback(async () => {
    if (chatId) {
      await endChat();
    }
    setMessages([]);
    setChatId(null);
    setIsLocalMode(false);
  }, [chatId, endChat]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (agentsLoading) {
    return (
      <AgentLayout title="Chat Simulator" description="Test your chat and SMS agents in a simulated conversation">
        <Card>
          <CardContent className="py-8">
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </AgentLayout>
    );
  }

  if (chatAgents.length === 0) {
    return (
      <AgentLayout title="Chat Simulator" description="Test your chat and SMS agents in a simulated conversation">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <TestTube className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2" data-testid="text-sms-simulator-empty">
              No Chat or SMS Agents Found
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              Create a Chat Agent or Speed to Lead agent first, then come back here to test conversations.
            </p>
          </CardContent>
        </Card>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout title="Chat Simulator" description="Test your chat and SMS agents in a simulated conversation">
      <div className="flex flex-col gap-4 h-[calc(100vh-12rem)]">
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Select
                value={selectedAgentId}
                onValueChange={(val) => {
                  if (chatId) resetChat();
                  setSelectedAgentId(val);
                }}
              >
                <SelectTrigger className="w-48" data-testid="select-chat-agent">
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {chatAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                      {(agent.voice_type === "Speed to Lead" || agent.voice_id === "sms-agent" || agent.voice_model === "sms") && 
                        " (SMS)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="Lead name"
                className="w-32"
                disabled={!!chatId}
              />
              
              <Input
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                placeholder="Service type"
                className="w-40"
                disabled={!!chatId}
              />

              {selectedAgentId && !chatId && (
                <Button
                  onClick={startChat}
                  disabled={isStarting}
                  data-testid="button-start-chat"
                >
                  {isStarting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                  {isStarting ? "Connecting..." : "Start Chat"}
                </Button>
              )}

              {chatId && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {isLocalMode ? "Local AI" : "Connected"}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetChat}
                    disabled={isEnding}
                    data-testid="button-reset-chat"
                  >
                    {isEnding ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-1" />}
                    New Chat
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1 flex flex-col min-h-0">
          <CardHeader className="py-3 border-b">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              {selectedAgent ? selectedAgent.name : "Conversation"}
              {isLocalMode && <Badge variant="outline" className="ml-2 text-xs">Testing with Lovable AI</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !chatId && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">Select an agent and start a conversation</p>
              </div>
            )}

            {messages.length === 0 && chatId && !isLocalMode && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">Chat connected. Send a message to begin.</p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${msg.role}-${index}`}
              >
                {msg.role === "agent" && (
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-500" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-500" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {chatId && (
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  disabled={isSending}
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isSending || !inputMessage.trim()}
                  size="icon"
                  data-testid="button-send-message"
                >
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AgentLayout>
  );
};

export default SmsSimulator;
