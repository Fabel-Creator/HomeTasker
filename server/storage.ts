import {
  users,
  households,
  tasks,
  timeLogs,
  taskTemplates,
  shoppingLists,
  shoppingItems,
  notifications,
  type User,
  type UpsertUser,
  type Household,
  type InsertHousehold,
  type Task,
  type InsertTask,
  type TimeLog,
  type InsertTimeLog,
  type TaskTemplate,
  type InsertTaskTemplate,
  type ShoppingList,
  type InsertShoppingList,
  type ShoppingItem,
  type InsertShoppingItem,
  type Notification,
  type InsertNotification,
  type UpdateUserTarget,
  type JoinAsGuest,
} from "@shared/schema";

// Local admin type
export interface LocalAdminData {
  username: string;
  hashedPassword: string;
  firstName: string;
  lastName?: string;
  email?: string;
  isLocalAdmin: boolean;
  role: string;
}
import { db } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { randomBytes } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createLocalAdmin(adminData: LocalAdminData): Promise<User>;
  
  // Household operations
  createHousehold(household: InsertHousehold): Promise<Household>;
  getHousehold(householdId: string): Promise<Household | undefined>;
  getHouseholdByInviteCode(inviteCode: string): Promise<Household | undefined>;
  getHouseholdMembers(householdId: string): Promise<User[]>;
  joinHousehold(userId: string, householdId: string): Promise<User>;
  joinHouseholdAsGuest(data: JoinAsGuest): Promise<User>;
  updateUserDailyTarget(data: UpdateUserTarget): Promise<User>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTasksByHousehold(householdId: string): Promise<Task[]>;
  getTasksByUser(userId: string): Promise<Task[]>;
  updateTaskStatus(taskId: string, status: string, reviewedBy?: string): Promise<Task>;
  completeTask(taskId: string, actualMinutes: number): Promise<Task>;
  
  // Time log operations
  createTimeLog(timeLog: InsertTimeLog): Promise<TimeLog>;
  getTimeLogsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<TimeLog[]>;
  getTimeLogsByHousehold(householdId: string): Promise<TimeLog[]>;
  reviewTimeLog(timeLogId: string, status: string, reviewedBy: string): Promise<TimeLog>;
  getUserDailyProgress(userId: string, date: Date): Promise<{
    completedMinutes: number;
    targetMinutes: number;
    pendingMinutes: number;
  }>;
  
  // Task template operations
  createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate>;
  getTaskTemplatesByHousehold(householdId: string): Promise<TaskTemplate[]>;
  updateTaskTemplate(templateId: string, updates: Partial<InsertTaskTemplate>): Promise<TaskTemplate>;
  deactivateTaskTemplate(templateId: string): Promise<TaskTemplate>;
  createTaskFromTemplate(templateId: string, assignedTo?: string): Promise<Task>;
  
  // Shopping list operations
  createShoppingList(list: InsertShoppingList): Promise<ShoppingList>;
  getShoppingListsByHousehold(householdId: string): Promise<ShoppingList[]>;
  addShoppingItem(item: InsertShoppingItem): Promise<ShoppingItem>;
  getShoppingItemsByList(listId: string): Promise<ShoppingItem[]>;
  toggleShoppingItem(itemId: string, checkedBy: string): Promise<ShoppingItem>;
  deleteShoppingItem(itemId: string): Promise<void>;
  completeShoppingList(listId: string): Promise<ShoppingList>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  markNotificationAsRead(notificationId: string): Promise<Notification>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createLocalAdmin(adminData: LocalAdminData): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        username: adminData.username,
        hashedPassword: adminData.hashedPassword,
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        email: adminData.email,
        isLocalAdmin: adminData.isLocalAdmin,
        role: adminData.role,
      })
      .returning();
    return user;
  }

  // Household operations
  async createHousehold(householdData: InsertHousehold): Promise<Household> {
    const inviteCode = randomBytes(4).toString('hex').toUpperCase();
    const [household] = await db
      .insert(households)
      .values({
        ...householdData,
        inviteCode,
      })
      .returning();
    
    // Update user to be admin of this household
    await db
      .update(users)
      .set({
        householdId: household.id,
        role: "admin",
      })
      .where(eq(users.id, householdData.createdBy));
    
    return household;
  }

  async getHousehold(householdId: string): Promise<Household | undefined> {
    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.id, householdId));
    return household;
  }

  async getHouseholdByInviteCode(inviteCode: string): Promise<Household | undefined> {
    const [household] = await db
      .select()
      .from(households)
      .where(eq(households.inviteCode, inviteCode));
    return household;
  }

  async getHouseholdMembers(householdId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.householdId, householdId));
  }

  async removeHouseholdMember(userId: string, adminId: string): Promise<void> {
    // First verify that the admin is actually an admin of the same household
    const admin = await this.getUser(adminId);
    const memberToRemove = await this.getUser(userId);
    
    if (!admin || !memberToRemove) {
      throw new Error("Benutzer nicht gefunden");
    }
    
    if (admin.role !== 'admin') {
      throw new Error("Nur Admins können Mitglieder entfernen");
    }
    
    if (admin.householdId !== memberToRemove.householdId) {
      throw new Error("Nicht autorisiert");
    }
    
    if (userId === adminId) {
      throw new Error("Admins können sich nicht selbst entfernen");
    }
    
    // Remove user from household (but don't delete the user completely)
    await db
      .update(users)
      .set({
        householdId: null,
        role: "member",
      })
      .where(eq(users.id, userId));
  }

  async joinHousehold(userId: string, householdId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        householdId,
        role: "member",
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async joinHouseholdAsGuest(data: JoinAsGuest): Promise<User> {
    const household = await this.getHouseholdByInviteCode(data.inviteCode);
    if (!household) {
      throw new Error("Haushalt nicht gefunden");
    }

    // Check if a guest user with the same display name already exists in this household
    const existingGuestUsers = await db
      .select()
      .from(users)
      .where(and(
        eq(users.displayName, data.displayName),
        eq(users.householdId, household.id),
        eq(users.isGuest, true)
      ));

    if (existingGuestUsers.length > 0) {
      // Return the first existing guest user instead of creating a new one
      return existingGuestUsers[0];
    }

    // Create a new guest user if none exists
    const [guestUser] = await db
      .insert(users)
      .values({
        displayName: data.displayName,
        householdId: household.id,
        role: "member",
        isGuest: true,
        email: null, // Guests don't need email
      })
      .returning();
    
    return guestUser;
  }

  async updateUserDailyTarget(data: UpdateUserTarget): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        dailyTargetMinutes: data.dailyTargetMinutes,
      })
      .where(eq(users.id, data.userId))
      .returning();
    return user;
  }

  // Task operations
  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values(taskData)
      .returning();
    return task;
  }

  async getTasksByHousehold(householdId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.householdId, householdId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedTo, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async updateTaskStatus(taskId: string, status: string, reviewedBy?: string): Promise<Task> {
    const updateData: any = { status, updatedAt: new Date() };
    if (reviewedBy) {
      updateData.reviewedBy = reviewedBy;
    }
    
    const [task] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning();
    return task;
  }

  async completeTask(taskId: string, actualMinutes: number): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({
        status: "completed",
        actualMinutes,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();
    return task;
  }

  // Time log operations
  async createTimeLog(timeLogData: InsertTimeLog): Promise<TimeLog> {
    const [timeLog] = await db
      .insert(timeLogs)
      .values(timeLogData)
      .returning();
    return timeLog;
  }

  async getTimeLogsByUser(userId: string, startDate?: Date, endDate?: Date): Promise<TimeLog[]> {
    let conditions = [eq(timeLogs.userId, userId)];
    
    if (startDate && endDate) {
      conditions.push(
        gte(timeLogs.logDate, startDate),
        lte(timeLogs.logDate, endDate)
      );
    }
    
    return await db
      .select()
      .from(timeLogs)
      .where(and(...conditions))
      .orderBy(desc(timeLogs.logDate));
  }

  async getTimeLogsByHousehold(householdId: string): Promise<any[]> {
    return await db
      .select({
        id: timeLogs.id,
        title: timeLogs.title,
        description: timeLogs.description,
        minutes: timeLogs.minutes,
        status: timeLogs.status,
        logDate: timeLogs.logDate,
        createdAt: timeLogs.createdAt,
        userId: timeLogs.userId,
        user: {
          id: users.id,
          displayName: users.displayName,
          firstName: users.firstName,
          lastName: users.lastName,
          isGuest: users.isGuest,
        }
      })
      .from(timeLogs)
      .leftJoin(users, eq(timeLogs.userId, users.id))
      .where(eq(timeLogs.householdId, householdId))
      .orderBy(desc(timeLogs.createdAt));
  }

  async reviewTimeLog(timeLogId: string, status: string, reviewedBy: string): Promise<TimeLog> {
    const [timeLog] = await db
      .update(timeLogs)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date(),
      })
      .where(eq(timeLogs.id, timeLogId))
      .returning();
    return timeLog;
  }

  async getUserDailyProgress(userId: string, date: Date): Promise<{
    completedMinutes: number;
    targetMinutes: number;
    pendingMinutes: number;
  }> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const user = await this.getUser(userId);
    const targetMinutes = user?.dailyTargetMinutes || 60;
    
    const approvedLogs = await db
      .select()
      .from(timeLogs)
      .where(
        and(
          eq(timeLogs.userId, userId),
          eq(timeLogs.status, "approved"),
          gte(timeLogs.logDate, dayStart),
          lte(timeLogs.logDate, dayEnd)
        )
      );
    
    const pendingLogs = await db
      .select()
      .from(timeLogs)
      .where(
        and(
          eq(timeLogs.userId, userId),
          eq(timeLogs.status, "pending_approval"),
          gte(timeLogs.logDate, dayStart),
          lte(timeLogs.logDate, dayEnd)
        )
      );
    
    const completedMinutes = approvedLogs.reduce((sum, log) => sum + log.minutes, 0);
    const pendingMinutes = pendingLogs.reduce((sum, log) => sum + log.minutes, 0);
    
    return {
      completedMinutes,
      targetMinutes,
      pendingMinutes,
    };
  }

  // Task template operations
  async createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate> {
    const [newTemplate] = await db
      .insert(taskTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async getTaskTemplatesByHousehold(householdId: string): Promise<TaskTemplate[]> {
    return await db
      .select()
      .from(taskTemplates)
      .where(and(eq(taskTemplates.householdId, householdId), eq(taskTemplates.isActive, true)))
      .orderBy(desc(taskTemplates.createdAt));
  }

  async updateTaskTemplate(templateId: string, updates: Partial<InsertTaskTemplate>): Promise<TaskTemplate> {
    const [updated] = await db
      .update(taskTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(taskTemplates.id, templateId))
      .returning();
    return updated;
  }

  async deactivateTaskTemplate(templateId: string): Promise<TaskTemplate> {
    const [deactivated] = await db
      .update(taskTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(taskTemplates.id, templateId))
      .returning();
    return deactivated;
  }

  async createTaskFromTemplate(templateId: string, assignedTo?: string): Promise<Task> {
    const [template] = await db
      .select()
      .from(taskTemplates)
      .where(eq(taskTemplates.id, templateId));

    if (!template) {
      throw new Error("Template not found");
    }

    const taskData: InsertTask = {
      title: template.title,
      description: template.description,
      estimatedMinutes: template.estimatedMinutes,
      householdId: template.householdId,
      assignedTo: assignedTo,
      assignedBy: template.createdBy,
      templateId: templateId,
      isFromTemplate: true,
    };

    const [newTask] = await db.insert(tasks).values(taskData).returning();
    
    // Create notification for assigned user
    if (assignedTo) {
      await this.createNotification({
        title: "Neue Aufgabe zugewiesen",
        message: `Du hast eine neue Aufgabe erhalten: ${template.title}`,
        type: "task_assigned",
        userId: assignedTo,
        householdId: template.householdId,
        relatedId: newTask.id,
      });
    }

    return newTask;
  }

  // Shopping list operations
  async createShoppingList(list: InsertShoppingList): Promise<ShoppingList> {
    const [newList] = await db
      .insert(shoppingLists)
      .values(list)
      .returning();
    return newList;
  }

  async getShoppingListsByHousehold(householdId: string): Promise<ShoppingList[]> {
    return await db
      .select()
      .from(shoppingLists)
      .where(eq(shoppingLists.householdId, householdId))
      .orderBy(desc(shoppingLists.createdAt));
  }

  async addShoppingItem(item: InsertShoppingItem): Promise<ShoppingItem> {
    const [newItem] = await db
      .insert(shoppingItems)
      .values(item)
      .returning();
    return newItem;
  }

  async getShoppingItemsByList(listId: string): Promise<ShoppingItem[]> {
    return await db
      .select()
      .from(shoppingItems)
      .where(eq(shoppingItems.listId, listId))
      .orderBy(desc(shoppingItems.createdAt));
  }

  async toggleShoppingItem(itemId: string, checkedBy: string): Promise<ShoppingItem> {
    const [currentItem] = await db
      .select()
      .from(shoppingItems)
      .where(eq(shoppingItems.id, itemId));

    const [updated] = await db
      .update(shoppingItems)
      .set({ 
        isChecked: !currentItem.isChecked,
        checkedBy: !currentItem.isChecked ? checkedBy : null,
        checkedAt: !currentItem.isChecked ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(shoppingItems.id, itemId))
      .returning();
    return updated;
  }

  async deleteShoppingItem(itemId: string): Promise<void> {
    await db.delete(shoppingItems).where(eq(shoppingItems.id, itemId));
  }

  async completeShoppingList(listId: string): Promise<ShoppingList> {
    const [completed] = await db
      .update(shoppingLists)
      .set({ isCompleted: true, updatedAt: new Date() })
      .where(eq(shoppingLists.id, listId))
      .returning();
    return completed;
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getNotificationsByUser(userId: string, unreadOnly = false): Promise<Notification[]> {
    const conditions = [eq(notifications.userId, userId)];
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    return await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification> {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId))
      .returning();
    return updated;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, notificationId));
  }
}

export const storage = new DatabaseStorage();
