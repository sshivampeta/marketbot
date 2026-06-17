import { describe, expect, it } from "vitest";
import { classifyEvent } from "./classify.js";
import { scoreEvent } from "./score.js";
import { runSignalPipeline } from "./pipeline.js";

const baseEvent = {
  id: "evt-1",
  sourceId: "fed-press",
  title: "Federal Reserve raises interest rates",
  summary: "The Fed increased rates citing inflation concerns.",
  url: "https://example.com",
  publishedAt: new Date().toISOString(),
  fetchedAt: new Date().toISOString(),
  tickers: ["SPY"],
  metadata: {},
};

describe("classifyEvent", () => {
  it("classifies macro events", () => {
    const result = classifyEvent(baseEvent);
    expect(result.category).toBe("macro");
    expect(result.keywords.length).toBeGreaterThan(0);
  });
});

describe("scoreEvent", () => {
  it("produces a signal with confidence", () => {
    const classified = classifyEvent(baseEvent);
    const signal = scoreEvent(classified);
    expect(signal.direction).toBeDefined();
    expect(signal.confidence).toBeGreaterThan(0);
    expect(signal.ticker).toBe("SPY");
  });
});

describe("runSignalPipeline", () => {
  it("generates recommendations above confidence threshold", () => {
    const result = runSignalPipeline([
      baseEvent,
      {
        ...baseEvent,
        id: "evt-2",
        title: "Company misses earnings guidance",
        summary: "Revenue decline triggers downgrade.",
        tickers: ["AAPL"],
      },
    ]);

    expect(result.events).toHaveLength(2);
    expect(result.signals).toHaveLength(2);
    expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
  });
});
