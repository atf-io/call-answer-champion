import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { 
  updateProfileSchema, 
  updateAgentSchema, 
  updateReviewSchema, 
  updateKnowledgeBaseSchema,
  updateSettingsSchema,
  insertAgentSchema,
  insertKnowledgeBaseSchema,
  insertContactSchema,
  updateContactSchema
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

  // Lead Analytics endpoint
  app.get("/api/lead-analytics", requireAuth, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const userId = req.user!.id;

      const contacts = await storage.getContacts(userId);
      const callLogs = await storage.getCallLogs(userId, 10000);

      const toDate = (val: any): Date => {
        if (val instanceof Date) return val;
        return new Date(String(val));
      };
      const toDateStr = (val: any): string => toDate(val).toISOString().split("T")[0];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const filteredContacts = contacts.filter(
        (c: any) => toDate(c.createdAt) >= startDate
      );
      const filteredCalls = callLogs.filter(
        (c: any) => toDate(c.createdAt) >= startDate
      );

      const smsContacts = filteredContacts.filter(
        (c: any) => c.source?.toLowerCase() === "sms"
      );
      const voiceContacts = filteredContacts.filter(
        (c: any) => c.source?.toLowerCase() === "voice_ai" || c.source?.toLowerCase() === "voice"
      );

      const smsLeads = smsContacts.length;
      const voiceLeads = voiceContacts.length + filteredCalls.length;
      const totalLeads = filteredContacts.length + filteredCalls.length;

      const convertedLeads = filteredContacts.filter(
        (c: any) => c.status?.toLowerCase() === "converted"
      ).length;
      const pendingLeads = filteredContacts.filter(
        (c: any) => c.status?.toLowerCase() === "pending" || c.status?.toLowerCase() === "new" || c.status?.toLowerCase() === "contacted"
      ).length;
      const lostLeads = filteredContacts.filter(
        (c: any) => c.status?.toLowerCase() === "lost"
      ).length;

      const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

      const leadsBySource: Record<string, number> = {};
      filteredContacts.forEach((c: any) => {
        const source = c.source || "unknown";
        leadsBySource[source] = (leadsBySource[source] || 0) + 1;
      });
      if (filteredCalls.length > 0) {
        leadsBySource["voice_call"] = (leadsBySource["voice_call"] || 0) + filteredCalls.length;
      }

      const leadsByDay: { date: string; sms: number; voice: number; total: number }[] = [];
      const outcomesByDay: { date: string; converted: number; pending: number; lost: number }[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const displayDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

        const daySms = filteredContacts.filter(
          (c: any) => toDateStr(c.createdAt) === dateStr && c.source?.toLowerCase() === "sms"
        ).length;

        const dayVoice = filteredContacts.filter(
          (c: any) => toDateStr(c.createdAt) === dateStr && (c.source?.toLowerCase() === "voice_ai" || c.source?.toLowerCase() === "voice")
        ).length + filteredCalls.filter(
          (c: any) => toDateStr(c.createdAt) === dateStr
        ).length;

        leadsByDay.push({ date: displayDate, sms: daySms, voice: dayVoice, total: daySms + dayVoice });

        const dayContacts = filteredContacts.filter((c: any) => toDateStr(c.createdAt) === dateStr);
        outcomesByDay.push({
          date: displayDate,
          converted: dayContacts.filter((c: any) => c.status?.toLowerCase() === "converted").length,
          pending: dayContacts.filter((c: any) => c.status?.toLowerCase() === "pending" || c.status?.toLowerCase() === "new").length,
          lost: dayContacts.filter((c: any) => c.status?.toLowerCase() === "lost").length,
        });
      }

      const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
      filteredCalls.forEach((c: any) => {
        if (c.sentiment === "positive") sentimentBreakdown.positive++;
        else if (c.sentiment === "negative") sentimentBreakdown.negative++;
        else sentimentBreakdown.neutral++;
      });
      filteredContacts.forEach((c: any) => {
        if (c.notes?.toLowerCase().includes("positive") || c.status?.toLowerCase() === "converted") {
          sentimentBreakdown.positive++;
        } else if (c.notes?.toLowerCase().includes("negative") || c.status?.toLowerCase() === "lost") {
          sentimentBreakdown.negative++;
        } else {
          sentimentBreakdown.neutral++;
        }
      });

      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 14);

      const thisWeekLeads = [
        ...filteredContacts.filter((c: any) => toDate(c.createdAt) >= thisWeekStart),
        ...filteredCalls.filter((c: any) => toDate(c.createdAt) >= thisWeekStart),
      ].length;

      const lastWeekLeads = [
        ...filteredContacts.filter((c: any) => toDate(c.createdAt) >= lastWeekStart && toDate(c.createdAt) < thisWeekStart),
        ...filteredCalls.filter((c: any) => toDate(c.createdAt) >= lastWeekStart && toDate(c.createdAt) < thisWeekStart),
      ].length;

      const weekOverWeekChange = lastWeekLeads > 0
        ? Math.round(((thisWeekLeads - lastWeekLeads) / lastWeekLeads) * 100)
        : thisWeekLeads > 0 ? 100 : 0;

      res.json({
        totalLeads,
        smsLeads,
        voiceLeads,
        convertedLeads,
        pendingLeads,
        lostLeads,
        conversionRate,
        avgResponseTime: 0,
        leadsBySource,
        leadsByDay,
        outcomesByDay,
        sentimentBreakdown,
        thisWeekLeads,
        lastWeekLeads,
        weekOverWeekChange,
      });
    } catch (error) {
      console.error("Lead analytics error:", error);
      res.status(500).json({ error: "Failed to fetch lead analytics" });
    }
  });

  // Contacts routes
  app.get("/api/contacts", requireAuth, async (req, res) => {
    try {
      const contacts = await storage.getContacts(req.user!.id);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.get("/api/contacts/:id", requireAuth, async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id as string, req.user!.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contact" });
    }
  });

  app.post("/api/contacts", requireAuth, async (req, res) => {
    try {
      const parsed = insertContactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid contact data", details: parsed.error.flatten() });
      }
      const contact = await storage.createContact({ ...parsed.data, userId: req.user!.id });
      res.json(contact);
    } catch (error) {
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  app.patch("/api/contacts/:id", requireAuth, async (req, res) => {
    try {
      const parsed = updateContactSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid contact data", details: parsed.error.flatten() });
      }
      const contact = await storage.updateContact(req.params.id as string, req.user!.id, parsed.data);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error) {
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteContact(req.params.id as string, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // Variable resolution - resolves template variables using contact data + metadata
  app.post("/api/resolve-variables", requireAuth, async (req, res) => {
    try {
      const { template, contactId, variables } = req.body;
      if (!template) return res.status(400).json({ error: "Template is required" });

      let contactData: Record<string, any> = {};
      if (contactId) {
        const contact = await storage.getContact(contactId, String(req.user!.id));
        if (contact) {
          const meta = (contact.metadata as Record<string, any>) || {};
          const nameParts = (contact.name || "").split(" ");
          contactData = {
            full_name: contact.name || "",
            first_name: meta.first_name || nameParts[0] || "",
            last_name: meta.last_name || nameParts.slice(1).join(" ") || "",
            phone: contact.phone || "",
            email: contact.email || "",
            lead_source: contact.source || meta.lead_source || "",
            service_category: meta.service_category || "",
            task_name: meta.task_name || meta.service_category || "",
            address: meta.address || "",
            postal_code: meta.postal_code || "",
            comments: meta.comments || "",
          };
        }
      }

      const mergedVars = { ...contactData, ...(variables || {}) };
      const resolved = template.replace(/\{\{(\w+)\}\}/g, (_: string, key: string) => {
        return mergedVars[key] !== undefined && mergedVars[key] !== null ? String(mergedVars[key]) : `{{${key}}}`;
      });

      res.json({ resolved, variables: mergedVars });
    } catch (error) {
      res.status(500).json({ error: "Failed to resolve variables" });
    }
  });

  // Get available lead variables for a contact
  app.get("/api/contacts/:id/variables", requireAuth, async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id, String(req.user!.id));
      if (!contact) return res.status(404).json({ error: "Contact not found" });

      const meta = (contact.metadata as Record<string, any>) || {};
      const nameParts = (contact.name || "").split(" ");
      const variables: Record<string, string> = {
        full_name: contact.name || "",
        first_name: meta.first_name || nameParts[0] || "",
        last_name: meta.last_name || nameParts.slice(1).join(" ") || "",
        phone: contact.phone || "",
        email: contact.email || "",
        lead_source: contact.source || meta.lead_source || "",
        service_category: meta.service_category || "",
        task_name: meta.task_name || meta.service_category || "",
        address: meta.address || "",
        postal_code: meta.postal_code || "",
        comments: meta.comments || "",
      };

      Object.keys(meta).forEach(key => {
        if (!(key in variables) && meta[key]) {
          variables[key] = String(meta[key]);
        }
      });

      res.json({ variables, source: contact.source, contactId: contact.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to get contact variables" });
    }
  });

  // ===================== WEBHOOK ENDPOINTS =====================
  // Public endpoints authenticated via per-tenant secret key in query string or X-API-KEY header

  async function validateWebhookKey(req: any, source: string): Promise<string | null> {
    const key = req.query.key || req.headers["x-api-key"];
    if (!key) return null;
    const secret = await storage.getWebhookSecretByKey(key as string, source);
    if (!secret) {
      const genericSecret = await storage.getWebhookSecretByKey(key as string, "all");
      if (!genericSecret) return null;
      return genericSecret.userId;
    }
    return secret.userId;
  }

  function extractAngiLead(payload: any) {
    const firstName = payload.first_name || payload.firstName || "";
    const lastName = payload.last_name || payload.lastName || "";
    const name = `${firstName} ${lastName}`.trim() || "Angi Lead";
    const phone = payload.phone_number || payload.phone || payload.phoneNumber || null;
    const email = payload.email || null;
    const category = payload.category || payload.task_name || payload.service || null;
    const metadata: Record<string, any> = {
      first_name: firstName || null,
      last_name: lastName || null,
      service_category: category,
      task_name: payload.task_name || null,
      address: payload.address || null,
      postal_code: payload.postal_code || payload.zip_code || null,
      comments: payload.comments || payload.description || null,
      spid: payload.spid || null,
      lead_source: "angi",
    };
    return { name, phone, email, tags: category ? [category] : ["angi-lead"], notes: payload.comments || payload.description || null, metadata };
  }

  function extractGoogleLsaLead(payload: any) {
    let name = "Google LSA Lead";
    let phone = null;
    let email = null;
    let postalCode = null;
    let address = null;
    let jobType = null;
    if (payload.user_column_data && Array.isArray(payload.user_column_data)) {
      for (const field of payload.user_column_data) {
        if (field.column_id === "FULL_NAME") name = field.string_value || name;
        if (field.column_id === "PHONE_NUMBER") phone = field.string_value;
        if (field.column_id === "EMAIL") email = field.string_value;
        if (field.column_id === "POSTAL_CODE") postalCode = field.string_value;
        if (field.column_id === "ADDRESS") address = field.string_value;
        if (field.column_id === "JOB_TYPE") jobType = field.string_value;
      }
    } else {
      name = payload.name || payload.customer_name || name;
      phone = payload.phone || payload.phone_number || null;
      email = payload.email || null;
      postalCode = payload.postal_code || payload.zip_code || null;
      address = payload.address || null;
      jobType = payload.job_type || payload.category || null;
    }
    const nameParts = name.split(" ");
    const metadata: Record<string, any> = {
      first_name: nameParts[0] || null,
      last_name: nameParts.slice(1).join(" ") || null,
      service_category: jobType,
      address,
      postal_code: postalCode,
      lead_id: payload.lead_id || null,
      geo_location: payload.geo_location || null,
      lead_source: "google-lsa",
    };
    return { name, phone, email, tags: ["google-lsa"], notes: payload.lead_id ? `Google Lead ID: ${payload.lead_id}` : null, metadata };
  }

  function extractGenericLead(payload: any, source: string) {
    const firstName = payload.first_name || "";
    const lastName = payload.last_name || "";
    const name = payload.name || `${firstName} ${lastName}`.trim() || payload.customer_name || `${source} Lead`;
    const phone = payload.phone || payload.phone_number || payload.phoneNumber || null;
    const email = payload.email || null;
    const metadata: Record<string, any> = {
      first_name: firstName || name.split(" ")[0] || null,
      last_name: lastName || name.split(" ").slice(1).join(" ") || null,
      service_category: payload.category || payload.service || payload.task_name || null,
      address: payload.address || null,
      postal_code: payload.postal_code || payload.zip_code || null,
      comments: payload.notes || payload.comments || payload.description || null,
      lead_source: source,
    };
    return { name, phone, email, tags: [source], notes: payload.notes || payload.comments || payload.description || null, metadata };
  }

  async function processWebhook(req: any, res: any, source: string, extractFn: (p: any) => any) {
    try {
      const payload = req.body;
      const userId = await validateWebhookKey(req, source);
      if (!userId) {
        return res.status(401).json({ error: "Invalid or missing webhook key. Include ?key=YOUR_KEY in the URL or X-API-KEY header." });
      }

      console.log(`${source} webhook received for user ${userId}:`, JSON.stringify(payload).substring(0, 200));

      const webhookLog = await storage.createWebhookLog({
        userId,
        source,
        eventType: "new_lead",
        payload,
        status: "received",
        isTest: payload.is_test === true || payload.isTest === true,
      });

      try {
        const leadData = extractFn(payload);
        const contact = await storage.createContact({
          userId,
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email,
          source,
          status: "new",
          tags: leadData.tags,
          notes: leadData.notes,
          metadata: leadData.metadata || {},
        });

        await storage.updateWebhookLog(webhookLog.id, { status: "processed", contactId: contact.id });
        res.json({ success: true, contactId: contact.id, webhookLogId: webhookLog.id });
      } catch (processError: any) {
        await storage.updateWebhookLog(webhookLog.id, { status: "error", errorMessage: processError.message });
        res.json({ success: true, webhookLogId: webhookLog.id, warning: "Lead logged but contact creation failed" });
      }
    } catch (error: any) {
      console.error(`${source} webhook error:`, error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  }

  app.post("/api/webhooks/angi", (req, res) => processWebhook(req, res, "angi", extractAngiLead));
  app.post("/api/webhooks/google-lsa", (req, res) => processWebhook(req, res, "google-lsa", extractGoogleLsaLead));
  app.post("/api/webhooks/:source", (req, res) => processWebhook(req, res, req.params.source, (p) => extractGenericLead(p, req.params.source)));

  // Webhook logs (authenticated)
  app.get("/api/webhook-logs", requireAuth, async (req, res) => {
    try {
      const logs = await storage.getWebhookLogs(String(req.user!.id));
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch webhook logs" });
    }
  });

  // Webhook secrets management (authenticated)
  app.get("/api/webhook-secrets", requireAuth, async (req, res) => {
    try {
      const secrets = await storage.getWebhookSecrets(String(req.user!.id));
      res.json(secrets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch webhook secrets" });
    }
  });

  app.post("/api/webhook-secrets", requireAuth, async (req, res) => {
    try {
      const { source } = req.body;
      if (!source) return res.status(400).json({ error: "Source is required" });
      const crypto = await import("crypto");
      const secretKey = crypto.randomBytes(24).toString("hex");
      const secret = await storage.createWebhookSecret({ userId: String(req.user!.id), source, secretKey });
      res.json(secret);
    } catch (error) {
      res.status(500).json({ error: "Failed to create webhook secret" });
    }
  });

  app.delete("/api/webhook-secrets/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteWebhookSecret(req.params.id, String(req.user!.id));
      if (!deleted) return res.status(404).json({ error: "Secret not found" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete webhook secret" });
    }
  });

  // Test webhook endpoint (authenticated - sends to own webhook with key)
  app.post("/api/webhook-test", requireAuth, async (req, res) => {
    try {
      const { source, payload } = req.body;
      if (!source || !payload) return res.status(400).json({ error: "Source and payload are required" });

      const userId = String(req.user!.id);
      const secrets = await storage.getWebhookSecrets(userId);
      let secret = secrets.find(s => s.source === source || s.source === "all");
      if (!secret) {
        const crypto = await import("crypto");
        const secretKey = crypto.randomBytes(24).toString("hex");
        secret = await storage.createWebhookSecret({ userId, source, secretKey });
      }

      const testPayload = { ...payload, is_test: true };

      let lead: { name: string; phone: string | null; email: string | null; tags: string[]; notes: string | null };
      if (source === "angi") {
        lead = extractAngiLead(testPayload);
      } else if (source === "google-lsa") {
        lead = extractGoogleLsaLead(testPayload);
      } else {
        lead = extractGenericLead(testPayload, source);
      }

      const webhookLog = await storage.createWebhookLog({
        userId,
        source,
        eventType: "new_lead",
        payload: testPayload,
        status: "received",
        isTest: true,
      });

      try {
        await storage.createContact({
          userId,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          tags: lead.tags,
          notes: lead.notes,
          source,
          metadata: lead.metadata || {},
        });
        await storage.updateWebhookLog(webhookLog.id, { status: "processed" });
      } catch (contactErr: any) {
        await storage.updateWebhookLog(webhookLog.id, { status: "error", errorMessage: contactErr.message });
      }

      res.json({ success: true, message: `Test ${source} webhook processed`, logId: webhookLog.id });
    } catch (error: any) {
      console.error("Webhook test error:", error);
      res.status(500).json({ error: "Failed to send test webhook", details: error.message });
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

        case "create-web-call": {
          const { testConfig } = req.body;
          let retellAgentId = agentId;

          if (!retellAgentId && !testConfig) {
            return res.status(400).json({ error: "Either agentId or testConfig is required" });
          }

          if (retellAgentId) {
            const agent = await storage.getAgent(retellAgentId, userId);
            if (!agent || !agent.retellAgentId) {
              return res.status(400).json({ error: "Agent not found or not synced with Retell" });
            }
            retellAgentId = agent.retellAgentId;
          }

          const webCallBody: any = {};
          if (retellAgentId) {
            webCallBody.agent_id = retellAgentId;
          }
          if (testConfig && retellAgentId) {
            webCallBody.agent_override = {
              voice_id: testConfig.voice_id,
              language: testConfig.language,
              agent_prompt: testConfig.prompt,
              begin_message: testConfig.greeting_message,
              voice_temperature: testConfig.voice_temperature,
              voice_speed: testConfig.voice_speed,
            };
          }

          const webCallResponse = await fetch(`${RETELL_BASE_URL}/v2/create-web-call`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RETELL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(webCallBody),
          });

          if (!webCallResponse.ok) {
            const errorText = await webCallResponse.text();
            throw new Error(`Failed to create web call: ${errorText}`);
          }

          result = await webCallResponse.json();
          break;
        }

        case "sync-agents-from-retell":
          result = await syncAgentsFromRetell(RETELL_API_KEY, userId);
          break;

        case "create-chat": {
          const { chatAgentId } = req.body;
          if (!chatAgentId) {
            return res.status(400).json({ error: "chatAgentId is required" });
          }
          const chatResponse = await fetch(`${RETELL_BASE_URL}/create-chat`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RETELL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ agent_id: chatAgentId }),
          });
          if (!chatResponse.ok) {
            const errorText = await chatResponse.text();
            throw new Error(`Failed to create chat: ${errorText}`);
          }
          result = await chatResponse.json();
          break;
        }

        case "send-chat-message": {
          const { chatId, message } = req.body;
          if (!chatId || !message) {
            return res.status(400).json({ error: "chatId and message are required" });
          }
          const msgResponse = await fetch(`${RETELL_BASE_URL}/create-chat-completion`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RETELL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ chat_id: chatId, content: message }),
          });
          if (!msgResponse.ok) {
            const errorText = await msgResponse.text();
            throw new Error(`Failed to send message: ${errorText}`);
          }
          result = await msgResponse.json();
          break;
        }

        case "end-chat": {
          const { chatId: endChatId } = req.body;
          if (!endChatId) {
            return res.status(400).json({ error: "chatId is required" });
          }
          const endResponse = await fetch(`${RETELL_BASE_URL}/end-chat`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RETELL_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ chat_id: endChatId }),
          });
          if (!endResponse.ok) {
            const errorText = await endResponse.text();
            throw new Error(`Failed to end chat: ${errorText}`);
          }
          result = { success: true };
          break;
        }

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
          formats: ["json"],
          jsonOptions: {
            schema: {
              type: "object",
              properties: {
                business_name: { type: "string", description: "The official business name" },
                tagline: { type: "string", description: "Business tagline or slogan" },
                business_description: { type: "string", description: "A comprehensive description of what the business does, its mission, and value proposition" },
                phone: { type: "string", description: "Primary business phone number" },
                email: { type: "string", description: "Primary business email address" },
                address: { type: "string", description: "Full business address including street, city, state, zip" },
                services: { type: "array", items: { type: "string" }, description: "List of all services offered" },
                specialties: { type: "array", items: { type: "string" }, description: "Specialty services or areas of expertise" },
                equipment_brands: { type: "array", items: { type: "string" }, description: "Equipment brands or product lines the business works with" },
                certifications: { type: "array", items: { type: "string" }, description: "Professional certifications, licenses, and accreditations" },
                guarantees: { type: "array", items: { type: "string" }, description: "Guarantees, warranties, or satisfaction promises" },
                payment_methods: { type: "array", items: { type: "string" }, description: "Accepted payment methods and financing options" },
                team_info: { type: "string", description: "Information about the team, number of employees, and key personnel" },
                years_in_business: { type: "string", description: "How long the business has been operating" },
                pricing_info: { type: "string", description: "Any pricing details, special offers, or financing options mentioned" },
                business_hours: { type: "object", description: "Business operating hours by day of the week" },
                emergency_service: { type: "boolean", description: "Whether 24/7 or emergency service is available" },
                service_area: { type: "object", properties: { cities: { type: "array", items: { type: "string" } }, radius: { type: "string" } }, description: "Geographic service area including cities and radius" },
                locations: { type: "array", items: { type: "string" }, description: "Multiple office or store locations" },
                faqs: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } }, description: "Frequently asked questions and answers" },
                social_links: { type: "object", description: "Social media and review site profile URLs" },
              }
            },
            prompt: "Extract all vital business information from this webpage including contact details, services, hours, certifications, team info, pricing, service area, and FAQs. Be thorough and capture as much business data as possible."
          },
          onlyMainContent: false,
        }),
      });

      const extractionData = await extractionResponse.json();

      if (!extractionResponse.ok) {
        console.error("Firecrawl extraction failed:", extractionData);
      }

      const branding = brandingData.data?.branding || brandingData.branding || {};
      const metadata = brandingData.data?.metadata || brandingData.metadata || {};
      const markdown = brandingData.data?.markdown || brandingData.markdown || "";
      const extractedJson = (extractionResponse.ok && extractionData.success !== false)
        ? (extractionData.data?.json || extractionData.json || {})
        : {};

      const businessData = {
        success: true,
        data: {
          business_name: extractedJson.business_name || metadata.title || "",
          tagline: extractedJson.tagline || "",
          business_description: extractedJson.business_description || metadata.description || "",
          phone: extractedJson.phone || "",
          email: extractedJson.email || "",
          address: extractedJson.address || "",
          website: formattedUrl,
          services: extractedJson.services || [],
          specialties: extractedJson.specialties || [],
          equipment_brands: extractedJson.equipment_brands || [],
          certifications: extractedJson.certifications || [],
          guarantees: extractedJson.guarantees || [],
          payment_methods: extractedJson.payment_methods || [],
          team_info: extractedJson.team_info || "",
          years_in_business: extractedJson.years_in_business || "",
          pricing_info: extractedJson.pricing_info || "",
          business_hours: extractedJson.business_hours || {},
          emergency_service: extractedJson.emergency_service || false,
          service_area: extractedJson.service_area || {},
          locations: extractedJson.locations || [],
          faqs: extractedJson.faqs || [],
          logo_url: branding.images?.logo || branding.logo || "",
          colors: branding.colors || {},
          social_links: extractedJson.social_links || {},
          raw_markdown: markdown,
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

  app.get("/api/sms-agents", requireAuth, async (req, res) => {
    try {
      const userId = String(req.user!.id);
      const allAgents = await storage.getAgents(userId);
      const smsAgents = allAgents.filter(a =>
        a.voiceId === "sms-agent" || a.voiceModel === "sms" || a.voiceType === "Speed to Lead"
      );
      const mapped = smsAgents.map(a => ({
        id: a.id,
        user_id: a.userId,
        name: a.name,
        system_prompt: a.personality || "",
        greeting_message: a.greetingMessage || "",
        phone_number: null,
        is_active: a.isActive ?? false,
        max_tokens: 1024,
        temperature: Number(a.voiceTemperature) || 1,
        model: a.voiceModel || "sms",
        created_at: a.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: a.updatedAt?.toISOString() || new Date().toISOString(),
      }));
      res.json(mapped);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sms-agents/:id", requireAuth, async (req, res) => {
    try {
      const userId = String(req.user!.id);
      const agent = await storage.getAgent(req.params.id, userId);
      if (!agent) return res.status(404).json({ error: "SMS agent not found" });
      const isSms = agent.voiceId === "sms-agent" || agent.voiceModel === "sms" || agent.voiceType === "Speed to Lead";
      if (!isSms) return res.status(404).json({ error: "SMS agent not found" });
      res.json({
        id: agent.id,
        user_id: agent.userId,
        name: agent.name,
        system_prompt: agent.personality || "",
        greeting_message: agent.greetingMessage || "",
        phone_number: null,
        is_active: agent.isActive ?? false,
        max_tokens: 1024,
        temperature: Number(agent.voiceTemperature) || 1,
        model: agent.voiceModel || "sms",
        created_at: agent.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: agent.updatedAt?.toISOString() || new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sms-campaigns", requireAuth, async (req, res) => {
    try {
      const userId = String(req.user!.id);
      const campaigns = await storage.getSmsCampaigns(userId);
      const result = await Promise.all(campaigns.map(async (c) => {
        const steps = await storage.getSmsCampaignSteps(c.id);
        return {
          id: c.id,
          user_id: c.userId,
          name: c.name,
          description: c.description,
          sms_agent_id: c.smsAgentId,
          is_active: c.isActive ?? false,
          created_at: c.createdAt?.toISOString() || new Date().toISOString(),
          updated_at: c.updatedAt?.toISOString() || new Date().toISOString(),
          steps: steps.map(s => ({
            id: s.id,
            campaign_id: s.campaignId,
            step_order: s.stepOrder,
            delay_minutes: s.delayMinutes ?? 0,
            message_template: s.messageTemplate,
            created_at: s.createdAt?.toISOString() || new Date().toISOString(),
          })),
        };
      }));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/sms-campaigns/:id", requireAuth, async (req, res) => {
    try {
      const userId = String(req.user!.id);
      const campaign = await storage.getSmsCampaign(req.params.id, userId);
      if (!campaign) return res.status(404).json({ error: "Campaign not found" });
      const steps = await storage.getSmsCampaignSteps(campaign.id);
      res.json({
        id: campaign.id,
        user_id: campaign.userId,
        name: campaign.name,
        description: campaign.description,
        sms_agent_id: campaign.smsAgentId,
        is_active: campaign.isActive ?? false,
        created_at: campaign.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: campaign.updatedAt?.toISOString() || new Date().toISOString(),
        steps: steps.map(s => ({
          id: s.id,
          campaign_id: s.campaignId,
          step_order: s.stepOrder,
          delay_minutes: s.delayMinutes ?? 0,
          message_template: s.messageTemplate,
          created_at: s.createdAt?.toISOString() || new Date().toISOString(),
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sms-campaigns", requireAuth, async (req, res) => {
    try {
      const userId = String(req.user!.id);
      const { name, description, sms_agent_id, is_active } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: "Campaign name is required" });
      if (sms_agent_id) {
        const agent = await storage.getAgent(sms_agent_id, userId);
        if (!agent) return res.status(400).json({ error: "SMS agent not found" });
        const isSms = agent.voiceId === "sms-agent" || agent.voiceModel === "sms" || agent.voiceType === "Speed to Lead";
        if (!isSms) return res.status(400).json({ error: "Selected agent is not an SMS agent" });
      }
      const campaign = await storage.createSmsCampaign({
        userId,
        name: name.trim(),
        description: description || null,
        smsAgentId: sms_agent_id || null,
        isActive: is_active ?? false,
      });
      res.json({
        id: campaign.id,
        user_id: campaign.userId,
        name: campaign.name,
        description: campaign.description,
        sms_agent_id: campaign.smsAgentId,
        is_active: campaign.isActive ?? false,
        created_at: campaign.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: campaign.updatedAt?.toISOString() || new Date().toISOString(),
        steps: [],
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/sms-campaigns/:id", requireAuth, async (req, res) => {
    try {
      const userId = String(req.user!.id);
      const updates: any = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.sms_agent_id !== undefined) {
        if (req.body.sms_agent_id) {
          const agent = await storage.getAgent(req.body.sms_agent_id, userId);
          if (!agent) return res.status(400).json({ error: "SMS agent not found" });
          const isSms = agent.voiceId === "sms-agent" || agent.voiceModel === "sms" || agent.voiceType === "Speed to Lead";
          if (!isSms) return res.status(400).json({ error: "Selected agent is not an SMS agent" });
        }
        updates.smsAgentId = req.body.sms_agent_id || null;
      }
      if (req.body.is_active !== undefined) updates.isActive = req.body.is_active;
      const campaign = await storage.updateSmsCampaign(req.params.id, userId, updates);
      if (!campaign) return res.status(404).json({ error: "Campaign not found" });
      const steps = await storage.getSmsCampaignSteps(campaign.id);
      res.json({
        id: campaign.id,
        user_id: campaign.userId,
        name: campaign.name,
        description: campaign.description,
        sms_agent_id: campaign.smsAgentId,
        is_active: campaign.isActive ?? false,
        created_at: campaign.createdAt?.toISOString() || new Date().toISOString(),
        updated_at: campaign.updatedAt?.toISOString() || new Date().toISOString(),
        steps: steps.map(s => ({
          id: s.id,
          campaign_id: s.campaignId,
          step_order: s.stepOrder,
          delay_minutes: s.delayMinutes ?? 0,
          message_template: s.messageTemplate,
          created_at: s.createdAt?.toISOString() || new Date().toISOString(),
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/sms-campaigns/:id", requireAuth, async (req, res) => {
    try {
      const userId = String(req.user!.id);
      const deleted = await storage.deleteSmsCampaign(req.params.id, userId);
      if (!deleted) return res.status(404).json({ error: "Campaign not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sms-campaign-steps", requireAuth, async (req, res) => {
    try {
      const userId = String(req.user!.id);
      const { campaign_id, step_order, delay_minutes, message_template } = req.body;
      if (!campaign_id || !message_template?.trim()) {
        return res.status(400).json({ error: "campaign_id and message_template are required" });
      }
      const campaign = await storage.getSmsCampaign(campaign_id, userId);
      if (!campaign) return res.status(404).json({ error: "Campaign not found" });
      const step = await storage.createSmsCampaignStep({
        campaignId: campaign_id,
        stepOrder: step_order ?? 1,
        delayMinutes: delay_minutes ?? 0,
        messageTemplate: message_template.trim(),
      });
      res.json({
        id: step.id,
        campaign_id: step.campaignId,
        step_order: step.stepOrder,
        delay_minutes: step.delayMinutes ?? 0,
        message_template: step.messageTemplate,
        created_at: step.createdAt?.toISOString() || new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/sms-campaign-steps/:id", requireAuth, async (req, res) => {
    try {
      const userId = String(req.user!.id);
      const existing = await storage.getSmsCampaignStep(req.params.id);
      if (!existing) return res.status(404).json({ error: "Step not found" });
      const campaign = await storage.getSmsCampaign(existing.campaignId, userId);
      if (!campaign) return res.status(404).json({ error: "Step not found" });
      const updates: any = {};
      if (req.body.delay_minutes !== undefined) updates.delayMinutes = req.body.delay_minutes;
      if (req.body.message_template !== undefined) updates.messageTemplate = req.body.message_template;
      if (req.body.step_order !== undefined) updates.stepOrder = req.body.step_order;
      const step = await storage.updateSmsCampaignStep(req.params.id, updates);
      if (!step) return res.status(404).json({ error: "Step not found" });
      res.json({
        id: step.id,
        campaign_id: step.campaignId,
        step_order: step.stepOrder,
        delay_minutes: step.delayMinutes ?? 0,
        message_template: step.messageTemplate,
        created_at: step.createdAt?.toISOString() || new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/sms-campaign-steps/:id", requireAuth, async (req, res) => {
    try {
      const userId = String(req.user!.id);
      const existing = await storage.getSmsCampaignStep(req.params.id);
      if (!existing) return res.status(404).json({ error: "Step not found" });
      const campaign = await storage.getSmsCampaign(existing.campaignId, userId);
      if (!campaign) return res.status(404).json({ error: "Step not found" });
      const deleted = await storage.deleteSmsCampaignStep(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Step not found" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

async function createRetellLlm(apiKey: string, config: any) {
  const llmConfig: any = {};
  if (config.greetingMessage || config.greeting_message) {
    llmConfig.begin_message = config.greetingMessage || config.greeting_message;
  }
  if (config.personality) {
    llmConfig.general_prompt = `You are a ${config.personality} AI assistant for a business. ${config.generalPrompt || config.general_prompt || ""}`.trim();
  }
  llmConfig.general_tools = [{ type: "end_call", name: "end_call", description: "End the call with the user." }];

  const response = await fetch(`${RETELL_BASE_URL}/create-retell-llm`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(llmConfig),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create Retell LLM: ${errorText}`);
  }

  return await response.json();
}

async function updateRetellLlm(apiKey: string, llmId: string, config: any) {
  const llmConfig: any = {};
  if (config.greetingMessage || config.greeting_message) {
    llmConfig.begin_message = config.greetingMessage || config.greeting_message;
  }
  if (config.personality) {
    llmConfig.general_prompt = `You are a ${config.personality} AI assistant for a business. ${config.generalPrompt || config.general_prompt || ""}`.trim();
  }

  const response = await fetch(`${RETELL_BASE_URL}/update-retell-llm/${llmId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(llmConfig),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update Retell LLM: ${errorText}`);
  }

  return await response.json();
}

async function listRetellChatAgents(apiKey: string) {
  const response = await fetch(`${RETELL_BASE_URL}/list-chat-agents`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return { chatAgents: [] };
    }
    throw new Error(`Failed to fetch chat agents: ${response.status}`);
  }

  const chatAgents = await response.json();
  return { chatAgents };
}

async function syncAgentsFromRetell(apiKey: string, userId: any) {
  const { agents: retellAgents } = await listRetellAgents(apiKey);
  
  let chatAgents: any[] = [];
  try {
    const chatResult = await listRetellChatAgents(apiKey);
    chatAgents = chatResult.chatAgents || [];
  } catch (e) {
    console.log("Chat agents not available or not supported:", e);
  }
  
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const retellAgent of retellAgents) {
    const existingAgent = await storage.getAgentByRetellId(retellAgent.agent_id, String(userId));

    const agentData: any = {
      name: retellAgent.agent_name || "Unnamed Agent",
      retellAgentId: retellAgent.agent_id,
      voiceType: "Voice AI",
      voiceId: retellAgent.voice_id || null,
      voiceModel: retellAgent.voice_model || "eleven_turbo_v2",
      voiceTemperature: retellAgent.voice_temperature?.toString() || "1",
      voiceSpeed: retellAgent.voice_speed?.toString() || "1",
      volume: retellAgent.volume?.toString() || "1",
      responsiveness: retellAgent.responsiveness?.toString() || "1",
      interruptionSensitivity: retellAgent.interruption_sensitivity?.toString() || "1",
      enableBackchannel: retellAgent.enable_backchannel ?? true,
      backchannelFrequency: retellAgent.backchannel_frequency?.toString() || "0.9",
      ambientSound: retellAgent.ambient_sound || null,
      ambientSoundVolume: retellAgent.ambient_sound_volume?.toString() || "1",
      language: retellAgent.language || "en-US",
      beginMessageDelayMs: retellAgent.begin_message_delay_ms || 1000,
      reminderTriggerMs: retellAgent.reminder_trigger_ms || 10000,
      reminderMaxCount: retellAgent.reminder_max_count || 2,
      boostedKeywords: retellAgent.boosted_keywords || null,
    };

    if (retellAgent.response_engine?.llm_id) {
      agentData.retellLlmId = retellAgent.response_engine.llm_id;
    }

    if (existingAgent) {
      await storage.updateAgent(existingAgent.id, String(userId), agentData);
      updated++;
    } else {
      await storage.createAgent({
        userId: String(userId),
        ...agentData,
      });
      created++;
    }
  }

  for (const chatAgent of chatAgents) {
    const chatAgentId = chatAgent.agent_id || chatAgent.chat_agent_id;
    if (!chatAgentId) continue;
    
    const existingAgent = await storage.getAgentByRetellId(chatAgentId, String(userId));

    const agentData: any = {
      name: chatAgent.agent_name || "Unnamed Chat Agent",
      retellAgentId: chatAgentId,
      voiceType: "Chat Agent",
      voiceId: "chat-agent",
      voiceModel: "chat",
      language: chatAgent.language || "en-US",
    };

    if (chatAgent.response_engine?.llm_id) {
      agentData.retellLlmId = chatAgent.response_engine.llm_id;
    }

    if (existingAgent) {
      await storage.updateAgent(existingAgent.id, String(userId), agentData);
      updated++;
    } else {
      await storage.createAgent({
        userId: String(userId),
        ...agentData,
      });
      created++;
    }
  }

  const totalVoice = retellAgents.length;
  const totalChat = chatAgents.length;
  return { 
    message: `Sync complete: ${created} new agents imported, ${updated} existing agents updated (${totalVoice} voice, ${totalChat} chat)`,
    created,
    updated,
    skipped,
    total: totalVoice + totalChat
  };
}

async function createRetellAgent(apiKey: string, userId: number, agentConfig: any) {
  const normalized = normalizeAgentConfig(agentConfig);

  const isSmsAgent = normalized.voiceId === "sms-agent" || normalized.voice_id === "sms-agent" ||
    normalized.voiceModel === "sms" || normalized.voice_model === "sms" ||
    normalized.voiceType === "Speed to Lead" || normalized.voice_type === "Speed to Lead" ||
    normalized.voiceType === "text-agent" || normalized.voice_type === "text-agent";

  let retellAgentId = null;
  let retellLlmId = null;
  let retellAgent = null;

  if (!isSmsAgent) {
    const retellLlm = await createRetellLlm(apiKey, normalized);
    retellLlmId = retellLlm.llm_id;

    const retellConfig = buildRetellAgentConfig(normalized);
    retellConfig.agent_name = normalized.name;
    retellConfig.response_engine = {
      type: "retell-llm",
      llm_id: retellLlm.llm_id,
    };

    if (!retellConfig.voice_id) {
      retellConfig.voice_id = normalized.voiceId || normalized.voice_id || normalized.voiceType || normalized.voice_type || "11labs-Emma";
    }

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

    retellAgent = await response.json();
    retellAgentId = retellAgent.agent_id;
  }

  const dbAgent = await storage.createAgent({
    userId,
    name: normalized.name,
    retellAgentId,
    retellLlmId,
    voiceType: normalized.voiceType,
    personality: normalized.personality,
    greetingMessage: normalized.greetingMessage,
    voiceId: normalized.voiceId,
    voiceModel: normalized.voiceModel,
    language: normalized.language,
    scheduleStart: normalized.scheduleStart,
    scheduleEnd: normalized.scheduleEnd,
    scheduleDays: normalized.scheduleDays,
    voiceTemperature: normalized.voiceTemperature?.toString(),
    voiceSpeed: normalized.voiceSpeed?.toString(),
    volume: normalized.volume?.toString(),
    responsiveness: normalized.responsiveness?.toString(),
    interruptionSensitivity: normalized.interruptionSensitivity?.toString(),
    enableBackchannel: normalized.enableBackchannel,
    backchannelFrequency: normalized.backchannelFrequency?.toString(),
    ambientSound: normalized.ambientSound,
    ambientSoundVolume: normalized.ambientSoundVolume?.toString(),
    enableVoicemailDetection: normalized.enableVoicemailDetection,
    voicemailMessage: normalized.voicemailMessage,
    voicemailDetectionTimeoutMs: normalized.voicemailDetectionTimeoutMs,
    maxCallDurationMs: normalized.maxCallDurationMs,
    endCallAfterSilenceMs: normalized.endCallAfterSilenceMs,
    beginMessageDelayMs: normalized.beginMessageDelayMs,
    normalizeForSpeech: normalized.normalizeForSpeech,
    boostedKeywords: normalized.boostedKeywords,
    reminderTriggerMs: normalized.reminderTriggerMs,
    reminderMaxCount: normalized.reminderMaxCount,
  });

  return { agent: dbAgent, retellAgent };
}

async function updateRetellAgent(apiKey: string, userId: number, agentId: string, agentConfig: any) {
  const normalized = normalizeAgentConfig(agentConfig);
  const existingAgent = await storage.getAgent(agentId, userId);
  if (!existingAgent) {
    throw new Error("Agent not found");
  }

  if (existingAgent.retellLlmId) {
    try {
      await updateRetellLlm(apiKey, existingAgent.retellLlmId, normalized);
    } catch (err) {
      console.error("Failed to update Retell LLM:", err);
    }
  }

  if (existingAgent.retellAgentId) {
    const retellConfig = buildRetellAgentConfig(normalized);
    if (normalized.name) {
      retellConfig.agent_name = normalized.name;
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

  const numericFields = new Set([
    'voiceTemperature', 'voiceSpeed', 'volume', 'responsiveness',
    'interruptionSensitivity', 'backchannelFrequency', 'ambientSoundVolume',
  ]);
  const dbFields = [
    'name', 'personality', 'language', 'voiceType', 'greetingMessage',
    'scheduleStart', 'scheduleEnd', 'scheduleDays', 'isActive',
    'voiceId', 'voiceModel', 'voiceTemperature', 'voiceSpeed',
    'volume', 'responsiveness', 'interruptionSensitivity',
    'enableBackchannel', 'backchannelFrequency', 'ambientSound',
    'ambientSoundVolume', 'enableVoicemailDetection', 'voicemailMessage',
    'voicemailDetectionTimeoutMs', 'maxCallDurationMs', 'endCallAfterSilenceMs',
    'beginMessageDelayMs', 'normalizeForSpeech', 'boostedKeywords',
    'reminderTriggerMs', 'reminderMaxCount',
  ];

  const dbUpdateData: any = {};
  for (const field of dbFields) {
    if (normalized[field] !== undefined) {
      dbUpdateData[field] = numericFields.has(field) ? normalized[field]?.toString() : normalized[field];
    }
  }

  const updatedAgent = await storage.updateAgent(agentId, userId, dbUpdateData);
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

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function normalizeAgentConfig(config: any): any {
  const normalized: any = {};
  for (const key of Object.keys(config)) {
    const camelKey = snakeToCamel(key);
    normalized[camelKey] = config[key];
    if (camelKey !== key) {
      normalized[key] = config[key];
    }
  }
  return normalized;
}

function buildRetellAgentConfig(config: any) {
  const retellConfig: any = {};

  const validVoiceModels = [
    "eleven_turbo_v2", "eleven_flash_v2", "eleven_turbo_v2_5", "eleven_flash_v2_5",
    "eleven_multilingual_v2", "sonic-2", "sonic-3", "sonic-3-latest",
    "sonic-turbo", "tts-1", "gpt-4o-mini-tts",
    "speech-02-turbo", "speech-2.8-turbo",
  ];
  if (config.voice_id && !["sms-agent", "text-agent"].includes(config.voice_id)) {
    retellConfig.voice_id = config.voice_id;
  }
  if (config.voice_model && validVoiceModels.includes(config.voice_model)) {
    retellConfig.voice_model = config.voice_model;
  }
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
