import { describe, expect, it } from "vitest";
import { detectWashSale } from "./index.js";

describe("detectWashSale", () => {
  it("warns on wash sale scenario", () => {
    const result = detectWashSale(
      { ticker: "AAPL", action: "buy", quantity: 1 },
      [{ ticker: "AAPL", quantity: 10, acquiredAt: "2025-01-01", costBasis: 150 }],
      [{ ticker: "AAPL", soldAt: new Date().toISOString() }],
    );
    expect(result.passed).toBe(false);
    expect(result.warnings[0]).toContain("wash sale");
  });
});
