import type { HistoryPoint } from "./priceUtils";

export type BotSignal = "BUY_DIP" | "HOLD" | "SELL";

export interface SignalResult {
  signal: BotSignal;
  confidence: number;
  reasoning: string;
}

function sma(prices: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(Number.NaN);
      continue;
    }
    const avg =
      prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    result.push(avg);
  }
  return result;
}

export function computeSignal(history: HistoryPoint[]): SignalResult {
  if (history.length < 14) {
    return {
      signal: "HOLD",
      confidence: 50,
      reasoning: "Insufficient data for analysis.",
    };
  }

  const prices = history.map((h) => h.price);
  const currentPrice = prices[prices.length - 1];
  const sma7 = sma(prices, 7);
  const sma14 = sma(prices, 14);

  const lastSma7 = sma7[sma7.length - 1];
  const lastSma14 = sma14[sma14.length - 1];

  const dipPct = ((lastSma7 - currentPrice) / lastSma7) * 100;
  const trendBullish = lastSma7 > lastSma14;

  if (currentPrice < lastSma7 * 0.97 && !trendBullish) {
    const confidence = Math.min(95, 60 + dipPct * 3);
    return {
      signal: "BUY_DIP",
      confidence: Math.round(confidence),
      reasoning: `Price is ${dipPct.toFixed(1)}% below 7-day SMA. Short-term trend is bearish - potential dip buying opportunity.`,
    };
  }

  if (currentPrice > lastSma14 * 1.08 && trendBullish) {
    const overextended = ((currentPrice - lastSma14) / lastSma14) * 100;
    return {
      signal: "SELL",
      confidence: Math.round(Math.min(90, 55 + overextended * 2)),
      reasoning: `Price is ${overextended.toFixed(1)}% above 14-day SMA. Consider taking profit or tightening stops.`,
    };
  }

  return {
    signal: "HOLD",
    confidence: Math.round(
      50 + (Math.abs(currentPrice - lastSma7) / lastSma7) * 100,
    ),
    reasoning: trendBullish
      ? "Short-term trend is bullish. Price tracking near moving averages - no clear entry/exit signal."
      : "Mixed signals. Price near moving averages - waiting for clearer direction.",
  };
}
