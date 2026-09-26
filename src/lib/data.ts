import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { companies, documents, projectNotes, projects, tasks, userCompanyAccess, users, type ProjectStatus } from "@/db/schema";
import type { SessionUser } from "./auth";

const progressSql = sql<number>`CASE WHEN count(${tasks.id}) = 0 THEN 0 ELSE round((count(${tasks.id}) FILTER (WHERE ${tasks.status} = 'DONE'))::numeric / count(${tasks.id}) * 100)::int END`;

export async function getCompaniesForUser(user: SessionUser) {
  if (user.companyIds.length === 0) return [];
  return db.select().from(companies).where(inArray(companies.id, user.companyIds)).orderBy(asc(companies.name));
}

export async function getAllCompanies() {
  return db.select().from(companies).orderBy(asc(companies.name));
}

export async function getProjectsForUser(user: SessionUser, filters?: { status?: ProjectStatus; companyId?: string }) {
  const allowed = filters?.companyId && user.companyIds.includes(filters.companyId)
    ? [filters.companyId]
    : user.companyIds;
  if (allowed.length === 0) return [];
  const conditions = [inArray(projects.companyId, allowed)];
  if (filters?.status) conditions.push(eq(projects.status, filters.status));
  return db.select({
    id: projects.id,
    name: projects.name,
    description: projects.description,
    status: projects.status,
    costQar: projects.costQar,
    startDate: projects.startDate,
    targetDate: projects.targetDate,
    updatedAt: projects.updatedAt,
    companyId: companies.id,
    companyName: companies.name,
    companyCode: companies.code,
    taskCount: sql<number>`count(${tasks.id})::int`,
    completedCount: sql<number>`count(${tasks.id}) FILTER (WHERE ${tasks.status} = 'DONE')::int`,
    progress: progressSql,
  }).from(projects)
    .innerJoin(companies, eq(companies.id, projects.companyId))
    .leftJoin(tasks, eq(tasks.projectId, projects.id))
    .where(and(...conditions))
    .groupBy(projects.id, companies.id)
    .orderBy(sql`CASE ${projects.status} WHEN 'CURRENT' THEN 1 WHEN 'PENDING' THEN 2 ELSE 3 END`, asc(projects.targetDate), asc(projects.name));
}

export async function getProjectForUser(user: SessionUser, id: string) {
  if (user.companyIds.length === 0) return null;
  const [project] = await db.select({
    id: projects.id,
    name: projects.name,
    description: projects.description,
    status: projects.status,
    costQar: projects.costQar,
    startDate: projects.startDate,
    targetDate: projects.targetDate,
    generalNotes: projects.generalNotes,
    createdAt: projects.createdAt,
    updatedAt: projects.updatedAt,
    companyId: companies.id,
    companyName: companies.name,
    companyCode: companies.code,
  }).from(projects)
    .innerJoin(companies, eq(companies.id, projects.companyId))
    .where(and(eq(projects.id, id), inArray(projects.companyId, user.companyIds)))
    .limit(1);
  if (!project) return null;

  const [projectTasks, projectDocuments, notes] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.projectId, id)).orderBy(asc(tasks.sortOrder), asc(tasks.createdAt)),
    db.select({
      id: documents.id,
      name: documents.name,
      mimeType: documents.mimeType,
      sizeBytes: documents.sizeBytes,
      createdAt: documents.createdAt,
      uploaderName: users.name,
    }).from(documents)
      .innerJoin(users, eq(users.id, documents.uploadedBy))
      .where(eq(documents.projectId, id))
      .orderBy(desc(documents.createdAt)),
    db.select({
      id: projectNotes.id,
      content: projectNotes.content,
      createdAt: projectNotes.createdAt,
      authorName: users.name,
    }).from(projectNotes)
      .innerJoin(users, eq(users.id, projectNotes.authorId))
      .where(eq(projectNotes.projectId, id))
      .orderBy(desc(projectNotes.createdAt)),
  ]);
  const done = projectTasks.filter((task) => task.status === "DONE").length;
  return {
    ...project,
    tasks: projectTasks,
    documents: projectDocuments,
    notes,
    progress: projectTasks.length ? Math.round(done / projectTasks.length * 100) : 0,
  };
}

export async function getDashboardSummary(user: SessionUser) {
  const portfolio = await getProjectsForUser(user);
  const counts = {
    CURRENT: portfolio.filter((project) => project.status === "CURRENT").length,
    PENDING: portfolio.filter((project) => project.status === "PENDING").length,
    FINALIZED: portfolio.filter((project) => project.status === "FINALIZED").length,
  };
  const totalCost = portfolio.reduce((sum, project) => sum + Number(project.costQar), 0);
  const averageProgress = portfolio.length
    ? Math.round(portfolio.reduce((sum, project) => sum + project.progress, 0) / portfolio.length)
    : 0;
  return { portfolio, counts, totalCost, averageProgress };
}

export async function getUsersWithAccess() {
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    username: users.username,
    email: users.email,
    role: users.role,
    active: users.active,
    createdAt: users.createdAt,
  }).from(users).orderBy(asc(users.name));
  const access = await db.select({
    userId: userCompanyAccess.userId,
    companyId: companies.id,
    companyName: companies.name,
  }).from(userCompanyAccess).innerJoin(companies, eq(companies.id, userCompanyAccess.companyId));
  return allUsers.map((user) => ({ ...user, companies: access.filter((row) => row.userId === user.id) }));
}
