import Link from "next/link";
import { Plus } from "lucide-react";
import type { ProjectStatus } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getCompaniesForUser, getProjectsForUser } from "@/lib/data";
import { Modal } from "@/components/modal";
import { ProjectForm } from "@/components/project-form";
import { ProjectList } from "@/components/project-list";
import { Flash } from "@/components/flash";

export const metadata = { title: "Projects" };
const statuses: Array<{ value?: ProjectStatus; label: string }> = [{ label: "All projects" }, { value: "CURRENT", label: "Current" }, { value: "PENDING", label: "Pending" }, { value: "FINALIZED", label: "Finalized" }];

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string; company?: string; success?: string; error?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const status = ["CURRENT", "PENDING", "FINALIZED"].includes(params.status ?? "") ? params.status as ProjectStatus : undefined;
  const [projectRows, companies] = await Promise.all([getProjectsForUser(user, { status, companyId: params.company }), getCompaniesForUser(user)]);
  return <>
    <header className="topbar"><div><div className="eyebrow">Portfolio</div><h1>Projects</h1><p className="lede">Current, pending, and finalized work across the companies you can access.</p></div>{user.role === "ADMIN" && <Modal title="Create project" trigger={<button className="button" type="button"><Plus /> New project</button>}><ProjectForm companies={companies} /></Modal>}</header>
    <Flash success={params.success} error={params.error} />
    <div className="filters" aria-label="Project status filters">{statuses.map((item) => <Link key={item.label} className={`filter ${status === item.value ? "active" : ""}`} href={item.value ? `/projects?status=${item.value}` : "/projects"}>{item.label}</Link>)}{companies.length > 1 && <form><select className="filter" name="company" defaultValue={params.company ?? ""} aria-label="Filter by company"><option value="">All companies</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select><button className="button ghost" type="submit">Apply</button></form>}</div>
    <section className="panel"><ProjectList projects={projectRows} /></section>
  </>;
}
