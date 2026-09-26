import Link from "next/link";
import { ArrowLeft, Download, FileText, Pencil, Plus, Upload } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCompaniesForUser, getProjectForUser } from "@/lib/data";
import { formatDate, formatDateTime, formatQar, humanFileSize } from "@/lib/utils";
import { Modal } from "@/components/modal";
import { ProjectForm } from "@/components/project-form";
import { TaskForm } from "@/components/task-form";
import { ProgressBar, StatusBadge } from "@/components/status-badge";
import { Flash } from "@/components/flash";
import { deleteDocument } from "@/app/actions";

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ success?: string; error?: string }> }) {
  const user = await requireUser();
  const [{ id }, flash] = await Promise.all([params, searchParams]);
  const [project, companies] = await Promise.all([getProjectForUser(user, id), getCompaniesForUser(user)]);
  if (!project) notFound();
  const isAdmin = user.role === "ADMIN";
  return <>
    <Link href="/projects" className="button ghost" style={{ marginBottom: ".7rem" }}><ArrowLeft /> Back to projects</Link>
    <Flash success={flash.success} error={flash.error} />
    <section className="detail-hero">
      <div className="detail-title"><div><div className="eyebrow">{project.companyName} · {project.companyCode}</div><h1>{project.name}</h1><p className="lede">{project.description || "No project description yet."}</p></div><div className="toolbar"><StatusBadge status={project.status} />{isAdmin && <Modal title="Edit project" trigger={<button type="button" className="button secondary"><Pencil /> Edit</button>}><ProjectForm companies={companies} project={project} /></Modal>}</div></div>
      <div className="detail-meta"><div className="detail-stat"><span>Cost</span><strong>{formatQar(project.costQar)}</strong></div><div className="detail-stat"><span>Start date</span><strong>{formatDate(project.startDate)}</strong></div><div className="detail-stat"><span>Target date</span><strong>{formatDate(project.targetDate)}</strong></div><div className="detail-stat" style={{ minWidth: "12rem", flex: 1 }}><ProgressBar value={project.progress} /></div></div>
    </section>
    <div className="grid-two">
      <section className="panel"><div className="panel-head"><div><h2>Delivery tasks</h2><div className="hint">{project.tasks.filter((task) => task.status === "DONE").length} of {project.tasks.length} complete</div></div>{isAdmin && <Modal title="Add task" trigger={<button type="button" className="button"><Plus /> Add task</button>}><TaskForm projectId={project.id} /></Modal>}</div><div className="panel-body"><div className="stack">{project.tasks.length ? project.tasks.map((task) => <article className="task" key={task.id}><div className="task-top"><div><h3 className="task-title">{task.title}</h3><div className="file-meta">Due {formatDateTime(task.dueAt)}</div></div><div className="toolbar"><StatusBadge status={task.status} />{isAdmin && <Modal title="Edit task" trigger={<button type="button" className="icon-button" aria-label={`Edit ${task.title}`}><Pencil size={16} /></button>}><TaskForm projectId={project.id} task={task} /></Modal>}</div></div>{task.description && <p>{task.description}</p>}<div className="task-notes"><strong>Notes</strong><p>{task.notes || "No notes yet."}</p></div></article>) : <div className="empty">No tasks yet. Progress remains at 0% until tasks are added.</div>}</div></div></section>
      <div className="stack"><section className="panel"><div className="panel-head"><h2>General notes</h2></div><div className="panel-body"><div className="notes">{project.generalNotes || "No general notes yet."}</div></div></section>
      <section className="panel"><div className="panel-head"><div><h2>Documents</h2><div className="hint">Up to 4 MB per file</div></div>{isAdmin && <Modal title="Upload document" trigger={<button type="button" className="button secondary"><Upload /> Upload</button>}><form action={`/api/projects/${project.id}/documents`} method="post" encType="multipart/form-data"><div className="field"><label htmlFor="document">Choose a document</label><input className="input" id="document" name="document" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg" required /></div><p className="hint">PDF, Office, text, CSV, PNG, and JPEG files are accepted.</p><div className="form-actions"><button className="button" type="submit">Upload document</button></div></form></Modal>}</div><div className="panel-body">{project.documents.length ? project.documents.map((document) => <div className="document-row" key={document.id}><div><div className="file-name"><FileText size={15} style={{ display: "inline", marginRight: ".4rem" }} />{document.name}</div><div className="file-meta">{humanFileSize(Number(document.sizeBytes))} · {document.uploaderName} · {formatDateTime(document.createdAt)}</div></div><Link className="button ghost" href={`/api/documents/${document.id}`}><Download /> Download</Link>{isAdmin && <form action={deleteDocument}><input type="hidden" name="id" value={document.id} /><input type="hidden" name="projectId" value={project.id} /><button className="button danger" type="submit">Remove</button></form>}</div>) : <div className="empty"><FileText /><p>No documents uploaded.</p></div>}</div></section></div>
    </div>
  </>;
}
