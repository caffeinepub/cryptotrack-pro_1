import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBackendSafe } from "../hooks/useBackend";

interface CoinDetails {
  id: string;
  name: string;
  symbol: string;
  description?: { en: string };
  market_data?: {
    current_price?: { usd: number };
    total_volume?: { usd: number };
    market_cap?: { usd: number };
    price_change_percentage_24h?: number;
  };
  developer_data?: {
    commit_count_4_weeks?: number;
    stars?: number;
    forks?: number;
  };
  community_data?: { reddit_subscribers?: number; twitter_followers?: number };
}

function computeHealthScore(d: CoinDetails) {
  const dev = d.developer_data ?? {};
  const comm = d.community_data ?? {};
  const market = d.market_data ?? {};
  const devScore = Math.round(
    (Math.min((dev.commit_count_4_weeks ?? 0) / 200, 1) * 0.5 +
      Math.min((dev.stars ?? 0) / 50000, 1) * 0.3 +
      Math.min((dev.forks ?? 0) / 20000, 1) * 0.2) *
      40,
  );
  const communityScore = Math.round(
    (Math.min((comm.reddit_subscribers ?? 0) / 2000000, 1) * 0.5 +
      Math.min((comm.twitter_followers ?? 0) / 3000000, 1) * 0.5) *
      30,
  );
  const marketScore = Math.round(
    (Math.min((market.total_volume?.usd ?? 0) / 1e9, 1) * 0.6 +
      Math.min((market.market_cap?.usd ?? 0) / 100e9, 1) * 0.4) *
      30,
  );
  const score = devScore + communityScore + marketScore;
  const label =
    score >= 75
      ? "Active Builder"
      : score >= 50
        ? "Growing"
        : score >= 25
          ? "Slowing Down"
          : "Ghost Chain";
  return { score, label, devScore, communityScore, marketScore };
}

const POPULAR = [
  "bitcoin",
  "ethereum",
  "solana",
  "polkadot",
  "cardano",
  "chainlink",
];

export default function Health() {
  const backend = useBackendSafe();
  const [query, setQuery] = useState("");
  const [coinId, setCoinId] = useState("bitcoin");

  const {
    data: detailsJson,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["coinDetails", coinId],
    queryFn: () => backend!.fetchCoinDetails(coinId),
    staleTime: 300000,
    enabled: !!backend,
  });

  let details: CoinDetails | null = null;
  try {
    details = detailsJson ? (JSON.parse(detailsJson) as CoinDetails) : null;
  } catch {
    /* ignore */
  }

  const health = details ? computeHealthScore(details) : null;
  const labelColor = health
    ? health.label === "Active Builder"
      ? "text-green-500"
      : health.label === "Growing"
        ? "text-chart-1"
        : health.label === "Slowing Down"
          ? "text-yellow-500"
          : "text-red-500"
    : "";
  const barData =
    health && details
      ? [
          { name: "Dev Activity", value: health.devScore },
          { name: "Community", value: health.communityScore },
          { name: "Market", value: health.marketScore },
        ]
      : [];
  const barColors = [
    "oklch(0.72 0.18 195)",
    "oklch(0.75 0.17 145)",
    "oklch(0.78 0.2 70)",
  ];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto" data-ocid="health.page">
      <div>
        <h2 className="text-2xl font-bold">Project Health</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Separate active builders from ghost chains
        </p>
      </div>

      <div className="flex gap-2" data-ocid="health.search.section">
        <Input
          placeholder="Search by coin ID (e.g. bitcoin, polkadot)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && setCoinId(query.toLowerCase().trim())
          }
          data-ocid="health.search.input"
        />
        <Button
          onClick={() => setCoinId(query.toLowerCase().trim())}
          data-ocid="health.search.button"
        >
          <Search size={16} />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {POPULAR.map((id) => (
          <Button
            key={id}
            variant={coinId === id ? "default" : "outline"}
            size="sm"
            onClick={() => setCoinId(id)}
            data-ocid="health.preset.button"
            className="capitalize"
          >
            {id}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4" data-ocid="health.loading_state">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      ) : error || !details || !health ? (
        <Card>
          <CardContent
            className="py-10 text-center text-muted-foreground"
            data-ocid="health.error_state"
          >
            Could not load data for &quot;{coinId}&quot;. Try a valid CoinGecko
            ID.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card data-ocid="health.score.card">
            <CardContent className="pt-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold capitalize">
                    {details.name}{" "}
                    <span className="text-muted-foreground text-sm uppercase">
                      ({details.symbol})
                    </span>
                  </h3>
                  <div className={`text-base font-semibold mt-1 ${labelColor}`}>
                    {health.label}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{health.score}</div>
                  <div className="text-xs text-muted-foreground">/ 100</div>
                </div>
              </div>
              <Progress value={health.score} className="h-2" />
              <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                <div>
                  <div className="text-xl font-bold">
                    {health.devScore}
                    <span className="text-xs text-muted-foreground">/40</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Dev Activity
                  </div>
                </div>
                <div>
                  <div className="text-xl font-bold">
                    {health.communityScore}
                    <span className="text-xs text-muted-foreground">/30</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Community</div>
                </div>
                <div>
                  <div className="text-xl font-bold">
                    {health.marketScore}
                    <span className="text-xs text-muted-foreground">/30</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Market</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-ocid="health.metrics.card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Score Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barData} barSize={40}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, i) => (
                      <Cell key={entry.name} fill={barColors[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card data-ocid="health.dev.card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Developer Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Commits (4 weeks)
                  </span>
                  <span className="font-medium mono">
                    {details.developer_data?.commit_count_4_weeks ?? 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GitHub Stars</span>
                  <span className="font-medium mono">
                    {(details.developer_data?.stars ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">GitHub Forks</span>
                  <span className="font-medium mono">
                    {(details.developer_data?.forks ?? 0).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card data-ocid="health.community.card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Community</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Reddit Subscribers
                  </span>
                  <span className="font-medium mono">
                    {(
                      details.community_data?.reddit_subscribers ?? 0
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Twitter Followers
                  </span>
                  <span className="font-medium mono">
                    {(
                      details.community_data?.twitter_followers ?? 0
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    24h Price Change
                  </span>
                  <span className="font-medium mono">
                    {details.market_data?.price_change_percentage_24h?.toFixed(
                      2,
                    ) ?? 0}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {details.description?.en && (
            <Card data-ocid="health.description.card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                  {details.description.en.replace(/<[^>]+>/g, "")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
