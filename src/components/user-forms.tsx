"use client";

import { useActionState, useState } from "react";
import { createUser, resetUserPassword, updateUser } from "@/app/actions";
import type { UserRole } from "@/db/schema";

type Company = { id: string; name: string; code: string };
type UserInput = { id: string; role: UserRole; active: boolean; companies: Array<{ companyId: string }> };

function CompanyChecks({ companies, selected = [], onSelectedChange }: { companies: Company[]; selected?: string[]; onSelectedChange?: (selected: string[]) => void }) {
  return <div className="field full"><span>Company access</span><div className="check-grid">{companies.map((company) => {
    const checked = selected.includes(company.id);
    const selectionProps = onSelectedChange
      ? { checked, onChange: () => onSelectedChange(checked ? selected.filter((id) => id !== company.id) : [...selected, company.id]) }
      : { defaultChecked: checked };
    return <label className="check" key={company.id}><input type="checkbox" name="companyIds" value={company.id} {...selectionProps} />{company.name} <span className="hint">({company.code})</span></label>;
  })}</div></div>;
}

export function CreateUserForm({ companies }: { companies: Company[] }) {
  const [state, formAction, pending] = useActionState(createUser, { message: "" });
  const [values, setValues] = useState({ name: "", username: "", email: "", password: "", role: "READ_ONLY", companyIds: [] as string[] });
  const update = (key: "name" | "username" | "email" | "password" | "role", value: string) => setValues((current) => ({ ...current, [key]: value }));
  return <form action={formAction}><div className="form-grid"><div className="field"><label htmlFor="new-user-name">Full name</label><input className="input" id="new-user-name" name="name" required maxLength={120} value={values.name} onChange={(event) => update("name", event.target.value)} /></div><div className="field"><label htmlFor="new-user-username">Username</label><input className="input" id="new-user-username" name="username" required minLength={3} maxLength={64} autoComplete="off" value={values.username} onChange={(event) => update("username", event.target.value)} /></div><div className="field"><label htmlFor="new-user-email">Email</label><input className="input" id="new-user-email" name="email" type="email" required maxLength={255} value={values.email} onChange={(event) => update("email", event.target.value)} /></div><div className="field"><label htmlFor="new-user-role">Role</label><select className="input" id="new-user-role" name="role" value={values.role} onChange={(event) => update("role", event.target.value)}><option value="READ_ONLY">Read-only</option><option value="ADMIN">Administrator</option></select></div><div className="field"><label htmlFor="new-user-password">Temporary password</label><input className="input" id="new-user-password" name="password" type="password" required minLength={8} autoComplete="new-password" value={values.password} onChange={(event) => update("password", event.target.value)} /></div><CompanyChecks companies={companies} selected={values.companyIds} onSelectedChange={(companyIds) => setValues((current) => ({ ...current, companyIds }))} /></div><p className="hint">Passwords must be at least 8 characters and include uppercase, lowercase, and a number.</p>{state.message ? <div className="flash error" role="alert" aria-live="polite">{state.message}</div> : null}<div className="form-actions"><button className="button" type="submit" disabled={pending}>{pending ? "Creating…" : "Create user"}</button></div></form>;
}

export function EditUserForm({ user, companies }: { user: UserInput; companies: Company[] }) {
  const selected = user.companies.map((company) => company.companyId);
  return <div className="stack"><form action={updateUser}><input type="hidden" name="id" value={user.id} /><div className="form-grid"><div className="field"><label htmlFor={`role-${user.id}`}>Role</label><select className="input" id={`role-${user.id}`} name="role" defaultValue={user.role}><option value="READ_ONLY">Read-only</option><option value="ADMIN">Administrator</option></select></div><div className="field"><label htmlFor={`active-${user.id}`}>Access status</label><select className="input" id={`active-${user.id}`} name="active" defaultValue={String(user.active)}><option value="true">Active</option><option value="false">Revoked</option></select></div><CompanyChecks companies={companies} selected={selected} /></div><div className="form-actions"><button className="button" type="submit">Save access</button></div></form><div style={{ borderTop: "1px solid var(--line)", paddingTop: "1rem" }}><form action={resetUserPassword}><input type="hidden" name="id" value={user.id} /><div className="field"><label htmlFor={`password-${user.id}`}>Set a new password</label><input className="input" id={`password-${user.id}`} name="password" type="password" minLength={8} required autoComplete="new-password" /></div><p className="hint">At least 8 characters with uppercase, lowercase, and a number.</p><div className="form-actions"><button className="button secondary" type="submit">Change password</button></div></form></div></div>;
}
