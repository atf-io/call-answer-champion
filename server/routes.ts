import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { 
  updateProfileSchema, 
  updateAgentSchema, 
  updateReviewSchema, 
  updateKnowledgeBaseSchema,
  updateSettingsSchema,
  insertAgentSchema,
  insertKnowledgeBaseSchema
} from "../shared/schema";
import { z } from "zod";

const RETELL_BASE_URL = "https://api.retellai.com";
const FIRECRAWL_BASE_URL = "https://api.firecrawl.dev/v1";

declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
    }
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export function registerRoutes(app: Express) {
  // Auth routes
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json({ user: req.user });
    } else {
      res.json({ user: null });
    }
  });

  // Profile routes
  app.get("/api/profile", requireAuth, async (req, res) => {
    try {
      const profile = await storage.getProfile(req.user!.id);
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getProfile(req.user!.id);
      if (existing) {
        const profile = await storage.updateProfile(req.user!.id, req.body);
        res.json(profile);
      } else {
        const profile = await storage.createProfile({ userId: req.user!.id, ...req.body });
        res.json(profile);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to save profile" });
    }
  });

  app.patch("/api/profile", requireAuth, async (req, res) => {
    try {
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid profile data", details: parsed.error.flatten() });
      }
      const profile = await storage.updateProfile(req.user!.id, parsed.data);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // AI Agents routes
  app.get("/api/agents", requireAuth, async (req, res) => {
    try {
      const agents = await storage.getAgents(req.user!.id);
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/:id", requireAuth, async (req, res) => {
    try {
      const agent = await storage.getAgent(req.params.id as string, req.user!.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agent" });
    }
  });

  app.post("/api/agents", requireAuth, async (req, res) => {
    try {
      const parsed = insertAgentSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid agent data", details: parsed.error.flatten() });
      }
      const agent = await storage.createAgent({ userId: req.user!.id, ...parsed.data });
      res.json(agent);
    } catch (error) {
      res.status(500).json({ error: "Failed to create agent" });
    }
  });

  app.patch("/api/agents/:id", requireAuth, async (req, res) => {
    try {
      const parsed = updateAgentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid agent data", details: parsed.error.flatten() });
      }
      const agent = await storage.updateAgent(req.params.id as string, req.user!.id, parsed.data);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
    } catch (error) {
      res.status(500).json({ error: "Failed to update agent" });
    }
  });

  app.delete("/api/agents/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteAgent(req.params.id as string, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete agent" });
    }
  });

  // Call Logs routes
  app.get("/api/call-logs", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getCallLogs(req.user!.id, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch call logs" });
    }
  });

  app.get("/api/call-logs/:id", requireAuth, async (req, res) => {
    try {
      const log = await storage.getCallLog(req.params.id as string, req.user!.id);
      if (!log) {
        return res.status(404).json({ error: "Call log not found" });
      }
      res.json(log);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch call log" });
    }
  });

  // Knowledge Base routes
  app.get("/api/knowledge-base", requireAuth, async (req, res) => {
    try {
      const agentId = req.query.agentId as string | undefined;
      const entries = await storage.getKnowledgeBaseEntries(req.user!.id, agentId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch knowledge base entries" });
    }
  });

  app.post("/api/knowledge-base", requireAuth, async (req, res) => {
    try {
      const parsed = insertKnowledgeBaseSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid knowledge base data", details: parsed.error.flatten() });
      }
      const entry = await storage.createKnowledgeBaseEntry({ userId: req.user!.id, ...parsed.data });
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to create knowledge base entry" });
    }
  });

  app.patch("/api/knowledge-base/:id", requireAuth, async (req, res) => {
    try {
      const parsed = updateKnowledgeBaseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid knowledge base data", details: parsed.error.flatten() });
      }
      const entry = await storage.updateKnowledgeBaseEntry(req.params.id as string, req.user!.id, parsed.data);
      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to update entry" });
    }
  });

  app.delete("/api/knowledge-base/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteKnowledgeBaseEntry(req.params.id as string, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ error: "Entry not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete entry" });
    }
  });

  // Phone Numbers routes
  app.get("/api/phone-numbers", requireAuth, async (req, res) => {
    try {
      const phoneNumbers = await storage.getPhoneNumbers(req.user!.id);
      res.json(phoneNumbers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch phone numbers" });
    }
  });

  app.post("/api/phone-numbers", requireAuth, async (req, res) => {
    try {
      const phoneNumber = await storage.createPhoneNumber({ userId: req.user!.id, ...req.body });
      res.json(phoneNumber);
    } catch (error) {
      res.status(500).json({ error: "Failed to create phone number" });
    }
  });

  app.patch("/api/phone-numbers/:id", requireAuth, async (req, res) => {
    try {
      const phoneNumber = await storage.updatePhoneNumber(req.params.id as string, req.user!.id, req.body);
      if (!phoneNumber) {
        return res.status(404).json({ error: "Phone number not found" });
      }
      res.json(phoneNumber);
    } catch (error) {
      res.status(500).json({ error: "Failed to update phone number" });
    }
  });

  app.delete("/api/phone-numbers/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deletePhoneNumber(req.params.id as string, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ error: "Phone number not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete phone number" });
    }
  });

  // Reviews routes
  app.get("/api/reviews", requireAuth, async (req, res) => {
    try {
      const reviews = await storage.getReviews(req.user!.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const review = await storage.createReview({ userId: req.user!.id, ...req.body });
      res.json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  app.patch("/api/reviews/:id", requireAuth, async (req, res) => {
    try {
      const parsed = updateReviewSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid review data", details: parsed.error.flatten() });
      }
      const review = await storage.updateReview(req.params.id as string, req.user!.id, parsed.data);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to update review" });
    }
  });

  // Settings routes
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      let settings = await storage.getSettings(req.user!.id);
      if (!settings) {
        settings = await storage.createSettings({ userId: req.user!.id });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", requireAuth, async (req, res) => {
    try {
      const parsed = updateSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid settings data", details: parsed.error.flatten() });
      }
      let settings = await storage.getSettings(req.user!.id);
      if (!settings) {
        settings = await storage.createSettings({ userId: req.user!.id, ...parsed.data });
      } else {
        settings = await storage.updateSettings(req.user!.id, parsed.data);
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Retell Sync API - migrated from edge function
  app.post("/api/retell-sync", requireAuth, async (req, res) => {
    try {
      const RETELL_API_KEY = process.env.RETELL_API_KEY;
      if (!RETELL_API_KEY) {
        return res.status(500).json({ error: "Retell API key not configured" });
      }

      const { action, agentId, limit = 100, area_code, nickname, inbound_agent_id, outbound_agent_id, agentConfig } = req.body;
      const userId = req.user!.id;

      let result;

      switch (action) {
        case "list-agents":
          result = await listRetellAgents(RETELL_API_KEY);
          break;

        case "list-calls":
          result = await listRetellCalls(RETELL_API_KEY, agentId, limit);
          break;

        case "get-call":
          result = await getRetellCall(RETELL_API_KEY, agentId);
          break;

        case "get-agent":
          result = await getRetellAgent(RETELL_API_KEY, agentId);
          break;

        case "create-agent":
          result = await createRetellAgent(RETELL_API_KEY, userId, agentConfig);
          break;

        case "update-agent":
          result = await updateRetellAgent(RETELL_API_KEY, userId, agentId, agentConfig);
          break;

        case "delete-agent":
          result = await deleteRetellAgent(RETELL_API_KEY, userId, agentId);
          break;

        case "sync-calls":
          result = await syncCallsToDatabase(RETELL_API_KEY, userId, agentId, limit);
          break;

        case "get-analytics":
          result = await getAnalytics(userId);
          break;

        case "get-live-status":
          result = await getLiveCallStatus(RETELL_API_KEY);
          break;

        case "list-phone-numbers":
          result = await listRetellPhoneNumbers(RETELL_API_KEY);
          break;

        case "sync-phone-numbers":
          result = await syncPhoneNumbers(RETELL_API_KEY, userId);
          break;

        case "purchase-phone-number":
          result = await purchasePhoneNumber(RETELL_API_KEY, userId, area_code, nickname, inbound_agent_id, outbound_agent_id);
          break;

        default:
          return res.status(400).json({ error: "Invalid action" });
      }

      res.json(result);
    } catch (error) {
      console.error("Retell sync error:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Scrape Business API - migrated from edge function
  app.post("/api/scrape-business", requireAuth, async (req, res) => {
    try {
      const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
      if (!FIRECRAWL_API_KEY) {
        return res.status(500).json({ success: false, error: "Firecrawl API key not configured" });
      }

      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, error: "URL is required" });
      }

      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = `https://${formattedUrl}`;
      }

      const brandingResponse = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formattedUrl,
          formats: ["markdown", "branding"],
          onlyMainContent: false,
        }),
      });

      const brandingData = await brandingResponse.json();

      if (!brandingResponse.ok) {
        return res.status(brandingResponse.status).json({ 
          success: false, 
          error: brandingData.error || `Request failed with status ${brandingResponse.status}` 
        });
      }

      const extractionResponse = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formattedUrl,
          formats: [{
            type: "json",
            schema: {
              type: "object",
              properties: {
                business_name: { type: "string" },
                business_description: { type: "string" },
                phone: { type: "string" },
                email: { type: "string" },
                address: { type: "string" },
                services: { type: "array", items: { type: "string" } },
                team_info: { type: "string" },
                faqs: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } },
                social_links: { type: "object" },
              }
            }
          }],
          onlyMainContent: false,
        }),
      });

      const extractionData = await extractionResponse.json();

      const branding = brandingData.data?.branding || brandingData.branding || {};
      const metadata = brandingData.data?.metadata || brandingData.metadata || {};
      const extractedJson = extractionData.data?.json || extractionData.json || {};

      const businessData = {
        success: true,
        data: {
          business_name: extractedJson.business_name || metadata.title || "",
          business_description: extractedJson.business_description || metadata.description || "",
          phone: extractedJson.phone || "",
          email: extractedJson.email || "",
          address: extractedJson.address || "",
          website: formattedUrl,
          services: extractedJson.services || [],
          team_info: extractedJson.team_info || "",
          faqs: extractedJson.faqs || [],
          logo_url: branding.images?.logo || branding.logo || "",
          colors: branding.colors || {},
          social_links: extractedJson.social_links || {},
        }
      };

      res.json(businessData);
    } catch (error) {
      console.error("Error scraping business:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to scrape" });
    }
  });

  // Scrape Knowledge Base API - migrated from edge function
  app.post("/api/scrape-knowledge-base", requireAuth, async (req, res) => {
    try {
      const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
      if (!FIRECRAWL_API_KEY) {
        return res.status(500).json({ success: false, error: "Firecrawl API key not configured" });
      }

      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ success: false, error: "URL is required" });
      }

      let formattedUrl = url.trim();
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = `https://${formattedUrl}`;
      }

      const response = await fetch(`${FIRECRAWL_BASE_URL}/scrape`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: formattedUrl,
          formats: ["markdown", "summary"],
          onlyMainContent: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(response.status).json({ 
          success: false, 
          error: data.error || `Request failed with status ${response.status}` 
        });
      }

      const markdown = data.data?.markdown || data.markdown || "";
      const summary = data.data?.summary || data.summary || "";
      const metadata = data.data?.metadata || data.metadata || {};

      res.json({
        success: true,
        data: {
          title: metadata.title || formattedUrl,
          content: markdown,
          summary: summary,
          source_url: formattedUrl,
          metadata: {
            description: metadata.description || "",
            language: metadata.language || "en",
            scraped_at: new Date().toISOString(),
          }
        }
      });
    } catch (error) {
      console.error("Error scraping for knowledge base:", error);
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Failed to scrape URL" });
    }
  });
}

