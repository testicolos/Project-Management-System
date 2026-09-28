import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email().max(255);
export const usernameSchema = z.string().trim().toLowerCase().min(3, "Username must be at least 3 characters").max(64).regex(/^[a-z0-9._-]+$/, "Use only letters, numbers, dots, underscores, or hyphens");
export const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(128).regex(/[A-Z]/, "Use at least one uppercase letter").regex(/[a-z]/, "Use at least one lowercase letter").regex(/\d/, "Use at least one number");
export const projectNoteSchema = z.string().trim().min(1, "Enter a note").max(10_000);

export const companySchema = z.object({
  name: z.string().trim().min(2).max(160),
  code: z.string().trim().toUpperCase().min(2).max(24).regex(/^[A-Z0-9-]+$/),
});

export const projectTypeSchema = z.string().trim().min(2, "Enter a project type").max(80);

export const projectSchema = z.object({
  companyId: z.string().uuid(),
  projectTypeId: z.string().uuid("Choose a project type"),
  name: z.string().trim().min(2).max(180),
  description: z.string().trim().max(4000).default(""),
  status: z.enum(["CURRENT", "PENDING", "FINALIZED"]),
  costQar: z.coerce.number().min(0).max(999_999_999_999),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal("")),
  generalNotes: z.string().trim().max(10_000).default(""),
}).refine((data) => !data.startDate || !data.targetDate || data.targetDate >= data.startDate, {
  message: "Target date must be on or after the start date",
  path: ["targetDate"],
});

export const taskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(4000).default(""),
  notes: z.string().trim().max(10_000).default(""),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  dueAt: z.string().default(""),
});

export const userSchema = z.object({
  name: z.string().trim().min(2).max(120),
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["ADMIN", "READ_ONLY"]),
  companyIds: z.array(z.string().uuid()).min(1, "Choose at least one company"),
});
