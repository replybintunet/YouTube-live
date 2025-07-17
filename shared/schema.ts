import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  plan: text("plan").notNull(), // "5hours", "12hours", "lifetime"
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const streamSessions = pgTable("stream_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  streamKeys: text("stream_keys").array(),
  videoFiles: text("video_files").array(), // JSON array of {key: streamKey, fileName: string, filePath: string}
  isActive: boolean("is_active").default(false),
  loopVideo: boolean("loop_video").default(false),
  mobileMode: boolean("mobile_mode").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertStreamSessionSchema = createInsertSchema(streamSessions).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  accessCode: z.string().min(1, "Access code is required"),
});

export const paymentSchema = z.object({
  plan: z.enum(["5hours", "12hours", "lifetime"]),
  transactionCode: z.string().min(1, "Transaction code is required"),
});

export const streamConfigSchema = z.object({
  streamKeys: z.string().min(1, "At least one stream key is required"),
  loopVideo: z.boolean().default(false),
  mobileMode: z.boolean().default(false),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type StreamSession = typeof streamSessions.$inferSelect;
export type InsertStreamSession = z.infer<typeof insertStreamSessionSchema>;
export type PaymentData = z.infer<typeof paymentSchema>;
export type StreamConfig = z.infer<typeof streamConfigSchema>;
