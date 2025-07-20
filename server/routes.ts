import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import { insertEventSchema, insertEventSessionSchema, insertGymnastSchema, insertScoreSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Initialize apparatus data
  await storage.initializeApparatus();

  // User management routes
  app.get('/api/users/role/:role', requireAuth, async (req: any, res) => {
    try {
      const { role } = req.params;
      const users = await storage.getUsersByRole(role);
      res.json(users);
    } catch (error) {
      console.error("Error fetching users by role:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:id/role', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { role, isApproved } = req.body;
      
      // Check if user has permission to approve/update roles
      const currentUser = req.user;
      if (currentUser.role !== 'admin' && currentUser.role !== 'club') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      const user = await storage.updateUserRole(parseInt(id), role, isApproved);
      res.json(user);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Event routes
  app.get('/api/events', async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const event = await storage.getEvent(parseInt(req.params.id));
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  app.post('/api/events', requireAuth, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser.role !== 'admin' && currentUser.role !== 'club') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const eventData = insertEventSchema.parse({
        ...req.body,
        createdBy: currentUser.id,
      });
      
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid event data", errors: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.patch('/api/events/:id/status', requireAuth, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser.role !== 'admin' && currentUser.role !== 'club') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const { status } = req.body;
      const event = await storage.updateEventStatus(parseInt(req.params.id), status);
      res.json(event);
    } catch (error) {
      console.error("Error updating event status:", error);
      res.status(500).json({ message: "Failed to update event status" });
    }
  });

  // Session routes
  app.get('/api/events/:eventId/sessions', async (req, res) => {
    try {
      const sessions = await storage.getSessionsByEvent(parseInt(req.params.eventId));
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get('/api/sessions/:id', async (req, res) => {
    try {
      const session = await storage.getSession(parseInt(req.params.id));
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.post('/api/sessions', requireAuth, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser.role !== 'admin' && currentUser.role !== 'club') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const sessionData = insertEventSessionSchema.parse(req.body);
      const session = await storage.createSession(sessionData);
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid session data", errors: error.errors });
      }
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  // Apparatus routes
  app.get('/api/apparatus', async (req, res) => {
    try {
      const apparatus = await storage.getApparatus();
      res.json(apparatus);
    } catch (error) {
      console.error("Error fetching apparatus:", error);
      res.status(500).json({ message: "Failed to fetch apparatus" });
    }
  });

  // Gymnast routes
  app.get('/api/gymnasts', requireAuth, async (req, res) => {
    try {
      const gymnasts = await storage.getGymnasts();
      res.json(gymnasts);
    } catch (error) {
      console.error("Error fetching gymnasts:", error);
      res.status(500).json({ message: "Failed to fetch gymnasts" });
    }
  });

  app.get('/api/sessions/:sessionId/gymnasts', async (req, res) => {
    try {
      const gymnasts = await storage.getGymnastsBySession(parseInt(req.params.sessionId));
      res.json(gymnasts);
    } catch (error) {
      console.error("Error fetching session gymnasts:", error);
      res.status(500).json({ message: "Failed to fetch session gymnasts" });
    }
  });

  app.post('/api/gymnasts', requireAuth, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser.role !== 'admin' && currentUser.role !== 'club') {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const gymnastData = insertGymnastSchema.parse({
        ...req.body,
        userId: currentUser.id,
      });
      
      const gymnast = await storage.createGymnast(gymnastData);
      res.status(201).json(gymnast);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid gymnast data", errors: error.errors });
      }
      console.error("Error creating gymnast:", error);
      res.status(500).json({ message: "Failed to create gymnast" });
    }
  });

  // Score routes
  app.get('/api/sessions/:sessionId/scores', async (req, res) => {
    try {
      const scores = await storage.getScoresBySession(parseInt(req.params.sessionId));
      res.json(scores);
    } catch (error) {
      console.error("Error fetching scores:", error);
      res.status(500).json({ message: "Failed to fetch scores" });
    }
  });

  app.post('/api/scores', requireAuth, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser.role !== 'admin' && currentUser.role !== 'judge') {
        return res.status(403).json({ message: "Only judges can enter scores" });
      }

      if (currentUser.role === 'judge' && !currentUser.isApproved) {
        return res.status(403).json({ message: "Judge account not approved" });
      }

      const scoreData = insertScoreSchema.parse({
        ...req.body,
        judgeId: currentUser.id,
      });
      
      const score = await storage.createScore(scoreData);
      res.status(201).json(score);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid score data", errors: error.errors });
      }
      console.error("Error creating score:", error);
      res.status(500).json({ message: "Failed to create score" });
    }
  });

  app.patch('/api/scores/:id', requireAuth, async (req: any, res) => {
    try {
      const currentUser = req.user;
      if (currentUser.role !== 'admin' && currentUser.role !== 'judge') {
        return res.status(403).json({ message: "Only judges can update scores" });
      }

      if (currentUser.role === 'judge' && !currentUser.isApproved) {
        return res.status(403).json({ message: "Judge account not approved" });
      }

      const score = await storage.updateScore(parseInt(req.params.id), req.body);
      res.json(score);
    } catch (error) {
      console.error("Error updating score:", error);
      res.status(500).json({ message: "Failed to update score" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}