import {
  users,
  events,
  eventSessions,
  apparatus,
  gymnasts,
  sessionGymnasts,
  scores,
  type User,
  type UpsertUser,
  type Event,
  type InsertEvent,
  type EventSession,
  type InsertEventSession,
  type Gymnast,
  type InsertGymnast,
  type Score,
  type InsertScore,
  type Apparatus,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string, isApproved?: boolean): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Event operations
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEventStatus(id: number, status: string): Promise<Event>;
  
  // Session operations
  getSessionsByEvent(eventId: number): Promise<EventSession[]>;
  getSession(id: number): Promise<EventSession | undefined>;
  createSession(session: InsertEventSession): Promise<EventSession>;
  updateSessionStatus(id: number, status: string): Promise<EventSession>;
  
  // Apparatus operations
  getApparatus(): Promise<Apparatus[]>;
  initializeApparatus(): Promise<void>;
  
  // Gymnast operations
  getGymnasts(): Promise<Gymnast[]>;
  getGymnast(id: number): Promise<Gymnast | undefined>;
  createGymnast(gymnast: InsertGymnast): Promise<Gymnast>;
  approveGymnast(id: number): Promise<Gymnast>;
  getGymnastsBySession(sessionId: number): Promise<Gymnast[]>;
  addGymnastToSession(sessionId: number, gymnastId: number): Promise<void>;
  
  // Score operations
  getScoresBySession(sessionId: number): Promise<Score[]>;
  getScore(sessionId: number, gymnastId: number, apparatusId: number): Promise<Score | undefined>;
  createScore(score: InsertScore): Promise<Score>;
  updateScore(id: number, score: Partial<InsertScore>): Promise<Score>;
  getGymnastScores(gymnastId: number): Promise<Score[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string, isApproved = false): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as any, isApproved, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  // Event operations
  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.startDate));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEventStatus(id: number, status: string): Promise<Event> {
    const [event] = await db
      .update(events)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  // Session operations
  async getSessionsByEvent(eventId: number): Promise<EventSession[]> {
    return await db
      .select()
      .from(eventSessions)
      .where(eq(eventSessions.eventId, eventId))
      .orderBy(asc(eventSessions.date), asc(eventSessions.startTime));
  }

  async getSession(id: number): Promise<EventSession | undefined> {
    const [session] = await db.select().from(eventSessions).where(eq(eventSessions.id, id));
    return session;
  }

  async createSession(session: InsertEventSession): Promise<EventSession> {
    const [newSession] = await db.insert(eventSessions).values(session).returning();
    return newSession;
  }

  async updateSessionStatus(id: number, status: string): Promise<EventSession> {
    const [session] = await db
      .update(eventSessions)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(eventSessions.id, id))
      .returning();
    return session;
  }

  // Apparatus operations
  async getApparatus(): Promise<Apparatus[]> {
    return await db.select().from(apparatus).orderBy(asc(apparatus.id));
  }

  async initializeApparatus(): Promise<void> {
    const defaultApparatus = [
      { name: "Floor Exercise", code: "FX", icon: "fas fa-running" },
      { name: "Pommel Horse", code: "PH", icon: "fas fa-horse-head" },
      { name: "Still Rings", code: "SR", icon: "fas fa-circle" },
      { name: "Vault", code: "VT", icon: "fas fa-horse" },
      { name: "Parallel Bars", code: "PB", icon: "fas fa-grip-horizontal" },
      { name: "High Bar", code: "HB", icon: "fas fa-grip-lines" },
      { name: "Balance Beam", code: "BB", icon: "fas fa-balance-scale" },
      { name: "Uneven Bars", code: "UB", icon: "fas fa-grip-horizontal" },
    ];

    for (const app of defaultApparatus) {
      await db.insert(apparatus).values(app).onConflictDoNothing();
    }
  }

  // Gymnast operations
  async getGymnasts(): Promise<Gymnast[]> {
    return await db.select().from(gymnasts).orderBy(asc(gymnasts.lastName), asc(gymnasts.firstName));
  }

  async getGymnast(id: number): Promise<Gymnast | undefined> {
    const [gymnast] = await db.select().from(gymnasts).where(eq(gymnasts.id, id));
    return gymnast;
  }

  async createGymnast(gymnast: InsertGymnast): Promise<Gymnast> {
    const [newGymnast] = await db.insert(gymnasts).values(gymnast).returning();
    return newGymnast;
  }

  async approveGymnast(id: number): Promise<Gymnast> {
    const [gymnast] = await db
      .update(gymnasts)
      .set({ isApproved: true, updatedAt: new Date() })
      .where(eq(gymnasts.id, id))
      .returning();
    return gymnast;
  }

  async getGymnastsBySession(sessionId: number): Promise<Gymnast[]> {
    return await db
      .select({
        id: gymnasts.id,
        userId: gymnasts.userId,
        firstName: gymnasts.firstName,
        lastName: gymnasts.lastName,
        clubName: gymnasts.clubName,
        level: gymnasts.level,
        dateOfBirth: gymnasts.dateOfBirth,
        isApproved: gymnasts.isApproved,
        createdAt: gymnasts.createdAt,
        updatedAt: gymnasts.updatedAt,
      })
      .from(gymnasts)
      .innerJoin(sessionGymnasts, eq(sessionGymnasts.gymnastId, gymnasts.id))
      .where(eq(sessionGymnasts.sessionId, sessionId))
      .orderBy(asc(gymnasts.lastName), asc(gymnasts.firstName));
  }

  async addGymnastToSession(sessionId: number, gymnastId: number): Promise<void> {
    await db.insert(sessionGymnasts).values({ sessionId, gymnastId });
  }

  // Score operations
  async getScoresBySession(sessionId: number): Promise<Score[]> {
    return await db
      .select()
      .from(scores)
      .where(eq(scores.sessionId, sessionId))
      .orderBy(asc(scores.gymnastId), asc(scores.apparatusId));
  }

  async getScore(sessionId: number, gymnastId: number, apparatusId: number): Promise<Score | undefined> {
    const [score] = await db
      .select()
      .from(scores)
      .where(
        and(
          eq(scores.sessionId, sessionId),
          eq(scores.gymnastId, gymnastId),
          eq(scores.apparatusId, apparatusId)
        )
      );
    return score;
  }

  async createScore(score: InsertScore): Promise<Score> {
    const [newScore] = await db.insert(scores).values(score).returning();
    return newScore;
  }

  async updateScore(id: number, scoreData: Partial<InsertScore>): Promise<Score> {
    const [score] = await db
      .update(scores)
      .set({ ...scoreData, updatedAt: new Date() })
      .where(eq(scores.id, id))
      .returning();
    return score;
  }

  async getGymnastScores(gymnastId: number): Promise<Score[]> {
    return await db
      .select()
      .from(scores)
      .where(eq(scores.gymnastId, gymnastId))
      .orderBy(desc(scores.createdAt));
  }
}

export const storage = new DatabaseStorage();
