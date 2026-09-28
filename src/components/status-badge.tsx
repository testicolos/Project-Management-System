import type { ProjectStatus, TaskStatus } from "@/db/schema";

const labels: Record<ProjectStatus | TaskStatus, string> = {
  CURRENT: "Current",
  PENDING: "Pending",
  FINALIZED: "Finalized",
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export function StatusBadge({ status }: { status: ProjectStatus | TaskStatus }) {
  return <span className={`status ${status.toLowerCase().replace("_", "-")}`}>{labels[status]}</span>;
}

export function TypeBadge({ type }: { type: string | null }) {
  return <span className="status project-type">{type ?? "Not set"}</span>;
}

export function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value));
  return <div className="progress-wrap" aria-label={`${safe}% complete`}><div className="progress-label"><span>Progress</span><strong>{safe}%</strong></div><div className="progress"><span style={{ width: `${safe}%` }} /></div></div>;
}
