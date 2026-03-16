import type { HistoryPoint } from "./priceUtils";

export type BotSignal = "BUY_DIP" | "HOLD" | "SELL";

export interface SignalResult {
  signal: BotSignal;
  confidence: number;
  reasoning: string;
}

export interface LiquidityZone {
  price: number;
  intensity: number; // 0-100, higher = more liquidity
  type: "bid" | "ask";
  label: string;
}

export interface BreakoutAssessment {
  type: "BREAKOUT" | "FAKEOUT" | "NEUTRAL";
  confidence: number;
  reasoning: string;
  direction: "UP" | "DOWN" | "NONE";
}

export interface MicroAnalysis {
  rsi: number;
  rsiSignal: "OVERBOUGHT" | "OVERSOLD" | "NEUTRAL";
  supportLevels: number[];
  resistanceLevels: number[];
  volumeSpike: boolean;
  volumeSpikeMultiplier: number;
  obvTrend: "RISING" | "FALLING" | "FLAT";
  volumeRatio: number;
}

export interface MacroAnalysis {
  marketStructure: "UPTREND" | "DOWNTREND" | "RANGING";
  momentumScore: number; // 0-100
  trend14d: number; // % change over 14 days
  volatilityLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface EnrichedSignalResult extends SignalResult {
  micro: MicroAnalysis;
  macro: MacroAnalysis;
  liquidityZones: LiquidityZone[];
  breakout: BreakoutAssessment;
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

function computeOBV(prices: number[], volumes: number[]): number[] {
  const obv = [0];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > prices[i - 1]) obv.push(obv[obv.length - 1] + volumes[i]);
    else if (prices[i] < prices[i - 1])
      obv.push(obv[obv.length - 1] - volumes[i]);
    else obv.push(obv[obv.length - 1]);
  }
  return obv;
}

export function computeRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return Math.round(100 - 100 / (1 + rs));
}

export function findPivotLevels(prices: number[]): {
  support: number[];
  resistance: number[];
} {
  const support: number[] = [];
  const resistance: number[] = [];
  const window = 3;
  for (let i = window; i < prices.length - window; i++) {
    const slice = prices.slice(i - window, i + window + 1);
    const isMin = prices[i] === Math.min(...slice);
    const isMax = prices[i] === Math.max(...slice);
    if (isMin) support.push(prices[i]);
    if (isMax) resistance.push(prices[i]);
  }
  const current = prices[prices.length - 1];
  const sortByProximity = (a: number, b: number) =>
    Math.abs(a - current) - Math.abs(b - current);
  return {
    support: support.sort(sortByProximity).slice(0, 3),
    resistance: resistance.sort(sortByProximity).slice(0, 3),
  };
}

export function detectVolumeSpike(
  volumes: number[],
  window = 7,
): { spike: boolean; multiplier: number } {
  if (volumes.length < window + 1) return { spike: false, multiplier: 1 };
  const recent = volumes.slice(-window - 1);
  const avg = recent.slice(0, window).reduce((a, b) => a + b, 0) / window;
  const last = recent[recent.length - 1];
  const multiplier = avg > 0 ? last / avg : 1;
  return {
    spike: multiplier > 1.8,
    multiplier: Math.round(multiplier * 10) / 10,
  };
}

