import { Building2, Plus } from "lucide-react";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { companies, projects, userCompanyAccess } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { createCompany } from "@/app/actions";
import { Modal } from "@/components/modal";
import { Flash } from "@/components/flash";

export const metadata = { title: "Companies" };

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireAdmin();
  const [flash, rows] = await Promise.all([searchParams, db.select({
    id: companies.id, name: companies.name, code: companies.code,
    projectCount: sql<number>`count(distinct ${projects.id})::int`,
    userCount: sql<number>`count(distinct ${userCompanyAccess.userId})::int`,
  }).from(companies).leftJoin(projects, eq(projects.companyId, companies.id)).leftJoin(userCompanyAccess, eq(userCompanyAccess.companyId, companies.id)).groupBy(companies.id).orderBy(companies.name)]);
  return <><header className="topbar"><div><div className="eyebrow">Access foundation</div><h1>Companies</h1><p className="lede">Company records define portfolio boundaries and user visibility.</p></div><Modal title="Add company" trigger={<button className="button" type="button"><Plus /> Add company</button>}><form action={createCompany}><div className="form-grid"><div className="field full"><label htmlFor="company-name">Company name</label><input className="input" id="company-name" name="name" required maxLength={160} /></div><div className="field full"><label htmlFor="company-code">Short code</label><input className="input" id="company-code" name="code" required maxLength={24} pattern="[A-Za-z0-9-]+" /></div></div><div className="form-actions"><button className="button" type="submit">Create company</button></div></form></Modal></header><Flash success={flash.success} error={flash.error} /><section className="panel"><div className="panel-head"><h2>Company directory</h2><span className="hint">{rows.length} companies</span></div><div className="panel-body">{rows.length ? rows.map((company) => <article className="company-row" key={company.id}><div className="user-row"><span className="avatar"><Building2 size={16} /></span><div><div className="file-name">{company.name}</div><div className="file-meta">{company.code}</div></div></div><div className="file-meta">{company.projectCount} projects · {company.userCount} users</div></article>) : <div className="empty">No companies yet.</div>}</div></section></>;
}
