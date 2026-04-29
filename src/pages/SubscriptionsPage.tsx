import { useState } from "react";
import { Plus, Trash2, Pencil, Power } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MonthFilter } from "@/components/MonthFilter";
import { PaidToggle } from "@/components/PaidToggle";
import { useRecurring, useRecurringMutations, useAccounts, useCategories, useProfile } from "@/hooks/useFinanceData";
import { useMonthlyPayments } from "@/hooks/useMonthlyPayments";
import { fmtMoney } from "@/lib/format";

export default function SubscriptionsPage() {
  const { data: allItems = [] } = useRecurring();
  const items = allItems.filter((i: any) => i.type === "subscription");
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: profile } = useProfile();
  const m = useRecurringMutations();
  const currency = profile?.currency || "EGP";

  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const { data: payments = [] } = useMonthlyPayments(month);

  const totalAll = items.filter((i: any) => i.active).reduce((s: number, i: any) => s + Number(i.amount), 0);
  const paidTotal = items
    .filter((i: any) => i.active && payments.some((p: any) => p.source_id === i.id && p.source_type === "subscription"))
    .reduce((s: number, i: any) => s + Number(i.amount), 0);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", amount: "", start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: "", account_id: "", category_id: "", active: true, included_in_total: true,
  });

  const reset = () => {
    setForm({ name: "", amount: "", start_date: format(new Date(), "yyyy-MM-dd"), end_date: "", account_id: "", category_id: "", active: true, included_in_total: true });
    setEditing(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: form.name, type: "subscription" as const, amount: Number(form.amount),
      start_date: form.start_date, end_date: form.end_date || null,
      account_id: form.account_id || null, category_id: form.category_id || null,
      active: form.active, included_in_total: form.included_in_total,
    };
    if (editing) await m.update.mutateAsync({ id: editing.id, ...payload });
    else await m.create.mutateAsync(payload);
    setOpen(false); reset();
  };

  const startEdit = (it: any) => {
    setEditing(it);
    setForm({
      name: it.name, amount: String(it.amount),
      start_date: it.start_date, end_date: it.end_date || "",
      account_id: it.account_id || "", category_id: it.category_id || "",
      active: it.active, included_in_total: it.included_in_total,
    });
    setOpen(true);
  };

  const expenseCats = categories.filter((c: any) => c.type === "expense");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthFilter value={month} onChange={setMonth} />
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild><Button><Plus size={16} /> Add subscription</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} subscription</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Netflix" /></div>
              <div><Label>Amount (monthly)</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required /></div>
                <div><Label>End date (opt)</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div>
                <Label>Account</Label>
                <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{accounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{expenseCats.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                <Label className="m-0">Active</Label>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
              <Button type="submit" className="w-full">{editing ? "Save" : "Add"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card"><div className="text-xs text-muted-foreground mb-1">Paid this month</div><div className="text-xl font-bold text-primary num">{fmtMoney(paidTotal, currency)}</div></div>
        <div className="stat-card"><div className="text-xs text-muted-foreground mb-1">Total / month</div><div className="text-xl font-bold num">{fmtMoney(totalAll, currency)}</div></div>
      </div>

      <div className="glass-card divide-y divide-border/40">
        {items.length ? items.map((i: any) => (
          <div key={i.id} className="flex items-center justify-between p-4 gap-3">
            <div className="min-w-0">
              <div className="font-medium flex items-center gap-2">
                {i.name}
                {!i.active && <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">paused</span>}
              </div>
              <div className="text-xs text-muted-foreground">since {i.start_date}{i.end_date ? ` · until ${i.end_date}` : ""}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="font-semibold num">{fmtMoney(i.amount, currency)}</div>
              {i.active && <PaidToggle sourceType="subscription" sourceId={i.id} amount={Number(i.amount)} month={month} />}
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => m.update.mutate({ id: i.id, active: !i.active })}><Power size={14} /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(i)}><Pencil size={14} /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => m.remove.mutate(i.id)}><Trash2 size={14} /></Button>
            </div>
          </div>
        )) : <div className="p-10 text-center text-sm text-muted-foreground">No subscriptions yet. Add your first one!</div>}
      </div>
    </div>
  );
}
