export type OrderStatus = "pending" | "submitted" | "filled" | "rejected" | "cancelled";

export interface Order {
  id: string;
  ticker: string;
  action: "buy" | "sell";
  quantity: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionResult {
  order: Order;
  message: string;
}

export interface BrokerAdapter {
  name: string;
  submitOrder(order: Omit<Order, "id" | "status" | "createdAt" | "updatedAt">): Promise<ExecutionResult>;
  getOrder(id: string): Promise<Order | null>;
}

export class PaperBroker implements BrokerAdapter {
  name = "paper";
  private orders = new Map<string, Order>();

  async submitOrder(
    input: Omit<Order, "id" | "status" | "createdAt" | "updatedAt">,
  ): Promise<ExecutionResult> {
    const now = new Date().toISOString();
    const id = `paper-${Date.now()}`;
    const order: Order = {
      ...input,
      id,
      status: "filled",
      createdAt: now,
      updatedAt: now,
    };
    this.orders.set(id, order);
    return { order, message: "Paper order filled" };
  }

  async getOrder(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }
}
