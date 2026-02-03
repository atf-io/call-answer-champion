import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb, uuid, varchar } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  email: text("email"),
  fullName: text("full_name"),
  companyName: text("company_name"),
  avatarUrl: text("avatar_url"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  businessName: text("business_name"),
  businessDescription: text("business_description"),
  businessAddress: text("business_address"),
  businessPhone: text("business_phone"),
  businessWebsite: text("business_website"),
  businessLogoUrl: text("business_logo_url"),
  businessColors: jsonb("business_colors"),
  businessServices: text("business_services").array(),
  businessTeamInfo: text("business_team_info"),
  businessFaqs: jsonb("business_faqs"),
  businessSocialLinks: jsonb("business_social_links"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const aiAgents = pgTable("ai_agents", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  retellAgentId: text("retell_agent_id"),
  voiceType: text("voice_type").default("Professional Female"),
  personality: text("personality").default("friendly and professional"),
  greetingMessage: text("greeting_message").default("Hello! How can I help you today?"),
  scheduleStart: text("schedule_start").default("18:00"),
  scheduleEnd: text("schedule_end").default("08:00"),
  scheduleDays: text("schedule_days").array().default(sql`ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']`),
  isActive: boolean("is_active").default(false),
  totalCalls: integer("total_calls").default(0),
  avgDurationSeconds: integer("avg_duration_seconds").default(0),
  satisfactionScore: numeric("satisfaction_score", { precision: 3, scale: 2 }).default("0"),
  voiceId: text("voice_id"),
  voiceModel: text("voice_model").default("eleven_turbo_v2"),
  voiceTemperature: numeric("voice_temperature").default("1"),
  voiceSpeed: numeric("voice_speed").default("1"),
  volume: numeric("volume").default("1"),
  responsiveness: numeric("responsiveness").default("1"),
  interruptionSensitivity: numeric("interruption_sensitivity").default("1"),
  enableBackchannel: boolean("enable_backchannel").default(true),
  backchannelFrequency: numeric("backchannel_frequency").default("0.9"),
  ambientSound: text("ambient_sound"),
  ambientSoundVolume: numeric("ambient_sound_volume").default("1"),
  language: text("language").default("en-US"),
  enableVoicemailDetection: boolean("enable_voicemail_detection").default(true),
  voicemailMessage: text("voicemail_message"),
  voicemailDetectionTimeoutMs: integer("voicemail_detection_timeout_ms").default(30000),
  maxCallDurationMs: integer("max_call_duration_ms").default(3600000),
  endCallAfterSilenceMs: integer("end_call_after_silence_ms").default(600000),
  beginMessageDelayMs: integer("begin_message_delay_ms").default(1000),
  normalizeForSpeech: boolean("normalize_for_speech").default(true),
  boostedKeywords: text("boosted_keywords").array(),
  reminderTriggerMs: integer("reminder_trigger_ms").default(10000),
  reminderMaxCount: integer("reminder_max_count").default(2),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const googleIntegrations = pgTable("google_integrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  businessName: text("business_name").notNull(),
  googlePlaceId: text("google_place_id"),
  isConnected: boolean("is_connected").default(false),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  googleIntegrationId: uuid("google_integration_id").references(() => googleIntegrations.id, { onDelete: "cascade" }),
  googleReviewId: text("google_review_id"),
  authorName: text("author_name").notNull(),
  authorPhotoUrl: text("author_photo_url"),
  rating: integer("rating").notNull(),
  reviewText: text("review_text"),
  reviewDate: timestamp("review_date").defaultNow().notNull(),
  responseText: text("response_text"),
  responseDate: timestamp("response_date"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const callLogs = pgTable("call_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  agentId: uuid("agent_id").references(() => aiAgents.id, { onDelete: "set null" }),
  callerNumber: text("caller_number"),
  durationSeconds: integer("duration_seconds").default(0),
  status: text("status").default("completed"),
  transcript: text("transcript"),
  sentiment: text("sentiment"),
  retellCallId: text("retell_call_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  retellApiKeyConfigured: boolean("retell_api_key_configured").default(false),
  googleApiConfigured: boolean("google_api_configured").default(false),
  notificationEmail: boolean("notification_email").default(true),
  notificationSms: boolean("notification_sms").default(false),
  autoRespondReviews: boolean("auto_respond_reviews").default(false),
  reviewResponseTone: text("review_response_tone").default("professional"),
  timezone: text("timezone").default("America/New_York"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const knowledgeBaseEntries = pgTable("knowledge_base_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  agentId: uuid("agent_id").references(() => aiAgents.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sourceType: text("source_type").notNull(),
  sourceUrl: text("source_url"),
  content: text("content").notNull(),
  summary: text("summary"),
  metadata: jsonb("metadata").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const phoneNumbers = pgTable("phone_numbers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  retellPhoneNumberId: text("retell_phone_number_id").unique(),
  phoneNumber: text("phone_number").notNull(),
  nickname: text("nickname"),
  areaCode: text("area_code"),
  inboundAgentId: uuid("inbound_agent_id").references(() => aiAgents.id, { onDelete: "set null" }),
  outboundAgentId: uuid("outbound_agent_id").references(() => aiAgents.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  sid: varchar("sid", { length: 255 }).primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type AiAgent = typeof aiAgents.$inferSelect;
export type GoogleIntegration = typeof googleIntegrations.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type CallLog = typeof callLogs.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type KnowledgeBaseEntry = typeof knowledgeBaseEntries.$inferSelect;
export type PhoneNumber = typeof phoneNumbers.$inferSelect;

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAgentSchema = createInsertSchema(aiAgents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertReviewSchema = createInsertSchema(reviews).omit({ id: true, createdAt: true, updatedAt: true });
export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBaseEntries).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPhoneNumberSchema = createInsertSchema(phoneNumbers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSettingsSchema = createInsertSchema(userSettings).omit({ id: true, createdAt: true, updatedAt: true });

export const updateProfileSchema = insertProfileSchema.partial().omit({ userId: true });
export const updateAgentSchema = insertAgentSchema.partial().omit({ userId: true });
export const updateReviewSchema = insertReviewSchema.partial().omit({ userId: true });
export const updateKnowledgeBaseSchema = insertKnowledgeBaseSchema.partial().omit({ userId: true });
export const updatePhoneNumberSchema = insertPhoneNumberSchema.partial().omit({ userId: true });
export const updateSettingsSchema = insertSettingsSchema.partial().omit({ userId: true });
