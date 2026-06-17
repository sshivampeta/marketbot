import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createDefaultDeps } from "./store.js";
import type { RawEvent } from "@marketbot/connectors";
import { runSignalPipeline } from "@marketbot/signals";

describe("engine API", () => {
  it("returns health status", async () => {
    const app = createApp(createDefaultDeps());
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("ok");
  });

  it("stores pipeline results as events and signals", async () => {
    const deps = createDefaultDeps();
    const event: RawEvent = {
      id: "test-1",
      sourceId: "fed-press",
      title: "Federal Reserve policy update",
      summary: "Rates unchanged amid inflation data.",
      url: "https://example.com",
      publishedAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      tickers: ["SPY"],
      metadata: {},
    };

    const added = await deps.store.addPipelineResult(runSignalPipeline([event]));
    expect(added).toBe(1);
    const signals = await deps.store.getSignals(10);
    expect(signals.length).toBeGreaterThan(0);
  });
});