// Retell API helper functions
async function listRetellAgents(apiKey: string) {
  const response = await fetch(`${RETELL_BASE_URL}/list-agents`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch agents: ${response.status}`);
  }

  const agents = await response.json();
  return { agents };
}

async function getRetellAgent(apiKey: string, agentId: string) {
  const response = await fetch(`${RETELL_BASE_URL}/get-agent/${agentId}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch agent: ${response.status}`);
  }

  return await response.json();
}

async function listRetellCalls(apiKey: string, agentId?: string, limit: number = 100) {
  const body: any = { limit, sort_order: "descending" };
  if (agentId) {
    body.filter_criteria = { agent_id: [agentId] };
  }

  const response = await fetch(`${RETELL_BASE_URL}/v2/list-calls`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch calls: ${response.status}`);
  }

  const calls = await response.json();
  return { calls };
}

async function getRetellCall(apiKey: string, callId: string) {
  const response = await fetch(`${RETELL_BASE_URL}/v2/get-call/${callId}`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch call: ${response.status}`);
  }

  return await response.json();
}

async function createRetellAgent(apiKey: string, userId: number, agentConfig: any) {
  const retellConfig = buildRetellAgentConfig(agentConfig);
  retellConfig.agent_name = agentConfig.name;

  const response = await fetch(`${RETELL_BASE_URL}/create-agent`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(retellConfig),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create Retell agent: ${errorText}`);
  }

  const retellAgent = await response.json();

  const dbAgent = await storage.createAgent({
    userId,
    name: agentConfig.name,
    retellAgentId: retellAgent.agent_id,
    voiceType: agentConfig.voice_type,
    personality: agentConfig.personality,
    greetingMessage: agentConfig.greeting_message,
    voiceId: agentConfig.voice_id,
    voiceModel: agentConfig.voice_model,
    language: agentConfig.language,
  });

  return { agent: dbAgent, retellAgent };
}

