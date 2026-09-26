import { createTask, updateTask } from "@/app/actions";
import type { TaskStatus } from "@/db/schema";
import { toQatarDateTimeInput } from "@/lib/utils";

type TaskInput = { id: string; title: string; description: string; notes: string; status: TaskStatus; dueAt: Date | null };

export function TaskForm({ projectId, task }: { projectId: string; task?: TaskInput }) {
  return <form action={task ? updateTask : createTask}>
    <input type="hidden" name="projectId" value={projectId} />
    {task && <input type="hidden" name="id" value={task.id} />}
    <div className="form-grid">
      <div className="field full"><label htmlFor={`task-title-${task?.id ?? "new"}`}>Task title</label><input className="input" id={`task-title-${task?.id ?? "new"}`} name="title" defaultValue={task?.title} required maxLength={180} /></div>
      <div className="field"><label htmlFor={`task-status-${task?.id ?? "new"}`}>Status</label><select className="input" id={`task-status-${task?.id ?? "new"}`} name="status" defaultValue={task?.status ?? "TODO"}><option value="TODO">To do</option><option value="IN_PROGRESS">In progress</option><option value="DONE">Done</option></select></div>
      <div className="field"><label htmlFor={`task-due-${task?.id ?? "new"}`}>Due date and time</label><input className="input" id={`task-due-${task?.id ?? "new"}`} name="dueAt" type="datetime-local" defaultValue={toQatarDateTimeInput(task?.dueAt)} /></div>
      <div className="field full"><label htmlFor={`task-description-${task?.id ?? "new"}`}>Description</label><textarea className="input" id={`task-description-${task?.id ?? "new"}`} name="description" defaultValue={task?.description} maxLength={4000} /></div>
      <div className="field full"><label htmlFor={`task-notes-${task?.id ?? "new"}`}>Task notes</label><textarea className="input" id={`task-notes-${task?.id ?? "new"}`} name="notes" defaultValue={task?.notes} maxLength={10000} /></div>
    </div>
    <p className="hint">Dates and times are interpreted and displayed in Asia/Qatar.</p>
    <div className="form-actions"><button className="button" type="submit">{task ? "Save task" : "Add task"}</button></div>
  </form>;
}