export function generateLiquidityZones(
  history: HistoryPoint[],
): LiquidityZone[] {
  if (history.length < 5) return [];
  const prices = history.map((h) => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min;
  if (range === 0) return [];

  const buckets = 8;
  const bucketSize = range / buckets;
  const counts = new Array(buckets).fill(0);
  for (const p of prices) {
    const idx = Math.min(buckets - 1, Math.floor((p - min) / bucketSize));
    counts[idx]++;
  }
  const maxCount = Math.max(...counts);
  const current = prices[prices.length - 1];

  return counts.map((count, i) => {
    const zonePriceMid = min + (i + 0.5) * bucketSize;
    const intensity = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
    return {
      price: Math.round(zonePriceMid * 100) / 100,
      intensity,
      type: zonePriceMid < current ? "bid" : "ask",
      label: `$${zonePriceMid.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    };
  });
}

export function assessBreakout(
  history: HistoryPoint[],
  volumes: number[],
): BreakoutAssessment {
  if (history.length < 10) {
    return {
      type: "NEUTRAL",
      confidence: 50,
      reasoning: "Insufficient data.",
      direction: "NONE",
    };
  }

  const prices = history.map((h) => h.price);
  const recent5 = prices.slice(-5);
  const prior5 = prices.slice(-10, -5);
  const priorHigh = Math.max(...prior5);
  const priorLow = Math.min(...prior5);
  const currentPrice = prices[prices.length - 1];
  const recentHigh = Math.max(...recent5);
  const recentLow = Math.min(...recent5);

  const { spike: volSpike, multiplier } = detectVolumeSpike(volumes);

  const breakoutUp = recentHigh > priorHigh * 1.02;
  const breakoutDown = recentLow < priorLow * 0.98;

  if (breakoutUp) {
    if (volSpike) {
      return {
        type: "BREAKOUT",
        confidence: Math.min(90, 65 + multiplier * 5),
        reasoning: `Price broke above resistance with ${multiplier}x volume surge — high-conviction breakout.`,
        direction: "UP",
      };
    }
    return {
      type: "FAKEOUT",
      confidence: 60,
      reasoning:
        "Price broke resistance but volume is weak — potential fakeout. Wait for confirmation.",
      direction: "UP",
    };
  }

  if (breakoutDown) {
    if (volSpike) {
      return {
        type: "BREAKOUT",
        confidence: Math.min(90, 65 + multiplier * 5),
        reasoning: `Price broke below support with ${multiplier}x volume surge — confirmed breakdown.`,
        direction: "DOWN",
      };
    }
    return {
      type: "FAKEOUT",
      confidence: 60,
      reasoning:
        "Price dipped below support but volume is thin — possible fakeout or liquidity grab.",
      direction: "DOWN",
    };
  }

  const pctRange = ((recentHigh - recentLow) / currentPrice) * 100;
  return {
    type: "NEUTRAL",
    confidence: 50,
    reasoning: `Price consolidating within ${pctRange.toFixed(1)}% range. Watching for breakout catalyst.`,
    direction: "NONE",
  };
}

export function computeSignal(history: HistoryPoint[]): EnrichedSignalResult {
  if (history.length < 14) {
    const neutral: EnrichedSignalResult = {
      signal: "HOLD",
      confidence: 50,
      reasoning: "Insufficient data for analysis.",
      micro: {
        rsi: 50,
        rsiSignal: "NEUTRAL",
        supportLevels: [],
        resistanceLevels: [],
        volumeSpike: false,
        volumeSpikeMultiplier: 1,
        obvTrend: "FLAT",
        volumeRatio: 1,
      },
      macro: {
        marketStructure: "RANGING",
        momentumScore: 50,
        trend14d: 0,
        volatilityLevel: "LOW",
      },
      liquidityZones: [],
      breakout: {
        type: "NEUTRAL",
        confidence: 50,
        reasoning: "Insufficient data.",
        direction: "NONE",
      },
    };
    return neutral;
  }

  const prices = history.map((h) => h.price);
  const volumes = history.map((h) => h.volume);
  const currentPrice = prices[prices.length - 1];
  const sma7 = sma(prices, 7);
  const sma14 = sma(prices, 14);
  const lastSma7 = sma7[sma7.length - 1];
  const lastSma14 = sma14[sma14.length - 1];
  const dipPct = ((lastSma7 - currentPrice) / lastSma7) * 100;
  const trendBullish = lastSma7 > lastSma14;

  // Base signal
  let base: SignalResult;
  if (currentPrice < lastSma7 * 0.97 && !trendBullish) {
    const confidence = Math.min(95, 60 + dipPct * 3);
    base = {
      signal: "BUY_DIP",
      confidence: Math.round(confidence),
      reasoning: `Price is ${dipPct.toFixed(1)}% below 7-day SMA. Short-term trend is bearish - potential dip buying opportunity.`,
    };
  } else if (currentPrice > lastSma14 * 1.08 && trendBullish) {
    const overextended = ((currentPrice - lastSma14) / lastSma14) * 100;
    base = {
      signal: "SELL",
      confidence: Math.round(Math.min(90, 55 + overextended * 2)),
      reasoning: `Price is ${overextended.toFixed(1)}% above 14-day SMA. Consider taking profit or tightening stops.`,
    };
  } else {
    base = {
      signal: "HOLD",
      confidence: Math.round(
        50 + (Math.abs(currentPrice - lastSma7) / lastSma7) * 100,
      ),
      reasoning: trendBullish
        ? "Short-term trend is bullish. Price tracking near moving averages."
        : "Mixed signals. Waiting for clearer direction.",
    };
  }

  // Micro analysis
  const rsiValue = computeRSI(prices);
  const rsiSignal =
    rsiValue > 70 ? "OVERBOUGHT" : rsiValue < 30 ? "OVERSOLD" : "NEUTRAL";
  const pivots = findPivotLevels(prices);
  const volData = detectVolumeSpike(volumes);

  // OBV trend
  const obv = computeOBV(prices, volumes);
  const lastOBV = obv[obv.length - 1];
  const prevOBV = obv[Math.max(0, obv.length - 6)];
  let obvTrend: "RISING" | "FALLING" | "FLAT" = "FLAT";
  if (prevOBV !== 0) {
    const obvChange = ((lastOBV - prevOBV) / Math.abs(prevOBV)) * 100;
    if (obvChange > 2) obvTrend = "RISING";
    else if (obvChange < -2) obvTrend = "FALLING";
  }

  // Volume ratio: last volume vs 14-period average
  const priorVols = volumes.slice(-15, -1);
  const avgVol =
    priorVols.length > 0
      ? priorVols.reduce((a, b) => a + b, 0) / priorVols.length
      : 1;
  const lastVol = volumes[volumes.length - 1];
  const volumeRatio = avgVol > 0 ? Math.round((lastVol / avgVol) * 10) / 10 : 1;

  // Macro analysis
  const firstPrice = prices[0];
  const trend14d =
    firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;
  const priceChanges = prices
    .slice(1)
    .map((p, i) => Math.abs(p - prices[i]) / prices[i]);
  const avgVolatility =
    priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
  const volatilityLevel: "LOW" | "MEDIUM" | "HIGH" =
    avgVolatility < 0.02 ? "LOW" : avgVolatility < 0.05 ? "MEDIUM" : "HIGH";

  let marketStructure: "UPTREND" | "DOWNTREND" | "RANGING";
  if (trend14d > 5 && trendBullish) marketStructure = "UPTREND";
  else if (trend14d < -5 && !trendBullish) marketStructure = "DOWNTREND";
  else marketStructure = "RANGING";

  const momentumScore = Math.round(
    Math.min(100, Math.max(0, 50 + trend14d * 1.5)),
  );

  return {
    ...base,
    micro: {
      rsi: rsiValue,
      rsiSignal,
      supportLevels: pivots.support,
      resistanceLevels: pivots.resistance,
      volumeSpike: volData.spike,
      volumeSpikeMultiplier: volData.multiplier,
      obvTrend,
      volumeRatio,
    },
    macro: {
      marketStructure,
      momentumScore,
      trend14d: Math.round(trend14d * 10) / 10,
      volatilityLevel,
    },
    liquidityZones: generateLiquidityZones(history),
    breakout: assessBreakout(history, volumes),
  };
}
