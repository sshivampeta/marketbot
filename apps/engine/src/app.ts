import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  createDefaultDeps,
  evaluateApproval,
  ingestAll,
  ingestSource,
  type EngineDeps,
} from "./store.js";

export function createApp(deps: EngineDeps = createDefaultDeps()) {
  const app = new Hono();

  app.use("*", cors());

  app.get("/health", async (c) => {
    const counts = await deps.store.getCounts();
    return c.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      counts,
    });
  });

  app.get("/sources", async (c) => c.json({ sources: await deps.store.getSources() }));

  app.post("/sources/:id/ingest", async (c) => {
    const id = c.req.param("id");
    const source = await deps.store.findSource(id);
    if (!source) return c.json({ error: "Source not found" }, 404);

    const result = await ingestSource(source, deps);
    return c.json({ result });
  });

  app.post("/ingest", async (c) => {
    const results = await ingestAll(deps);
    return c.json({ results });
  });

  app.get("/events", async (c) => {
    const limit = Number(c.req.query("limit") ?? 50);
    return c.json({ events: await deps.store.getEvents(limit) });
  });

  app.get("/signals", async (c) => {
    const limit = Number(c.req.query("limit") ?? 50);
    return c.json({ signals: await deps.store.getSignals(limit) });
  });

  app.get("/recommendations", async (c) => {
    const limit = Number(c.req.query("limit") ?? 50);
    return c.json({ recommendations: await deps.store.getRecommendations(limit) });
  });

  app.get("/approvals", async (c) => c.json({ approvals: await deps.store.getApprovals() }));

  app.post("/approvals/:id/decide", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<{ status: "approved" | "rejected" | "modified"; quantity?: number; notes?: string }>();

    const approval = await deps.store.findApproval(id);
    if (!approval) return c.json({ error: "Approval not found" }, 404);

    const evaluation = await evaluateApproval(id, deps);
    if (!evaluation) return c.json({ error: "Recommendation not found" }, 404);

    if (body.status === "approved" || body.status === "modified") {
      if (!evaluation.risk.passed) {
        return c.json({ error: "Risk checks failed", violations: evaluation.risk.violations }, 422);
      }
    }

    approval.status = body.status;
    approval.modifiedQuantity = body.quantity;
    approval.notes = body.notes;
    approval.updatedAt = new Date().toISOString();
    await deps.store.updateApproval(approval);

    let execution = null;
    if (body.status === "approved" || body.status === "modified") {
      const rec = await deps.store.findRecommendation(approval.recommendationId);
      if (rec && (rec.action === "buy" || rec.action === "sell")) {
        execution = await deps.broker.submitOrder({
          ticker: rec.ticker,
          action: rec.action,
          quantity: body.quantity ?? rec.quantity,
        });
      }
    }

    return c.json({
      approval,
      evaluation,
      execution,
    });
  });

  return app;
}

export const app = createApp();
