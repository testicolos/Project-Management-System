import { createUser, resetUserPassword, updateUser } from "@/app/actions";
import type { UserRole } from "@/db/schema";

type Company = { id: string; name: string; code: string };
type UserInput = { id: string; role: UserRole; active: boolean; companies: Array<{ companyId: string }> };

function CompanyChecks({ companies, selected = [] }: { companies: Company[]; selected?: string[] }) {
  return <div className="field full"><span>Company access</span><div className="check-grid">{companies.map((company) => <label className="check" key={company.id}><input type="checkbox" name="companyIds" value={company.id} defaultChecked={selected.includes(company.id)} />{company.name} <span className="hint">({company.code})</span></label>)}</div></div>;
}

export function CreateUserForm({ companies }: { companies: Company[] }) {
  return <form action={createUser}><div className="form-grid"><div className="field"><label htmlFor="new-user-name">Full name</label><input className="input" id="new-user-name" name="name" required maxLength={120} /></div><div className="field"><label htmlFor="new-user-email">Email</label><input className="input" id="new-user-email" name="email" type="email" required maxLength={255} /></div><div className="field"><label htmlFor="new-user-role">Role</label><select className="input" id="new-user-role" name="role" defaultValue="READ_ONLY"><option value="READ_ONLY">Read-only</option><option value="ADMIN">Administrator</option></select></div><div className="field"><label htmlFor="new-user-password">Temporary password</label><input className="input" id="new-user-password" name="password" type="password" required minLength={10} autoComplete="new-password" /></div><CompanyChecks companies={companies} /></div><p className="hint">Passwords require uppercase, lowercase, and a number. Share temporary credentials through your approved secure channel.</p><div className="form-actions"><button className="button" type="submit">Create user</button></div></form>;
}

export function EditUserForm({ user, companies }: { user: UserInput; companies: Company[] }) {
  const selected = user.companies.map((company) => company.companyId);
  return <div className="stack"><form action={updateUser}><input type="hidden" name="id" value={user.id} /><div className="form-grid"><div className="field"><label htmlFor={`role-${user.id}`}>Role</label><select className="input" id={`role-${user.id}`} name="role" defaultValue={user.role}><option value="READ_ONLY">Read-only</option><option value="ADMIN">Administrator</option></select></div><div className="field"><label htmlFor={`active-${user.id}`}>Account status</label><select className="input" id={`active-${user.id}`} name="active" defaultValue={String(user.active)}><option value="true">Active</option><option value="false">Inactive</option></select></div><CompanyChecks companies={companies} selected={selected} /></div><div className="form-actions"><button className="button" type="submit">Save access</button></div></form><div style={{ borderTop: "1px solid var(--line)", paddingTop: "1rem" }}><form action={resetUserPassword}><input type="hidden" name="id" value={user.id} /><div className="field"><label htmlFor={`password-${user.id}`}>Reset password</label><input className="input" id={`password-${user.id}`} name="password" type="password" minLength={10} required autoComplete="new-password" /></div><div className="form-actions"><button className="button secondary" type="submit">Reset password</button></div></form></div></div>;
}
