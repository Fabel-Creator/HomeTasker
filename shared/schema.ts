import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Household-specific fields
  householdId: varchar("household_id"),
  role: varchar("role").notNull().default("member"), // "admin" or "member"
  dailyTargetMinutes: integer("daily_target_minutes").default(60),
  // For guest members (no auth required)
  isGuest: boolean("is_guest").default(false),
  displayName: varchar("display_name"), // For guest users
  // For local admin authentication (alternative to Replit Auth)
  username: varchar("username").unique(),
  hashedPassword: varchar("hashed_password"),
  isLocalAdmin: boolean("is_local_admin").default(false),
});

export const households = pgTable("households", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  inviteCode: varchar("invite_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

export const taskStatusEnum = pgEnum("task_status", [
  "assigned",
  "completed",
  "pending_approval",
  "approved",
  "rejected"
]);

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  householdId: varchar("household_id").notNull(),
  assignedTo: varchar("assigned_to"),
  assignedBy: varchar("assigned_by"),
  status: taskStatusEnum("status").notNull().default("assigned"),
  estimatedMinutes: integer("estimated_minutes"),
  actualMinutes: integer("actual_minutes"),
  deadline: timestamp("deadline"),
  completedAt: timestamp("completed_at"),
  templateId: varchar("template_id"),
  isFromTemplate: boolean("is_from_template").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Task Templates for recurring tasks
export const taskTemplates = pgTable("task_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description"),
  estimatedMinutes: integer("estimated_minutes").notNull(),
  priority: varchar("priority").notNull().default("medium"),
  recurrence: varchar("recurrence").notNull(), // daily, weekly, monthly
  householdId: varchar("household_id").notNull(),
  createdBy: varchar("created_by").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shopping Lists
export const shoppingLists = pgTable("shopping_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  householdId: varchar("household_id").notNull(),
  createdBy: varchar("created_by").notNull(),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shopping List Items
export const shoppingItems = pgTable("shopping_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  quantity: varchar("quantity"),
  isChecked: boolean("is_checked").default(false),
  checkedBy: varchar("checked_by"),
  checkedAt: timestamp("checked_at"),
  listId: varchar("list_id").notNull(),
  addedBy: varchar("added_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  message: varchar("message").notNull(),
  type: varchar("type").notNull(), // task_deadline, task_assigned, time_log_approved, etc.
  userId: varchar("user_id").notNull(),
  householdId: varchar("household_id").notNull(),
  relatedId: varchar("related_id"), // ID of related task, time log, etc.
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const timeLogs = pgTable("time_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  householdId: varchar("household_id").notNull(),
  taskId: varchar("task_id"), // Optional - can be linked to a task or standalone
  title: varchar("title").notNull(),
  description: text("description"),
  minutes: integer("minutes").notNull(),
  status: varchar("status").notNull().default("pending_approval"), // "pending_approval", "approved", "rejected"
  logDate: timestamp("log_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  household: one(households, {
    fields: [users.householdId],
    references: [households.id],
  }),
  assignedTasks: many(tasks, { relationName: "assignedTasks" }),
  createdTasks: many(tasks, { relationName: "createdTasks" }),
  timeLogs: many(timeLogs),
  taskTemplates: many(taskTemplates),
  shoppingLists: many(shoppingLists),
  notifications: many(notifications),
}));

export const householdsRelations = relations(households, ({ one, many }) => ({
  creator: one(users, {
    fields: [households.createdBy],
    references: [users.id],
  }),
  members: many(users),
  tasks: many(tasks),
  timeLogs: many(timeLogs),
  taskTemplates: many(taskTemplates),
  shoppingLists: many(shoppingLists),
  notifications: many(notifications),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  household: one(households, {
    fields: [tasks.householdId],
    references: [households.id],
  }),
  assignedUser: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: "assignedTasks",
  }),
  createdBy: one(users, {
    fields: [tasks.assignedBy],
    references: [users.id],
    relationName: "createdTasks",
  }),
  template: one(taskTemplates, {
    fields: [tasks.templateId],
    references: [taskTemplates.id],
  }),
  timeLogs: many(timeLogs),
}));

