import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function verify() {
  const result = await db.execute(sql`
    select
      (select count(*)::int from users) as users,
      (select count(*)::int from companies) as companies,
      (select count(*)::int from projects) as projects,
      (select count(*)::int from tasks) as tasks,
      (select count(*)::int from information_schema.tables where table_schema = 'public' and table_name in ('users','companies','user_company_access','projects','tasks','documents')) as required_tables
  `);
  const row = result.rows[0] as Record<string, number>;
  if (Number(row.required_tables) !== 6) throw new Error(`Expected 6 application tables, found ${row.required_tables}`);
  if (Number(row.users) < 1 || Number(row.companies) < 1) throw new Error("Seed data is incomplete");
  console.log(`Database verified: ${row.required_tables} tables, ${row.users} user(s), ${row.companies} company, ${row.projects} project(s), ${row.tasks} task(s).`);
}

verify().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
