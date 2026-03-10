export interface LivePrice {
  usd: number;
  usd_24h_change: number;
  usd_market_cap: number;
  usd_24h_vol: number;
}

export type LivePrices = Record<string, LivePrice>;

export function parsePrices(json: string): LivePrices {
  try {
    return JSON.parse(json) as LivePrices;
  } catch {
    return {};
  }
}

export interface TopCoin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_7d_in_currency?: number;
}

export function parseTopCoins(json: string): TopCoin[] {
  try {
    return JSON.parse(json) as TopCoin[];
  } catch {
    return [];
  }
}

export interface HistoryPoint {
  timestamp: number;
  price: number;
}

export function parseCoinHistory(json: string): HistoryPoint[] {
  try {
    const data = JSON.parse(json);
    return (data.prices as [number, number][]).map(([ts, p]) => ({
      timestamp: ts,
      price: p,
    }));
  } catch {
    return [];
  }
}

export function formatUsd(n: number, decimals = 2): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(2)}K`;
  return `$${n.toFixed(decimals)}`;
}

export function formatPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}
