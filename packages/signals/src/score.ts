import { createHash } from "node:crypto";
import type { ClassifiedEvent, ScoreBreakdown, Signal, SignalDirection, SignalHorizon } from "./index.js";

const CATEGORY_WEIGHTS: Record<ClassifiedEvent["category"], number> = {
  macro: 0.85,
  earnings: 0.9,
  regulatory: 0.75,
  merger: 0.95,
  product: 0.7,
  management: 0.65,
  other: 0.5,
};

const SOURCE_WEIGHTS: Record<string, number> = {
  "fed-press": 0.9,
  "sec-aapl": 0.85,
};

const BULLISH_PATTERNS = [/beat|raise|growth|partnership|launch|approval|upgrade|buyback|dividend/i];
const BEARISH_PATTERNS = [/miss|cut|downgrade|investigation|recall|layoff|decline|warning|subpoena/i];

function inferDirection(text: string): SignalDirection {
  const bullish = BULLISH_PATTERNS.filter((p) => p.test(text)).length;
  const bearish = BEARISH_PATTERNS.filter((p) => p.test(text)).length;

  if (bullish > bearish) return "bullish";
  if (bearish > bullish) return "bearish";
  return "neutral";
}

function inferHorizon(category: ClassifiedEvent["category"]): SignalHorizon {
  if (category === "macro") return "swing";
  if (category === "earnings" || category === "merger") return "position";
  return "intraday";
}

function recencyWeight(publishedAt: string): number {
  const ageHours = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
  if (ageHours <= 1) return 1;
  if (ageHours <= 6) return 0.85;
  if (ageHours <= 24) return 0.7;
  if (ageHours <= 72) return 0.5;
  return 0.3;
}

function keywordWeight(keywords: string[]): number {
  const impactful = keywords.filter((k) =>
    ["rate", "inflation", "earnings", "merger", "fda", "guidance", "revenue"].includes(k),
  );
  return Math.min(1, 0.4 + impactful.length * 0.1);
}

function computeConfidence(breakdown: ScoreBreakdown): number {
  const weights = [
    breakdown.categoryWeight * 0.3,
    breakdown.keywordWeight * 0.15,
    breakdown.sourceWeight * 0.2,
    breakdown.recencyWeight * 0.2,
    breakdown.tickerMatchWeight * 0.15,
  ];
  return Math.round(weights.reduce((a, b) => a + b, 0) * 100) / 100;
}

function signalId(eventId: string, ticker: string): string {
  return createHash("sha256").update(`${eventId}:${ticker}`).digest("hex").slice(0, 16);
}

export function scoreEvent(event: ClassifiedEvent, ticker = "SPY"): Signal {
  const text = `${event.title} ${event.summary}`;
  const direction = inferDirection(text);
  const breakdown: ScoreBreakdown = {
    categoryWeight: CATEGORY_WEIGHTS[event.category],
    keywordWeight: keywordWeight(event.keywords),
    sourceWeight: SOURCE_WEIGHTS[event.sourceId] ?? 0.6,
    recencyWeight: recencyWeight(event.publishedAt),
    tickerMatchWeight: event.tickers.length > 0 ? 0.9 : 0.5,
  };

  const confidence = computeConfidence(breakdown);
  const targetTicker = event.tickers[0] ?? ticker;

  return {
    id: signalId(event.id, targetTicker),
    eventId: event.id,
    ticker: targetTicker,
    direction,
    confidence,
    horizon: inferHorizon(event.category),
    rationale: `${event.category} event: ${event.title}`,
    decayHours: event.category === "macro" ? 48 : 24,
    createdAt: new Date().toISOString(),
    scoreBreakdown: breakdown,
  };
}

export function scoreEvents(events: ClassifiedEvent[]): Signal[] {
  return events.map((event) => scoreEvent(event));
}
