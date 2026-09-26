"use server";

import { compare, hash } from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { companies, documents, projectNotes, projects, tasks, userCompanyAccess, users } from "@/db/schema";
import { assertCompanyAccess, clearSession, requireAdmin, requireUser } from "@/lib/auth";
import { companySchema, passwordSchema, projectNoteSchema, projectSchema, taskSchema, userSchema } from "@/lib/validation";
import { qatarLocalToDate } from "@/lib/utils";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function message(error: unknown) {
  if (error && typeof error === "object" && "issues" in error) {
    const issue = (error as { issues: Array<{ message: string }> }).issues[0];
    return issue?.message ?? "Please check the form";
  }
  if (error instanceof Error && (error.message.includes("unique") || error.message.includes("duplicate key"))) return "That username or email is already in use";
  return error instanceof Error ? error.message : "Something went wrong";
}

function to(path: string, type: "success" | "error", text: string): never {
  const joiner = path.includes("?") ? "&" : "?";
  redirect(`${path}${joiner}${type}=${encodeURIComponent(text)}`);
}

export async function signOut() {
  await clearSession();
  redirect("/login");
}

export async function createCompany(formData: FormData) {
  const admin = await requireAdmin();
  try {
    const input = companySchema.parse({ name: value(formData, "name"), code: value(formData, "code") });
    const [company] = await db.insert(companies).values(input).returning({ id: companies.id });
    await db.insert(userCompanyAccess).values({ userId: admin.id, companyId: company.id }).onConflictDoNothing();
    revalidatePath("/");
  } catch (error) {
    to("/companies", "error", message(error));
  }
  to("/companies", "success", "Company created");
}

