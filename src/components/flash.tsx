export function Flash({ success, error }: { success?: string; error?: string }) {
  if (!success && !error) return null;
  return <div className={`flash ${error ? "error" : "success"}`} role="status">{error ?? success}</div>;
}
