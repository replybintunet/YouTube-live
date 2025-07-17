import {
  type User,
  type InsertUser,
  type Session,
  type InsertSession,
  type StreamSession,
  type InsertStreamSession
} from "@shared/schema";
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

export class InMemoryStorage implements IStorage {
  private users = new Map<number, User>();
  private usersByUsername = new Map<string, User>();
  private sessions = new Map<string, Session>();
  private streamSessions = new Map<string, StreamSession>();

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.usersByUsername.get(username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = Date.now();
    const user: User = { id, ...insertUser };
    this.users.set(id, user);
    this.usersByUsername.set(user.username, user);
    return user;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const session: Session = { ...insertSession };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<Session | undefined> {
    return this.sessions.get(sessionId);
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  async createStreamSession(insertStreamSession: InsertStreamSession): Promise<StreamSession> {
    const streamSession: StreamSession = { ...insertStreamSession };
    this.streamSessions.set(streamSession.sessionId, streamSession);
    return streamSession;
  }

  async getStreamSession(sessionId: string): Promise<StreamSession | undefined> {
    return this.streamSessions.get(sessionId);
  }

  async updateStreamSession(sessionId: string, updates: Partial<StreamSession>): Promise<StreamSession | undefined> {
    const current = this.streamSessions.get(sessionId);
    if (!current) return undefined;
    const updated = { ...current, ...updates };
    this.streamSessions.set(sessionId, updated);
    return updated;
  }

  async deleteStreamSession(sessionId: string): Promise<void> {
    this.streamSessions.delete(sessionId);
  }
}

export const storage = new InMemoryStorage();