export const taskTemplatesRelations = relations(taskTemplates, ({ one, many }) => ({
  household: one(households, {
    fields: [taskTemplates.householdId],
    references: [households.id],
  }),
  creator: one(users, {
    fields: [taskTemplates.createdBy],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const shoppingListsRelations = relations(shoppingLists, ({ one, many }) => ({
  household: one(households, {
    fields: [shoppingLists.householdId],
    references: [households.id],
  }),
  creator: one(users, {
    fields: [shoppingLists.createdBy],
    references: [users.id],
  }),
  items: many(shoppingItems),
}));

export const shoppingItemsRelations = relations(shoppingItems, ({ one }) => ({
  list: one(shoppingLists, {
    fields: [shoppingItems.listId],
    references: [shoppingLists.id],
  }),
  addedByUser: one(users, {
    fields: [shoppingItems.addedBy],
    references: [users.id],
  }),
  checkedByUser: one(users, {
    fields: [shoppingItems.checkedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  household: one(households, {
    fields: [notifications.householdId],
    references: [households.id],
  }),
}));

export const timeLogsRelations = relations(timeLogs, ({ one }) => ({
  user: one(users, {
    fields: [timeLogs.userId],
    references: [users.id],
  }),
  household: one(households, {
    fields: [timeLogs.householdId],
    references: [households.id],
  }),
  task: one(tasks, {
    fields: [timeLogs.taskId],
    references: [tasks.id],
  }),
  reviewer: one(users, {
    fields: [timeLogs.reviewedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertHouseholdSchema = createInsertSchema(households).omit({
  id: true,
  createdAt: true,
  inviteCode: true, // Auto-generated by server
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  deadline: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

export const insertTimeLogSchema = createInsertSchema(timeLogs).omit({
  id: true,
  createdAt: true,
}).extend({
  logDate: z.string().transform((val) => new Date(val)),
  reviewedBy: z.string().optional(),
  reviewedAt: z.date().optional(),
});

export const updateUserTargetSchema = z.object({
  userId: z.string(),
  dailyTargetMinutes: z.number().min(1),
});

export const joinAsGuestSchema = z.object({
  inviteCode: z.string().min(1, "Einladungscode ist erforderlich"),
  displayName: z.string().min(1, "Name ist erforderlich"),
});

// Local admin authentication schemas
export const localAdminRegisterSchema = z.object({
  username: z.string().min(3, "Benutzername muss mindestens 3 Zeichen haben"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen haben"),
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().optional(),
  email: z.string().email("Gültige E-Mail-Adresse erforderlich").optional(),
});

export const localAdminLoginSchema = z.object({
  username: z.string().min(1, "Benutzername ist erforderlich"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShoppingListSchema = createInsertSchema(shoppingLists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShoppingItemSchema = createInsertSchema(shoppingItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  checkedBy: true,
  checkedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Household = typeof households.$inferSelect;
export type InsertHousehold = z.infer<typeof insertHouseholdSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type TimeLog = typeof timeLogs.$inferSelect;
export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;
export type ShoppingList = typeof shoppingLists.$inferSelect;
export type InsertShoppingList = z.infer<typeof insertShoppingListSchema>;
export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type InsertShoppingItem = z.infer<typeof insertShoppingItemSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertTimeLog = z.infer<typeof insertTimeLogSchema>;
export type UpdateUserTarget = z.infer<typeof updateUserTargetSchema>;
export type JoinAsGuest = z.infer<typeof joinAsGuestSchema>;
export type LocalAdminRegister = z.infer<typeof localAdminRegisterSchema>;
export type LocalAdminLogin = z.infer<typeof localAdminLoginSchema>;
