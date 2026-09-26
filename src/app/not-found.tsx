import Link from "next/link";

export default function NotFound() {
  return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "1rem" }}><div className="panel" style={{ maxWidth: "30rem", padding: "2rem", textAlign: "center" }}><div className="eyebrow">404</div><h1>Record not found</h1><p className="lede">This item does not exist or is outside your company access.</p><Link href="/" className="button" style={{ marginTop: "1rem" }}>Return to overview</Link></div></main>;
}