async function updateRetellAgent(apiKey: string, userId: number, agentId: string, agentConfig: any) {
  const existingAgent = await storage.getAgent(agentId, userId);
  if (!existingAgent) {
    throw new Error("Agent not found");
  }

  if (existingAgent.retellAgentId) {
    const retellConfig = buildRetellAgentConfig(agentConfig);
    if (agentConfig.name) {
      retellConfig.agent_name = agentConfig.name;
    }

    const response = await fetch(`${RETELL_BASE_URL}/update-agent/${existingAgent.retellAgentId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(retellConfig),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update Retell agent: ${errorText}`);
    }
  }

  const updatedAgent = await storage.updateAgent(agentId, userId, agentConfig);
  return { agent: updatedAgent };
}

async function deleteRetellAgent(apiKey: string, userId: number, agentId: string) {
  const existingAgent = await storage.getAgent(agentId, userId);
  if (!existingAgent) {
    throw new Error("Agent not found");
  }

  if (existingAgent.retellAgentId) {
    const response = await fetch(`${RETELL_BASE_URL}/delete-agent/${existingAgent.retellAgentId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${apiKey}` },
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`Failed to delete Retell agent: ${errorText}`);
    }
  }

  await storage.deleteAgent(agentId, userId);
  return { success: true, message: `Successfully deleted agent "${existingAgent.name}"` };
}

