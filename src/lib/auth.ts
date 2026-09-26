import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { userCompanyAccess, users, type UserRole } from "@/db/schema";

const COOKIE_NAME = "project_command_session";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not configured");
  return new TextEncoder().encode(value);
}

export type SessionUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  companyIds: string[];
};

export async function createSession(userId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const [user] = await db.select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      role: users.role,
    }).from(users).where(and(eq(users.id, payload.sub), eq(users.active, true))).limit(1);
    if (!user) return null;
    const access = await db.select({ companyId: userCompanyAccess.companyId })
      .from(userCompanyAccess)
      .where(eq(userCompanyAccess.userId, user.id));
    return { ...user, companyIds: access.map((row) => row.companyId) };
  } catch {
    return null;
  }
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/?error=Administrator+access+is+required");
  return user;
}

export function canAccessCompany(user: SessionUser, companyId: string) {
  return user.companyIds.includes(companyId);
}

export function assertCompanyAccess(user: SessionUser, companyId: string) {
  if (!canAccessCompany(user, companyId)) throw new Error("Company access denied");
}
