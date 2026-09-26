import { hash } from "bcryptjs";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import { companies, projects, tasks, userCompanyAccess, users } from "../src/db/schema";

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@projectcommand.qa";
  const username = (process.env.SEED_ADMIN_USERNAME ?? "Admin").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) throw new Error("SEED_ADMIN_PASSWORD is required for the initial seed");

  const passwordHash = await hash(password, 12);
  const [admin] = await db.insert(users).values({
    name: "Project Managment Admin",
    username,
    email: email.toLowerCase(),
    passwordHash,
    role: "ADMIN",
    active: true,
  }).onConflictDoUpdate({
    target: users.email,
    set: { name: "Project Managment Admin", username, passwordHash, role: "ADMIN", active: true, updatedAt: new Date() },
  }).returning({ id: users.id });

  const [company] = await db.insert(companies).values({ name: "Head Office", code: "HQ" })
    .onConflictDoUpdate({ target: companies.code, set: { name: "Head Office" } })
    .returning({ id: companies.id });
  await db.insert(userCompanyAccess).values({ userId: admin.id, companyId: company.id }).onConflictDoNothing();

  const projectName = "Project Managment rollout";
  const projectDescription = "Launch the organization-wide project management system and onboard the operating team.";
  const [existingProject] = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.companyId, company.id), inArray(projects.name, ["Project Command rollout", projectName]))).limit(1);
  let projectId = existingProject?.id;
  if (projectId) {
    await db.update(projects).set({ name: projectName, description: projectDescription, updatedAt: new Date() }).where(eq(projects.id, projectId));
  } else {
    const [project] = await db.insert(projects).values({
      companyId: company.id,
      name: projectName,
      description: projectDescription,
      status: "CURRENT",
      costQar: "0.00",
      startDate: new Date().toISOString().slice(0, 10),
      generalNotes: "Use this project as the onboarding workspace. Update the tasks as access and operating procedures are confirmed.",
      createdBy: admin.id,
    }).returning({ id: projects.id });
    projectId = project.id;
  }

  const [existingTask] = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.projectId, projectId)).limit(1);
  if (!existingTask) {
    await db.insert(tasks).values([
      { projectId, title: "Confirm company portfolio access", description: "Review which companies each user should be able to see.", notes: "Add users from the administration area and assign at least one company.", status: "IN_PROGRESS", sortOrder: "1" },
      { projectId, title: "Add active projects", description: "Create the current and pending project records for the team.", notes: "Costs must be entered in QAR.", status: "TODO", sortOrder: "2" },
      { projectId, title: "Complete administrator setup", description: "Verify the primary administrator account and access.", notes: "Initial setup completed by the deployment process.", status: "DONE", sortOrder: "3" },
    ]);
  }
  console.log("Seed complete: administrator, Head Office, and onboarding project are ready.");
}

seed().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