async function syncCallsToDatabase(apiKey: string, userId: number, agentId?: string, limit: number = 100) {
  const { calls } = await listRetellCalls(apiKey, agentId, limit);
  const existingIds = new Set(await storage.getExistingRetellCallIds(userId));
  const userAgents = await storage.getAgents(userId);
  const agentMap = new Map(userAgents.map(a => [a.retellAgentId, a.id]));

  const normalizeSentiment = (sentiment: string | null | undefined): string | null => {
    if (!sentiment) return null;
    const lower = sentiment.toLowerCase();
    if (["positive", "neutral", "negative"].includes(lower)) return lower;
    return null;
  };

  const normalizeStatus = (status: string | null | undefined): string => {
    if (!status) return "completed";
    const lower = status.toLowerCase();
    if (["ended", "completed", "transferred"].includes(lower)) return "completed";
    if (lower === "voicemail") return "voicemail";
    if (["missed", "no-answer", "busy"].includes(lower)) return "missed";
    if (["failed", "error"].includes(lower)) return "failed";
    return "completed";
  };

  let synced = 0;
  for (const call of calls) {
    if (!existingIds.has(call.call_id)) {
      await storage.createCallLog({
        userId,
        agentId: agentMap.get(call.agent_id) || null,
        retellCallId: call.call_id,
        callerNumber: call.from_number || call.to_number || "Unknown",
        durationSeconds: Math.round((call.end_timestamp - call.start_timestamp) / 1000) || 0,
        status: normalizeStatus(call.call_status),
        transcript: call.transcript || null,
        sentiment: normalizeSentiment(call.call_analysis?.user_sentiment),
      });
      synced++;
    }
  }

  return { synced, total: calls.length, message: `Synced ${synced} new calls out of ${calls.length} total` };
}

