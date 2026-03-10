import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, LogIn, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { RecurringBuyRule, Trade } from "../backend";
import { SignInButton } from "../components/SignInPrompt";
import { useBackendSafe } from "../hooks/useBackend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { formatUsd } from "../lib/priceUtils";
import { sampleRecurring, sampleTrades } from "../sampleData";

const COIN_OPTIONS = [
  { id: "bitcoin", name: "Bitcoin" },
  { id: "ethereum", name: "Ethereum" },
  { id: "solana", name: "Solana" },
  { id: "binancecoin", name: "BNB" },
  { id: "cardano", name: "Cardano" },
  { id: "polkadot", name: "Polkadot" },
  { id: "chainlink", name: "Chainlink" },
  { id: "avalanche-2", name: "Avalanche" },
];

export default function Trades() {
  const backend = useBackendSafe();
  const qc = useQueryClient();
  const { identity } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);

  const { data: trades = sampleTrades, isLoading: tradesLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: () => backend!.getCallerTrades(),
    placeholderData: sampleTrades,
    enabled: !!backend,
  });

  const { data: recurring = sampleRecurring, isLoading: recurringLoading } =
    useQuery({
      queryKey: ["recurring"],
      queryFn: () => backend!.getCallerRecurringBuyRules(),
      placeholderData: sampleRecurring,
      enabled: !!backend,
    });

  const addTrade = useMutation({
    mutationFn: (t: Trade) => backend!.createTrade(t),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
      toast.success("Trade added");
      setTradeDialogOpen(false);
    },
    onError: () => toast.error("Failed to add trade"),
  });

  const deleteTrade = useMutation({
    mutationFn: (assetId: string) => backend!.deleteTrade(assetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
      toast.success("Trade deleted");
    },
  });

  const addRecurring = useMutation({
    mutationFn: (r: RecurringBuyRule) => backend!.createRecurringBuyRule(r),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring"] });
      toast.success("Recurring buy added");
      setRecurringDialogOpen(false);
    },
  });

  const deleteRecurring = useMutation({
    mutationFn: (assetId: string) => backend!.deleteRecurringBuyRule(assetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring"] });
      toast.success("Recurring buy removed");
    },
  });

  const updateRecurring = useMutation({
    mutationFn: ({
      assetId,
      rule,
    }: { assetId: string; rule: RecurringBuyRule }) =>
      backend!.updateRecurringBuyRule(assetId, rule),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto" data-ocid="trades.page">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trades</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your trade history
          </p>
        </div>
        <Dialog open={tradeDialogOpen} onOpenChange={setTradeDialogOpen}>
          <DialogTrigger asChild>
            <Button data-ocid="trades.add.open_modal_button">
              <Plus size={16} className="mr-2" /> Add Trade
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="trades.add.dialog">
            <DialogHeader>
              <DialogTitle>Add Trade</DialogTitle>
            </DialogHeader>
            <TradeForm
              onSubmit={(t) => addTrade.mutate(t)}
              loading={addTrade.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Sign-in notice */}
      {!isLoggedIn && (
        <div
          className="flex items-center justify-between gap-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3"
          data-ocid="trades.panel"
        >
          <div className="flex items-center gap-3 min-w-0">
            <LogIn size={15} className="text-amber-500 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                Trades won&apos;t be saved.
              </span>{" "}
              Sign in to persist your portfolio across sessions.
            </p>
          </div>
          <SignInButton
            variant="outline"
            size="sm"
            label="Sign In"
            className="shrink-0"
          />
        </div>
      )}

      <Card data-ocid="trades.table.card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Trade History ({trades.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tradesLoading ? (
            <div className="space-y-2" data-ocid="trades.loading_state">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : trades.length === 0 ? (
            <div
              className="py-10 text-center text-muted-foreground"
              data-ocid="trades.empty_state"
            >
              No trades yet. Add your first trade above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2 font-medium">Asset</th>
                    <th className="text-left py-2 font-medium">Type</th>
                    <th className="text-right py-2 font-medium">Price</th>
                    <th className="text-right py-2 font-medium">Qty</th>
                    <th className="text-right py-2 font-medium">Total</th>
                    <th className="text-right py-2 font-medium">Date</th>
                    <th className="text-right py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t, i) => (
                    <tr
                      key={`${t.assetId}-${t.timestamp}-${i}`}
                      className="border-b border-border/50"
                      data-ocid={`trades.row.${i + 1}`}
                    >
                      <td className="py-2.5">
                        <div className="font-medium">{t.assetName}</div>
                        {t.note && (
                          <div className="text-xs text-muted-foreground">
                            {t.note}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5">
                        <Badge
                          variant={
                            t.tradeType === "buy" ? "default" : "destructive"
                          }
                          className="text-xs capitalize"
                        >
                          {t.tradeType}
                        </Badge>
                      </td>
                      <td className="text-right py-2.5 mono">
                        {formatUsd(t.priceUsd)}
                      </td>
                      <td className="text-right py-2.5 mono">
                        {t.quantity.toFixed(4)}
                      </td>
                      <td className="text-right py-2.5 mono font-medium">
                        {formatUsd(t.priceUsd * t.quantity)}
                      </td>
                      <td className="text-right py-2.5 text-muted-foreground text-xs">
                        {new Date(t.timestamp).toLocaleDateString()}
                      </td>
                      <td className="text-right py-2.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTrade.mutate(t.assetId)}
                          data-ocid={`trades.delete_button.${i + 1}`}
                        >
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Recurring Buys</h3>
          <p className="text-muted-foreground text-sm">
            Dollar-cost averaging rules
          </p>
        </div>
        <Dialog
          open={recurringDialogOpen}
          onOpenChange={setRecurringDialogOpen}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              data-ocid="recurring.add.open_modal_button"
            >
              <RefreshCcw size={14} className="mr-2" /> Add Recurring Buy
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="recurring.add.dialog">
            <DialogHeader>
              <DialogTitle>Add Recurring Buy</DialogTitle>
            </DialogHeader>
            <RecurringForm
              onSubmit={(r) => addRecurring.mutate(r)}
              loading={addRecurring.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recurringLoading ? (
          [1, 2].map((i) => <Skeleton key={i} className="h-28" />)
        ) : recurring.length === 0 ? (
          <Card className="col-span-full">
            <CardContent
              className="py-8 text-center text-muted-foreground text-sm"
              data-ocid="recurring.empty_state"
            >
              No recurring buys set up.
            </CardContent>
          </Card>
        ) : (
          recurring.map((r, i) => (
            <Card key={r.assetId} data-ocid={`recurring.item.${i + 1}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{r.assetName}</div>
                    <div className="text-sm text-muted-foreground">
                      ${r.amountUsd} every {r.intervalDays.toString()} days
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRecurring.mutate(r.assetId)}
                    data-ocid={`recurring.delete_button.${i + 1}`}
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Switch
                    checked={r.enabled}
                    onCheckedChange={(enabled) =>
                      updateRecurring.mutate({
                        assetId: r.assetId,
                        rule: { ...r, enabled },
                      })
                    }
                    data-ocid={`recurring.switch.${i + 1}`}
                  />
                  <span className="text-sm text-muted-foreground">
                    {r.enabled ? "Active" : "Paused"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function TradeForm({
  onSubmit,
  loading,
}: { onSubmit: (t: Trade) => void; loading: boolean }) {
  const [assetId, setAssetId] = useState("bitcoin");
  const [assetName, setAssetName] = useState("Bitcoin");
  const [datetime, setDatetime] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [type, setType] = useState("buy");
  const [note, setNote] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      assetId,
      assetName,
      timestamp: new Date(datetime).getTime(),
      priceUsd: Number.parseFloat(price),
      quantity: Number.parseFloat(qty),
      tradeType: type,
      note,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Asset</Label>
          <Select
            value={assetId}
            onValueChange={(v) => {
              setAssetId(v);
              setAssetName(COIN_OPTIONS.find((c) => c.id === v)?.name ?? v);
            }}
          >
            <SelectTrigger data-ocid="trade.asset.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COIN_OPTIONS.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger data-ocid="trade.type.select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">Buy</SelectItem>
              <SelectItem value="sell">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Date &amp; Time</Label>
        <Input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          required
          data-ocid="trade.datetime.input"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Price (USD)</Label>
          <Input
            type="number"
            step="any"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            data-ocid="trade.price.input"
          />
        </div>
        <div className="space-y-1">
          <Label>Quantity</Label>
          <Input
            type="number"
            step="any"
            placeholder="0.0"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
            data-ocid="trade.quantity.input"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Note (optional)</Label>
        <Input
          placeholder="e.g. DCA buy"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          data-ocid="trade.note.input"
        />
      </div>
      <DialogFooter>
        <Button
          type="submit"
          disabled={loading}
          data-ocid="trade.submit_button"
        >
          {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
          Add Trade
        </Button>
      </DialogFooter>
    </form>
  );
}

function RecurringForm({
  onSubmit,
  loading,
}: { onSubmit: (r: RecurringBuyRule) => void; loading: boolean }) {
  const [assetId, setAssetId] = useState("bitcoin");
  const [assetName, setAssetName] = useState("Bitcoin");
  const [interval, setIntervalDays] = useState("7");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      assetId,
      assetName,
      intervalDays: BigInt(interval),
      amountUsd: Number.parseFloat(amount),
      enabled: true,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Asset</Label>
        <Select
          value={assetId}
          onValueChange={(v) => {
            setAssetId(v);
            setAssetName(COIN_OPTIONS.find((c) => c.id === v)?.name ?? v);
          }}
        >
          <SelectTrigger data-ocid="recurring.asset.select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COIN_OPTIONS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Amount (USD)</Label>
          <Input
            type="number"
            step="any"
            placeholder="50"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            data-ocid="recurring.amount.input"
          />
        </div>
        <div className="space-y-1">
          <Label>Every N Days</Label>
          <Input
            type="number"
            min="1"
            placeholder="7"
            value={interval}
            onChange={(e) => setIntervalDays(e.target.value)}
            required
            data-ocid="recurring.interval.input"
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          type="submit"
          disabled={loading}
          data-ocid="recurring.submit_button"
        >
          {loading ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
          Add Recurring Buy
        </Button>
      </DialogFooter>
    </form>
  );
}
