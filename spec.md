# Genesis Trading Bot

## Current State
The Bot page has: signal cards per asset, Analysis Dashboard with micro/macro panels and liquidity heatmap per asset. Live volume data (OBV, volume ratio, volume spike) is fetched via CoinGecko through the backend. RGB neon strobe theme throughout.

## Requested Changes (Diff)

### Add
- A 24h volume comparison chart section on the Bot page, displayed after the active signals and before the analysis dashboard
- Fetches 24h volume for all target assets (bitcoin, ethereum) from CoinGecko markets endpoint
- Renders a bar chart comparing 24h volume side-by-side with neon colors matching the cyberpunk theme
- Shows volume in billions ($B) for readability
- Shows percentage change in volume vs prior period if available

### Modify
- Bot.tsx: add a VolumeComparisonChart component and render it between signals and the analysis dashboard divider

### Remove
- Nothing

## Implementation Plan
1. Add a `VolumeComparisonChart` component in Bot.tsx
2. Fetch 24h volume data from CoinGecko `/coins/markets` endpoint via backend `httpGet` or use available backend calls
3. Render a BarChart with recharts using neon cyberpunk styling
4. Place the chart between the Active Signals section and the Analysis Dashboard divider
