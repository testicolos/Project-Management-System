import { Plus, Tags, Trash2 } from "lucide-react";
import { createProjectType, deleteProjectType } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { getProjectTypesWithCount } from "@/lib/data";
import { Modal } from "@/components/modal";
import { Flash } from "@/components/flash";
import { ConfirmSubmit } from "@/components/confirm-submit";

export const metadata = { title: "Project Types" };

export default async function ProjectTypesPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireAdmin();
  const [flash, rows] = await Promise.all([searchParams, getProjectTypesWithCount()]);

  return <>
    <header className="topbar">
      <div>
        <div className="eyebrow">Project setup</div>
        <h1>Project Types</h1>
        <p className="lede">Manage the type options available when administrators create or edit projects.</p>
      </div>
      <Modal title="Add project type" trigger={<button className="button" type="button"><Plus /> Add type</button>}>
        <form action={createProjectType}>
          <div className="field">
            <label htmlFor="project-type-name">Type name</label>
            <input className="input" id="project-type-name" name="name" required maxLength={80} placeholder="e.g. Awarded" />
          </div>
          <div className="form-actions"><button className="button" type="submit">Add type</button></div>
        </form>
      </Modal>
    </header>
    <Flash success={flash.success} error={flash.error} />
    <section className="panel">
      <div className="panel-head"><h2>Available project types</h2><span className="hint">{rows.length} types</span></div>
      <div className="panel-body">
        {rows.length ? rows.map((type) => <article className="company-row" key={type.id}>
          <div className="user-row"><span className="avatar"><Tags size={16} /></span><div><div className="file-name">{type.name}</div><div className="file-meta">{type.projectCount} project{type.projectCount === 1 ? "" : "s"}</div></div></div>
          {type.projectCount === 0 ? <form action={deleteProjectType}><input type="hidden" name="id" value={type.id} /><ConfirmSubmit confirmText={`Delete project type "${type.name}"?`}><Trash2 /> Delete</ConfirmSubmit></form> : <span className="hint">In use</span>}
        </article>) : <div className="empty">No project types yet.</div>}
      </div>
    </section>
  </>;
}
