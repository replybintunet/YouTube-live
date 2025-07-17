import { 
  users, 
  sessions, 
  streamSessions,
  type User, 
  type InsertUser,
  type Session,
  type InsertSession,
  type StreamSession,
  type InsertStreamSession
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createSession(session: InsertSession): Promise<Session>;
  getSession(sessionId: string): Promise<Session | undefined>;
  deleteSession(sessionId: string): Promise<void>;
  
  createStreamSession(streamSession: InsertStreamSession): Promise<StreamSession>;
  getStreamSession(sessionId: string): Promise<StreamSession | undefined>;
  updateStreamSession(sessionId: string, updates: Partial<StreamSession>): Promise<StreamSession | undefined>;
  deleteStreamSession(sessionId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.sessionId, sessionId));
    return session || undefined;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.sessionId, sessionId));
  }

  async createStreamSession(insertStreamSession: InsertStreamSession): Promise<StreamSession> {
    const [streamSession] = await db
      .insert(streamSessions)
      .values(insertStreamSession)
      .returning();
    return streamSession;
  }

  async getStreamSession(sessionId: string): Promise<StreamSession | undefined> {
    const [streamSession] = await db.select().from(streamSessions).where(eq(streamSessions.sessionId, sessionId));
    return streamSession || undefined;
  }

  async updateStreamSession(sessionId: string, updates: Partial<StreamSession>): Promise<StreamSession | undefined> {
    const [updated] = await db
      .update(streamSessions)
      .set(updates)
      .where(eq(streamSessions.sessionId, sessionId))
      .returning();
    return updated || undefined;
  }

  async deleteStreamSession(sessionId: string): Promise<void> {
    await db.delete(streamSessions).where(eq(streamSessions.sessionId, sessionId));
  }
}

export const storage = new DatabaseStorage();