export async function createProject(formData: FormData) {
  const admin = await requireAdmin();
  try {
    const input = projectSchema.parse({
      companyId: value(formData, "companyId"), name: value(formData, "name"), description: value(formData, "description"),
      status: value(formData, "status"), costQar: value(formData, "costQar"), startDate: value(formData, "startDate"),
      targetDate: value(formData, "targetDate"), generalNotes: value(formData, "generalNotes"),
    });
    assertCompanyAccess(admin, input.companyId);
    const [project] = await db.insert(projects).values({
      ...input,
      costQar: input.costQar.toFixed(2),
      startDate: input.startDate || null,
      targetDate: input.targetDate || null,
      createdBy: admin.id,
    }).returning({ id: projects.id });
    revalidatePath("/");
    redirect(`/projects/${project.id}?success=${encodeURIComponent("Project created")}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    to("/projects", "error", message(error));
  }
}

export async function updateProject(formData: FormData) {
  const admin = await requireAdmin();
  const id = value(formData, "id");
  try {
    const input = projectSchema.parse({
      companyId: value(formData, "companyId"), name: value(formData, "name"), description: value(formData, "description"),
      status: value(formData, "status"), costQar: value(formData, "costQar"), startDate: value(formData, "startDate"),
      targetDate: value(formData, "targetDate"), generalNotes: value(formData, "generalNotes"),
    });
    assertCompanyAccess(admin, input.companyId);
    await db.update(projects).set({
      ...input,
      costQar: input.costQar.toFixed(2),
      startDate: input.startDate || null,
      targetDate: input.targetDate || null,
      updatedAt: new Date(),
    }).where(eq(projects.id, id));
    revalidatePath(`/projects/${id}`);
  } catch (error) {
    to(`/projects/${id}`, "error", message(error));
  }
  to(`/projects/${id}`, "success", "Project updated");
}

export async function createTask(formData: FormData) {
  const admin = await requireAdmin();
  const projectId = value(formData, "projectId");
  try {
    const [project] = await db.select({ companyId: projects.companyId }).from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project) throw new Error("Project not found");
    assertCompanyAccess(admin, project.companyId);
    const input = taskSchema.parse({
      projectId, title: value(formData, "title"), description: value(formData, "description"), notes: value(formData, "notes"),
      status: value(formData, "status"), dueAt: value(formData, "dueAt"),
    });
    await db.insert(tasks).values({ ...input, dueAt: qatarLocalToDate(input.dueAt) });
    revalidatePath(`/projects/${projectId}`);
  } catch (error) {
    to(`/projects/${projectId}`, "error", message(error));
  }
  to(`/projects/${projectId}`, "success", "Task added");
}

export async function updateTask(formData: FormData) {
  const admin = await requireAdmin();
  const id = value(formData, "id");
  const projectId = value(formData, "projectId");
  try {
    const [project] = await db.select({ companyId: projects.companyId }).from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project) throw new Error("Project not found");
    assertCompanyAccess(admin, project.companyId);
    const input = taskSchema.parse({
      projectId, title: value(formData, "title"), description: value(formData, "description"), notes: value(formData, "notes"),
      status: value(formData, "status"), dueAt: value(formData, "dueAt"),
    });
    await db.update(tasks).set({
      title: input.title, description: input.description, notes: input.notes, status: input.status,
      dueAt: qatarLocalToDate(input.dueAt), updatedAt: new Date(),
    }).where(and(eq(tasks.id, id), eq(tasks.projectId, projectId)));
    revalidatePath(`/projects/${projectId}`);
  } catch (error) {
    to(`/projects/${projectId}`, "error", message(error));
  }
  to(`/projects/${projectId}`, "success", "Task updated");
}

export async function updateTaskStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = value(formData, "id");
  const projectId = value(formData, "projectId");
  try {
    const status = value(formData, "status");
    if (status !== "TODO" && status !== "IN_PROGRESS" && status !== "DONE") throw new Error("Invalid task status");
    const [project] = await db.select({ companyId: projects.companyId }).from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project) throw new Error("Project not found");
    assertCompanyAccess(admin, project.companyId);
    await db.update(tasks).set({ status, updatedAt: new Date() }).where(and(eq(tasks.id, id), eq(tasks.projectId, projectId)));
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/");
  } catch (error) {
    to(`/projects/${projectId}`, "error", message(error));
  }
}

export async function createProjectNote(formData: FormData) {
  const admin = await requireAdmin();
  const projectId = value(formData, "projectId");
  try {
    const [project] = await db.select({ companyId: projects.companyId }).from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project) throw new Error("Project not found");
    assertCompanyAccess(admin, project.companyId);
    const content = projectNoteSchema.parse(value(formData, "content"));
    await db.insert(projectNotes).values({ projectId, content, authorId: admin.id });
    revalidatePath(`/projects/${projectId}`);
  } catch (error) {
    to(`/projects/${projectId}`, "error", message(error));
  }
  to(`/projects/${projectId}`, "success", "Note added");
}

export async function deleteDocument(formData: FormData) {
  const admin = await requireAdmin();
  const id = value(formData, "id");
  const projectId = value(formData, "projectId");
  const [project] = await db.select({ companyId: projects.companyId }).from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) to("/projects", "error", "Project not found");
  assertCompanyAccess(admin, project.companyId);
  await db.delete(documents).where(and(eq(documents.id, id), eq(documents.projectId, projectId)));
  revalidatePath(`/projects/${projectId}`);
  to(`/projects/${projectId}`, "success", "Document removed");
}

export type CreateUserState = { message: string };

export async function createUser(_previousState: CreateUserState, formData: FormData): Promise<CreateUserState> {
  await requireAdmin();
  try {
    const input = userSchema.parse({
      name: value(formData, "name"), username: value(formData, "username"), email: value(formData, "email"), password: value(formData, "password"),
      role: value(formData, "role"), companyIds: formData.getAll("companyIds").map(String),
    });
    const [usernameMatch, emailMatch] = await Promise.all([
      db.select({ id: users.id }).from(users).where(eq(users.username, input.username)).limit(1),
      db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1),
    ]);
    if (usernameMatch.length) return { message: "That username is already in use" };
    if (emailMatch.length) return { message: "That email address is already in use" };
    const passwordHash = await hash(input.password, 12);
    const [user] = await db.insert(users).values({ name: input.name, username: input.username, email: input.email, passwordHash, role: input.role }).returning({ id: users.id });
    await db.insert(userCompanyAccess).values(input.companyIds.map((companyId) => ({ userId: user.id, companyId })));
    revalidatePath("/users");
  } catch (error) {
    return { message: message(error) };
  }
  to("/users", "success", "User created");
}

export async function updateUser(formData: FormData) {
  const admin = await requireAdmin();
  const id = value(formData, "id");
  try {
    const role = value(formData, "role");
    if (role !== "ADMIN" && role !== "READ_ONLY") throw new Error("Invalid role");
    const companyIds = formData.getAll("companyIds").map(String);
    if (!companyIds.length) throw new Error("Choose at least one company");
    const active = value(formData, "active") === "true";
    if (id === admin.id && !active) throw new Error("You cannot deactivate your own account");
    await db.update(users).set({ role, active, updatedAt: new Date() }).where(eq(users.id, id));
    await db.delete(userCompanyAccess).where(eq(userCompanyAccess.userId, id));
    await db.insert(userCompanyAccess).values(companyIds.map((companyId) => ({ userId: id, companyId })));
    revalidatePath("/users");
  } catch (error) {
    to("/users", "error", message(error));
  }
  to("/users", "success", "User access updated");
}

export async function resetUserPassword(formData: FormData) {
  await requireAdmin();
  const id = value(formData, "id");
  try {
    const password = passwordSchema.parse(value(formData, "password"));
    await db.update(users).set({ passwordHash: await hash(password, 12), updatedAt: new Date() }).where(eq(users.id, id));
  } catch (error) {
    to("/users", "error", message(error));
  }
  to("/users", "success", "Password reset");
}

export async function changeOwnPassword(formData: FormData) {
  const user = await requireUser();
  try {
    const currentPassword = value(formData, "currentPassword");
    const newPassword = passwordSchema.parse(value(formData, "newPassword"));
    if (newPassword !== value(formData, "confirmPassword")) throw new Error("New passwords do not match");
    const [record] = await db.select({ passwordHash: users.passwordHash }).from(users).where(eq(users.id, user.id)).limit(1);
    if (!record || !(await compare(currentPassword, record.passwordHash))) throw new Error("Current password is incorrect");
    if (await compare(newPassword, record.passwordHash)) throw new Error("Choose a password different from your current password");
    await db.update(users).set({ passwordHash: await hash(newPassword, 12), updatedAt: new Date() }).where(eq(users.id, user.id));
  } catch (error) {
    to("/account", "error", message(error));
  }
  await clearSession();
  to("/login", "success", "Password changed. Sign in with your new password");
}
