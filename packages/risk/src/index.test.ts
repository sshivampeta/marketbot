import { describe, expect, it } from "vitest";
import { DEFAULT_RISK_CONFIG, runRiskChecks } from "./index.js";

describe("runRiskChecks", () => {
  it("passes valid proposals", () => {
    const result = runRiskChecks(
      { ticker: "AAPL", action: "buy", quantity: 1 },
      DEFAULT_RISK_CONFIG,
      { openOrders: 0, dailyPnl: 0, currentPosition: 0 },
    );
    expect(result.passed).toBe(true);
  });

  it("blocks when kill switch is active", () => {
    const result = runRiskChecks(
      { ticker: "AAPL", action: "buy", quantity: 1 },
      { ...DEFAULT_RISK_CONFIG, killSwitch: true },
      { openOrders: 0, dailyPnl: 0, currentPosition: 0 },
    );
    expect(result.passed).toBe(false);
    expect(result.violations).toContain("Kill switch is active");
  });
});
