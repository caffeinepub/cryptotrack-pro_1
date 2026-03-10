import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Bot as BotIcon,
  Loader2,
  Minus,
  Settings,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import type { BotSettings } from "../backend";
import { useBackendSafe } from "../hooks/useBackend";
import { type BotSignal, computeSignal } from "../lib/botUtils";
import { parseCoinHistory } from "../lib/priceUtils";

const DEFAULT_SETTINGS: BotSettings = {
  enabled: false,
  dipThresholdPercent: 5,
  targetAssets: ["bitcoin", "ethereum"],
};

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
      <div className="flex items-center gap-3">
        <BotIcon size={24} className="text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Trading Bot</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Signal-based market analysis assistant
          </p>
        </div>
      </div>

      <Alert data-ocid="bot.disclaimer">
        <AlertTriangle size={16} />
        <AlertDescription className="text-sm">
          This bot provides informational signals only. Not financial advice.
          Always do your own research before trading.
        </AlertDescription>
      </Alert>

      <Card data-ocid="bot.settings.card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings size={14} /> Bot Configuration
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
              <span className="text-sm font-semibold text-primary">
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
            >
              {saveSettings.isPending ? (
                <Loader2 size={14} className="mr-2 animate-spin" />
              ) : null}
              Save Settings
            </Button>
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="text-base font-semibold mb-3">Active Signals</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {effective.targetAssets.map((assetId, i) => (
            <SignalCard key={assetId} assetId={assetId} index={i + 1} />
          ))}
        </div>
      </div>
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
    {
      label: string;
      icon: React.ReactNode;
      variant: "default" | "destructive" | "secondary";
    }
  > = {
    BUY_DIP: {
      label: "BUY DIP",
      icon: <TrendingUp size={16} />,
      variant: "default",
    },
    SELL: {
      label: "SELL",
      icon: <TrendingDown size={16} />,
      variant: "destructive",
    },
    HOLD: { label: "HOLD", icon: <Minus size={16} />, variant: "secondary" },
  };
  const cfg = signalConfig[signal.signal];

  return (
    <Card data-ocid={`bot.signal.card.${index}`}>
      <CardContent className="pt-4">
        {isLoading ? (
          <Skeleton
            className="h-32"
            data-ocid={`bot.signal.loading_state.${index}`}
          />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-semibold capitalize">{assetId}</div>
                {currentPrice && (
                  <div className="text-sm text-muted-foreground">
                    ${currentPrice.toLocaleString()}
                  </div>
                )}
              </div>
              <div className="text-right">
                <Badge variant={cfg.variant} className="gap-1">
                  {cfg.icon} {cfg.label}
                </Badge>
                <div className="text-xs text-muted-foreground mt-1">
                  {signal.confidence}% confidence
                </div>
              </div>
            </div>
            {sparkData.length > 0 && (
              <ResponsiveContainer width="100%" height={60}>
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
                        stopColor="oklch(0.72 0.18 195)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="oklch(0.72 0.18 195)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="oklch(0.72 0.18 195)"
                    fill={`url(#grad-${assetId})`}
                    dot={false}
                    strokeWidth={1.5}
                  />
                  <XAxis hide />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip
                    formatter={(v: number) => `$${v.toLocaleString()}`}
                    labelFormatter={() => ""}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {signal.reasoning}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
