import { describe, expect, it } from "vitest";
import { PaperBroker } from "./index.js";

describe("PaperBroker", () => {
  it("fills paper orders immediately", async () => {
    const broker = new PaperBroker();
    const result = await broker.submitOrder({ ticker: "AAPL", action: "buy", quantity: 1 });
    expect(result.order.status).toBe("filled");
    expect(await broker.getOrder(result.order.id)).not.toBeNull();
  });
});
