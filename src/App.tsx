import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import Reviews from "./pages/Reviews";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

// Agent Admin Pages
import AgentsList from "./pages/agents/AgentsList";
import AgentEdit from "./pages/agents/AgentEdit";
import KnowledgeBase from "./pages/agents/KnowledgeBase";
import PhoneNumbers from "./pages/agents/PhoneNumbers";
import BatchCall from "./pages/agents/BatchCall";
import CallHistory from "./pages/agents/CallHistory";
import ChatHistory from "./pages/agents/ChatHistory";
import AgentAnalytics from "./pages/agents/AgentAnalytics";
import QualityAssurance from "./pages/agents/QualityAssurance";
import Alerting from "./pages/agents/Alerting";
import Billing from "./pages/agents/Billing";
import AgentSettings from "./pages/agents/AgentSettings";
import Playground from "./pages/agents/Playground";
import SMS from "./pages/agents/SMS";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/agents" element={<AgentsList />} />
            <Route path="/dashboard/agents/:agentId/edit" element={<AgentEdit />} />
            <Route path="/dashboard/agents/knowledge" element={<KnowledgeBase />} />
            <Route path="/dashboard/agents/phone-numbers" element={<PhoneNumbers />} />
            <Route path="/dashboard/agents/batch-call" element={<BatchCall />} />
            <Route path="/dashboard/agents/call-history" element={<CallHistory />} />
            <Route path="/dashboard/agents/chat-history" element={<ChatHistory />} />
            <Route path="/dashboard/agents/analytics" element={<AgentAnalytics />} />
            <Route path="/dashboard/agents/quality" element={<QualityAssurance />} />
            <Route path="/dashboard/agents/alerting" element={<Alerting />} />
            <Route path="/dashboard/agents/billing" element={<Billing />} />
            <Route path="/dashboard/agents/settings" element={<AgentSettings />} />
            <Route path="/dashboard/agents/playground" element={<Playground />} />
            <Route path="/dashboard/agents/sms" element={<SMS />} />
            <Route path="/dashboard/reviews" element={<Reviews />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
