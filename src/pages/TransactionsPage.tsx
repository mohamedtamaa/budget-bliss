import { useMemo, useState } from "react";
import { Plus, Search, Trash2, Pencil, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MonthFilter } from "@/components/MonthFilter";
import { useTransactions, useTransactionMutations, useAccounts, useAccountMutations, useCategories, useProfile } from "@/hooks/useFinanceData";
import { fmtMoney } from "@/lib/format";

export default function TransactionsPage() {
  const { data: txns = [] } = useTransactions();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: profile } = useProfile();
  const m = useTransactionMutations();
  const am = useAccountMutations();
  const currency = profile?.currency || "EGP";

  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    type: "expense" as "income" | "expense",
    amount: "", account_id: "", category_id: "", description: "", notes: "",
  });

  const filtered = useMemo(() => txns.filter((t: any) => {
    if (!t.date?.startsWith(month)) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (search && !(t.description?.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  }), [txns, month, typeFilter, search]);

  const totals = useMemo(() => ({
    income: filtered.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0),
    expense: filtered.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0),
  }), [filtered]);

  const reset = () => {
    setForm({ date: format(new Date(), "yyyy-MM-dd"), type: "expense", amount: "", account_id: "", category_id: "", description: "", notes: "" });
    setEditing(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) return;
    const amt = Number(form.amount);
    const payload = {
      date: form.date, type: form.type, amount: amt,
      account_id: form.account_id || null, category_id: form.category_id || null,
      description: form.description || null, notes: form.notes || null,
    };
    if (editing) await m.update.mutateAsync({ id: editing.id, ...payload });
    else await m.create.mutateAsync(payload);

    // If this is an expense charged to a credit card, push the amount onto the card's due / used balance
    const acc = accounts.find((a: any) => a.id === form.account_id);
    if (!editing && acc && acc.type === "credit_card" && form.type === "expense") {
      await am.update.mutateAsync({
        id: acc.id,
        due_amount: Number(acc.due_amount || 0) + amt,
        used_amount: Number(acc.used_amount || 0) + amt,
      });
    }

    setOpen(false); reset();
  };

  const startEdit = (t: any) => {
    setEditing(t);
    setForm({
      date: t.date, type: t.type === "income" ? "income" : "expense", amount: String(t.amount),
      account_id: t.account_id || "", category_id: t.category_id || "",
      description: t.description || "", notes: t.notes || "",
    });
    setOpen(true);
  };

  const filteredCats = categories.filter((c: any) => c.type === form.type);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthFilter value={month} onChange={setMonth} />
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild><Button><Plus size={16} /> Add transaction</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} transaction</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any, category_id: "" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
              </div>
              <div><Label>Amount</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
              <div>
                <Label>Account / Pay with</Label>
                <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select account or credit card" /></SelectTrigger>
                  <SelectContent>{accounts.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}{a.type === "credit_card" ? " (Credit card)" : ""}
                    </SelectItem>
                  ))}</SelectContent>
                </Select>
                {form.type === "expense" && accounts.find((a: any) => a.id === form.account_id)?.type === "credit_card" && (
                  <p className="text-[11px] text-warning mt-1">Charged to credit card — added to that card's due, not to monthly expenses.</p>
                )}
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{filteredCats.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Description (optional)</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>Notes (optional)</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <Button type="submit" className="w-full">{editing ? "Save" : "Add"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card"><div className="text-xs text-muted-foreground mb-1">Income</div><div className="text-xl font-bold text-primary num">{fmtMoney(totals.income, currency)}</div></div>
        <div className="stat-card"><div className="text-xs text-muted-foreground mb-1">Expenses</div><div className="text-xl font-bold text-destructive num">{fmtMoney(totals.expense, currency)}</div></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input className="pl-9" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="loan_payment">Loan payment</SelectItem>
            <SelectItem value="card_payment">Card payment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card divide-y divide-border/40">
        {filtered.length ? filtered.map((t: any) => {
          const acc = accounts.find((a: any) => a.id === t.account_id);
          const cat = categories.find((c: any) => c.id === t.category_id);
          return (
            <div key={t.id} className="flex items-center justify-between p-4 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === "income" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                  {t.type === "income" ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.description || cat?.name || t.type}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.date} · {acc?.name || "—"} · {cat?.name || "—"}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`text-sm font-semibold num ${t.type === "income" ? "text-primary" : "text-destructive"}`}>
                  {t.type === "income" ? "+" : "-"}{fmtMoney(t.amount, currency)}
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(t)}><Pencil size={14} /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => m.remove.mutate(t.id)}><Trash2 size={14} /></Button>
              </div>
            </div>
          );
        }) : <div className="p-10 text-center text-sm text-muted-foreground">No transactions for this month</div>}
      </div>
    </div>
  );
}
