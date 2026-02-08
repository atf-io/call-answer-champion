import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import AgentLayout from "@/components/agents/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, RotateCcw, Loader2, Bot, User, TestTube, Calendar, CheckCircle } from "lucide-react";
import { useAgents } from "@/hooks/useAgents";
import { useRetell } from "@/hooks/useRetell";
import { useToast } from "@/hooks/use-toast";
import { useCrmConnections } from "@/hooks/useCrmConnections";
import { supabase } from "@/integrations/supabase/client";
import { buildSchedulingContext } from "@/lib/buildSchedulingContext";
import type { AgentCrmConfig } from "@/lib/crm/types";

interface ChatMessage {
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  functionResult?: {
    success: boolean;
    confirmation?: string;
  };
}

interface FunctionCall {
  name: string;
  params: Record<string, unknown>;
}

// Parse function calls from AI response
function parseFunctionCalls(response: string): { cleanResponse: string; functions: FunctionCall[] } {
  const functions: FunctionCall[] = [];
  const functionRegex = /\[FUNCTION:(\w+)\]\s*(\{[\s\S]*?\})\s*\[\/FUNCTION\]/g;
  
  let cleanResponse = response;
  let match;
  
  while ((match = functionRegex.exec(response)) !== null) {
    const [fullMatch, functionName, paramsJson] = match;
    try {
      const params = JSON.parse(paramsJson);
      functions.push({ name: functionName, params });
      cleanResponse = cleanResponse.replace(fullMatch, '').trim();
    } catch (e) {
      console.error('Failed to parse function params:', e);
    }
  }
  
  return { cleanResponse, functions };
}

const SmsSimulator = () => {
  const { agents, loading: agentsLoading } = useAgents();
  const { toast } = useToast();
  const retell = useRetell();
  const { connections } = useCrmConnections();

  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [leadName, setLeadName] = useState("John");
  const [leadPhone] = useState("+1555123456");
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
  
  // Get CRM config with scheduling settings for the selected agent
  const crmConfig = selectedAgent?.crm_config as AgentCrmConfig | null | undefined;
  const schedulingConfig = crmConfig?.scheduling_config;
  
  // Get allowed services from CRM config for the service preset dropdown
  const allowedServices = useMemo(() => {
    return schedulingConfig?.allowed_products_or_services || [];
  }, [schedulingConfig]);
  
  // Get Jobber connection for function execution
  const jobberConnection = useMemo(() => {
    return connections.find(c => c.crm_type === 'jobber' && c.is_active);
  }, [connections]);
  
  // Check if the selected agent is a Speed to Lead/SMS type (uses local AI instead of Retell)
  const isSpeedToLeadAgent = selectedAgent && (
    selectedAgent.voice_type === "Speed to Lead" ||
    selectedAgent.voice_id === "sms-agent" ||
    selectedAgent.voice_model === "sms"
  );

  // Execute a function call (e.g., book_appointment)
  const executeFunction = useCallback(async (fn: FunctionCall): Promise<{ success: boolean; message: string }> => {
    console.log('Executing function:', fn.name, fn.params);
    
    if (fn.name === 'book_appointment') {
      if (!jobberConnection) {
        return { 
          success: false, 
          message: 'No Jobber connection configured. Please connect Jobber in CRM settings to enable real bookings.' 
        };
      }
      
      try {
        const { data, error } = await supabase.functions.invoke('jobber-booking', {
          body: {
            action: 'create_request',
            connection_id: jobberConnection.id,
            customer_phone: leadPhone,
            customer_name: leadName,
            service_name: fn.params.service_name || serviceType,
            preferred_date: fn.params.preferred_date,
            preferred_time: fn.params.preferred_time,
            notes: fn.params.notes,
          }
        });
        
        if (error) throw error;
        
        if (data?.success) {
          return {
            success: true,
            message: data.confirmation_message || `Appointment booked! Confirmation: ${data.confirmation_number || 'Pending'}`
          };
        } else {
          return { success: false, message: data?.error || 'Failed to create booking' };
        }
      } catch (err) {
        console.error('Booking function error:', err);
        return { success: false, message: err instanceof Error ? err.message : 'Booking failed' };
      }
    }
    
    return { success: false, message: `Unknown function: ${fn.name}` };
  }, [jobberConnection, leadPhone, leadName, serviceType]);

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
    
    // Inject scheduling context if CRM scheduling is enabled
    const schedulingContext = buildSchedulingContext(schedulingConfig);
    
    const contextPrompt = `${schedulingContext}${basePrompt}\n\nCurrent lead information:\n- Lead Name: ${leadName}\n- Service Requested: ${serviceType}\n\nAddress the customer by their name when appropriate.`;
    
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
      
      const rawResponse = data?.response || data?.content || "I apologize, but I couldn't generate a response. Please try again.";
      
      // Parse for function calls
      const { cleanResponse, functions } = parseFunctionCalls(rawResponse);
      
      // Execute any function calls
      let functionResult: ChatMessage['functionResult'] | undefined;
      if (functions.length > 0) {
        for (const fn of functions) {
          const result = await executeFunction(fn);
          functionResult = { success: result.success, confirmation: result.message };
          
          // Show toast for booking results
          if (result.success) {
            toast({
              title: "Booking Created!",
              description: result.message,
            });
          } else {
            toast({
              variant: "destructive",
              title: "Booking Failed",
              description: result.message,
            });
          }
        }
      }
      
      // Add message with any function result
      setMessages(prev => [...prev, { 
        role: "agent", 
        content: cleanResponse || rawResponse, 
        timestamp: new Date(),
        functionResult 
      }]);
    } catch (error) {
      console.error("Local AI error:", error);
      // Fallback response if edge function fails
      setMessages(prev => [...prev, { 
        role: "agent", 
        content: "I'm having trouble connecting. Please check that the SMS simulator edge function is deployed.", 
        timestamp: new Date() 
      }]);
    }
  }, [selectedAgent, messages, leadName, serviceType, schedulingConfig, executeFunction, toast]);

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
              
              {/* Service type - show dropdown if CRM services configured, otherwise freeform input */}
              {allowedServices.length > 0 ? (
                <Select
                  value={serviceType}
                  onValueChange={setServiceType}
                  disabled={!!chatId}
                >
                  <SelectTrigger className="w-48">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedServices.map((service) => (
                      <SelectItem key={service.id} value={service.name}>
                        {service.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Other (type below)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="Service type"
                  className="w-40"
                  disabled={!!chatId}
                />
              )}

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
                <div className="max-w-[75%] space-y-2">
                  <div
                    className={`rounded-lg px-4 py-2.5 text-sm ${
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
                  {msg.functionResult && (
                    <div className={`rounded-lg px-3 py-2 text-sm flex items-center gap-2 ${
                      msg.functionResult.success 
                        ? "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20" 
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    }`}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">{msg.functionResult.confirmation}</span>
                    </div>
                  )}
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
