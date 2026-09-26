import { Radar } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { signIn } from "./actions";
import { Flash } from "@/components/flash";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { success, error } = await searchParams;
  return <main className="login-shell">
    <section className="login-visual"><div className="brand"><span className="brand-mark"><Radar size={20} /></span><div><div className="brand-name">Project Command</div><div className="brand-kicker">Qatar operations</div></div></div><div className="login-copy"><div className="eyebrow">One operational picture</div><h1>Lead every project with clarity.</h1><p className="lede">A focused command system for company portfolios, delivery tasks, notes, documents, and financial commitments.</p><div className="login-gridline" /></div><div className="hint">All dates and times use Asia/Qatar. Costs are maintained exclusively in QAR.</div></section>
    <section className="login-panel"><div className="login-card"><span className="brand-mark"><Radar size={20} /></span><h2>Welcome back</h2><p className="lede">Sign in with your assigned account.</p><Flash success={success} error={error} /><form action={signIn} className="stack"><div className="field"><label htmlFor="username">Username</label><input className="input" id="username" name="username" autoComplete="username" required /></div><div className="field"><label htmlFor="password">Password</label><input className="input" id="password" name="password" type="password" autoComplete="current-password" required /></div><button className="button" type="submit">Sign in</button></form><p className="login-foot">Access is restricted to authorized company portfolios.</p></div></section>
  </main>;
}
