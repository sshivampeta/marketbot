import type { SourceConfig } from "@marketbot/connectors";
import type { ClassifiedEvent, Signal, TradeRecommendation } from "@marketbot/signals";
import type { PaperBroker } from "@marketbot/broker";
import type { runSignalPipeline } from "@marketbot/signals";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "modified";

export interface Approval {
  id: string;
  recommendationId: string;
  status: ApprovalStatus;
  modifiedQuantity?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IngestResult {
  sourceId: string;
  fetched: number;
  newEvents: number;
}

export interface StoreCounts {
  sources: number;
  events: number;
  signals: number;
  recommendations: number;
  approvals: number;
}

export interface MarketStoreLike {
  getSources(): Promise<SourceConfig[]>;
  findSource(id: string): Promise<SourceConfig | undefined>;
  getEvents(limit: number): Promise<ClassifiedEvent[]>;
  getSignals(limit: number): Promise<Signal[]>;
  getRecommendations(limit: number): Promise<TradeRecommendation[]>;
  getApprovals(): Promise<Approval[]>;
  findApproval(id: string): Promise<Approval | undefined>;
  findRecommendation(id: string): Promise<TradeRecommendation | undefined>;
  listPendingApprovals(): Promise<Approval[]>;
  updateApproval(approval: Approval): Promise<void>;
  addPipelineResult(result: ReturnType<typeof runSignalPipeline>): Promise<number>;
  recordIngest(result: IngestResult): Promise<void>;
  getCounts(): Promise<StoreCounts>;
}

export interface EngineDeps {
  store: MarketStoreLike;
  userAgent: string;
  broker: PaperBroker;
}

export interface WorkerEnv {
  DB: D1Database;
  SEC_USER_AGENT?: string;
}
