"use server";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { emailSchema } from "@/lib/validation";

export async function signIn(formData: FormData) {
  const emailResult = emailSchema.safeParse(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!emailResult.success || !password) redirect("/login?error=Invalid+email+or+password");

  const [user] = await db.select().from(users).where(eq(users.email, emailResult.data)).limit(1);
  const valid = user?.active && await compare(password, user.passwordHash);
  if (!valid) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    redirect("/login?error=Invalid+email+or+password");
  }
  await createSession(user.id);
  redirect("/");
}
