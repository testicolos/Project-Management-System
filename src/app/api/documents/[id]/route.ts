import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { documents, projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || user.companyIds.length === 0) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const [document] = await db.select({ name: documents.name, mimeType: documents.mimeType, content: documents.content })
    .from(documents).innerJoin(projects, eq(projects.id, documents.projectId))
    .where(and(eq(documents.id, id), inArray(projects.companyId, user.companyIds))).limit(1);
  if (!document) return new Response("Not found", { status: 404 });
  const fallback = document.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const encoded = encodeURIComponent(document.name);
  return new Response(new Uint8Array(document.content), {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
