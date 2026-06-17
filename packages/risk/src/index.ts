export interface RiskConfig {
  maxPositionSize: number;
  maxDailyLoss: number;
  maxOpenOrders: number;
  killSwitch: boolean;
}

export interface RiskContext {
  openOrders: number;
  dailyPnl: number;
  currentPosition: number;
}

export interface RiskCheckResult {
  passed: boolean;
  violations: string[];
}

export interface TradeProposal {
  ticker: string;
  action: "buy" | "sell";
  quantity: number;
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  maxPositionSize: 100,
  maxDailyLoss: 500,
  maxOpenOrders: 5,
  killSwitch: false,
};

export function runRiskChecks(
  proposal: TradeProposal,
  config: RiskConfig,
  ctx: RiskContext,
): RiskCheckResult {
  const violations: string[] = [];

  if (config.killSwitch) {
    violations.push("Kill switch is active");
  }

  if (ctx.openOrders >= config.maxOpenOrders) {
    violations.push(`Max open orders (${config.maxOpenOrders}) reached`);
  }

  if (ctx.dailyPnl <= -config.maxDailyLoss) {
    violations.push(`Daily loss limit ($${config.maxDailyLoss}) exceeded`);
  }

  const projectedPosition =
    proposal.action === "buy"
      ? ctx.currentPosition + proposal.quantity
      : ctx.currentPosition - proposal.quantity;

  if (Math.abs(projectedPosition) > config.maxPositionSize) {
    violations.push(`Position size would exceed limit (${config.maxPositionSize})`);
  }

  return { passed: violations.length === 0, violations };
}
