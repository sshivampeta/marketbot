import { registerConnector } from "./registry.js";
import { rssConnector } from "./rss.js";
import { secEdgarConnector } from "./sec-edgar.js";

registerConnector(rssConnector);
registerConnector(secEdgarConnector);

export type SourceKind = "rss" | "sec-edgar" | "macro";

export interface SourceConfig {
  id: string;
  name: string;
  kind: SourceKind;
  url: string;
  enabled: boolean;
  pollIntervalMinutes: number;
  metadata?: Record<string, string>;
}

export interface RawEvent {
  id: string;
  sourceId: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  fetchedAt: string;
  tickers: string[];
  metadata: Record<string, string>;
}

export interface ConnectorContext {
  userAgent: string;
  fetchFn?: typeof fetch;
}

export interface Connector {
  kind: SourceKind;
  fetchEvents(source: SourceConfig, ctx: ConnectorContext): Promise<RawEvent[]>;
}

export * from "./registry.js";
export * from "./rss.js";
export * from "./sec-edgar.js";
export * from "./dedupe.js";
export * from "./sources.js";
