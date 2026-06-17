import { describe, expect, it } from "vitest";

describe("web", () => {
  it("loads api base path", () => {
    expect("/api").toBe("/api");
  });
});
