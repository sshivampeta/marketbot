import { describe, expect, it } from "vitest";
import { dedupeEvents, eventFingerprint } from "./dedupe.js";

describe("dedupeEvents", () => {
  it("removes duplicate events by fingerprint", () => {
    const events = [
      {
        id: "",
        sourceId: "test",
        title: "Fed raises rates",
        summary: "",
        url: "https://example.com/a",
        publishedAt: "2026-01-01T00:00:00.000Z",
        fetchedAt: "2026-01-01T00:05:00.000Z",
        tickers: [],
        metadata: {},
      },
      {
        id: "",
        sourceId: "test",
        title: "Fed raises rates",
        summary: "",
        url: "https://example.com/a",
        publishedAt: "2026-01-01T00:00:00.000Z",
        fetchedAt: "2026-01-01T00:06:00.000Z",
        tickers: [],
        metadata: {},
      },
    ];

    const result = dedupeEvents(events);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(eventFingerprint(events[0]));
  });
});
