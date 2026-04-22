import { useState } from "react";
import { format } from "date-fns";
import { Check, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTransactionMutations, useAccounts, useCategories, useProfile } from "@/hooks/useFinanceData";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function QuickAddPage() {
  const { user, loading } = useAuth();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: profile } = useProfile();
  const m = useTransactionMutations();
  const currency = profile?.currency || "EGP";

  const [type, setType] = useState<"expense" | "income">("expense");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saved, setSaved] = useState(false);

  if (!loading && !user) return <Navigate to="/auth" replace />;

  const filteredCats = categories.filter((c: any) => c.type === type);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await m.create.mutateAsync({
      type,
      amount: Number(amount),
      description: desc || null,
      date: format(new Date(), "yyyy-MM-dd"),
      account_id: accountId || null,
      category_id: categoryId || null,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setAmount("");
      setDesc("");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold">Quick Add</h1>
          <p className="text-xs text-muted-foreground">Money Manager Pro</p>
        </div>

        {saved ? (
          <div className="glass-card p-10 flex flex-col items-center gap-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="text-primary" size={28} />
            </div>
            <p className="font-semibold">Saved!</p>
          </div>
        ) : (
          <form onSubmit={submit} className="glass-card p-5 space-y-4">
            {/* Type toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setType("expense"); setCategoryId(""); }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all border ${
                  type === "expense"
                    ? "bg-destructive/15 border-destructive/40 text-destructive"
                    : "border-border/40 text-muted-foreground"
                }`}
              >
                <ArrowDownRight size={16} /> Expense
              </button>
              <button
                type="button"
                onClick={() => { setType("income"); setCategoryId(""); }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-medium transition-all border ${
                  type === "income"
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "border-border/40 text-muted-foreground"
                }`}
              >
                <ArrowUpRight size={16} /> Income
              </button>
            </div>

            {/* Amount - big */}
            <div>
              <Label>Amount ({currency})</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
                className="text-2xl h-14 font-bold text-center"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Description (optional)</Label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What was this for?" />
            </div>

            <div>
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{accounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{filteredCats.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full h-12 text-base" disabled={m.create.isPending}>
              {m.create.isPending ? "Saving..." : "Add Transaction"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
