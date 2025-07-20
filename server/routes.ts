import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertEventSchema, insertEventSessionSchema, insertGymnastSchema, insertScoreSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize apparatus data
  await storage.initializeApparatus();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User registration and management
  app.post('/api/users/register', isAuthenticated, async (req: any, res) => {
    try {
      const userData = req.body;
      
      // Get user ID from authenticated session
      userData.id = req.user.claims.sub;
      userData.email = req.user.claims.email;
      userData.firstName = req.user.claims.first_name;
      userData.lastName = req.user.claims.last_name;
      userData.profileImageUrl = req.user.claims.profile_image_url;
      
      // Set approval status based on role
      userData.isApproved = userData.role === 'observer';
      
      const user = await storage.upsertUser(userData);
      res.json(user);
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.get('/api/users/pending', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'club') {
        return res.status(403).json({ message: "Access denied" });
      }

      const pendingJudges = await storage.getUsersByRole('judge');
      const pendingGymnasts = await storage.getGymnasts();
      
      res.json({
        judges: pendingJudges.filter(u => !u.isApproved),
        gymnasts: pendingGymnasts.filter(g => !g.isApproved)
      });
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  app.post('/api/users/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'club') {
        return res.status(403).json({ message: "Access denied" });
      }

      const user = await storage.updateUserRole(req.params.id, req.body.role, true);
      res.json(user);
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  // Event routes
  app.get('/api/events', isAuthenticated, async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get('/api/events/:id', isAuthenticated, async (req, res) => {
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

  app.post('/api/events', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'club' && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only clubs can create events" });
      }

      const eventData = insertEventSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub
      });
      
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  // Session routes
  app.get('/api/events/:eventId/sessions', isAuthenticated, async (req, res) => {
    try {
      const sessions = await storage.getSessionsByEvent(parseInt(req.params.eventId));
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.post('/api/events/:eventId/sessions', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'club' && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only clubs can create sessions" });
      }

      const sessionData = insertEventSessionSchema.parse({
        ...req.body,
        eventId: parseInt(req.params.eventId)
      });
      
      const session = await storage.createSession(sessionData);
      res.json(session);
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  // Apparatus routes
  app.get('/api/apparatus', isAuthenticated, async (req, res) => {
    try {
      const apparatus = await storage.getApparatus();
      res.json(apparatus);
    } catch (error) {
      console.error("Error fetching apparatus:", error);
      res.status(500).json({ message: "Failed to fetch apparatus" });
    }
  });

  // Gymnast routes
  app.get('/api/gymnasts', isAuthenticated, async (req, res) => {
    try {
      const gymnasts = await storage.getGymnasts();
      res.json(gymnasts);
    } catch (error) {
      console.error("Error fetching gymnasts:", error);
      res.status(500).json({ message: "Failed to fetch gymnasts" });
    }
  });

  app.post('/api/gymnasts', isAuthenticated, async (req: any, res) => {
    try {
      const gymnastData = insertGymnastSchema.parse({
        ...req.body,
        userId: req.user.claims.sub
      });
      
      const gymnast = await storage.createGymnast(gymnastData);
      res.json(gymnast);
    } catch (error) {
      console.error("Error creating gymnast:", error);
      res.status(500).json({ message: "Failed to create gymnast" });
    }
  });

  app.get('/api/sessions/:sessionId/gymnasts', isAuthenticated, async (req, res) => {
    try {
      const gymnasts = await storage.getGymnastsBySession(parseInt(req.params.sessionId));
      res.json(gymnasts);
    } catch (error) {
      console.error("Error fetching session gymnasts:", error);
      res.status(500).json({ message: "Failed to fetch session gymnasts" });
    }
  });

  app.post('/api/sessions/:sessionId/gymnasts/:gymnastId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'club' && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only clubs can add gymnasts to sessions" });
      }

      await storage.addGymnastToSession(
        parseInt(req.params.sessionId),
        parseInt(req.params.gymnastId)
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding gymnast to session:", error);
      res.status(500).json({ message: "Failed to add gymnast to session" });
    }
  });

  // Score routes
  app.get('/api/sessions/:sessionId/scores', isAuthenticated, async (req, res) => {
    try {
      const scores = await storage.getScoresBySession(parseInt(req.params.sessionId));
      res.json(scores);
    } catch (error) {
      console.error("Error fetching scores:", error);
      res.status(500).json({ message: "Failed to fetch scores" });
    }
  });

  app.post('/api/scores', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'judge' && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only judges can enter scores" });
      }

      if (!currentUser.isApproved) {
        return res.status(403).json({ message: "Account not approved" });
      }

      const scoreData = insertScoreSchema.parse({
        ...req.body,
        judgeId: req.user.claims.sub
      });
      
      const score = await storage.createScore(scoreData);
      res.json(score);
    } catch (error) {
      console.error("Error creating score:", error);
      res.status(500).json({ message: "Failed to create score" });
    }
  });

  app.put('/api/scores/:id', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'judge' && currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Only judges can edit scores" });
      }

      if (!currentUser.isApproved) {
        return res.status(403).json({ message: "Account not approved" });
      }

      const scoreData = z.object({
        difficultyScore: z.string().optional(),
        executionScore: z.string().optional(),
        finalScore: z.string(),
        deductions: z.string().optional(),
        notes: z.string().optional(),
      }).parse(req.body);
      
      const score = await storage.updateScore(parseInt(req.params.id), scoreData);
      res.json(score);
    } catch (error) {
      console.error("Error updating score:", error);
      res.status(500).json({ message: "Failed to update score" });
    }
  });

  app.get('/api/gymnasts/:gymnastId/scores', isAuthenticated, async (req, res) => {
    try {
      const scores = await storage.getGymnastScores(parseInt(req.params.gymnastId));
      res.json(scores);
    } catch (error) {
      console.error("Error fetching gymnast scores:", error);
      res.status(500).json({ message: "Failed to fetch gymnast scores" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
