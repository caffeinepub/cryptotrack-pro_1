# Genesis Trading Bot

## Current State
- Bot page uses `parseCoinHistory` which only parses `prices` from CoinGecko history JSON
- Volume data in `botUtils.ts` is synthesized from price deltas with random noise, not real volume
- `assessBreakout` and `detectVolumeSpike` use fake volume arrays
- Theme uses fixed neon magenta and cyan colors throughout

## Requested Changes (Diff)

### Add
- Real volume parsing in `parseCoinHistory` — extract `total_volumes` array from CoinGecko response alongside prices
- Volume OBV (On-Balance Volume) trend metric to `MicroAnalysis`
- Volume ratio (current vs 30-period average) displayed in micro analysis panel
- Soft RGB neon strobe CSS animation cycling red → green → blue neon
- `rgb-strobe` CSS utility class and keyframe animation in index.css

### Modify
- `HistoryPoint` interface: add `volume: number` field
- `assessBreakout`: use real `history[i].volume` instead of synthetic volumes
- `computeSignal`: pass real volumes from history to all volume functions
- `detectVolumeSpike`: use real volumes
- Bot.tsx neon accent colors: apply strobe animation to borders, headers, badges
- Volume spike badge: show real multiplier from actual volume data
- Micro analysis: add OBV trend and volume ratio display

### Remove
- Random/synthetic volume generation in botUtils.ts

## Implementation Plan
1. Update `HistoryPoint` + `parseCoinHistory` in priceUtils.ts to include volume
2. Update botUtils.ts to use real volume from history; add OBV calc; remove synthetic volume
3. Update MicroAnalysis interface to add `obvTrend` and `volumeRatio`
4. Add RGB strobe keyframe + utility classes in index.css
5. Update Bot.tsx to apply strobe classes and show new volume metrics
