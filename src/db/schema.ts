import { boolean, customType, date, decimal, index, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["ADMIN", "READ_ONLY"]);
export const projectStatus = pgEnum("project_status", ["CURRENT", "PENDING", "FINALIZED"]);
export const taskStatus = pgEnum("task_status", ["TODO", "IN_PROGRESS", "DONE"]);

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  code: varchar("code", { length: 24 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [uniqueIndex("companies_code_unique").on(table.code)]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  username: varchar("username", { length: 64 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: userRole("role").default("READ_ONLY").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("users_username_unique").on(table.username),
  uniqueIndex("users_email_unique").on(table.email),
]);

export const userCompanyAccess = pgTable("user_company_access", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.userId, table.companyId] }),
  index("user_company_company_idx").on(table.companyId),
]);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description").default("").notNull(),
  status: projectStatus("status").default("PENDING").notNull(),
  costQar: decimal("cost_qar", { precision: 14, scale: 2 }).default("0").notNull(),
  startDate: date("start_date"),
  targetDate: date("target_date"),
  generalNotes: text("general_notes").default("").notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("projects_company_idx").on(table.companyId),
  index("projects_status_idx").on(table.status),
]);

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description").default("").notNull(),
  notes: text("notes").default("").notNull(),
  status: taskStatus("status").default("TODO").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }),
  sortOrder: decimal("sort_order", { precision: 10, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("tasks_project_idx").on(table.projectId)]);

export const projectNotes = pgTable("project_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("project_notes_project_idx").on(table.projectId)]);

export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 160 }).notNull(),
  sizeBytes: decimal("size_bytes", { precision: 12, scale: 0 }).notNull(),
  content: bytea("content").notNull(),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("documents_project_idx").on(table.projectId)]);

export type UserRole = (typeof userRole.enumValues)[number];
export type ProjectStatus = (typeof projectStatus.enumValues)[number];
export type TaskStatus = (typeof taskStatus.enumValues)[number];
