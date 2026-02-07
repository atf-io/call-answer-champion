import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Agents from "./pages/Agents";
import Reviews from "./pages/Reviews";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import GoogleCallback from "./pages/auth/GoogleCallback";

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
import SmsAnalytics from "./pages/agents/SmsAnalytics";
import SmsSimulator from "./pages/agents/SmsSimulator";
import Campaigns from "./pages/agents/Campaigns";
import Contacts from "./pages/agents/Contacts";
import Webhooks from "./pages/agents/Webhooks";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/google/callback" element={<ProtectedRoute><GoogleCallback /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/agents" element={<ProtectedRoute><AgentsList /></ProtectedRoute>} />
              <Route path="/dashboard/agents/:agentId/edit" element={<ProtectedRoute><AgentEdit /></ProtectedRoute>} />
              <Route path="/dashboard/agents/knowledge" element={<ProtectedRoute><KnowledgeBase /></ProtectedRoute>} />
              <Route path="/dashboard/agents/phone-numbers" element={<ProtectedRoute><PhoneNumbers /></ProtectedRoute>} />
              <Route path="/dashboard/agents/batch-call" element={<ProtectedRoute><BatchCall /></ProtectedRoute>} />
              <Route path="/dashboard/agents/call-history" element={<ProtectedRoute><CallHistory /></ProtectedRoute>} />
              <Route path="/dashboard/agents/chat-history" element={<ProtectedRoute><ChatHistory /></ProtectedRoute>} />
              <Route path="/dashboard/agents/analytics" element={<ProtectedRoute><AgentAnalytics /></ProtectedRoute>} />
              <Route path="/dashboard/agents/quality" element={<ProtectedRoute><QualityAssurance /></ProtectedRoute>} />
              <Route path="/dashboard/agents/alerting" element={<ProtectedRoute><Alerting /></ProtectedRoute>} />
              <Route path="/dashboard/agents/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
              <Route path="/dashboard/agents/settings" element={<ProtectedRoute><AgentSettings /></ProtectedRoute>} />
              <Route path="/dashboard/agents/playground" element={<ProtectedRoute><Playground /></ProtectedRoute>} />
              <Route path="/dashboard/agents/sms" element={<ProtectedRoute><SMS /></ProtectedRoute>} />
              <Route path="/dashboard/agents/sms/:agentId" element={<ProtectedRoute><SMS /></ProtectedRoute>} />
              <Route path="/dashboard/agents/sms-analytics" element={<ProtectedRoute><SmsAnalytics /></ProtectedRoute>} />
              <Route path="/dashboard/agents/sms-simulator" element={<ProtectedRoute><SmsSimulator /></ProtectedRoute>} />
              <Route path="/dashboard/agents/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
              <Route path="/dashboard/agents/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
              <Route path="/dashboard/agents/webhooks" element={<ProtectedRoute><Webhooks /></ProtectedRoute>} />
              <Route path="/dashboard/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
