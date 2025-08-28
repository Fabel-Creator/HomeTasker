import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, type LocalAdminData } from "./storage";
import { setupAuth, isAuthenticated, isLocalAdmin, isGuest } from "./auth";
import { 
  insertHouseholdSchema, 
  insertTaskSchema, 
  insertTimeLogSchema,
  insertTaskTemplateSchema,
  insertShoppingListSchema,
  insertShoppingItemSchema,
  updateUserTargetSchema,
  joinAsGuestSchema,
  localAdminRegisterSchema,
  localAdminLoginSchema
} from "@shared/schema";
import bcrypt from 'bcryptjs';
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      // Check for guest user session first
      if (req.session.guestUserId) {
        const user = await storage.getUser(req.session.guestUserId);
        if (user) {
          return res.json(user);
        }
      }
      
      // Check for local admin session
      if (req.session.localAdminId) {
        const user = await storage.getUser(req.session.localAdminId);
        if (user) {
          return res.json(user);
        }
      }
      
      return res.status(401).json({ message: "Unauthorized" });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Local admin authentication
  app.post('/api/auth/local/register', async (req: any, res) => {
    try {
      const data = localAdminRegisterSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ message: "Benutzername bereits vergeben" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 12);
      
      // Create user
      const user = await storage.createLocalAdmin({
        username: data.username,
        hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        isLocalAdmin: true,
        role: "admin",
      });
      
      // Set session
      req.session.localAdminId = user.id;
      req.session.save();
      
      res.json({ message: "Admin erfolgreich erstellt", user });
    } catch (error) {
      console.error("Error creating local admin:", error);
      res.status(400).json({ message: "Registrierung fehlgeschlagen" });
    }
  });

  app.post('/api/auth/local/login', async (req: any, res) => {
    try {
      const data = localAdminLoginSchema.parse(req.body);
      
      // Find user by username
      const user = await storage.getUserByUsername(data.username);
      if (!user || !user.hashedPassword || !user.isLocalAdmin) {
        return res.status(401).json({ message: "Ungültige Anmeldedaten" });
      }
      
      // Check password
      const isValid = await bcrypt.compare(data.password, user.hashedPassword);
      if (!isValid) {
        return res.status(401).json({ message: "Ungültige Anmeldedaten" });
      }
      
      // Set session
      req.session.localAdminId = user.id;
      req.session.save();
      
      res.json({ message: "Erfolgreich angemeldet", user });
    } catch (error) {
      console.error("Error with local login:", error);
      res.status(400).json({ message: "Anmeldung fehlgeschlagen" });
    }
  });

  app.post('/api/auth/local/logout', async (req: any, res) => {
    if (req.session.localAdminId) {
      req.session.localAdminId = null;
      req.session.save();
    }
    res.json({ message: "Abgemeldet" });
  });

  // Helper function to get user ID from session
  function getUserId(req: any): string {
    if (req.session.localAdminId) {
      return req.session.localAdminId;
    }
    if (req.session.guestUserId) {
      return req.session.guestUserId;
    }
    throw new Error('No user ID found');
  }

  // Household routes
  app.post('/api/households', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const householdData = insertHouseholdSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      
      const household = await storage.createHousehold(householdData);
      res.json(household);
    } catch (error) {
      console.error("Error creating household:", error);
      res.status(400).json({ message: "Failed to create household" });
    }
  });

  app.post('/api/households/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { inviteCode } = req.body;
      
      const household = await storage.getHouseholdByInviteCode(inviteCode);
      if (!household) {
        return res.status(404).json({ message: "Haushalt nicht gefunden" });
      }
      
      const user = await storage.joinHousehold(userId, household.id);
      res.json({ user, household });
    } catch (error) {
      console.error("Error joining household:", error);
      res.status(400).json({ message: "Failed to join household" });
    }
  });

  // Guest join route (no authentication required)
  app.post('/api/households/join-guest', async (req: any, res) => {
    try {
      const data = joinAsGuestSchema.parse(req.body);
      const user = await storage.joinHouseholdAsGuest(data);
      
      // Set a simple session for guest user
      req.session.guestUserId = user.id;
      
      // Check if this user was found (not created) by seeing if it was returned from existing user search
      const existingUsers = await storage.getHouseholdMembers(user.householdId!);
      const matchingUsers = existingUsers.filter((u: any) => 
        u.displayName === user.displayName && u.isGuest && u.id !== user.id
      );
      const isExisting = matchingUsers.length > 0;
      
      res.json({ 
        user, 
        message: isExisting ? "Willkommen zurück!" : "Erfolgreich beigetreten!" 
      });
    } catch (error) {
      console.error("Error joining household as guest:", error);
      res.status(400).json({ message: "Fehler beim Beitreten des Haushalts" });
    }
  });

  // Helper function to get user ID from authenticated or guest user

  app.get('/api/households/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const household = await storage.getHousehold(id);
      if (!household) {
        return res.status(404).json({ message: "Haushalt nicht gefunden" });
      }
      res.json(household);
    } catch (error) {
      console.error("Error fetching household:", error);
      res.status(500).json({ message: "Failed to fetch household" });
    }
  });

  app.get('/api/households/:id/members', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const members = await storage.getHouseholdMembers(id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching household members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.delete('/api/households/members/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const adminId = req.user.claims.sub;
      
      await storage.removeHouseholdMember(userId, adminId);
      res.json({ success: true, message: "Mitglied erfolgreich entfernt" });
    } catch (error) {
      console.error("Error removing household member:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Mitglied konnte nicht entfernt werden" });
    }
  });

  app.put('/api/users/daily-target', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const adminUser = await storage.getUser(adminId);
      
      if (adminUser?.role !== 'admin') {
        return res.status(403).json({ message: "Nur Admins können Ziele setzen" });
      }
      
      const data = updateUserTargetSchema.parse(req.body);
      const user = await storage.updateUserDailyTarget(data);
      res.json(user);
    } catch (error) {
      console.error("Error updating daily target:", error);
      res.status(400).json({ message: "Failed to update daily target" });
    }
  });

  // Task routes
  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user?.householdId) {
        return res.status(400).json({ message: "Sie müssen einem Haushalt beitreten" });
      }

      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Nur Admins können Aufgaben erstellen" });
      }
      
      const taskData = insertTaskSchema.parse({
        ...req.body,
        householdId: user.householdId,
        assignedBy: userId,
      });
      
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: "Failed to create task" });
    }
  });

  app.get('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user?.householdId) {
        return res.status(400).json({ message: "Sie müssen einem Haushalt beitreten" });
      }
      
      const tasks = await storage.getTasksByHousehold(user.householdId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/tasks/assigned', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const tasks = await storage.getTasksByUser(userId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching assigned tasks:", error);
      res.status(500).json({ message: "Failed to fetch assigned tasks" });
    }
  });

  app.put('/api/tasks/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = getUserId(req);
      
      const task = await storage.updateTaskStatus(id, status, userId);
      res.json(task);
    } catch (error) {
      console.error("Error updating task status:", error);
      res.status(400).json({ message: "Failed to update task status" });
    }
  });

  app.put('/api/tasks/:id/complete', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { actualMinutes } = req.body;
      const userId = getUserId(req);
      
      const task = await storage.completeTask(id, actualMinutes);
      res.json(task);
    } catch (error) {
      console.error("Error completing task:", error);
      res.status(400).json({ message: "Failed to complete task" });
    }
  });

  // Time log routes
  app.post('/api/time-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user?.householdId) {
        return res.status(400).json({ message: "Sie müssen einem Haushalt beitreten" });
      }
      
      // Admins get their time automatically approved
      const status = user.role === 'admin' ? 'approved' : 'pending_approval';
      const reviewedBy = user.role === 'admin' ? userId : undefined;
      const reviewedAt = user.role === 'admin' ? new Date() : undefined;
      
      const timeLogData = insertTimeLogSchema.parse({
        ...req.body,
        userId,
        householdId: user.householdId,
        status,
        reviewedBy,
        reviewedAt,
      });
      
      const timeLog = await storage.createTimeLog(timeLogData);
      res.json(timeLog);
    } catch (error) {
      console.error("Error creating time log:", error);
      res.status(400).json({ message: "Failed to create time log" });
    }
  });

  app.get('/api/time-logs/my', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const timeLogs = await storage.getTimeLogsByUser(userId, start, end);
      res.json(timeLogs);
    } catch (error) {
      console.error("Error fetching time logs:", error);
      res.status(500).json({ message: "Failed to fetch time logs" });
    }
  });

  app.get('/api/time-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user?.householdId || user.role !== 'admin') {
        return res.status(403).json({ message: "Nur Admins können alle Zeitlogs sehen" });
      }
      
      const timeLogs = await storage.getTimeLogsByHousehold(user.householdId);
      res.json(timeLogs);
    } catch (error) {
      console.error("Error fetching household time logs:", error);
      res.status(500).json({ message: "Failed to fetch time logs" });
    }
  });

  app.put('/api/time-logs/:id/review', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Nur Admins können Zeitlogs bewerten" });
      }
      
      const timeLog = await storage.reviewTimeLog(id, status, userId);
      res.json(timeLog);
    } catch (error) {
      console.error("Error reviewing time log:", error);
      res.status(400).json({ message: "Failed to review time log" });
    }
  });

  app.get('/api/progress/daily', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { date } = req.query;
      
      // Default to today
      let targetDate: Date;
      if (date) {
        targetDate = new Date(date as string);
      } else {
        targetDate = new Date();
      }
      
      const progress = await storage.getUserDailyProgress(userId, targetDate);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching daily progress:", error);
      res.status(500).json({ message: "Failed to fetch daily progress" });
    }
  });

  // Task Templates routes
  app.post("/api/task-templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user?.householdId) {
        return res.status(400).json({ message: "Sie müssen einem Haushalt beitreten" });
      }

      if (user.role !== 'admin') {
        return res.status(403).json({ message: "Nur Admins können Vorlagen erstellen" });
      }
      
      const templateData = insertTaskTemplateSchema.parse({
        ...req.body,
        householdId: user.householdId,
        createdBy: userId,
      });
      
      const template = await storage.createTaskTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error("Error creating task template:", error);
      res.status(400).json({ message: "Failed to create task template" });
    }
  });

  app.get("/api/task-templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user?.householdId) {
        return res.status(400).json({ message: "Sie müssen einem Haushalt beitreten" });
      }
      
      const templates = await storage.getTaskTemplatesByHousehold(user.householdId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching task templates:", error);
      res.status(500).json({ message: "Failed to fetch task templates" });
    }
  });

  app.post("/api/task-templates/:templateId/create-task", isAuthenticated, async (req: any, res) => {
    try {
      const { templateId } = req.params;
      const { assignedTo } = req.body;
      const task = await storage.createTaskFromTemplate(templateId, assignedTo);
      res.json(task);
    } catch (error) {
      console.error("Error creating task from template:", error);
      res.status(500).json({ message: "Failed to create task from template" });
    }
  });

  app.delete("/api/task-templates/:templateId", isAuthenticated, async (req, res) => {
    try {
      const template = await storage.deactivateTaskTemplate(req.params.templateId);
      res.json(template);
    } catch (error) {
      console.error("Error deactivating template:", error);
      res.status(500).json({ message: "Failed to deactivate template" });
    }
  });

  // Shopping Lists routes
  app.post("/api/shopping-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user?.householdId) {
        return res.status(400).json({ message: "Sie müssen einem Haushalt beitreten" });
      }
      
      const listData = insertShoppingListSchema.parse({
        ...req.body,
        householdId: user.householdId,
        createdBy: userId,
      });
      
      const list = await storage.createShoppingList(listData);
      res.json(list);
    } catch (error) {
      console.error("Error creating shopping list:", error);
      res.status(400).json({ message: "Failed to create shopping list" });
    }
  });

  app.get("/api/shopping-lists", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user?.householdId) {
        return res.status(400).json({ message: "Sie müssen einem Haushalt beitreten" });
      }
      
      const lists = await storage.getShoppingListsByHousehold(user.householdId);
      res.json(lists);
    } catch (error) {
      console.error("Error fetching shopping lists:", error);
      res.status(500).json({ message: "Failed to fetch shopping lists" });
    }
  });

  app.post("/api/shopping-lists/:listId/items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const itemData = insertShoppingItemSchema.parse({
        ...req.body,
        listId: req.params.listId,
        addedBy: userId,
      });
      
      const item = await storage.addShoppingItem(itemData);
      res.json(item);
    } catch (error) {
      console.error("Error adding shopping item:", error);
      res.status(400).json({ message: "Failed to add shopping item" });
    }
  });

  app.get("/api/shopping-lists/:listId/items", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getShoppingItemsByList(req.params.listId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching shopping items:", error);
      res.status(500).json({ message: "Failed to fetch shopping items" });
    }
  });

  app.patch("/api/shopping-items/:itemId/toggle", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const item = await storage.toggleShoppingItem(req.params.itemId, userId);
      res.json(item);
    } catch (error) {
      console.error("Error toggling shopping item:", error);
      res.status(500).json({ message: "Failed to toggle shopping item" });
    }
  });

  app.delete("/api/shopping-items/:itemId", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteShoppingItem(req.params.itemId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shopping item:", error);
      res.status(500).json({ message: "Failed to delete shopping item" });
    }
  });

  // Notifications routes
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { unreadOnly } = req.query;
      const notifications = await storage.getNotificationsByUser(
        userId, 
        unreadOnly === 'true'
      );
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:notificationId/read", isAuthenticated, async (req, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.notificationId);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
