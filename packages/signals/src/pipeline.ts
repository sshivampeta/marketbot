import type { RawEvent } from "@marketbot/connectors";
import type { ClassifiedEvent, Signal, TradeRecommendation } from "./index.js";
import { classifyEvents } from "./classify.js";
import { scoreEvents } from "./score.js";

export interface PipelineResult {
  events: ClassifiedEvent[];
  signals: Signal[];
  recommendations: TradeRecommendation[];
}

const MIN_CONFIDENCE = 0.55;

function toRecommendation(signal: Signal): TradeRecommendation | null {
  if (signal.confidence < MIN_CONFIDENCE) return null;
  if (signal.direction === "neutral") return null;

  return {
    id: `rec-${signal.id}`,
    signalId: signal.id,
    ticker: signal.ticker,
    action: signal.direction === "bullish" ? "buy" : "sell",
    quantity: 1,
    rationale: signal.rationale,
    confidence: signal.confidence,
    createdAt: signal.createdAt,
  };
}

export function runSignalPipeline(rawEvents: RawEvent[]): PipelineResult {
  const events = classifyEvents(rawEvents);
  const signals = scoreEvents(events);
  const recommendations = signals
    .map(toRecommendation)
    .filter((r): r is TradeRecommendation => r !== null);

  return { events, signals, recommendations };
}
