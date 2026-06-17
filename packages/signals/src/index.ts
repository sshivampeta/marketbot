import type { RawEvent } from "@marketbot/connectors";

export type EventCategory =
  | "macro"
  | "earnings"
  | "regulatory"
  | "merger"
  | "product"
  | "management"
  | "other";

export type SignalDirection = "bullish" | "bearish" | "neutral";

export type SignalHorizon = "intraday" | "swing" | "position";

export interface ClassifiedEvent extends RawEvent {
  category: EventCategory;
  keywords: string[];
}

export interface Signal {
  id: string;
  eventId: string;
  ticker: string;
  direction: SignalDirection;
  confidence: number;
  horizon: SignalHorizon;
  rationale: string;
  decayHours: number;
  createdAt: string;
  scoreBreakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  categoryWeight: number;
  keywordWeight: number;
  sourceWeight: number;
  recencyWeight: number;
  tickerMatchWeight: number;
}

export interface TradeRecommendation {
  id: string;
  signalId: string;
  ticker: string;
  action: "buy" | "sell" | "hold";
  quantity: number;
  rationale: string;
  confidence: number;
  createdAt: string;
}

export * from "./classify.js";
export * from "./score.js";
export * from "./pipeline.js";
