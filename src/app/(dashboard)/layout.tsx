import { Radar } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { initials } from "@/lib/utils";
import { Navigation } from "@/components/nav";
import { signOut } from "@/app/actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Radar size={20} /></span><div><div className="brand-name">Project Managment</div><div className="brand-kicker">Operations deck</div></div></div>
      <Navigation isAdmin={user.role === "ADMIN"} />
      <div className="sidebar-spacer" />
      <div className="user-card"><div className="user-row"><span className="avatar">{initials(user.name)}</span><div style={{ minWidth: 0 }}><div className="user-name">{user.name}</div><div className="user-role">@{user.username} · {user.role === "ADMIN" ? "Administrator" : "Read-only"}</div></div></div><form action={signOut}><button className="signout" type="submit">Sign out</button></form></div>
    </aside>
    <main className="main">{children}</main>
  </div>;
}
