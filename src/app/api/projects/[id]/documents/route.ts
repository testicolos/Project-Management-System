import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents, projects } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

const acceptedTypes = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "text/plain", "image/png", "image/jpeg"]);
const maxBytes = 4 * 1024 * 1024;

function back(request: Request, id: string, type: "success" | "error", message: string) {
  return NextResponse.redirect(new URL(`/projects/${id}?${type}=${encodeURIComponent(message)}`, request.url), 303);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response("Invalid origin", { status: 403 });
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return back(request, id, "error", "Administrator access is required");
  const [project] = await db.select({ companyId: projects.companyId }).from(projects).where(and(eq(projects.id, id))).limit(1);
  if (!project || !user.companyIds.includes(project.companyId)) return back(request, id, "error", "Project access denied");

  const formData = await request.formData();
  const file = formData.get("document");
  if (!(file instanceof File) || file.size === 0) return back(request, id, "error", "Choose a file to upload");
  if (file.size > maxBytes) return back(request, id, "error", "File exceeds the 4 MB limit");
  if (!acceptedTypes.has(file.type)) return back(request, id, "error", "This file type is not supported");
  await db.insert(documents).values({
    projectId: id,
    name: file.name.slice(0, 255),
    mimeType: file.type,
    sizeBytes: String(file.size),
    content: Buffer.from(await file.arrayBuffer()),
    uploadedBy: user.id,
  });
  return back(request, id, "success", "Document uploaded");
}
