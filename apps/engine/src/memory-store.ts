import { DEFAULT_SOURCES } from "@marketbot/connectors";
import type { SourceConfig } from "@marketbot/connectors";
import type { ClassifiedEvent, Signal, TradeRecommendation } from "@marketbot/signals";
import type { runSignalPipeline } from "@marketbot/signals";
import type { Approval, IngestResult, MarketStoreLike, StoreCounts } from "./types.js";

export class MemoryStore implements MarketStoreLike {
  private sources: SourceConfig[] = [...DEFAULT_SOURCES];
  private events: ClassifiedEvent[] = [];
  private signals: Signal[] = [];
  private recommendations: TradeRecommendation[] = [];
  private approvals: Approval[] = [];
  private eventIds = new Set<string>();

  async getSources(): Promise<SourceConfig[]> {
    return this.sources;
  }

  async findSource(id: string): Promise<SourceConfig | undefined> {
    return this.sources.find((source) => source.id === id);
  }

  async getEvents(limit: number): Promise<ClassifiedEvent[]> {
    return this.events.slice(0, limit);
  }

  async getSignals(limit: number): Promise<Signal[]> {
    return this.signals.slice(0, limit);
  }

  async getRecommendations(limit: number): Promise<TradeRecommendation[]> {
    return this.recommendations.slice(0, limit);
  }

  async getApprovals(): Promise<Approval[]> {
    return this.approvals;
  }

  async findApproval(id: string): Promise<Approval | undefined> {
    return this.approvals.find((approval) => approval.id === id);
  }

  async findRecommendation(id: string): Promise<TradeRecommendation | undefined> {
    return this.recommendations.find((rec) => rec.id === id);
  }

  async listPendingApprovals(): Promise<Approval[]> {
    return this.approvals.filter((approval) => approval.status === "pending");
  }

  async updateApproval(approval: Approval): Promise<void> {
    const index = this.approvals.findIndex((item) => item.id === approval.id);
    if (index >= 0) {
      this.approvals[index] = approval;
    }
  }

  async addPipelineResult(result: ReturnType<typeof runSignalPipeline>): Promise<number> {
    let newCount = 0;

    for (const event of result.events) {
      if (this.eventIds.has(event.id)) continue;
      this.eventIds.add(event.id);
      this.events.unshift(event);
      newCount++;
    }

    this.signals.unshift(...result.signals);
    this.recommendations.unshift(...result.recommendations);

    for (const rec of result.recommendations) {
      this.approvals.unshift({
        id: `appr-${rec.id}`,
        recommendationId: rec.id,
        status: "pending",
        createdAt: rec.createdAt,
        updatedAt: rec.createdAt,
      });
    }

    return newCount;
  }

  async recordIngest(_result: IngestResult): Promise<void> {
    // No-op for in-memory store.
  }

  async getCounts(): Promise<StoreCounts> {
    return {
      sources: this.sources.length,
      events: this.events.length,
      signals: this.signals.length,
      recommendations: this.recommendations.length,
      approvals: this.approvals.length,
    };
  }
}