async function getAnalytics(userId: number) {
  const callStats = await storage.getCallLogs(userId, 1000);
  const agents = await storage.getAgents(userId);

  const totalCalls = callStats.length;
  const totalDuration = callStats.reduce((acc, c) => acc + (c.durationSeconds || 0), 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

  const completedCalls = callStats.filter(c => c.status === "completed").length;
  const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

  const positiveCount = callStats.filter(c => c.sentiment?.toLowerCase() === "positive").length;
  const satisfactionRate = totalCalls > 0 ? Math.round((positiveCount / totalCalls) * 100) : 0;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentCalls = callStats.filter(c => new Date(c.createdAt) >= thirtyDaysAgo);

  const callsByDay: Record<string, number> = {};
  recentCalls.forEach(c => {
    const day = new Date(c.createdAt).toISOString().split("T")[0];
    callsByDay[day] = (callsByDay[day] || 0) + 1;
  });

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    totalCalls,
    avgDurationSeconds: avgDuration,
    avgDurationFormatted: formatDuration(avgDuration),
    successRate,
    satisfactionRate,
    activeAgents: agents.filter(a => a.isActive).length,
    totalAgents: agents.length,
    callsByDay,
    thisMonthCalls: recentCalls.length,
  };
}

async function getLiveCallStatus(apiKey: string) {
  const response = await fetch(`${RETELL_BASE_URL}/v2/list-calls`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      limit: 50,
      sort_order: "descending",
      filter_criteria: { call_status: ["ongoing", "ringing"] },
    }),
  });

  if (!response.ok) {
    return { activeCalls: [], count: 0 };
  }

  const calls = await response.json();
  const activeCalls = calls.map((call: any) => ({
    callId: call.call_id,
    agentId: call.agent_id,
    status: call.call_status,
    startTime: call.start_timestamp,
    callerNumber: call.from_number || call.to_number || "Unknown",
  }));

  return { activeCalls, count: activeCalls.length };
}

