import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useBackendSafe } from "../hooks/useBackend";
import { computePortfolioSummary } from "../lib/portfolioUtils";
import { formatPct, formatUsd, parsePrices } from "../lib/priceUtils";
import { sampleTrades } from "../sampleData";

const CHART_COLORS = [
  "oklch(0.72 0.18 195)",
  "oklch(0.75 0.17 145)",
  "oklch(0.78 0.2 70)",
  "oklch(0.7 0.22 35)",
  "oklch(0.68 0.2 280)",
];

export default function Dashboard() {
  const backend = useBackendSafe();

  const { data: trades = sampleTrades, isLoading: tradesLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: () => backend!.getCallerTrades(),
    placeholderData: sampleTrades,
    enabled: !!backend,
  });

  const assetIds = useMemo(
    () => [...new Set(trades.map((t) => t.assetId))],
    [trades],
  );

  const { data: pricesJson = "{}", isLoading: pricesLoading } = useQuery({
    queryKey: ["prices", assetIds],
    queryFn: () => backend!.fetchPrices(assetIds),
    enabled: !!backend && assetIds.length > 0,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const prices = useMemo(() => parsePrices(pricesJson), [pricesJson]);
  const summary = useMemo(
    () => computePortfolioSummary(trades, prices),
    [trades, prices],
  );

  const totalValue = summary.reduce((s, a) => s + a.currentValue, 0);
  const totalCost = summary.reduce((s, a) => s + a.costBasis, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  const best = summary.reduce(
    (b, a) => (a.pnlPct > (b?.pnlPct ?? Number.NEGATIVE_INFINITY) ? a : b),
    summary[0],
  );
  const worst = summary.reduce(
    (w, a) => (a.pnlPct < (w?.pnlPct ?? Number.POSITIVE_INFINITY) ? a : w),
    summary[0],
  );
  const pieData = summary.map((a) => ({
    name: a.assetName,
    value: a.currentValue,
  }));
  const isLoading = tradesLoading || pricesLoading;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-ocid="dashboard.page">
      <div>
        <h2 className="text-2xl font-bold">Portfolio Overview</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time tracking of your crypto holdings
        </p>
      </div>

      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        data-ocid="dashboard.section"
      >
        <StatCard
          title="Total Value"
          value={isLoading ? null : formatUsd(totalValue)}
          icon={<DollarSign size={16} />}
          loading={isLoading}
        />
        <StatCard
          title="Total P&L"
          value={isLoading ? null : formatUsd(Math.abs(totalPnl))}
          sub={isLoading ? null : formatPct(totalPnlPct)}
          positive={totalPnl >= 0}
          icon={
            totalPnl >= 0 ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )
          }
          loading={isLoading}
        />
        <StatCard
          title="Best Performer"
          value={best ? best.assetName : "--"}
          sub={best ? formatPct(best.pnlPct) : null}
          positive={true}
          icon={<TrendingUp size={16} />}
          loading={isLoading}
        />
        <StatCard
          title="Worst Performer"
          value={worst ? worst.assetName : "--"}
          sub={worst ? formatPct(worst.pnlPct) : null}
          positive={false}
          icon={<TrendingDown size={16} />}
          loading={isLoading}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card data-ocid="dashboard.allocation.card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton
                className="h-48 w-full"
                data-ocid="dashboard.loading_state"
              />
            ) : pieData.length === 0 ? (
              <div
                className="h-48 flex items-center justify-center text-muted-foreground text-sm"
                data-ocid="dashboard.empty_state"
              >
                No holdings yet
              </div>
            ) : (
              <div>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {pieData.map((entry, i) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatUsd(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieData.map((d, i) => (
                    <div
                      key={d.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            background: CHART_COLORS[i % CHART_COLORS.length],
                          }}
                        />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="font-medium">
                        {totalValue > 0
                          ? ((d.value / totalValue) * 100).toFixed(1)
                          : 0}
                        %
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2" data-ocid="dashboard.holdings.card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart2 size={15} /> Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2" data-ocid="dashboard.loading_state">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : summary.length === 0 ? (
              <div
                className="py-8 text-center text-muted-foreground text-sm"
                data-ocid="dashboard.empty_state"
              >
                Add your first trade to see holdings
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-2 font-medium">Asset</th>
                      <th className="text-right py-2 font-medium">Qty</th>
                      <th className="text-right py-2 font-medium">Avg Buy</th>
                      <th className="text-right py-2 font-medium">Current</th>
                      <th className="text-right py-2 font-medium">Value</th>
                      <th className="text-right py-2 font-medium">P&amp;L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((asset, i) => (
                      <tr
                        key={asset.assetId}
                        className="border-b border-border/50"
                        data-ocid={`holdings.row.${i + 1}`}
                      >
                        <td className="py-2.5">
                          <div className="font-medium">{asset.assetName}</div>
                          <div className="text-muted-foreground text-xs uppercase">
                            {asset.assetId}
                          </div>
                        </td>
                        <td className="text-right py-2.5 mono">
                          {asset.totalQty.toFixed(4)}
                        </td>
                        <td className="text-right py-2.5 mono">
                          {formatUsd(asset.avgBuyPrice)}
                        </td>
                        <td className="text-right py-2.5 mono">
                          {formatUsd(asset.currentPrice)}
                        </td>
                        <td className="text-right py-2.5 mono font-medium">
                          {formatUsd(asset.currentValue)}
                        </td>
                        <td className="text-right py-2.5">
                          <Badge
                            variant={asset.pnl >= 0 ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {formatPct(asset.pnlPct)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  positive,
  icon,
  loading,
}: {
  title: string;
  value: string | null;
  sub?: string | null;
  positive?: boolean;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {title}
          </span>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        {loading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <div className="text-xl font-bold">{value ?? "--"}</div>
        )}
        {sub && !loading && (
          <div
            className={`text-xs mt-1 font-medium ${positive ? "text-green-500" : "text-red-500"}`}
          >
            {sub}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
