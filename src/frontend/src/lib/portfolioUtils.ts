import type { Trade } from "../backend";
import type { LivePrices } from "./priceUtils";

export interface AssetSummary {
  assetId: string;
  assetName: string;
  totalQty: number;
  avgBuyPrice: number;
  costBasis: number;
  currentPrice: number;
  currentValue: number;
  pnl: number;
  pnlPct: number;
}

export function computePortfolioSummary(
  trades: Trade[],
  prices: LivePrices,
): AssetSummary[] {
  const map = new Map<string, { name: string; qty: number; cost: number }>();

  for (const trade of trades) {
    const existing = map.get(trade.assetId) ?? {
      name: trade.assetName,
      qty: 0,
      cost: 0,
    };
    if (trade.tradeType === "buy") {
      existing.qty += trade.quantity;
      existing.cost += trade.quantity * trade.priceUsd;
    } else {
      existing.qty -= trade.quantity;
      existing.cost -= trade.quantity * trade.priceUsd;
    }
    map.set(trade.assetId, existing);
  }

  return Array.from(map.entries())
    .filter(([, v]) => v.qty > 0)
    .map(([id, v]) => {
      const currentPrice = prices[id]?.usd ?? 0;
      const currentValue = v.qty * currentPrice;
      const pnl = currentValue - v.cost;
      const pnlPct = v.cost > 0 ? (pnl / v.cost) * 100 : 0;
      return {
        assetId: id,
        assetName: v.name,
        totalQty: v.qty,
        avgBuyPrice: v.qty > 0 ? v.cost / v.qty : 0,
        costBasis: v.cost,
        currentPrice,
        currentValue,
        pnl,
        pnlPct,
      };
    });
}
