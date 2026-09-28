import Link from "next/link";
import { Plus } from "lucide-react";
import type { ProjectStatus } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { getCompaniesForUser, getProjectsForUser, getProjectTypes } from "@/lib/data";
import { Modal } from "@/components/modal";
import { ProjectForm } from "@/components/project-form";
import { ProjectList } from "@/components/project-list";
import { Flash } from "@/components/flash";

export const metadata = { title: "Projects" };
const statuses: Array<{ value?: ProjectStatus; label: string }> = [{ label: "All projects" }, { value: "CURRENT", label: "Current" }, { value: "PENDING", label: "Pending" }, { value: "FINALIZED", label: "Finalized" }];

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ status?: string; company?: string; type?: string; success?: string; error?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const status = ["CURRENT", "PENDING", "FINALIZED"].includes(params.status ?? "") ? params.status as ProjectStatus : undefined;
  const [companies, projectTypes] = await Promise.all([getCompaniesForUser(user), getProjectTypes()]);
  const projectTypeId = projectTypes.some((type) => type.id === params.type) ? params.type : undefined;
  const projectRows = await getProjectsForUser(user, { status, companyId: params.company, projectTypeId });
  const statusHref = (nextStatus?: ProjectStatus) => {
    const query = new URLSearchParams();
    if (nextStatus) query.set("status", nextStatus);
    if (params.company) query.set("company", params.company);
    if (projectTypeId) query.set("type", projectTypeId);
    const qs = query.toString();
    return qs ? `/projects?${qs}` : "/projects";
  };
  return <>
    <header className="topbar"><div><div className="eyebrow">Portfolio</div><h1>Projects</h1><p className="lede">Current, pending, and finalized work across the companies you can access.</p></div>{user.role === "ADMIN" && <Modal title="Create project" trigger={<button className="button" type="button"><Plus /> New project</button>}><ProjectForm companies={companies} projectTypes={projectTypes} /></Modal>}</header>
    <Flash success={params.success} error={params.error} />
    <div className="filters" aria-label="Project filters">
      {statuses.map((item) => <Link key={item.label} className={`filter ${status === item.value ? "active" : ""}`} href={statusHref(item.value)}>{item.label}</Link>)}
      <form>
        {status && <input type="hidden" name="status" value={status} />}
        {companies.length > 1 && <select className="filter" name="company" defaultValue={params.company ?? ""} aria-label="Filter by company"><option value="">All companies</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>}
        <select className="filter" name="type" defaultValue={projectTypeId ?? ""} aria-label="Filter by project type"><option value="">All types</option>{projectTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select>
        <button className="button ghost" type="submit">Apply</button>
      </form>
    </div>
    <section className="panel"><ProjectList projects={projectRows} /></section>
  </>;
}
