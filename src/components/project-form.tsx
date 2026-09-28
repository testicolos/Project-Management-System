import type { ProjectStatus } from "@/db/schema";
import { createProject, updateProject } from "@/app/actions";

type Company = { id: string; name: string; code: string };
type ProjectType = { id: string; name: string };
type ProjectInput = {
  id: string; companyId: string; projectTypeId: string | null; name: string; description: string; status: ProjectStatus;
  costQar: string; startDate: string | null; targetDate: string | null; generalNotes: string;
};

export function ProjectForm({ companies, projectTypes, project }: { companies: Company[]; projectTypes: ProjectType[]; project?: ProjectInput }) {
  return <form action={project ? updateProject : createProject}>
    {project && <input type="hidden" name="id" value={project.id} />}
    <div className="form-grid">
      <div className="field full"><label htmlFor="project-name">Project name</label><input className="input" id="project-name" name="name" defaultValue={project?.name} required maxLength={180} /></div>
      <div className="field"><label htmlFor="company">Company</label><select className="input" id="company" name="companyId" defaultValue={project?.companyId} required><option value="">Select company</option>{companies.map((company) => <option value={company.id} key={company.id}>{company.name} · {company.code}</option>)}</select></div>
      <div className="field"><label htmlFor="project-type">Type</label><select className="input" id="project-type" name="projectTypeId" defaultValue={project?.projectTypeId ?? ""} required><option value="">Select type</option>{projectTypes.map((type) => <option value={type.id} key={type.id}>{type.name}</option>)}</select></div>
      <div className="field"><label htmlFor="project-status">Status</label><select className="input" id="project-status" name="status" defaultValue={project?.status ?? "PENDING"}><option value="CURRENT">Current</option><option value="PENDING">Pending</option><option value="FINALIZED">Finalized</option></select></div>
      <div className="field"><label htmlFor="cost">Cost (QAR)</label><input className="input" id="cost" name="costQar" type="number" min="0" step="0.01" defaultValue={project?.costQar ?? "0"} required /></div>
      <div className="field"><label htmlFor="start-date">Start date</label><input className="input" id="start-date" name="startDate" type="date" defaultValue={project?.startDate ?? ""} /></div>
      <div className="field"><label htmlFor="target-date">Target date</label><input className="input" id="target-date" name="targetDate" type="date" defaultValue={project?.targetDate ?? ""} /></div>
      <div className="field full"><label htmlFor="description">Description</label><textarea className="input" id="description" name="description" defaultValue={project?.description} maxLength={4000} /></div>
      <div className="field full"><label htmlFor="general-notes">General notes</label><textarea className="input" id="general-notes" name="generalNotes" defaultValue={project?.generalNotes} maxLength={10000} /></div>
    </div>
    <p className="hint">All monetary values are stored and displayed only in Qatari riyals.</p>
    <div className="form-actions"><button className="button" type="submit">{project ? "Save project" : "Create project"}</button></div>
  </form>;
}
