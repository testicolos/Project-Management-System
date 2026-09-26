import { describe, expect, it } from "vitest";
import { calculateProgress, formatQar, formatDate, qatarLocalToDate, toQatarDateTimeInput } from "@/lib/utils";

describe("portfolio utilities", () => {
  it("derives progress only from completed tasks", () => {
    expect(calculateProgress([])).toBe(0);
    expect(calculateProgress(["DONE", "IN_PROGRESS", "TODO"])).toBe(33);
    expect(calculateProgress(["DONE", "DONE"])).toBe(100);
  });
  it("formats values exclusively in QAR", () => {
    expect(formatQar(1250)).toContain("QAR");
    expect(formatQar(1250)).toContain("1,250");
  });
  it("round-trips Qatar local task timestamps", () => {
    const date = qatarLocalToDate("2026-10-01T09:30");
    expect(date?.toISOString()).toBe("2026-10-01T06:30:00.000Z");
    expect(toQatarDateTimeInput(date)).toBe("2026-10-01T09:30");
  });
  it("keeps date-only fields stable in Qatar", () => {
    expect(formatDate("2026-09-26")).toMatch(/26 Sept 2026|26 Sep 2026/);
  });
});
