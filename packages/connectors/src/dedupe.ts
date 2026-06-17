import { createHash } from "node:crypto";
import type { RawEvent } from "./index.js";

export function eventFingerprint(event: Pick<RawEvent, "title" | "url" | "publishedAt">): string {
  const payload = `${event.title}|${event.url}|${event.publishedAt}`;
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export function dedupeEvents(events: RawEvent[]): RawEvent[] {
  const seen = new Set<string>();
  const unique: RawEvent[] = [];

  for (const event of events) {
    const key = event.id || eventFingerprint(event);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ ...event, id: key });
  }

  return unique;
}
