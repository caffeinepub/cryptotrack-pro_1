# CryptoTrack Pro

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Portfolio dashboard with real-time price tracking via HTTP outcalls (CoinGecko API)
- Manual trade entry: asset, date/time, price paid, quantity, buy type (one-time or recurring)
- Recurring buy scheduler: track DCA (dollar-cost averaging) strategies with interval settings
- Portfolio overview: total value, P&L, allocation pie chart, average buy-in prices per asset
- Market structure charts: price history with buy markers overlaid
- Asset comparison tool: side-by-side metrics for multiple coins
- Project health analyzer: fetches on-chain activity metrics (volume, dev activity, community) to rate "active" vs "dead" projects
- Trading bot assistant: rule-based signal engine that detects dip conditions, RSI-style scoring, and recommends buy/sell signals (no actual trade execution)
- Dark / light theme toggle
- Sample data on first load for newcomers

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend (Motoko)
   - Data models: Portfolio, Trade (assetId, timestamp, priceUsd, quantity, type), RecurringBuy, BotSettings
   - CRUD for trades and recurring buys
   - HTTP outcalls to CoinGecko for live prices, market data, and coin metadata
   - Bot signal logic: fetch OHLCV-style data, compute simple dip/RSI signals, return recommendations
   - Project health scorer: fetch developer activity, volume trends, community size from CoinGecko

2. Frontend
   - Layout: sidebar nav, main content area, theme toggle
   - Pages: Dashboard, Trades, Compare, Project Health, Bot
   - Dashboard: portfolio value card, P&L card, allocation pie chart (Recharts), asset list with avg buy-in
   - Trades page: add/edit/delete trades form, trades table, recurring buy management
   - Compare page: multi-asset selector, side-by-side price + volume + market cap cards
   - Project Health page: coin search, health score card, activity/volume charts
   - Bot page: configure dip threshold and strategy, view current signals, enable/disable alerts
   - Theme: OKLCH-based design tokens, dark/light switcher persisted in localStorage
