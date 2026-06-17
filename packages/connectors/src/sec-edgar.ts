import type { Connector, ConnectorContext, RawEvent, SourceConfig } from "./index.js";
import { eventFingerprint } from "./dedupe.js";

interface EdgarFiling {
  accessionNumber: string;
  form: string;
  filingDate: string;
  primaryDocument: string;
  companyName: string;
  cik: string;
}

function parseEdgarFeed(json: unknown): EdgarFiling[] {
  if (!json || typeof json !== "object") return [];
  const feed = json as { filings?: { recent?: Record<string, unknown[]> } };
  const recent = feed.filings?.recent;
  if (!recent) return [];

  const accessionNumbers = (recent.accessionNumber as string[]) ?? [];
  const forms = (recent.form as string[]) ?? [];
  const filingDates = (recent.filingDate as string[]) ?? [];
  const primaryDocuments = (recent.primaryDocument as string[]) ?? [];
  const companyNames = (recent.companyName as string[]) ?? [];
  const ciks = (recent.cik as string[]) ?? [];

  const filings: EdgarFiling[] = [];
  const count = Math.min(accessionNumbers.length, 20);

  for (let i = 0; i < count; i++) {
    filings.push({
      accessionNumber: accessionNumbers[i] ?? "",
      form: forms[i] ?? "",
      filingDate: filingDates[i] ?? "",
      primaryDocument: primaryDocuments[i] ?? "",
      companyName: companyNames[i] ?? "",
      cik: ciks[i] ?? "",
    });
  }

  return filings.filter((f) => f.accessionNumber && f.form);
}

export const secEdgarConnector: Connector = {
  kind: "sec-edgar",

  async fetchEvents(source: SourceConfig, ctx: ConnectorContext): Promise<RawEvent[]> {
    const fetchFn = ctx.fetchFn ?? fetch;
    const cik = source.metadata?.cik ?? "0000320193";
    const url = source.url || `https://data.sec.gov/submissions/CIK${cik.padStart(10, "0")}.json`;

    const response = await fetchFn(url, {
      headers: {
        "User-Agent": ctx.userAgent,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`SEC EDGAR fetch failed for ${source.id}: ${response.status}`);
    }

    const json = await response.json();
    const filings = parseEdgarFeed(json);
    const fetchedAt = new Date().toISOString();

    return filings.map((filing) => {
      const title = `${filing.companyName} filed ${filing.form}`;
      const url = `https://www.sec.gov/Archives/edgar/data/${filing.cik}/${filing.accessionNumber.replace(/-/g, "")}/${filing.primaryDocument}`;
      const publishedAt = new Date(filing.filingDate).toISOString();
      const partial = { title, url, publishedAt };

      return {
        id: eventFingerprint(partial),
        sourceId: source.id,
        title,
        summary: `${filing.form} filing by ${filing.companyName}`,
        url,
        publishedAt,
        fetchedAt,
        tickers: [],
        metadata: {
          form: filing.form,
          cik: filing.cik,
          accessionNumber: filing.accessionNumber,
        },
      };
    });
  },
};