async function listRetellPhoneNumbers(apiKey: string) {
  const response = await fetch(`${RETELL_BASE_URL}/list-phone-numbers`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch phone numbers: ${response.status}`);
  }

  const phoneNumbers = await response.json();
  return { phoneNumbers };
}

async function syncPhoneNumbers(apiKey: string, userId: number) {
  const { phoneNumbers } = await listRetellPhoneNumbers(apiKey);
  const userAgents = await storage.getAgents(userId);
  const agentMap = new Map(userAgents.map(a => [a.retellAgentId, a.id]));

  let synced = 0;
  let updated = 0;

  for (const phone of phoneNumbers) {
    const existing = await storage.getPhoneNumberByRetellId(phone.phone_number_id, userId);
    const phoneData = {
      phoneNumber: phone.phone_number,
      nickname: phone.nickname || null,
      areaCode: phone.area_code || null,
      inboundAgentId: agentMap.get(phone.inbound_agent_id) || null,
      outboundAgentId: agentMap.get(phone.outbound_agent_id) || null,
      isActive: true,
      lastSyncedAt: new Date(),
    };

    if (existing) {
      await storage.updatePhoneNumber(existing.id, userId, phoneData);
      updated++;
    } else {
      await storage.createPhoneNumber({
        userId,
        retellPhoneNumberId: phone.phone_number_id,
        ...phoneData,
      });
      synced++;
    }
  }

  return { synced, updated, total: phoneNumbers.length, message: `Synced ${synced} new and updated ${updated} phone numbers` };
}

async function purchasePhoneNumber(apiKey: string, userId: number, areaCode?: string, nickname?: string, inboundAgentId?: string, outboundAgentId?: string) {
  const requestBody: any = {};
  if (areaCode) {
    requestBody.area_code = parseInt(areaCode, 10);
  }
  if (nickname) {
    requestBody.nickname = nickname;
  }

  if (inboundAgentId) {
    const agent = await storage.getAgent(inboundAgentId, userId);
    if (agent?.retellAgentId) {
      requestBody.inbound_agent_id = agent.retellAgentId;
    }
  }

  if (outboundAgentId) {
    const agent = await storage.getAgent(outboundAgentId, userId);
    if (agent?.retellAgentId) {
      requestBody.outbound_agent_id = agent.retellAgentId;
    }
  }

  const response = await fetch(`${RETELL_BASE_URL}/create-phone-number`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to purchase phone number: ${errorText}`);
  }

  const phoneData = await response.json();

  const savedPhone = await storage.createPhoneNumber({
    userId,
    retellPhoneNumberId: phoneData.phone_number_id,
    phoneNumber: phoneData.phone_number,
    nickname: phoneData.nickname || nickname || null,
    areaCode: phoneData.area_code || areaCode || null,
    inboundAgentId: inboundAgentId || null,
    outboundAgentId: outboundAgentId || null,
    isActive: true,
    lastSyncedAt: new Date(),
  });

  return {
    success: true,
    phone_number: phoneData.phone_number,
    phone_number_id: phoneData.phone_number_id,
    saved: savedPhone,
    message: `Successfully purchased ${phoneData.phone_number}`,
  };
}

function buildRetellAgentConfig(config: any) {
  const retellConfig: any = {};

  if (config.voice_id) retellConfig.voice_id = config.voice_id;
  if (config.voice_model) retellConfig.voice_model = config.voice_model;
  if (config.voice_temperature !== undefined) retellConfig.voice_temperature = config.voice_temperature;
  if (config.voice_speed !== undefined) retellConfig.voice_speed = config.voice_speed;
  if (config.volume !== undefined) retellConfig.volume = config.volume;
  if (config.responsiveness !== undefined) retellConfig.responsiveness = config.responsiveness;
  if (config.interruption_sensitivity !== undefined) retellConfig.interruption_sensitivity = config.interruption_sensitivity;
  if (config.enable_backchannel !== undefined) retellConfig.enable_backchannel = config.enable_backchannel;
  if (config.backchannel_frequency !== undefined) retellConfig.backchannel_frequency = config.backchannel_frequency;
  if (config.ambient_sound && config.ambient_sound !== "none") {
    retellConfig.ambient_sound = config.ambient_sound;
    if (config.ambient_sound_volume !== undefined) retellConfig.ambient_sound_volume = config.ambient_sound_volume;
  }
  if (config.language) retellConfig.language = config.language;
  if (config.begin_message_delay_ms !== undefined) retellConfig.begin_message_delay_ms = config.begin_message_delay_ms;
  if (config.end_call_after_silence_ms !== undefined) retellConfig.end_call_after_silence_ms = config.end_call_after_silence_ms;
  if (config.max_call_duration_ms !== undefined) retellConfig.max_call_duration_ms = config.max_call_duration_ms;
  if (config.enable_voicemail_detection !== undefined) retellConfig.enable_voicemail_detection = config.enable_voicemail_detection;
  if (config.voicemail_message) retellConfig.voicemail_message = config.voicemail_message;
  if (config.voicemail_detection_timeout_ms !== undefined) retellConfig.voicemail_detection_timeout_ms = config.voicemail_detection_timeout_ms;
  if (config.normalize_for_speech !== undefined) retellConfig.normalize_for_speech = config.normalize_for_speech;
  if (config.boosted_keywords?.length) retellConfig.boosted_keywords = config.boosted_keywords;
  if (config.reminder_trigger_ms !== undefined) retellConfig.reminder_trigger_ms = config.reminder_trigger_ms;
  if (config.reminder_max_count !== undefined) retellConfig.reminder_max_count = config.reminder_max_count;

  return retellConfig;
}
