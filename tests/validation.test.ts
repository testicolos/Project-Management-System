import { describe, expect, it } from "vitest";
import { passwordSchema, projectSchema, userSchema } from "@/lib/validation";

describe("application validation", () => {
  it("rejects negative costs", () => {
    const result = projectSchema.safeParse({ companyId: crypto.randomUUID(), name: "Launch", description: "", status: "CURRENT", costQar: -1, startDate: "", targetDate: "", generalNotes: "" });
    expect(result.success).toBe(false);
  });
  it("rejects a target date before the start date", () => {
    const result = projectSchema.safeParse({ companyId: crypto.randomUUID(), name: "Launch", description: "", status: "PENDING", costQar: 10, startDate: "2026-10-02", targetDate: "2026-10-01", generalNotes: "" });
    expect(result.success).toBe(false);
  });
  it("requires strong passwords and at least one company", () => {
    expect(passwordSchema.safeParse("weakpassword").success).toBe(false);
    expect(userSchema.safeParse({ name: "Viewer User", email: "viewer@example.com", password: "StrongPass123", role: "READ_ONLY", companyIds: [] }).success).toBe(false);
  });
});
