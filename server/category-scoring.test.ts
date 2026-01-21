import { describe, it, expect } from "vitest";
import { calculateWeeklySummary } from "./lib/analytics-utils";

describe("category-scoring utils", () => {
  describe("calculateWeeklySummary", () => {
    it("should return 0 for empty scores", () => {
      const result = calculateWeeklySummary([]);
      expect(result.weeklyScore).toBe(0);
      expect(result.trend).toBe("stable");
    });

    it("should calculate average correctly", () => {
      const result = calculateWeeklySummary([10, 20, 30]);
      expect(result.weeklyScore).toBe(20);
    });

    it("should detect improving trend", () => {
      const result = calculateWeeklySummary([10, 10, 20, 20]);
      expect(result.trend).toBe("improving");
      expect(result.delta).toBeGreaterThan(0);
    });

    it("should detect declining trend", () => {
      const result = calculateWeeklySummary([20, 20, 10, 10]);
      expect(result.trend).toBe("declining");
      expect(result.delta).toBeLessThan(0);
    });

    it("should detect stable trend", () => {
      const result = calculateWeeklySummary([15, 16, 15, 14]);
      expect(result.trend).toBe("stable");
    });
  });
});
