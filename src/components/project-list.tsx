import Link from "next/link";
import { ChevronRight, FolderOpen } from "lucide-react";
import { ProgressBar, StatusBadge } from "./status-badge";
import { formatDate, formatQar } from "@/lib/utils";
import type { ProjectStatus } from "@/db/schema";

type ProjectRow = { id: string; name: string; status: ProjectStatus; costQar: string; targetDate: string | null; companyName: string; companyCode: string; progress: number; taskCount: number };

export function ProjectList({ projects }: { projects: ProjectRow[] }) {
  if (!projects.length) return <div className="empty"><FolderOpen /><p>No projects match this view.</p></div>;
  return <div>{projects.map((project) => <Link className="project-row" href={`/projects/${project.id}`} key={project.id}>
    <div><div className="project-name">{project.name}</div><div className="project-meta"><span>{project.companyCode}</span><span>{project.taskCount} tasks</span><span>Due {formatDate(project.targetDate)}</span></div></div>
    <StatusBadge status={project.status} />
    <ProgressBar value={project.progress} />
    <div className="cost">{formatQar(project.costQar)}</div>
    <ChevronRight className="chevron" size={17} />
  </Link>)}</div>;
}
