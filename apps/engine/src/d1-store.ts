import type { SourceConfig } from "@marketbot/connectors";
import type { ClassifiedEvent, Signal, TradeRecommendation } from "@marketbot/signals";
import type { runSignalPipeline } from "@marketbot/signals";
import type { Approval, IngestResult, MarketStoreLike, StoreCounts } from "./types.js";

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export class D1Store implements MarketStoreLike {
  constructor(private readonly db: D1Database) {}

  async getSources(): Promise<SourceConfig[]> {
    const { results } = await this.db
      .prepare(
        "SELECT id, name, kind, url, enabled, poll_interval_minutes, metadata FROM sources ORDER BY name",
      )
      .all<{
        id: string;
        name: string;
        kind: SourceConfig["kind"];
        url: string;
        enabled: number;
        poll_interval_minutes: number;
        metadata: string;
      }>();

    return results.map((row) => ({
      id: row.id,
      name: row.name,
      kind: row.kind,
      url: row.url,
      enabled: row.enabled === 1,
      pollIntervalMinutes: row.poll_interval_minutes,
      metadata: parseJson<Record<string, string>>(row.metadata, {}),
    }));
  }

  async findSource(id: string): Promise<SourceConfig | undefined> {
    const sources = await this.getSources();
    return sources.find((source) => source.id === id);
  }

  async getEvents(limit: number): Promise<ClassifiedEvent[]> {
    const { results } = await this.db
      .prepare(
        `SELECT id, source_id, title, summary, url, published_at, fetched_at, tickers, metadata, category, keywords
         FROM events ORDER BY published_at DESC LIMIT ?`,
      )
      .bind(limit)
      .all<{
        id: string;
        source_id: string;
        title: string;
        summary: string;
        url: string;
        published_at: string;
        fetched_at: string;
        tickers: string;
        metadata: string;
        category: ClassifiedEvent["category"];
        keywords: string;
      }>();

    return results.map((row) => ({
      id: row.id,
      sourceId: row.source_id,
      title: row.title,
      summary: row.summary,
      url: row.url,
      publishedAt: row.published_at,
      fetchedAt: row.fetched_at,
      tickers: parseJson<string[]>(row.tickers, []),
      metadata: parseJson<Record<string, string>>(row.metadata, {}),
      category: row.category,
      keywords: parseJson<string[]>(row.keywords, []),
    }));
  }

  async getSignals(limit: number): Promise<Signal[]> {
    const { results } = await this.db
      .prepare(
        `SELECT id, event_id, ticker, direction, confidence, horizon, rationale, decay_hours, score_breakdown, created_at
         FROM signals ORDER BY created_at DESC LIMIT ?`,
      )
      .bind(limit)
      .all<{
        id: string;
        event_id: string;
        ticker: string;
        direction: Signal["direction"];
        confidence: number;
        horizon: Signal["horizon"];
        rationale: string;
        decay_hours: number;
        score_breakdown: string;
        created_at: string;
      }>();

    return results.map((row) => ({
      id: row.id,
      eventId: row.event_id,
      ticker: row.ticker,
      direction: row.direction,
      confidence: row.confidence,
      horizon: row.horizon,
      rationale: row.rationale,
      decayHours: row.decay_hours,
      createdAt: row.created_at,
      scoreBreakdown: parseJson(row.score_breakdown, {
        categoryWeight: 0,
        keywordWeight: 0,
        sourceWeight: 0,
        recencyWeight: 0,
        tickerMatchWeight: 0,
      }),
    }));
  }

  async getRecommendations(limit: number): Promise<TradeRecommendation[]> {
    const { results } = await this.db
      .prepare(
        `SELECT id, signal_id, ticker, action, quantity, rationale, confidence, created_at
         FROM recommendations ORDER BY created_at DESC LIMIT ?`,
      )
      .bind(limit)
      .all<{
        id: string;
        signal_id: string;
        ticker: string;
        action: TradeRecommendation["action"];
        quantity: number;
        rationale: string;
        confidence: number;
        created_at: string;
      }>();

    return results.map((row) => ({
      id: row.id,
      signalId: row.signal_id,
      ticker: row.ticker,
      action: row.action,
      quantity: row.quantity,
      rationale: row.rationale,
      confidence: row.confidence,
      createdAt: row.created_at,
    }));
  }

  async getApprovals(): Promise<Approval[]> {
    const { results } = await this.db
      .prepare(
        `SELECT id, recommendation_id, status, modified_quantity, notes, created_at, updated_at
         FROM approvals ORDER BY created_at DESC`,
      )
      .all<{
        id: string;
        recommendation_id: string;
        status: Approval["status"];
        modified_quantity: number | null;
        notes: string | null;
        created_at: string;
        updated_at: string;
      }>();

    return results.map((row) => ({
      id: row.id,
      recommendationId: row.recommendation_id,
      status: row.status,
      modifiedQuantity: row.modified_quantity ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async findApproval(id: string): Promise<Approval | undefined> {
    const row = await this.db
      .prepare(
        `SELECT id, recommendation_id, status, modified_quantity, notes, created_at, updated_at
         FROM approvals WHERE id = ?`,
      )
      .bind(id)
      .first<{
        id: string;
        recommendation_id: string;
        status: Approval["status"];
        modified_quantity: number | null;
        notes: string | null;
        created_at: string;
        updated_at: string;
      }>();

    if (!row) return undefined;

    return {
      id: row.id,
      recommendationId: row.recommendation_id,
      status: row.status,
      modifiedQuantity: row.modified_quantity ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async findRecommendation(id: string): Promise<TradeRecommendation | undefined> {
    const row = await this.db
      .prepare(
        `SELECT id, signal_id, ticker, action, quantity, rationale, confidence, created_at
         FROM recommendations WHERE id = ?`,
      )
      .bind(id)
      .first<{
        id: string;
        signal_id: string;
        ticker: string;
        action: TradeRecommendation["action"];
        quantity: number;
        rationale: string;
        confidence: number;
        created_at: string;
      }>();

    if (!row) return undefined;

    return {
      id: row.id,
      signalId: row.signal_id,
      ticker: row.ticker,
      action: row.action,
      quantity: row.quantity,
      rationale: row.rationale,
      confidence: row.confidence,
      createdAt: row.created_at,
    };
  }

  async listPendingApprovals(): Promise<Approval[]> {
    const approvals = await this.getApprovals();
    return approvals.filter((approval) => approval.status === "pending");
  }

  async updateApproval(approval: Approval): Promise<void> {
    await this.db
      .prepare(
        `UPDATE approvals
         SET status = ?, modified_quantity = ?, notes = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        approval.status,
        approval.modifiedQuantity ?? null,
        approval.notes ?? null,
        approval.updatedAt,
        approval.id,
      )
      .run();
  }

  async addPipelineResult(result: ReturnType<typeof runSignalPipeline>): Promise<number> {
    let newCount = 0;

    for (const event of result.events) {
      const insert = await this.db
        .prepare(
          `INSERT OR IGNORE INTO events
           (id, source_id, title, summary, url, published_at, fetched_at, tickers, metadata, category, keywords)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          event.id,
          event.sourceId,
          event.title,
          event.summary,
          event.url,
          event.publishedAt,
          event.fetchedAt,
          JSON.stringify(event.tickers),
          JSON.stringify(event.metadata),
          event.category,
          JSON.stringify(event.keywords),
        )
        .run();

      if (insert.meta.changes > 0) {
        newCount++;
      }
    }

    for (const signal of result.signals) {
      await this.db
        .prepare(
          `INSERT OR REPLACE INTO signals
           (id, event_id, ticker, direction, confidence, horizon, rationale, decay_hours, score_breakdown, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          signal.id,
          signal.eventId,
          signal.ticker,
          signal.direction,
          signal.confidence,
          signal.horizon,
          signal.rationale,
          signal.decayHours,
          JSON.stringify(signal.scoreBreakdown),
          signal.createdAt,
        )
        .run();
    }

    for (const rec of result.recommendations) {
      await this.db
        .prepare(
          `INSERT OR REPLACE INTO recommendations
           (id, signal_id, ticker, action, quantity, rationale, confidence, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(rec.id, rec.signalId, rec.ticker, rec.action, rec.quantity, rec.rationale, rec.confidence, rec.createdAt)
        .run();

      await this.db
        .prepare(
          `INSERT OR IGNORE INTO approvals
           (id, recommendation_id, status, created_at, updated_at)
           VALUES (?, ?, 'pending', ?, ?)`,
        )
        .bind(`appr-${rec.id}`, rec.id, rec.createdAt, rec.createdAt)
        .run();
    }

    return newCount;
  }

  async recordIngest(result: IngestResult): Promise<void> {
    await this.db
      .prepare("INSERT INTO ingest_log (source_id, fetched, new_events) VALUES (?, ?, ?)")
      .bind(result.sourceId, result.fetched, result.newEvents)
      .run();
  }

  async getCounts(): Promise<StoreCounts> {
    const [sources, events, signals, recommendations, approvals] = await Promise.all([
      this.db.prepare("SELECT COUNT(*) AS count FROM sources").first<{ count: number }>(),
      this.db.prepare("SELECT COUNT(*) AS count FROM events").first<{ count: number }>(),
      this.db.prepare("SELECT COUNT(*) AS count FROM signals").first<{ count: number }>(),
      this.db.prepare("SELECT COUNT(*) AS count FROM recommendations").first<{ count: number }>(),
      this.db.prepare("SELECT COUNT(*) AS count FROM approvals").first<{ count: number }>(),
    ]);

    return {
      sources: sources?.count ?? 0,
      events: events?.count ?? 0,
      signals: signals?.count ?? 0,
      recommendations: recommendations?.count ?? 0,
      approvals: approvals?.count ?? 0,
    };
  }
}
