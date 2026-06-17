import { describe, expect, it } from "vitest";

describe("scheduler", () => {
  it("has engine url default", () => {
    expect(process.env.ENGINE_URL ?? "http://localhost:8787").toContain("8787");
  });
});
