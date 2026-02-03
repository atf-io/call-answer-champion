import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users, profiles, aiAgents, callLogs, knowledgeBaseEntries,
  phoneNumbers, reviews, userSettings, googleIntegrations,
  type User, type Profile, type AiAgent, type CallLog, 
  type KnowledgeBaseEntry, type PhoneNumber, type Review, 
  type UserSettings, type GoogleIntegration
} from "../shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: { username: string; password: string; email?: string; fullName?: string }): Promise<User>;
  
  // Profiles
  getProfile(userId: number): Promise<Profile | undefined>;
  createProfile(data: Partial<Profile> & { userId: number }): Promise<Profile>;
  updateProfile(userId: number, data: Partial<Profile>): Promise<Profile | undefined>;
  
  // AI Agents
  getAgents(userId: number): Promise<AiAgent[]>;
  getAgent(id: string, userId: number): Promise<AiAgent | undefined>;
  getAgentByRetellId(retellAgentId: string, userId: number): Promise<AiAgent | undefined>;
  createAgent(data: Partial<AiAgent> & { userId: number; name: string }): Promise<AiAgent>;
  updateAgent(id: string, userId: number, data: Partial<AiAgent>): Promise<AiAgent | undefined>;
  deleteAgent(id: string, userId: number): Promise<boolean>;
  
  // Call Logs
  getCallLogs(userId: number, limit?: number): Promise<CallLog[]>;
  getCallLog(id: string, userId: number): Promise<CallLog | undefined>;
  createCallLog(data: Partial<CallLog> & { userId: number }): Promise<CallLog>;
  getExistingRetellCallIds(userId: number): Promise<string[]>;
  
  // Knowledge Base
  getKnowledgeBaseEntries(userId: number, agentId?: string): Promise<KnowledgeBaseEntry[]>;
  getKnowledgeBaseEntry(id: string, userId: number): Promise<KnowledgeBaseEntry | undefined>;
  createKnowledgeBaseEntry(data: Partial<KnowledgeBaseEntry> & { userId: number; title: string; sourceType: string; content: string }): Promise<KnowledgeBaseEntry>;
  updateKnowledgeBaseEntry(id: string, userId: number, data: Partial<KnowledgeBaseEntry>): Promise<KnowledgeBaseEntry | undefined>;
  deleteKnowledgeBaseEntry(id: string, userId: number): Promise<boolean>;
  
  // Phone Numbers
  getPhoneNumbers(userId: number): Promise<PhoneNumber[]>;
  getPhoneNumber(id: string, userId: number): Promise<PhoneNumber | undefined>;
  getPhoneNumberByRetellId(retellPhoneNumberId: string, userId: number): Promise<PhoneNumber | undefined>;
  createPhoneNumber(data: Partial<PhoneNumber> & { userId: number; phoneNumber: string }): Promise<PhoneNumber>;
  updatePhoneNumber(id: string, userId: number, data: Partial<PhoneNumber>): Promise<PhoneNumber | undefined>;
  deletePhoneNumber(id: string, userId: number): Promise<boolean>;
  
  // Reviews
  getReviews(userId: number): Promise<Review[]>;
  getReview(id: string, userId: number): Promise<Review | undefined>;
  createReview(data: Partial<Review> & { userId: number; authorName: string; rating: number }): Promise<Review>;
  updateReview(id: string, userId: number, data: Partial<Review>): Promise<Review | undefined>;
  deleteReview(id: string, userId: number): Promise<boolean>;
  
  // User Settings
  getSettings(userId: number): Promise<UserSettings | undefined>;
  createSettings(data: Partial<UserSettings> & { userId: number }): Promise<UserSettings>;
  updateSettings(userId: number, data: Partial<UserSettings>): Promise<UserSettings | undefined>;
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
  async getProfile(userId: number): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    return profile;
  }

  async createProfile(data: Partial<Profile> & { userId: number }): Promise<Profile> {
    const [profile] = await db.insert(profiles).values(data).returning();
    return profile;
  }

  async updateProfile(userId: number, data: Partial<Profile>): Promise<Profile | undefined> {
    const [profile] = await db.update(profiles).set({ ...data, updatedAt: new Date() }).where(eq(profiles.userId, userId)).returning();
    return profile;
  }

  // AI Agents
  async getAgents(userId: number): Promise<AiAgent[]> {
    return await db.select().from(aiAgents).where(eq(aiAgents.userId, userId)).orderBy(desc(aiAgents.createdAt));
  }

  async getAgent(id: string, userId: number): Promise<AiAgent | undefined> {
    const [agent] = await db.select().from(aiAgents).where(and(eq(aiAgents.id, id), eq(aiAgents.userId, userId))).limit(1);
    return agent;
  }

  async getAgentByRetellId(retellAgentId: string, userId: number): Promise<AiAgent | undefined> {
    const [agent] = await db.select().from(aiAgents).where(and(eq(aiAgents.retellAgentId, retellAgentId), eq(aiAgents.userId, userId))).limit(1);
    return agent;
  }

  async createAgent(data: Partial<AiAgent> & { userId: number; name: string }): Promise<AiAgent> {
    const [agent] = await db.insert(aiAgents).values(data).returning();
    return agent;
  }

  async updateAgent(id: string, userId: number, data: Partial<AiAgent>): Promise<AiAgent | undefined> {
    const [agent] = await db.update(aiAgents).set({ ...data, updatedAt: new Date() }).where(and(eq(aiAgents.id, id), eq(aiAgents.userId, userId))).returning();
    return agent;
  }

  async deleteAgent(id: string, userId: number): Promise<boolean> {
    const result = await db.delete(aiAgents).where(and(eq(aiAgents.id, id), eq(aiAgents.userId, userId))).returning();
    return result.length > 0;
  }

  // Call Logs
  async getCallLogs(userId: number, limit: number = 100): Promise<CallLog[]> {
    return await db.select().from(callLogs).where(eq(callLogs.userId, userId)).orderBy(desc(callLogs.createdAt)).limit(limit);
  }

  async getCallLog(id: string, userId: number): Promise<CallLog | undefined> {
    const [log] = await db.select().from(callLogs).where(and(eq(callLogs.id, id), eq(callLogs.userId, userId))).limit(1);
    return log;
  }

  async createCallLog(data: Partial<CallLog> & { userId: number }): Promise<CallLog> {
    const [log] = await db.insert(callLogs).values(data).returning();
    return log;
  }

  async getExistingRetellCallIds(userId: number): Promise<string[]> {
    const logs = await db.select({ retellCallId: callLogs.retellCallId }).from(callLogs).where(eq(callLogs.userId, userId));
    return logs.map(l => l.retellCallId).filter((id): id is string => id !== null);
  }

  // Knowledge Base
  async getKnowledgeBaseEntries(userId: number, agentId?: string): Promise<KnowledgeBaseEntry[]> {
    if (agentId) {
      return await db.select().from(knowledgeBaseEntries).where(and(eq(knowledgeBaseEntries.userId, userId), eq(knowledgeBaseEntries.agentId, agentId))).orderBy(desc(knowledgeBaseEntries.createdAt));
    }
    return await db.select().from(knowledgeBaseEntries).where(eq(knowledgeBaseEntries.userId, userId)).orderBy(desc(knowledgeBaseEntries.createdAt));
  }

  async getKnowledgeBaseEntry(id: string, userId: number): Promise<KnowledgeBaseEntry | undefined> {
    const [entry] = await db.select().from(knowledgeBaseEntries).where(and(eq(knowledgeBaseEntries.id, id), eq(knowledgeBaseEntries.userId, userId))).limit(1);
    return entry;
  }

  async createKnowledgeBaseEntry(data: Partial<KnowledgeBaseEntry> & { userId: number; title: string; sourceType: string; content: string }): Promise<KnowledgeBaseEntry> {
    const [entry] = await db.insert(knowledgeBaseEntries).values(data).returning();
    return entry;
  }

  async updateKnowledgeBaseEntry(id: string, userId: number, data: Partial<KnowledgeBaseEntry>): Promise<KnowledgeBaseEntry | undefined> {
    const [entry] = await db.update(knowledgeBaseEntries).set({ ...data, updatedAt: new Date() }).where(and(eq(knowledgeBaseEntries.id, id), eq(knowledgeBaseEntries.userId, userId))).returning();
    return entry;
  }

  async deleteKnowledgeBaseEntry(id: string, userId: number): Promise<boolean> {
    const result = await db.delete(knowledgeBaseEntries).where(and(eq(knowledgeBaseEntries.id, id), eq(knowledgeBaseEntries.userId, userId))).returning();
    return result.length > 0;
  }

  // Phone Numbers
  async getPhoneNumbers(userId: number): Promise<PhoneNumber[]> {
    return await db.select().from(phoneNumbers).where(eq(phoneNumbers.userId, userId)).orderBy(desc(phoneNumbers.createdAt));
  }

  async getPhoneNumber(id: string, userId: number): Promise<PhoneNumber | undefined> {
    const [phone] = await db.select().from(phoneNumbers).where(and(eq(phoneNumbers.id, id), eq(phoneNumbers.userId, userId))).limit(1);
    return phone;
  }

  async getPhoneNumberByRetellId(retellPhoneNumberId: string, userId: number): Promise<PhoneNumber | undefined> {
    const [phone] = await db.select().from(phoneNumbers).where(and(eq(phoneNumbers.retellPhoneNumberId, retellPhoneNumberId), eq(phoneNumbers.userId, userId))).limit(1);
    return phone;
  }

  async createPhoneNumber(data: Partial<PhoneNumber> & { userId: number; phoneNumber: string }): Promise<PhoneNumber> {
    const [phone] = await db.insert(phoneNumbers).values(data).returning();
    return phone;
  }

  async updatePhoneNumber(id: string, userId: number, data: Partial<PhoneNumber>): Promise<PhoneNumber | undefined> {
    const [phone] = await db.update(phoneNumbers).set({ ...data, updatedAt: new Date() }).where(and(eq(phoneNumbers.id, id), eq(phoneNumbers.userId, userId))).returning();
    return phone;
  }

  async deletePhoneNumber(id: string, userId: number): Promise<boolean> {
    const result = await db.delete(phoneNumbers).where(and(eq(phoneNumbers.id, id), eq(phoneNumbers.userId, userId))).returning();
    return result.length > 0;
  }

  // Reviews
  async getReviews(userId: number): Promise<Review[]> {
    return await db.select().from(reviews).where(eq(reviews.userId, userId)).orderBy(desc(reviews.reviewDate));
  }

  async getReview(id: string, userId: number): Promise<Review | undefined> {
    const [review] = await db.select().from(reviews).where(and(eq(reviews.id, id), eq(reviews.userId, userId))).limit(1);
    return review;
  }

  async createReview(data: Partial<Review> & { userId: number; authorName: string; rating: number }): Promise<Review> {
    const [review] = await db.insert(reviews).values(data).returning();
    return review;
  }

  async updateReview(id: string, userId: number, data: Partial<Review>): Promise<Review | undefined> {
    const [review] = await db.update(reviews).set({ ...data, updatedAt: new Date() }).where(and(eq(reviews.id, id), eq(reviews.userId, userId))).returning();
    return review;
  }

  async deleteReview(id: string, userId: number): Promise<boolean> {
    const result = await db.delete(reviews).where(and(eq(reviews.id, id), eq(reviews.userId, userId))).returning();
    return result.length > 0;
  }

  // User Settings
  async getSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
    return settings;
  }

  async createSettings(data: Partial<UserSettings> & { userId: number }): Promise<UserSettings> {
    const [settings] = await db.insert(userSettings).values(data).returning();
    return settings;
  }

  async updateSettings(userId: number, data: Partial<UserSettings>): Promise<UserSettings | undefined> {
    const [settings] = await db.update(userSettings).set({ ...data, updatedAt: new Date() }).where(eq(userSettings.userId, userId)).returning();
    return settings;
  }
}

export const storage = new DatabaseStorage();
