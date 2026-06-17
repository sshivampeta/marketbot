import type { SourceConfig } from "@marketbot/connectors";
import { dedupeEvents, getConnector } from "@marketbot/connectors";
import { runSignalPipeline } from "@marketbot/signals";
import { DEFAULT_RISK_CONFIG, runRiskChecks } from "@marketbot/risk";
import { detectWashSale } from "@marketbot/tax";
import { PaperBroker } from "@marketbot/broker";
import { D1Store } from "./d1-store.js";
import { MemoryStore } from "./memory-store.js";
import type { EngineDeps, IngestResult, WorkerEnv } from "./types.js";

export type { Approval, ApprovalStatus, EngineDeps, IngestResult, WorkerEnv } from "./types.js";

export async function ingestSource(
  source: SourceConfig,
  deps: Pick<EngineDeps, "store" | "userAgent">,
): Promise<IngestResult> {
  const connector = getConnector(source.kind);
  if (!connector) {
    throw new Error(`No connector for kind: ${source.kind}`);
  }

  const raw = await connector.fetchEvents(source, { userAgent: deps.userAgent });
  const deduped = dedupeEvents(raw);
  const pipeline = runSignalPipeline(deduped);
  const newEvents = await deps.store.addPipelineResult(pipeline);

  const result: IngestResult = {
    sourceId: source.id,
    fetched: raw.length,
    newEvents,
  };

  await deps.store.recordIngest(result);
  return result;
}

export async function ingestAll(deps: Pick<EngineDeps, "store" | "userAgent">): Promise<IngestResult[]> {
  const sources = await deps.store.getSources();
  const enabled = sources.filter((source) => source.enabled);
  const results: IngestResult[] = [];

  for (const source of enabled) {
    try {
      results.push(await ingestSource(source, deps));
    } catch (err) {
      results.push({
        sourceId: source.id,
        fetched: 0,
        newEvents: 0,
      });
      console.error(`Ingest failed for ${source.id}:`, err);
    }
  }

  return results;
}

export async function evaluateApproval(
  approvalId: string,
  deps: EngineDeps,
): Promise<{ risk: ReturnType<typeof runRiskChecks>; tax: ReturnType<typeof detectWashSale> } | null> {
  const approval = await deps.store.findApproval(approvalId);
  if (!approval) return null;

  const rec = await deps.store.findRecommendation(approval.recommendationId);
  if (!rec) return null;

  const proposal = {
    ticker: rec.ticker,
    action: rec.action as "buy" | "sell",
    quantity: approval.modifiedQuantity ?? rec.quantity,
  };

  const pending = await deps.store.listPendingApprovals();
  const risk = runRiskChecks(proposal, DEFAULT_RISK_CONFIG, {
    openOrders: pending.length,
    dailyPnl: 0,
    currentPosition: 0,
  });

  const tax = detectWashSale(proposal, [], []);

  return { risk, tax };
}

export function createDefaultDeps(): EngineDeps {
  return {
    store: new MemoryStore(),
    userAgent: process.env.SEC_USER_AGENT ?? "marketbot-dev@example.com",
    broker: new PaperBroker(),
  };
}

export function createWorkerDeps(env: WorkerEnv): EngineDeps {
  return {
    store: new D1Store(env.DB),
    userAgent: env.SEC_USER_AGENT ?? "marketbot-worker@example.com",
    broker: new PaperBroker(),
  };
}
