import { describe, it, expect } from "vitest";
import { todayInNewYork, nowInNewYorkLabel } from "../src/date";

describe("date utilities", () => {
  describe("todayInNewYork", () => {
    it("returns the current day in America/New_York (EDT, late evening edge case)", () => {
      // 2026-08-13T02:30:00Z is 10:30 PM on Aug 12 in EDT (UTC-4)
      const result = todayInNewYork(new Date("2026-08-13T02:30:00Z"));
      expect(result).toBe("2026-08-12");
    });

    it("returns the current day in America/New_York (regular case)", () => {
      // 2026-08-12T12:00:00Z is noon on Aug 12 in EDT
      const result = todayInNewYork(new Date("2026-08-12T12:00:00Z"));
      expect(result).toBe("2026-08-12");
    });

    it("handles winter EST edge case correctly", () => {
      // 2026-01-02T04:30:00Z is 11:30 PM on Jan 1 in EST (UTC-5)
      const result = todayInNewYork(new Date("2026-01-02T04:30:00Z"));
      expect(result).toBe("2026-01-01");
    });
  });

  describe("nowInNewYorkLabel", () => {
    it("returns human-readable time in America/New_York", () => {
      // 2026-08-13T02:30:00Z is 10:30 PM on Aug 12 in EDT (UTC-4)
      const result = nowInNewYorkLabel(new Date("2026-08-13T02:30:00Z"));
      expect(result).toBe("10:30 PM");
    });
  });
});
