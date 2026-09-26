import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardSummary } from "@/lib/data";
import { formatQar } from "@/lib/utils";
import { ProjectList } from "@/components/project-list";
import { Flash } from "@/components/flash";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const user = await requireUser();
  const [{ success, error }, summary] = await Promise.all([searchParams, getDashboardSummary(user)]);
  return <>
    <header className="topbar"><div><div className="eyebrow">Portfolio overview</div><h1>Command center</h1><p className="lede">Projects, delivery progress, and QAR commitments across your authorized companies.</p></div><Link href="/projects" className="button secondary">Open portfolio <ArrowRight /></Link></header>
    <Flash success={success} error={error} />
    <section className="metrics" aria-label="Portfolio summary">
      <article className="metric"><div className="metric-label">Current</div><div className="metric-value">{summary.counts.CURRENT}</div><div className="metric-note">Projects in delivery</div></article>
      <article className="metric"><div className="metric-label">Pending</div><div className="metric-value">{summary.counts.PENDING}</div><div className="metric-note">Awaiting start</div></article>
      <article className="metric"><div className="metric-label">Portfolio cost</div><div className="metric-value" style={{ fontSize: "clamp(1.2rem, 2.3vw, 1.7rem)" }}>{formatQar(summary.totalCost)}</div><div className="metric-note">QAR only</div></article>
      <article className="metric"><div className="metric-label">Average progress</div><div className="metric-value">{summary.averageProgress}%</div><div className="metric-note">Calculated from tasks</div></article>
    </section>
    <section className="panel"><div className="panel-head"><h2>Priority portfolio</h2><Link href="/projects" className="button ghost">View all</Link></div><ProjectList projects={summary.portfolio.filter((project) => project.status !== "FINALIZED").slice(0, 8)} /></section>
  </>;
}
