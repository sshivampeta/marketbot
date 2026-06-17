import type { RawEvent } from "@marketbot/connectors";
import type { ClassifiedEvent, EventCategory } from "./index.js";

const CATEGORY_RULES: Array<{ category: EventCategory; patterns: RegExp[] }> = [
  {
    category: "macro",
    patterns: [/federal reserve|fed\b|interest rate|inflation|cpi|gdp|jobs report|unemployment/i],
  },
  {
    category: "earnings",
    patterns: [/earnings|revenue|eps|quarterly results|guidance|beat|miss/i],
  },
  {
    category: "regulatory",
    patterns: [/sec filing|fda|regulat|antitrust|investigation|subpoena|8-k|10-k|10-q/i],
  },
  {
    category: "merger",
    patterns: [/merger|acquisition|acquire|takeover|buyout|m&a/i],
  },
  {
    category: "product",
    patterns: [/launch|product|release|unveil|partnership|contract/i],
  },
  {
    category: "management",
    patterns: [/ceo|cfo|resign|appoint|executive|board|leadership/i],
  },
];

function extractKeywords(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 3);

  return [...new Set(tokens)].slice(0, 10);
}

export function classifyEvent(event: RawEvent): ClassifiedEvent {
  const text = `${event.title} ${event.summary}`;
  let category: EventCategory = "other";

  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((p) => p.test(text))) {
      category = rule.category;
      break;
    }
  }

  return {
    ...event,
    category,
    keywords: extractKeywords(text),
  };
}

export function classifyEvents(events: RawEvent[]): ClassifiedEvent[] {
  return events.map(classifyEvent);
}
