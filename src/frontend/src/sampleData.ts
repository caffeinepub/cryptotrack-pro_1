import type { RecurringBuyRule, Trade } from "./backend";

const now = Date.now();
const day = 86400000;

export const sampleTrades: Trade[] = [
  {
    assetId: "bitcoin",
    assetName: "Bitcoin",
    timestamp: now - 90 * day,
    priceUsd: 41200,
    quantity: 0.5,
    tradeType: "buy",
    note: "Initial buy",
  },
  {
    assetId: "bitcoin",
    assetName: "Bitcoin",
    timestamp: now - 60 * day,
    priceUsd: 38500,
    quantity: 0.3,
    tradeType: "buy",
    note: "DCA",
  },
  {
    assetId: "bitcoin",
    assetName: "Bitcoin",
    timestamp: now - 30 * day,
    priceUsd: 44100,
    quantity: 0.2,
    tradeType: "buy",
    note: "DCA",
  },
  {
    assetId: "ethereum",
    assetName: "Ethereum",
    timestamp: now - 85 * day,
    priceUsd: 2100,
    quantity: 5,
    tradeType: "buy",
    note: "Initial buy",
  },
  {
    assetId: "ethereum",
    assetName: "Ethereum",
    timestamp: now - 45 * day,
    priceUsd: 1850,
    quantity: 3,
    tradeType: "buy",
    note: "Dip buy",
  },
  {
    assetId: "solana",
    assetName: "Solana",
    timestamp: now - 70 * day,
    priceUsd: 85,
    quantity: 20,
    tradeType: "buy",
    note: "Initial buy",
  },
  {
    assetId: "solana",
    assetName: "Solana",
    timestamp: now - 20 * day,
    priceUsd: 110,
    quantity: 10,
    tradeType: "buy",
    note: "Add to position",
  },
];

export const sampleRecurring: RecurringBuyRule[] = [
  {
    assetId: "bitcoin",
    assetName: "Bitcoin",
    intervalDays: BigInt(7),
    amountUsd: 50,
    enabled: true,
  },
  {
    assetId: "ethereum",
    assetName: "Ethereum",
    intervalDays: BigInt(14),
    amountUsd: 100,
    enabled: true,
  },
];
