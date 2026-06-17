export interface TaxLot {
  ticker: string;
  quantity: number;
  acquiredAt: string;
  costBasis: number;
}

export interface TaxCheckResult {
  passed: boolean;
  warnings: string[];
}

export interface TradeProposal {
  ticker: string;
  action: "buy" | "sell";
  quantity: number;
}

const WASH_SALE_DAYS = 30;

export function detectWashSale(
  proposal: TradeProposal,
  lots: TaxLot[],
  recentSales: Array<{ ticker: string; soldAt: string }>,
): TaxCheckResult {
  const warnings: string[] = [];

  if (proposal.action !== "buy") {
    return { passed: true, warnings };
  }

  const cutoff = Date.now() - WASH_SALE_DAYS * 24 * 60 * 60 * 1000;
  const recentLossSale = recentSales.find(
    (s) => s.ticker === proposal.ticker && new Date(s.soldAt).getTime() >= cutoff,
  );

  if (recentLossSale) {
    warnings.push(
      `Potential wash sale: ${proposal.ticker} was sold at a loss within the last ${WASH_SALE_DAYS} days`,
    );
  }

  const holdingPeriodDays = lots
    .filter((l) => l.ticker === proposal.ticker)
    .map((l) => (Date.now() - new Date(l.acquiredAt).getTime()) / (1000 * 60 * 60 * 24));

  if (holdingPeriodDays.some((d) => d < 365 && d > 0)) {
    warnings.push("Short-term capital gains may apply to some lots");
  }

  return { passed: warnings.length === 0, warnings };
}
