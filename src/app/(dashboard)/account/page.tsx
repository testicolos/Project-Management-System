import { KeyRound } from "lucide-react";
import { changeOwnPassword } from "@/app/actions";
import { Flash } from "@/components/flash";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Account" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [user, flash] = await Promise.all([requireUser(), searchParams]);
  return <>
    <header className="topbar"><div><div className="eyebrow">Account security</div><h1>Change password</h1><p className="lede">Update the password for @{user.username}. You will be signed out after the change.</p></div></header>
    <Flash error={flash.error} />
    <section className="panel account-panel">
      <div className="panel-head"><div><h2><KeyRound size={18} style={{ display: "inline", marginRight: ".45rem", verticalAlign: "text-bottom" }} />Password</h2><div className="hint">Available to administrators and read-only users</div></div></div>
      <div className="panel-body"><form action={changeOwnPassword} className="stack"><div className="field"><label htmlFor="current-password">Current password</label><input className="input" id="current-password" name="currentPassword" type="password" required autoComplete="current-password" /></div><div className="field"><label htmlFor="new-password">New password</label><input className="input" id="new-password" name="newPassword" type="password" minLength={8} required autoComplete="new-password" /></div><div className="field"><label htmlFor="confirm-password">Confirm new password</label><input className="input" id="confirm-password" name="confirmPassword" type="password" minLength={8} required autoComplete="new-password" /></div><p className="hint">Use at least 8 characters with uppercase, lowercase, and a number.</p><div className="form-actions"><button className="button" type="submit">Change password</button></div></form></div>
    </section>
  </>;
}
