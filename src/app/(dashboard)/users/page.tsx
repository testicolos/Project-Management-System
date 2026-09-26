import { Pencil, Plus, ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getAllCompanies, getUsersWithAccess } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { Modal } from "@/components/modal";
import { CreateUserForm, EditUserForm } from "@/components/user-forms";
import { Flash } from "@/components/flash";

export const metadata = { title: "Users" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  await requireAdmin();
  const [flash, users, companies] = await Promise.all([searchParams, getUsersWithAccess(), getAllCompanies()]);
  return <><header className="topbar"><div><div className="eyebrow">Administration</div><h1>Users & access</h1><p className="lede">Control administrator or read-only roles, passwords, and the companies each person can see.</p></div><Modal title="Create user" trigger={<button className="button" type="button"><Plus /> New user</button>}><CreateUserForm companies={companies} /></Modal></header><Flash success={flash.success} error={flash.error} /><section className="panel"><div className="panel-head"><h2>User directory</h2><span className="hint">{users.filter((user) => user.active).length} active</span></div><div className="panel-body">{users.map((user) => <article className="user-row-table" key={user.id}><div className="user-row"><span className="avatar"><ShieldCheck size={16} /></span><div><div className="file-name">{user.name} <span className="hint">@{user.username}</span></div><div className="file-meta">{user.email} · Added {formatDate(user.createdAt)}</div></div></div><div><span className={`status ${user.active ? "current" : "finalized"}`}>{user.active ? "Active" : "Revoked"}</span></div><div><div className="file-name">{user.role === "ADMIN" ? "Administrator" : "Read-only"}</div><div className="file-meta">{user.companies.map((company) => company.companyName).join(", ")}</div></div><Modal title={`Manage ${user.name}`} trigger={<button className="button secondary" type="button"><Pencil /> Manage</button>}><EditUserForm user={user} companies={companies} /></Modal></article>)}</div></section></>;
}
