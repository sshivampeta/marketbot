import { registerConnector } from "./registry.js";
import { rssConnector } from "./rss.js";
import { secEdgarConnector } from "./sec-edgar.js";

registerConnector(rssConnector);
registerConnector(secEdgarConnector);

export const DEFAULT_SOURCES = [
  {
    id: "fed-press",
    name: "Federal Reserve Press Releases",
    kind: "rss" as const,
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
    enabled: true,
    pollIntervalMinutes: 30,
  },
  {
    id: "sec-aapl",
    name: "Apple SEC Filings",
    kind: "sec-edgar" as const,
    url: "",
    enabled: true,
    pollIntervalMinutes: 60,
    metadata: { cik: "0000320193" },
  },
];
