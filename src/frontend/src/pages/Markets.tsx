import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useBackendSafe } from "../hooks/useBackend";
import {
  type TopCoin,
  formatPct,
  formatUsd,
  parseTopCoins,
} from "../lib/priceUtils";

type SortKey = "rank" | "price" | "pct24" | "pct7d" | "marketcap" | "volume";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown size={12} className="ml-1 opacity-40" />;
  return dir === "asc" ? (
    <ArrowUp size={12} className="ml-1 text-primary" />
  ) : (
    <ArrowDown size={12} className="ml-1 text-primary" />
  );
}

export default function Markets() {
  const backend = useBackendSafe();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // Fetch all 4 pages in parallel
  const page1 = useQuery({
    queryKey: ["topCoins", 1],
    queryFn: () => (backend as any).fetchTopCoinsPage(BigInt(1)),
    enabled: !!backend,
    staleTime: 60000,
  });
  const page2 = useQuery({
    queryKey: ["topCoins", 2],
    queryFn: () => (backend as any).fetchTopCoinsPage(BigInt(2)),
    enabled: !!backend,
    staleTime: 60000,
  });
  const page3 = useQuery({
    queryKey: ["topCoins", 3],
    queryFn: () => (backend as any).fetchTopCoinsPage(BigInt(3)),
    enabled: !!backend,
    staleTime: 60000,
  });
  const page4 = useQuery({
    queryKey: ["topCoins", 4],
    queryFn: () => (backend as any).fetchTopCoinsPage(BigInt(4)),
    enabled: !!backend,
    staleTime: 60000,
  });

  const isLoading =
    page1.isLoading || page2.isLoading || page3.isLoading || page4.isLoading;

  const allCoins = useMemo<TopCoin[]>(() => {
    const p1 = parseTopCoins((page1.data as string) ?? "[]");
    const p2 = parseTopCoins((page2.data as string) ?? "[]");
    const p3 = parseTopCoins((page3.data as string) ?? "[]");
    const p4 = parseTopCoins((page4.data as string) ?? "[]");
    return [...p1, ...p2, ...p3, ...p4];
  }, [page1.data, page2.data, page3.data, page4.data]);

  // Attach original rank index before filtering
  const allCoinsWithRank = useMemo(
    () => allCoins.map((c, i) => ({ coin: c, rank: i + 1 })),
    [allCoins],
  );

  const filteredWithRank = useMemo(() => {
    if (!search.trim()) return allCoinsWithRank;
    const q = search.toLowerCase();
    return allCoinsWithRank.filter(
      ({ coin }) =>
        coin.name.toLowerCase().includes(q) ||
        coin.symbol.toLowerCase().includes(q),
    );
  }, [allCoinsWithRank, search]);

  const sorted = useMemo(() => {
    if (sortKey === "rank") {
      return sortDir === "asc"
        ? [...filteredWithRank]
        : [...filteredWithRank].reverse();
    }
    return [...filteredWithRank].sort((a, b) => {
      let av = 0;
      let bv = 0;
      if (sortKey === "price") {
        av = a.coin.current_price ?? 0;
        bv = b.coin.current_price ?? 0;
      } else if (sortKey === "pct24") {
        av = a.coin.price_change_percentage_24h ?? 0;
        bv = b.coin.price_change_percentage_24h ?? 0;
      } else if (sortKey === "pct7d") {
        av = a.coin.price_change_percentage_7d_in_currency ?? 0;
        bv = b.coin.price_change_percentage_7d_in_currency ?? 0;
      } else if (sortKey === "marketcap") {
        av = a.coin.market_cap ?? 0;
        bv = b.coin.market_cap ?? 0;
      } else if (sortKey === "volume") {
        av = a.coin.total_volume ?? 0;
        bv = b.coin.total_volume ?? 0;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [filteredWithRank, sortKey, sortDir]);

  const thClass =
    "cursor-pointer select-none hover:text-foreground transition-colors";

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" data-ocid="markets.page">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Markets</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Top 200 cryptocurrencies by market cap
          </p>
        </div>
        {allCoins.length > 0 && (
          <span className="text-xs text-muted-foreground self-end pb-1">
            {allCoins.length} coins loaded
          </span>
        )}
      </div>

      {!backend && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          Sign in to load live market data from CoinGecko.
        </div>
      )}

      {/* Prominent Search Section */}
      <Card className="border-border/60 bg-card shadow-sm">
        <CardContent className="pt-5 pb-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Search size={16} className="text-primary" />
              <span className="text-sm font-semibold">Search Assets</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Type a coin name or symbol to filter from the list below
            </p>
            <div className="relative mt-3">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="e.g. Bitcoin, ETH, Solana…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 text-base focus-visible:ring-primary"
                data-ocid="markets.search.input"
                autoComplete="off"
                autoFocus={false}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs"
                >
                  Clear
                </button>
              )}
            </div>
            {search && (
              <p className="text-xs text-muted-foreground pt-1">
                {sorted.length === 0
                  ? `No results for "${search}"`
                  : `${sorted.length} result${
                      sorted.length !== 1 ? "s" : ""
                    } for "${search}"`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2" data-ocid="markets.loading_state">
          {Array.from({ length: 12 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="py-16 text-center text-muted-foreground text-sm"
          data-ocid="markets.empty_state"
        >
          {search
            ? `No coins matching "${search}"`
            : "No market data available. Sign in to load live data."}
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table data-ocid="markets.table">
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead
                  className={`w-12 ${thClass}`}
                  onClick={() => handleSort("rank")}
                  data-ocid="markets.rank_sort.button"
                >
                  <span className="inline-flex items-center">
                    #
                    <SortIcon active={sortKey === "rank"} dir={sortDir} />
                  </span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead
                  className={`text-right ${thClass}`}
                  onClick={() => handleSort("price")}
                  data-ocid="markets.price_sort.button"
                >
                  <span className="inline-flex items-center justify-end w-full">
                    Price
                    <SortIcon active={sortKey === "price"} dir={sortDir} />
                  </span>
                </TableHead>
                <TableHead
                  className={`text-right ${thClass}`}
                  onClick={() => handleSort("pct24")}
                  data-ocid="markets.24h_sort.button"
                >
                  <span className="inline-flex items-center justify-end w-full">
                    24h %
                    <SortIcon active={sortKey === "pct24"} dir={sortDir} />
                  </span>
                </TableHead>
                <TableHead
                  className={`text-right hidden md:table-cell ${thClass}`}
                  onClick={() => handleSort("pct7d")}
                  data-ocid="markets.7d_sort.button"
                >
                  <span className="inline-flex items-center justify-end w-full">
                    7d %
                    <SortIcon active={sortKey === "pct7d"} dir={sortDir} />
                  </span>
                </TableHead>
                <TableHead
                  className={`text-right hidden lg:table-cell ${thClass}`}
                  onClick={() => handleSort("marketcap")}
                  data-ocid="markets.marketcap_sort.button"
                >
                  <span className="inline-flex items-center justify-end w-full">
                    Market Cap
                    <SortIcon active={sortKey === "marketcap"} dir={sortDir} />
                  </span>
                </TableHead>
                <TableHead
                  className={`text-right hidden lg:table-cell ${thClass}`}
                  onClick={() => handleSort("volume")}
                  data-ocid="markets.volume_sort.button"
                >
                  <span className="inline-flex items-center justify-end w-full">
                    Volume 24h
                    <SortIcon active={sortKey === "volume"} dir={sortDir} />
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(({ coin, rank }, idx) => {
                const pct24 = coin.price_change_percentage_24h ?? 0;
                const pct7d = coin.price_change_percentage_7d_in_currency ?? 0;
                const ocid = idx < 3 ? `markets.row.${idx + 1}` : undefined;
                return (
                  <TableRow
                    key={coin.id}
                    className="hover:bg-muted/30 transition-colors"
                    data-ocid={ocid}
                  >
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {rank}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold uppercase shrink-0">
                          {coin.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{coin.name}</div>
                          <div className="text-muted-foreground text-xs uppercase">
                            {coin.symbol}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      {formatUsd(coin.current_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          pct24 >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {pct24 >= 0 ? (
                          <TrendingUp size={12} />
                        ) : (
                          <TrendingDown size={12} />
                        )}
                        {formatPct(pct24)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right hidden md:table-cell">
                      <span
                        className={`text-xs font-medium ${
                          pct7d >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {formatPct(pct7d)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground hidden lg:table-cell">
                      {formatUsd(coin.market_cap)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground hidden lg:table-cell">
                      {formatUsd(coin.total_volume)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
