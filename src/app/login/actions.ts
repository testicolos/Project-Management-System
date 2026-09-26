"use server";

import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/lib/auth";
import { usernameSchema } from "@/lib/validation";

export async function signIn(formData: FormData) {
  const usernameResult = usernameSchema.safeParse(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!usernameResult.success || !password) redirect("/login?error=Invalid+username+or+password");

  const [user] = await db.select().from(users).where(eq(users.username, usernameResult.data)).limit(1);
  const valid = user?.active && await compare(password, user.passwordHash);
  if (!valid) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    redirect("/login?error=Invalid+username+or+password");
  }
  await createSession(user.id);
  redirect("/");
}
