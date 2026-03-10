import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBackendSafe } from "../hooks/useBackend";
import {
  formatPct,
  formatUsd,
  parseCoinHistory,
  parseTopCoins,
} from "../lib/priceUtils";

const COLORS = [
  "oklch(0.72 0.18 195)",
  "oklch(0.75 0.17 145)",
  "oklch(0.78 0.2 70)",
  "oklch(0.7 0.22 35)",
];

function CoinHistoryFetcher({
  coinId,
  onData,
}: { coinId: string; onData: (id: string, data: string) => void }) {
  const backend = useBackendSafe();
  useQuery({
    queryKey: ["history", coinId, 30],
    queryFn: async () => {
      const data = await backend!.fetchCoinHistory(coinId, BigInt(30));
      onData(coinId, data);
      return data;
    },
    staleTime: 300000,
    enabled: !!backend,
  });
  return null;
}

export default function Compare() {
  const backend = useBackendSafe();
  const [selected, setSelected] = useState<string[]>(["bitcoin", "ethereum"]);
  const [search, setSearch] = useState("");
  const [historyMap, setHistoryMap] = useState<Record<string, string>>({});

  const { data: topJson = "[]", isLoading: topLoading } = useQuery({
    queryKey: ["topCoins"],
    queryFn: () => backend!.fetchTopCoins(),
    staleTime: 120000,
    enabled: !!backend,
  });

  const topCoins = useMemo(() => parseTopCoins(topJson), [topJson]);
  const filtered = topCoins
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.symbol.toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, 20);

  const chartData = useMemo(() => {
    const histories = selected.map((id) =>
      parseCoinHistory(historyMap[id] ?? "{}"),
    );
    if (histories.some((h) => h.length < 2)) return [];
    const minLen = Math.min(...histories.map((h) => h.length));
    return Array.from({ length: minLen }).map((_, i) => {
      const entry: Record<string, number | string> = { day: `D${i}` };
      histories.forEach((h, ci) => {
        const base = h[0]?.price ?? 1;
        entry[selected[ci]] = Number(((h[i]?.price / base) * 100).toFixed(2));
      });
      return entry;
    });
  }, [historyMap, selected]);

  const addCoin = (id: string) => {
    if (!selected.includes(id) && selected.length < 4)
      setSelected((s) => [...s, id]);
  };
  const removeCoin = (id: string) =>
    setSelected((s) => s.filter((x) => x !== id));
  const handleHistoryData = (id: string, data: string) =>
    setHistoryMap((m) => ({ ...m, [id]: data }));
  const allLoaded = selected.every((id) => historyMap[id]);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" data-ocid="compare.page">
      {selected.map((id) => (
        <CoinHistoryFetcher key={id} coinId={id} onData={handleHistoryData} />
      ))}

      <div>
        <h2 className="text-2xl font-bold">Compare Assets</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Side-by-side market comparison (up to 4 assets)
        </p>
      </div>

      <Card data-ocid="compare.selector.card">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {selected.map((id, i) => {
              const coin = topCoins.find((c) => c.id === id);
              return (
                <Badge
                  key={id}
                  variant="outline"
                  className="gap-1.5 pr-1.5 py-1"
                >
                  <span style={{ color: COLORS[i] }}>●</span>
                  {coin?.name ?? id}
                  <button
                    type="button"
                    onClick={() => removeCoin(id)}
                    data-ocid={`compare.remove.button.${i + 1}`}
                  >
                    <X
                      size={12}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    />
                  </button>
                </Badge>
              );
            })}
          </div>
          <input
            className="w-full text-sm bg-input border border-border rounded-md px-3 py-2 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search coins to compare..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="compare.search.input"
          />
          {search && (
            <div className="mt-2 border border-border rounded-md overflow-hidden max-h-40 overflow-y-auto">
              {filtered.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    addCoin(c.id);
                    setSearch("");
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between"
                  disabled={selected.includes(c.id) || selected.length >= 4}
                  data-ocid="compare.coin.button"
                >
                  <span>
                    {c.name}{" "}
                    <span className="text-muted-foreground uppercase text-xs">
                      {c.symbol}
                    </span>
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {formatUsd(c.current_price)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topLoading
          ? [1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className="h-32"
                data-ocid="compare.loading_state"
              />
            ))
          : selected.map((id, i) => {
              const c = topCoins.find((x) => x.id === id);
              if (!c) return null;
              return (
                <Card
                  key={id}
                  data-ocid={`compare.coin.card.${i + 1}`}
                  style={{ borderColor: COLORS[i], borderWidth: 1.5 }}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: COLORS[i] }}
                      />
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-muted-foreground text-xs uppercase">
                        {c.symbol}
                      </span>
                    </div>
                    <div className="text-xl font-bold mono">
                      {formatUsd(c.current_price)}
                    </div>
                    <div
                      className={`text-sm mt-1 ${c.price_change_percentage_24h >= 0 ? "text-green-500" : "text-red-500"}`}
                    >
                      {formatPct(c.price_change_percentage_24h)} 24h
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Market Cap</span>
                        <span>{formatUsd(c.market_cap)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volume 24h</span>
                        <span>{formatUsd(c.total_volume)}</span>
                      </div>
                      {c.price_change_percentage_7d_in_currency != null && (
                        <div className="flex justify-between">
                          <span>7d</span>
                          <span
                            className={
                              c.price_change_percentage_7d_in_currency >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            {formatPct(
                              c.price_change_percentage_7d_in_currency,
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <Card data-ocid="compare.chart.card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Relative Performance (30 days, indexed to 100)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!allLoaded ? (
            <Skeleton
              className="h-64"
              data-ocid="compare.chart.loading_state"
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.5 0 0 / 15%)"
                />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                <Tooltip formatter={(v: number) => v.toFixed(2)} />
                <Legend />
                {selected.map((id, i) => (
                  <Line
                    key={id}
                    type="monotone"
                    dataKey={id}
                    stroke={COLORS[i]}
                    dot={false}
                    strokeWidth={2}
                    name={topCoins.find((c) => c.id === id)?.name ?? id}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
