import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart2,
  Bot as BotIcon,
  Flame,
  Loader2,
  Minus,
  Monitor,
  Settings,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { BotSettings } from "../backend";
import { useBackendSafe } from "../hooks/useBackend";
import {
  type BotSignal,
  type EnrichedSignalResult,
  computeSignal,
} from "../lib/botUtils";
import { parseCoinHistory } from "../lib/priceUtils";

const DEFAULT_SETTINGS: BotSettings = {
  enabled: false,
  dipThresholdPercent: 5,
  targetAssets: ["bitcoin", "ethereum"],
};

const NEON_MAGENTA = "oklch(0.72 0.3 340)";
const NEON_CYAN = "oklch(0.75 0.24 195)";
const NEON_PURPLE = "oklch(0.68 0.28 280)";
const NEON_RED = "oklch(0.65 0.22 25)";
const NEON_GREEN = "oklch(0.72 0.2 145)";
const NEON_YELLOW = "oklch(0.82 0.22 60)";

interface CoinMarketData {
  id: string;
  name: string;
  symbol: string;
  total_volume: number;
  price_change_percentage_24h: number;
  current_price: number;
}

function VolumeComparisonChart() {
  const { data, isLoading, isError } = useQuery<CoinMarketData[]>({
    queryKey: ["volumeComparison"],
    queryFn: async () => {
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&order=market_cap_desc&per_page=10&page=1",
      );
      if (!res.ok) throw new Error("Failed to fetch volume data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((coin) => ({
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      volumeB: Number((coin.total_volume / 1e9).toFixed(2)),
      change24h: coin.price_change_percentage_24h,
      id: coin.id,
    }));
  }, [data]);

  const barColors: Record<string, string> = {
    bitcoin: NEON_CYAN,
    ethereum: NEON_MAGENTA,
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: {
      payload: { name: string; volumeB: number; change24h: number };
    }[];
  }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const changeColor = d.change24h >= 0 ? NEON_GREEN : NEON_RED;
    return (
      <div
        style={{
          background: "oklch(0.09 0.015 280)",
          border: `1px solid ${NEON_CYAN}55`,
          padding: "10px 14px",
          borderRadius: 4,
          fontFamily: "Geist Mono, monospace",
          fontSize: 11,
          minWidth: 160,
        }}
      >
        <p
          className="font-bold uppercase tracking-wider mb-1"
          style={{ color: NEON_CYAN }}
        >
          {d.name}
        </p>
        <p style={{ color: "oklch(0.72 0.03 280)" }}>
          Volume:{" "}
          <span style={{ color: "oklch(0.9 0.02 280)" }}>
            ${d.volumeB.toFixed(2)}B
          </span>
        </p>
        <p style={{ color: "oklch(0.72 0.03 280)" }}>
          24h Change:{" "}
          <span
            style={{
              color: changeColor,
              textShadow: `0 0 6px ${changeColor}`,
            }}
          >
            {d.change24h >= 0 ? "+" : ""}
            {d.change24h?.toFixed(2)}%
          </span>
        </p>
      </div>
    );
  };

  return (
    <Card
      data-ocid="bot.volume_chart.section"
      className="border rgb-strobe-border"
      style={{ background: "oklch(0.09 0.015 280 / 0.85)" }}
    >
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
          <BarChart2 size={12} style={{ color: NEON_CYAN }} />
          <span className="rgb-strobe-text">24H Volume Comparison</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2" data-ocid="bot.volume_chart.loading_state">
            <Skeleton className="h-[200px] w-full rounded" />
          </div>
        ) : isError ? (
          <div
            className="flex items-center justify-center h-[200px] text-xs text-muted-foreground"
            data-ocid="bot.volume_chart.error_state"
          >
            <span style={{ color: NEON_RED }}>
              ⚠ Failed to load volume data
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Real-time 24h trading volume fetched from CoinGecko.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 10, bottom: 4 }}
                barCategoryGap="40%"
              >
                <defs>
                  {chartData.map((d) => {
                    const color = barColors[d.id] ?? NEON_CYAN;
                    return (
                      <linearGradient
                        key={d.id}
                        id={`vol-grad-${d.id}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                        <stop
                          offset="100%"
                          stopColor={color}
                          stopOpacity={0.3}
                        />
                      </linearGradient>
                    );
                  })}
                </defs>
                <XAxis
                  dataKey="name"
                  tick={{
                    fontSize: 11,
                    fill: "oklch(0.60 0.04 280)",
                    fontFamily: "Geist Mono, monospace",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "oklch(0.75 0.24 195 / 0.06)" }}
                />
                <Bar dataKey="volumeB" radius={[3, 3, 0, 0]}>
                  {chartData.map((d) => {
                    const color = barColors[d.id] ?? NEON_CYAN;
                    return (
                      <Cell
                        key={d.id}
                        fill={`url(#vol-grad-${d.id})`}
                        style={{
                          filter: `drop-shadow(0 0 6px ${color}88)`,
                        }}
                      />
                    );
                  })}
                  <LabelList
                    dataKey="volumeB"
                    position="top"
                    formatter={(v: number) => `$${v.toFixed(2)}B`}
                    style={{
                      fontSize: 11,
                      fontFamily: "Geist Mono, monospace",
                      fill: "oklch(0.85 0.04 280)",
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* 24h change badges */}
            <div className="flex items-center gap-3 flex-wrap">
              {chartData.map((d) => {
                const color = barColors[d.id] ?? NEON_CYAN;
                const changeColor = d.change24h >= 0 ? NEON_GREEN : NEON_RED;
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-2 text-xs font-mono"
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-sm"
                      style={{
                        background: color,
                        boxShadow: `0 0 4px ${color}`,
                      }}
                    />
                    <span
                      style={{ color: "oklch(0.65 0.04 280)" }}
                      className="uppercase"
                    >
                      {d.symbol}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-xs font-bold"
                      style={{
                        color: changeColor,
                        background: `${changeColor}18`,
                        border: `1px solid ${changeColor}44`,
                        textShadow: `0 0 5px ${changeColor}`,
                      }}
                    >
                      {d.change24h >= 0 ? "+" : ""}
                      {d.change24h?.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Bot() {
  const backend = useBackendSafe();
  const qc = useQueryClient();

  const { data: settings = DEFAULT_SETTINGS } = useQuery({
    queryKey: ["botSettings"],
    queryFn: () =>
      backend!.getCallerBotSettings().then((s) => s ?? DEFAULT_SETTINGS),
    placeholderData: DEFAULT_SETTINGS,
    enabled: !!backend,
  });

  const [localSettings, setLocalSettings] = useState<BotSettings | null>(null);
  const effective = localSettings ?? settings;

  const saveSettings = useMutation({
    mutationFn: (s: BotSettings) => backend!.updateBotSettings(s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["botSettings"] });
      toast.success("Bot settings saved");
      setLocalSettings(null);
    },
    onError: () => toast.error("Failed to save settings"),
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" data-ocid="bot.page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded rgb-strobe-border"
          style={{
            background: `${NEON_MAGENTA}22`,
          }}
        >
          <BotIcon size={22} className="rgb-strobe-text" />
        </div>
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest rgb-strobe-text">
            Genesis Trading Bot
          </h2>
          <p className="text-muted-foreground text-xs tracking-wider uppercase mt-0.5">
            Signal-based market analysis assistant
          </p>
        </div>
      </div>

      <Alert
        data-ocid="bot.disclaimer"
        style={{
          borderColor: `${NEON_MAGENTA}40`,
          background: `${NEON_MAGENTA}08`,
        }}
      >
        <AlertTriangle size={14} style={{ color: NEON_MAGENTA }} />
        <AlertDescription className="text-xs text-muted-foreground">
          This bot provides informational signals only. Not financial advice.
          Always do your own research before trading.
        </AlertDescription>
      </Alert>

      {/* Settings Card */}
      <Card data-ocid="bot.settings.card" className="border rgb-strobe-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium flex items-center gap-2 uppercase tracking-widest text-muted-foreground">
            <Settings size={12} /> Bot Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Bot Signals</Label>
              <p className="text-xs text-muted-foreground">
                Receive buy/sell recommendations
              </p>
            </div>
            <Switch
              checked={effective.enabled}
              onCheckedChange={(v) =>
                setLocalSettings({ ...effective, enabled: v })
              }
              data-ocid="bot.enabled.switch"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Dip Threshold</Label>
              <span
                className="text-sm font-bold font-mono"
                style={{ color: NEON_CYAN }}
              >
                {effective.dipThresholdPercent}%
              </span>
            </div>
            <Slider
              min={1}
              max={20}
              step={0.5}
              value={[effective.dipThresholdPercent]}
              onValueChange={([v]) =>
                setLocalSettings({ ...effective, dipThresholdPercent: v })
              }
              data-ocid="bot.threshold.slider"
            />
            <p className="text-xs text-muted-foreground">
              Minimum price drop below SMA7 to trigger a BUY DIP signal
            </p>
          </div>
          {localSettings && (
            <Button
              onClick={() => saveSettings.mutate(effective)}
              disabled={saveSettings.isPending}
              data-ocid="bot.settings.save_button"
              className="neon-glow-primary"
            >
              {saveSettings.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              Save Settings
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Active Signals */}
      <div>
        <h3 className="text-xs font-semibold mb-4 uppercase tracking-widest rgb-strobe-text">
          ⬡ Active Signals
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {effective.targetAssets.map((assetId, i) => (
            <SignalCard key={assetId} assetId={assetId} index={i + 1} />
          ))}
        </div>
      </div>

      {/* 24H Volume Comparison Chart */}
      <VolumeComparisonChart />

      {/* Analysis Dashboard Divider */}
      <div className="flex items-center gap-4 py-2">
        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(to right, transparent, ${NEON_MAGENTA}60, transparent)`,
          }}
        />
        <span className="text-xs uppercase tracking-widest font-bold rgb-strobe-text">
          ⚡ Analysis Dashboard
        </span>
        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(to left, transparent, ${NEON_MAGENTA}60, transparent)`,
          }}
        />
      </div>

      {/* Analysis Panels rendered per asset */}
      {effective.targetAssets.map((assetId, i) => (
        <AssetAnalysisPanels key={assetId} assetId={assetId} index={i + 1} />
      ))}
    </div>
  );
}

function SignalCard({ assetId, index }: { assetId: string; index: number }) {
  const backend = useBackendSafe();
  const { data: historyJson, isLoading } = useQuery({
    queryKey: ["history", assetId, 14],
    queryFn: () => backend!.fetchCoinHistory(assetId, BigInt(14)),
    staleTime: 300000,
    enabled: !!backend,
  });

  const history = useMemo(
    () => parseCoinHistory(historyJson ?? "{}"),
    [historyJson],
  );
  const signal = useMemo(() => computeSignal(history), [history]);
  const sparkData = history.slice(-14).map((h, i) => ({ i, price: h.price }));
  const currentPrice = history[history.length - 1]?.price;

  const signalConfig: Record<
    BotSignal,
    { label: string; icon: React.ReactNode; color: string }
  > = {
    BUY_DIP: {
      label: "BUY DIP",
      icon: <TrendingUp size={13} />,
      color: "oklch(0.75 0.24 195)",
    },
    SELL: {
      label: "SELL",
      icon: <TrendingDown size={13} />,
      color: "oklch(0.65 0.22 25)",
    },
    HOLD: {
      label: "HOLD",
      icon: <Minus size={13} />,
      color: "oklch(0.68 0.28 280)",
    },
  };
  const cfg = signalConfig[signal.signal];

  const breakoutConfig = {
    BREAKOUT: { color: "oklch(0.75 0.24 195)", label: "BREAKOUT" },
    FAKEOUT: { color: "oklch(0.65 0.22 25)", label: "FAKEOUT" },
    NEUTRAL: { color: "oklch(0.52 0.03 280)", label: "NEUTRAL" },
  };
  const bCfg = breakoutConfig[signal.breakout.type];

  return (
    <Card
      data-ocid={`bot.signal.card.${index}`}
      className="border rgb-strobe-border"
      style={{ background: "oklch(0.09 0.015 280 / 0.8)" }}
    >
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton
            className="h-32"
            data-ocid={`bot.signal.loading_state.${index}`}
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold uppercase tracking-wider text-sm rgb-strobe-text">
                  {assetId}
                </div>
                {currentPrice && (
                  <div className="text-sm font-mono text-muted-foreground">
                    ${currentPrice.toLocaleString()}
                  </div>
                )}
              </div>
              <div className="text-right space-y-1">
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold font-mono uppercase tracking-wider"
                  style={{
                    color: cfg.color,
                    background: `${cfg.color}22`,
                    border: `1px solid ${cfg.color}55`,
                    textShadow: `0 0 8px ${cfg.color}`,
                  }}
                >
                  {cfg.icon} {cfg.label}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {signal.confidence}% conf
                </div>
              </div>
            </div>

            {/* Spark chart */}
            {sparkData.length > 0 && (
              <ResponsiveContainer width="100%" height={55}>
                <AreaChart data={sparkData}>
                  <defs>
                    <linearGradient
                      id={`grad-${assetId}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="oklch(0.75 0.24 195)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="oklch(0.75 0.24 195)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="oklch(0.75 0.24 195)"
                    fill={`url(#grad-${assetId})`}
                    dot={false}
                    strokeWidth={1.5}
                  />
                  <XAxis hide />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip
                    formatter={(v: number) => `$${v.toLocaleString()}`}
                    labelFormatter={() => ""}
                    contentStyle={{
                      background: "oklch(0.09 0.015 280)",
                      border: "1px solid oklch(0.75 0.24 195 / 0.55)",
                      fontSize: "11px",
                      fontFamily: "Geist Mono, monospace",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {/* Breakout / Fakeout badge */}
            <div
              className="flex items-center gap-2 p-2 rounded"
              style={{
                background: `${bCfg.color}11`,
                border: `1px solid ${bCfg.color}33`,
              }}
              data-ocid={`bot.breakout.badge.${index}`}
            >
              <span
                className="text-xs font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  color: bCfg.color,
                  background: `${bCfg.color}22`,
                  textShadow: `0 0 6px ${bCfg.color}`,
                }}
              >
                {bCfg.label}
              </span>
              {signal.breakout.direction !== "NONE" && (
                <span style={{ color: bCfg.color }}>
                  {signal.breakout.direction === "UP" ? (
                    <ArrowUp size={12} />
                  ) : (
                    <ArrowDown size={12} />
                  )}
                </span>
              )}
              <p className="text-xs text-muted-foreground leading-tight flex-1">
                {signal.breakout.reasoning}
              </p>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {signal.reasoning}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AssetAnalysisPanels({
  assetId,
  index,
}: {
  assetId: string;
  index: number;
}) {
  const backend = useBackendSafe();
  const { data: historyJson, isLoading } = useQuery({
    queryKey: ["history", assetId, 14],
    queryFn: () => backend!.fetchCoinHistory(assetId, BigInt(14)),
    staleTime: 300000,
    enabled: !!backend,
  });

  const history = useMemo(
    () => parseCoinHistory(historyJson ?? "{}"),
    [historyJson],
  );
  const signal = useMemo(() => computeSignal(history), [history]);

  if (isLoading) {
    return (
      <div
        className="space-y-4"
        data-ocid={`bot.signal.loading_state.${index}`}
      >
        <Skeleton className="h-24" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  const { micro, macro, liquidityZones } = signal;

  const structureColor =
    macro.marketStructure === "UPTREND"
      ? NEON_CYAN
      : macro.marketStructure === "DOWNTREND"
        ? NEON_RED
        : NEON_YELLOW;

  const rsiColor =
    micro.rsi > 70 ? NEON_RED : micro.rsi < 30 ? NEON_GREEN : NEON_YELLOW;

  const volatilityColor =
    macro.volatilityLevel === "HIGH"
      ? NEON_RED
      : macro.volatilityLevel === "MEDIUM"
        ? NEON_YELLOW
        : NEON_GREEN;

  const volumeRatioColor =
    micro.volumeRatio > 1.5
      ? NEON_GREEN
      : micro.volumeRatio < 0.8
        ? NEON_RED
        : NEON_YELLOW;

  const obvColor =
    micro.obvTrend === "RISING"
      ? NEON_GREEN
      : micro.obvTrend === "FALLING"
        ? NEON_RED
        : "oklch(0.52 0.03 280)";

  const assetLabel = assetId.charAt(0).toUpperCase() + assetId.slice(1);

  return (
    <div className="space-y-4">
      {/* Asset label */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1" style={{ background: `${NEON_CYAN}40` }} />
        <span className="text-xs font-bold uppercase tracking-widest font-mono rgb-strobe-text">
          {assetLabel}
        </span>
        <div className="h-px flex-1" style={{ background: `${NEON_CYAN}40` }} />
      </div>

      {/* Micro + Macro row */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Micro Analysis */}
        <Card
          className="border rgb-strobe-border"
          style={{
            background: "oklch(0.09 0.015 280 / 0.7)",
          }}
          data-ocid="bot.micro.section"
        >
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Monitor size={11} /> Micro Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* RSI */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  RSI ({micro.rsiSignal})
                </span>
                <span
                  className="text-xs font-bold font-mono"
                  style={{ color: rsiColor }}
                >
                  {micro.rsi}
                </span>
              </div>
              <div
                className="h-2 rounded-sm overflow-hidden"
                style={{ background: "oklch(0.14 0.02 280)" }}
              >
                <div
                  className="h-full rounded-sm transition-all"
                  style={{
                    width: `${micro.rsi}%`,
                    background: `linear-gradient(to right, ${rsiColor}88, ${rsiColor})`,
                    boxShadow: `0 0 6px ${rsiColor}`,
                  }}
                />
              </div>
            </div>

            {/* Volume Ratio */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Volume Ratio
              </span>
              <span
                className="text-xs font-bold font-mono px-2 py-0.5 rounded"
                style={{
                  color: volumeRatioColor,
                  background: `${volumeRatioColor}22`,
                  border: `1px solid ${volumeRatioColor}44`,
                }}
              >
                {micro.volumeRatio}x avg
              </span>
            </div>

            {/* OBV Trend */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                OBV Trend
              </span>
              <span
                className="text-xs font-bold font-mono uppercase px-2 py-0.5 rounded"
                style={{
                  color: obvColor,
                  background: `${obvColor}22`,
                  border: `1px solid ${obvColor}44`,
                  textShadow:
                    micro.obvTrend !== "FLAT" ? `0 0 6px ${obvColor}` : "none",
                }}
              >
                OBV: {micro.obvTrend}
              </span>
            </div>

            {/* Volume spike */}
            {micro.volumeSpike && (
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono"
                style={{
                  background: `${NEON_MAGENTA}18`,
                  border: `1px solid ${NEON_MAGENTA}44`,
                  color: NEON_MAGENTA,
                }}
              >
                <Zap size={11} />
                <span className="font-bold">VOLUME SPIKE</span>
                <span className="text-muted-foreground">
                  {micro.volumeSpikeMultiplier}x avg
                </span>
              </div>
            )}

            {/* Support levels */}
            {micro.supportLevels.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Support
                </p>
                <div className="flex flex-wrap gap-1">
                  {micro.supportLevels.map((lvl) => (
                    <span
                      key={lvl}
                      className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: `${NEON_GREEN}22`,
                        color: NEON_GREEN,
                        border: `1px solid ${NEON_GREEN}44`,
                      }}
                    >
                      $
                      {lvl.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resistance levels */}
            {micro.resistanceLevels.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Resistance
                </p>
                <div className="flex flex-wrap gap-1">
                  {micro.resistanceLevels.map((lvl) => (
                    <span
                      key={lvl}
                      className="text-xs font-mono px-1.5 py-0.5 rounded"
                      style={{
                        background: `${NEON_RED}22`,
                        color: NEON_RED,
                        border: `1px solid ${NEON_RED}44`,
                      }}
                    >
                      $
                      {lvl.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Macro Analysis */}
        <Card
          className="border rgb-strobe-border"
          style={{
            background: "oklch(0.09 0.015 280 / 0.7)",
          }}
          data-ocid="bot.macro.section"
        >
          <CardHeader className="pb-2 pt-4">
            <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Activity size={11} /> Macro Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Market structure */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Structure
              </span>
              <span
                className="text-xs font-bold font-mono uppercase px-2 py-0.5 rounded"
                style={{
                  color: structureColor,
                  background: `${structureColor}22`,
                  border: `1px solid ${structureColor}44`,
                  textShadow: `0 0 6px ${structureColor}`,
                }}
              >
                {macro.marketStructure}
              </span>
            </div>

            {/* Momentum */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Momentum
                </span>
                <span
                  className="text-xs font-bold font-mono"
                  style={{ color: NEON_PURPLE }}
                >
                  {macro.momentumScore}/100
                </span>
              </div>
              <div
                className="h-2 rounded-sm overflow-hidden"
                style={{ background: "oklch(0.14 0.02 280)" }}
              >
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${macro.momentumScore}%`,
                    background: `linear-gradient(to right, ${NEON_PURPLE}88, ${NEON_PURPLE})`,
                    boxShadow: `0 0 6px ${NEON_PURPLE}`,
                  }}
                />
              </div>
            </div>

            {/* 14d trend */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                14d Trend
              </span>
              <span
                className="text-xs font-bold font-mono"
                style={{ color: macro.trend14d >= 0 ? NEON_GREEN : NEON_RED }}
              >
                {macro.trend14d >= 0 ? "+" : ""}
                {macro.trend14d}%
              </span>
            </div>

            {/* Volatility */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Volatility
              </span>
              <span
                className="text-xs font-bold font-mono uppercase px-2 py-0.5 rounded"
                style={{
                  color: volatilityColor,
                  background: `${volatilityColor}22`,
                  border: `1px solid ${volatilityColor}44`,
                }}
              >
                {macro.volatilityLevel}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liquidity Heatmap */}
      <Card
        className="border rgb-strobe-border"
        style={{
          background: "oklch(0.09 0.015 280 / 0.7)",
        }}
        data-ocid="bot.heatmap.section"
      >
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Flame size={11} style={{ color: NEON_MAGENTA }} />
            <span>Liquidity Heatmap</span>
            <span className="ml-1 text-xs font-mono rgb-strobe-text">
              {assetLabel}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {liquidityZones.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Insufficient data for heatmap.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Price zones colored by liquidity concentration. Brighter = more
                activity.
              </p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart
                  data={liquidityZones}
                  margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
                >
                  <XAxis
                    dataKey="label"
                    tick={{
                      fontSize: 9,
                      fill: "oklch(0.52 0.03 280)",
                      fontFamily: "Geist Mono",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(val: number) => [
                      `${val}% intensity`,
                      "Liquidity",
                    ]}
                    contentStyle={{
                      background: "oklch(0.09 0.015 280)",
                      border: "1px solid oklch(0.75 0.24 195 / 0.55)",
                      fontSize: "11px",
                      fontFamily: "Geist Mono, monospace",
                    }}
                  />
                  <Bar dataKey="intensity" radius={[2, 2, 0, 0]}>
                    {liquidityZones.map((zone) => {
                      const alpha = 0.2 + (zone.intensity / 100) * 0.8;
                      const color =
                        zone.type === "bid" ? NEON_CYAN : NEON_MAGENTA;
                      return (
                        <Cell
                          key={zone.price}
                          fill={color}
                          fillOpacity={alpha}
                          style={{
                            filter:
                              zone.intensity > 60
                                ? `drop-shadow(0 0 4px ${color})`
                                : "none",
                          }}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block w-2 h-2 rounded-sm"
                    style={{ background: NEON_CYAN }}
                  />
                  Bid zones (below price)
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block w-2 h-2 rounded-sm"
                    style={{ background: NEON_MAGENTA }}
                  />
                  Ask zones (above price)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
