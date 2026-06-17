import type { Connector, ConnectorContext, RawEvent, SourceConfig } from "./index.js";
import { eventFingerprint } from "./dedupe.js";

const TICKER_PATTERN = /\b(?:NYSE|NASDAQ|AMEX)?:?\s*([A-Z]{1,5})\b/g;

function extractTickers(text: string): string[] {
  const matches = text.match(TICKER_PATTERN) ?? [];
  const tickers = new Set<string>();

  for (const match of matches) {
    const ticker = match.replace(/^(?:NYSE|NASDAQ|AMEX):?\s*/i, "").trim();
    if (ticker.length >= 1 && ticker.length <= 5) {
      tickers.add(ticker);
    }
  }

  return [...tickers];
}

function parseRssItems(xml: string): Array<{ title: string; link: string; description: string; pubDate: string }> {
  const items: Array<{ title: string; link: string; description: string; pubDate: string }> = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

  for (const block of itemBlocks) {
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() ?? "";
    const link = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() ?? "";
    const description =
      block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() ?? "";
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() ?? new Date().toISOString();

    if (title && link) {
      items.push({ title, link, description, pubDate });
    }
  }

  return items;
}

export const rssConnector: Connector = {
  kind: "rss",

  async fetchEvents(source: SourceConfig, ctx: ConnectorContext): Promise<RawEvent[]> {
    const fetchFn = ctx.fetchFn ?? fetch;
    const response = await fetchFn(source.url, {
      headers: { "User-Agent": ctx.userAgent },
    });

    if (!response.ok) {
      throw new Error(`RSS fetch failed for ${source.id}: ${response.status}`);
    }

    const xml = await response.text();
    const fetchedAt = new Date().toISOString();

    return parseRssItems(xml).map((item) => {
      const combined = `${item.title} ${item.description}`;
      const publishedAt = new Date(item.pubDate).toISOString();
      const partial = { title: item.title, url: item.link, publishedAt };

      return {
        id: eventFingerprint(partial),
        sourceId: source.id,
        title: item.title,
        summary: item.description.slice(0, 500),
        url: item.link,
        publishedAt,
        fetchedAt,
        tickers: extractTickers(combined),
        metadata: { feed: source.name },
      };
    });
  },
};
