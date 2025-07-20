import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  date,
  time,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["observer", "judge", "club", "admin"] }).notNull().default("observer"),
  isApproved: boolean("is_approved").notNull().default(false),
  judgeId: varchar("judge_id"),
  displayName: varchar("display_name"),
  clubName: varchar("club_name"),
  clubUsername: varchar("club_username"),
  location: varchar("location"),
  clubAffiliation: varchar("club_affiliation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  venue: varchar("venue").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  description: text("description"),
  status: varchar("status", { enum: ["upcoming", "live", "completed"] }).notNull().default("upcoming"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eventSessions = pgTable("event_sessions", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  date: date("date").notNull(),
  level: varchar("level").notNull(),
  status: varchar("status", { enum: ["upcoming", "in_progress", "completed"] }).notNull().default("upcoming"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const apparatus = pgTable("apparatus", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  code: varchar("code").notNull().unique(),
  icon: varchar("icon"),
});

export const gymnasts = pgTable("gymnasts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  clubName: varchar("club_name").notNull(),
  level: varchar("level").notNull(),
  dateOfBirth: date("date_of_birth"),
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessionGymnasts = pgTable("session_gymnasts", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => eventSessions.id, { onDelete: "cascade" }),
  gymnastId: integer("gymnast_id").notNull().references(() => gymnasts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scores = pgTable("scores", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => eventSessions.id, { onDelete: "cascade" }),
  gymnastId: integer("gymnast_id").notNull().references(() => gymnasts.id, { onDelete: "cascade" }),
  apparatusId: integer("apparatus_id").notNull().references(() => apparatus.id),
  judgeId: varchar("judge_id").notNull().references(() => users.id),
  difficultyScore: decimal("difficulty_score", { precision: 4, scale: 3 }),
  executionScore: decimal("execution_score", { precision: 4, scale: 3 }),
  finalScore: decimal("final_score", { precision: 4, scale: 3 }).notNull(),
  deductions: decimal("deductions", { precision: 4, scale: 3 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdEvents: many(events),
  scores: many(scores),
  gymnast: many(gymnasts),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
  eventSessions: many(eventSessions),
}));

export const eventSessionsRelations = relations(eventSessions, ({ one, many }) => ({
  event: one(events, {
    fields: [eventSessions.eventId],
    references: [events.id],
  }),
  sessionGymnasts: many(sessionGymnasts),
  scores: many(scores),
}));

export const apparatusRelations = relations(apparatus, ({ many }) => ({
  scores: many(scores),
}));

export const gymnastsRelations = relations(gymnasts, ({ one, many }) => ({
  user: one(users, {
    fields: [gymnasts.userId],
    references: [users.id],
  }),
  sessionGymnasts: many(sessionGymnasts),
  scores: many(scores),
}));

export const sessionGymnastsRelations = relations(sessionGymnasts, ({ one }) => ({
  session: one(eventSessions, {
    fields: [sessionGymnasts.sessionId],
    references: [eventSessions.id],
  }),
  gymnast: one(gymnasts, {
    fields: [sessionGymnasts.gymnastId],
    references: [gymnasts.id],
  }),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
  session: one(eventSessions, {
    fields: [scores.sessionId],
    references: [eventSessions.id],
  }),
  gymnast: one(gymnasts, {
    fields: [scores.gymnastId],
    references: [gymnasts.id],
  }),
  apparatus: one(apparatus, {
    fields: [scores.apparatusId],
    references: [apparatus.id],
  }),
  judge: one(users, {
    fields: [scores.judgeId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSessionSchema = createInsertSchema(eventSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGymnastSchema = createInsertSchema(gymnasts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScoreSchema = createInsertSchema(scores).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEventSession = z.infer<typeof insertEventSessionSchema>;
export type EventSession = typeof eventSessions.$inferSelect;
export type InsertGymnast = z.infer<typeof insertGymnastSchema>;
export type Gymnast = typeof gymnasts.$inferSelect;
export type InsertScore = z.infer<typeof insertScoreSchema>;
export type Score = typeof scores.$inferSelect;
export type Apparatus = typeof apparatus.$inferSelect;
