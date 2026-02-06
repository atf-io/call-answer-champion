import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users, profiles, aiAgents, callLogs, knowledgeBaseEntries,
  phoneNumbers, reviews, userSettings, googleIntegrations, contacts, webhookLogs, webhookSecrets,
  smsCampaigns, smsCampaignSteps,
  type User, type Profile, type AiAgent, type CallLog, 
  type KnowledgeBaseEntry, type PhoneNumber, type Review, 
  type UserSettings, type GoogleIntegration, type Contact, type WebhookLog, type WebhookSecret,
  type SmsCampaign, type SmsCampaignStep
} from "../shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: { username: string; password: string; email?: string; fullName?: string }): Promise<User>;
  
  // Profiles
  getProfile(userId: string): Promise<Profile | undefined>;
  createProfile(data: Partial<Profile> & { userId: string }): Promise<Profile>;
  updateProfile(userId: string, data: Partial<Profile>): Promise<Profile | undefined>;
  
  // AI Agents
  getAgents(userId: string): Promise<AiAgent[]>;
  getAgent(id: string, userId: string): Promise<AiAgent | undefined>;
  getAgentByRetellId(retellAgentId: string, userId: string): Promise<AiAgent | undefined>;
  createAgent(data: Partial<AiAgent> & { userId: string; name: string }): Promise<AiAgent>;
  updateAgent(id: string, userId: string, data: Partial<AiAgent>): Promise<AiAgent | undefined>;
  deleteAgent(id: string, userId: string): Promise<boolean>;
  
  // Call Logs
  getCallLogs(userId: string, limit?: number): Promise<CallLog[]>;
  getCallLog(id: string, userId: string): Promise<CallLog | undefined>;
  createCallLog(data: Partial<CallLog> & { userId: string }): Promise<CallLog>;
  getExistingRetellCallIds(userId: string): Promise<string[]>;
  
  // Knowledge Base
  getKnowledgeBaseEntries(userId: string, agentId?: string): Promise<KnowledgeBaseEntry[]>;
  getKnowledgeBaseEntry(id: string, userId: string): Promise<KnowledgeBaseEntry | undefined>;
  createKnowledgeBaseEntry(data: Partial<KnowledgeBaseEntry> & { userId: string; title: string; sourceType: string; content: string }): Promise<KnowledgeBaseEntry>;
  updateKnowledgeBaseEntry(id: string, userId: string, data: Partial<KnowledgeBaseEntry>): Promise<KnowledgeBaseEntry | undefined>;
  deleteKnowledgeBaseEntry(id: string, userId: string): Promise<boolean>;
  
  // Phone Numbers
  getPhoneNumbers(userId: string): Promise<PhoneNumber[]>;
  getPhoneNumber(id: string, userId: string): Promise<PhoneNumber | undefined>;
  getPhoneNumberByRetellId(retellPhoneNumberId: string, userId: string): Promise<PhoneNumber | undefined>;
  createPhoneNumber(data: Partial<PhoneNumber> & { userId: string; phoneNumber: string }): Promise<PhoneNumber>;
  updatePhoneNumber(id: string, userId: string, data: Partial<PhoneNumber>): Promise<PhoneNumber | undefined>;
  deletePhoneNumber(id: string, userId: string): Promise<boolean>;
  
  // Reviews
  getReviews(userId: string): Promise<Review[]>;
  getReview(id: string, userId: string): Promise<Review | undefined>;
  createReview(data: Partial<Review> & { userId: string; authorName: string; rating: number }): Promise<Review>;
  updateReview(id: string, userId: string, data: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: string, userId: string): Promise<boolean>;
  
  // Contacts
  getContacts(userId: string): Promise<Contact[]>;
  getContact(id: string, userId: string): Promise<Contact | undefined>;
  createContact(data: Partial<Contact> & { userId: string; name: string }): Promise<Contact>;
  updateContact(id: string, userId: string, data: Partial<Contact>): Promise<Contact | undefined>;
  deleteContact(id: string, userId: string): Promise<boolean>;

  // User Settings
  getSettings(userId: string): Promise<UserSettings | undefined>;
  createSettings(data: Partial<UserSettings> & { userId: string }): Promise<UserSettings>;
  updateSettings(userId: string, data: Partial<UserSettings>): Promise<UserSettings | undefined>;

  // Webhook Logs
  getWebhookLogs(userId: string): Promise<WebhookLog[]>;
  getAllWebhookLogs(): Promise<WebhookLog[]>;
  createWebhookLog(data: Partial<WebhookLog> & { source: string; eventType: string; payload: any }): Promise<WebhookLog>;
  updateWebhookLog(id: string, data: Partial<WebhookLog>): Promise<WebhookLog | undefined>;

  // Webhook Secrets
  getWebhookSecrets(userId: string): Promise<WebhookSecret[]>;
  getWebhookSecretByKey(secretKey: string, source: string): Promise<WebhookSecret | undefined>;
  createWebhookSecret(data: { userId: string; source: string; secretKey: string }): Promise<WebhookSecret>;
  deleteWebhookSecret(id: string, userId: string): Promise<boolean>;

  // SMS Campaigns
  getSmsCampaigns(userId: string): Promise<SmsCampaign[]>;
  getSmsCampaign(id: string, userId: string): Promise<SmsCampaign | undefined>;
  createSmsCampaign(data: Partial<SmsCampaign> & { userId: string; name: string }): Promise<SmsCampaign>;
  updateSmsCampaign(id: string, userId: string, data: Partial<SmsCampaign>): Promise<SmsCampaign | undefined>;
  deleteSmsCampaign(id: string, userId: string): Promise<boolean>;

  // SMS Campaign Steps
  getSmsCampaignSteps(campaignId: string): Promise<SmsCampaignStep[]>;
  getSmsCampaignStep(id: string): Promise<SmsCampaignStep | undefined>;
  createSmsCampaignStep(data: Partial<SmsCampaignStep> & { campaignId: string; stepOrder: number; messageTemplate: string }): Promise<SmsCampaignStep>;
  updateSmsCampaignStep(id: string, data: Partial<SmsCampaignStep>): Promise<SmsCampaignStep | undefined>;
  deleteSmsCampaignStep(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return user;
  }

  async createUser(userData: { username: string; password: string; email?: string; fullName?: string }): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  // Profiles
  async getProfile(userId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    return profile;
  }

  async createProfile(data: Partial<Profile> & { userId: string }): Promise<Profile> {
    const [profile] = await db.insert(profiles).values(data).returning();
    return profile;
  }

  async updateProfile(userId: string, data: Partial<Profile>): Promise<Profile | undefined> {
    const [profile] = await db.update(profiles).set({ ...data, updatedAt: new Date() }).where(eq(profiles.userId, userId)).returning();
    return profile;
  }

  // AI Agents
  async getAgents(userId: string): Promise<AiAgent[]> {
    return await db.select().from(aiAgents).where(eq(aiAgents.userId, userId)).orderBy(desc(aiAgents.createdAt));
  }

  async getAgent(id: string, userId: string): Promise<AiAgent | undefined> {
    const [agent] = await db.select().from(aiAgents).where(and(eq(aiAgents.id, id), eq(aiAgents.userId, userId))).limit(1);
    return agent;
  }

  async getAgentByRetellId(retellAgentId: string, userId: string): Promise<AiAgent | undefined> {
    const [agent] = await db.select().from(aiAgents).where(and(eq(aiAgents.retellAgentId, retellAgentId), eq(aiAgents.userId, userId))).limit(1);
    return agent;
  }

  async createAgent(data: Partial<AiAgent> & { userId: string; name: string }): Promise<AiAgent> {
    const [agent] = await db.insert(aiAgents).values(data).returning();
    return agent;
  }

  async updateAgent(id: string, userId: string, data: Partial<AiAgent>): Promise<AiAgent | undefined> {
    const [agent] = await db.update(aiAgents).set({ ...data, updatedAt: new Date() }).where(and(eq(aiAgents.id, id), eq(aiAgents.userId, userId))).returning();
    return agent;
  }

  async deleteAgent(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(aiAgents).where(and(eq(aiAgents.id, id), eq(aiAgents.userId, userId))).returning();
    return result.length > 0;
  }

  // Call Logs
  async getCallLogs(userId: string, limit: number = 100): Promise<CallLog[]> {
    return await db.select().from(callLogs).where(eq(callLogs.userId, userId)).orderBy(desc(callLogs.createdAt)).limit(limit);
  }

  async getCallLog(id: string, userId: string): Promise<CallLog | undefined> {
    const [log] = await db.select().from(callLogs).where(and(eq(callLogs.id, id), eq(callLogs.userId, userId))).limit(1);
    return log;
  }

  async createCallLog(data: Partial<CallLog> & { userId: string }): Promise<CallLog> {
    const [log] = await db.insert(callLogs).values(data).returning();
    return log;
  }

  async getExistingRetellCallIds(userId: string): Promise<string[]> {
    const logs = await db.select({ retellCallId: callLogs.retellCallId }).from(callLogs).where(eq(callLogs.userId, userId));
    return logs.map(l => l.retellCallId).filter((id): id is string => id !== null);
  }

  // Knowledge Base
  async getKnowledgeBaseEntries(userId: string, agentId?: string): Promise<KnowledgeBaseEntry[]> {
    if (agentId) {
      return await db.select().from(knowledgeBaseEntries).where(and(eq(knowledgeBaseEntries.userId, userId), eq(knowledgeBaseEntries.agentId, agentId))).orderBy(desc(knowledgeBaseEntries.createdAt));
    }
    return await db.select().from(knowledgeBaseEntries).where(eq(knowledgeBaseEntries.userId, userId)).orderBy(desc(knowledgeBaseEntries.createdAt));
  }

  async getKnowledgeBaseEntry(id: string, userId: string): Promise<KnowledgeBaseEntry | undefined> {
    const [entry] = await db.select().from(knowledgeBaseEntries).where(and(eq(knowledgeBaseEntries.id, id), eq(knowledgeBaseEntries.userId, userId))).limit(1);
    return entry;
  }

  async createKnowledgeBaseEntry(data: Partial<KnowledgeBaseEntry> & { userId: string; title: string; sourceType: string; content: string }): Promise<KnowledgeBaseEntry> {
    const [entry] = await db.insert(knowledgeBaseEntries).values(data).returning();
    return entry;
  }

  async updateKnowledgeBaseEntry(id: string, userId: string, data: Partial<KnowledgeBaseEntry>): Promise<KnowledgeBaseEntry | undefined> {
    const [entry] = await db.update(knowledgeBaseEntries).set({ ...data, updatedAt: new Date() }).where(and(eq(knowledgeBaseEntries.id, id), eq(knowledgeBaseEntries.userId, userId))).returning();
    return entry;
  }

  async deleteKnowledgeBaseEntry(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(knowledgeBaseEntries).where(and(eq(knowledgeBaseEntries.id, id), eq(knowledgeBaseEntries.userId, userId))).returning();
    return result.length > 0;
  }

  // Phone Numbers
  async getPhoneNumbers(userId: string): Promise<PhoneNumber[]> {
    return await db.select().from(phoneNumbers).where(eq(phoneNumbers.userId, userId)).orderBy(desc(phoneNumbers.createdAt));
  }

  async getPhoneNumber(id: string, userId: string): Promise<PhoneNumber | undefined> {
    const [phone] = await db.select().from(phoneNumbers).where(and(eq(phoneNumbers.id, id), eq(phoneNumbers.userId, userId))).limit(1);
    return phone;
  }

  async getPhoneNumberByRetellId(retellPhoneNumberId: string, userId: string): Promise<PhoneNumber | undefined> {
    const [phone] = await db.select().from(phoneNumbers).where(and(eq(phoneNumbers.retellPhoneNumberId, retellPhoneNumberId), eq(phoneNumbers.userId, userId))).limit(1);
    return phone;
  }

  async createPhoneNumber(data: Partial<PhoneNumber> & { userId: string; phoneNumber: string }): Promise<PhoneNumber> {
    const [phone] = await db.insert(phoneNumbers).values(data).returning();
    return phone;
  }

  async updatePhoneNumber(id: string, userId: string, data: Partial<PhoneNumber>): Promise<PhoneNumber | undefined> {
    const [phone] = await db.update(phoneNumbers).set({ ...data, updatedAt: new Date() }).where(and(eq(phoneNumbers.id, id), eq(phoneNumbers.userId, userId))).returning();
    return phone;
  }

  async deletePhoneNumber(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(phoneNumbers).where(and(eq(phoneNumbers.id, id), eq(phoneNumbers.userId, userId))).returning();
    return result.length > 0;
  }

  // Reviews
  async getReviews(userId: string): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.userId, userId)).orderBy(desc(reviews.reviewDate));
  }

  async getReview(id: string, userId: string): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(and(eq(reviews.id, id), eq(reviews.userId, userId))).limit(1);
    return review;
  }

  async createReview(data: Partial<Review> & { userId: string; authorName: string; rating: number }): Promise<Review> {
    const [review] = await db.insert(reviews).values(data).returning();
    return review;
  }

  async updateReview(id: string, userId: string, data: Partial<Review>): Promise<Review | undefined> {
    const [review] = await db.update(reviews).set({ ...data, updatedAt: new Date() }).where(and(eq(reviews.id, id), eq(reviews.userId, userId))).returning();
    return review;
  }

  async deleteReview(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(reviews).where(and(eq(reviews.id, id), eq(reviews.userId, userId))).returning();
    return result.length > 0;
  }

  // Contacts
  async getContacts(userId: string): Promise<Contact[]> {
    return await db.select().from(contacts).where(eq(contacts.userId, userId)).orderBy(desc(contacts.createdAt));
  }

  async getContact(id: string, userId: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId))).limit(1);
    return contact;
  }

  async createContact(data: Partial<Contact> & { userId: string; name: string }): Promise<Contact> {
    const [contact] = await db.insert(contacts).values(data).returning();
    return contact;
  }

  async updateContact(id: string, userId: string, data: Partial<Contact>): Promise<Contact | undefined> {
    const [contact] = await db.update(contacts).set({ ...data, updatedAt: new Date() }).where(and(eq(contacts.id, id), eq(contacts.userId, userId))).returning();
    return contact;
  }

  async deleteContact(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId))).returning();
    return result.length > 0;
  }

  // User Settings
  async getSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
    return settings;
  }

  async createSettings(data: Partial<UserSettings> & { userId: string }): Promise<UserSettings> {
    const [settings] = await db.insert(userSettings).values(data).returning();
    return settings;
  }

  async updateSettings(userId: string, data: Partial<UserSettings>): Promise<UserSettings | undefined> {
    const [settings] = await db.update(userSettings).set({ ...data, updatedAt: new Date() }).where(eq(userSettings.userId, userId)).returning();
    return settings;
  }
  // Webhook Logs
  async getWebhookLogs(userId: string): Promise<WebhookLog[]> {
    return await db.select().from(webhookLogs).where(eq(webhookLogs.userId, userId)).orderBy(desc(webhookLogs.createdAt));
  }

  async getAllWebhookLogs(): Promise<WebhookLog[]> {
    return await db.select().from(webhookLogs).orderBy(desc(webhookLogs.createdAt));
  }

  async createWebhookLog(data: Partial<WebhookLog> & { source: string; eventType: string; payload: any }): Promise<WebhookLog> {
    const [log] = await db.insert(webhookLogs).values(data).returning();
    return log;
  }

  async updateWebhookLog(id: string, data: Partial<WebhookLog>): Promise<WebhookLog | undefined> {
    const [log] = await db.update(webhookLogs).set(data).where(eq(webhookLogs.id, id)).returning();
    return log;
  }

  // Webhook Secrets
  async getWebhookSecrets(userId: string): Promise<WebhookSecret[]> {
    return await db.select().from(webhookSecrets).where(and(eq(webhookSecrets.userId, userId), eq(webhookSecrets.isActive, true))).orderBy(desc(webhookSecrets.createdAt));
  }

  async getWebhookSecretByKey(secretKey: string, source: string): Promise<WebhookSecret | undefined> {
    const [secret] = await db.select().from(webhookSecrets).where(and(eq(webhookSecrets.secretKey, secretKey), eq(webhookSecrets.source, source), eq(webhookSecrets.isActive, true))).limit(1);
    return secret;
  }

  async createWebhookSecret(data: { userId: string; source: string; secretKey: string }): Promise<WebhookSecret> {
    const [secret] = await db.insert(webhookSecrets).values(data).returning();
    return secret;
  }

  async deleteWebhookSecret(id: string, userId: string): Promise<boolean> {
    const result = await db.update(webhookSecrets).set({ isActive: false }).where(and(eq(webhookSecrets.id, id), eq(webhookSecrets.userId, userId))).returning();
    return result.length > 0;
  }

  // SMS Campaigns
  async getSmsCampaigns(userId: string): Promise<SmsCampaign[]> {
    return await db.select().from(smsCampaigns).where(eq(smsCampaigns.userId, userId)).orderBy(desc(smsCampaigns.createdAt));
  }

  async getSmsCampaign(id: string, userId: string): Promise<SmsCampaign | undefined> {
    const [campaign] = await db.select().from(smsCampaigns).where(and(eq(smsCampaigns.id, id), eq(smsCampaigns.userId, userId))).limit(1);
    return campaign;
  }

  async createSmsCampaign(data: Partial<SmsCampaign> & { userId: string; name: string }): Promise<SmsCampaign> {
    const [campaign] = await db.insert(smsCampaigns).values(data).returning();
    return campaign;
  }

  async updateSmsCampaign(id: string, userId: string, data: Partial<SmsCampaign>): Promise<SmsCampaign | undefined> {
    const [campaign] = await db.update(smsCampaigns).set({ ...data, updatedAt: new Date() }).where(and(eq(smsCampaigns.id, id), eq(smsCampaigns.userId, userId))).returning();
    return campaign;
  }

  async deleteSmsCampaign(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(smsCampaigns).where(and(eq(smsCampaigns.id, id), eq(smsCampaigns.userId, userId))).returning();
    return result.length > 0;
  }

  // SMS Campaign Steps
  async getSmsCampaignSteps(campaignId: string): Promise<SmsCampaignStep[]> {
    return await db.select().from(smsCampaignSteps).where(eq(smsCampaignSteps.campaignId, campaignId)).orderBy(smsCampaignSteps.stepOrder);
  }

  async getSmsCampaignStep(id: string): Promise<SmsCampaignStep | undefined> {
    const [step] = await db.select().from(smsCampaignSteps).where(eq(smsCampaignSteps.id, id)).limit(1);
    return step;
  }

  async createSmsCampaignStep(data: Partial<SmsCampaignStep> & { campaignId: string; stepOrder: number; messageTemplate: string }): Promise<SmsCampaignStep> {
    const [step] = await db.insert(smsCampaignSteps).values(data).returning();
    return step;
  }

  async updateSmsCampaignStep(id: string, data: Partial<SmsCampaignStep>): Promise<SmsCampaignStep | undefined> {
    const [step] = await db.update(smsCampaignSteps).set(data).where(eq(smsCampaignSteps.id, id)).returning();
    return step;
  }

  async deleteSmsCampaignStep(id: string): Promise<boolean> {
    const result = await db.delete(smsCampaignSteps).where(eq(smsCampaignSteps.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
