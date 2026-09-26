"use client";

import { useFormStatus } from "react-dom";
import { updateTaskStatus } from "@/app/actions";
import type { TaskStatus } from "@/db/schema";

function StatusControl({ title, value }: { title: string; value: TaskStatus }) {
  const { pending } = useFormStatus();
  return <select
    className={`task-status-select ${value.toLowerCase().replace("_", "-")}`}
    name="status"
    defaultValue={value}
    disabled={pending}
    aria-label={`Status for ${title}`}
    onChange={(event) => event.currentTarget.form?.requestSubmit()}
  >
    <option value="TODO">To do</option>
    <option value="IN_PROGRESS">In progress</option>
    <option value="DONE">Done</option>
  </select>;
}

export function TaskStatusSelect({ id, projectId, title, value }: { id: string; projectId: string; title: string; value: TaskStatus }) {
  return <form action={updateTaskStatus}>
    <input type="hidden" name="id" value={id} />
    <input type="hidden" name="projectId" value={projectId} />
    <StatusControl title={title} value={value} />
  </form>;
}
