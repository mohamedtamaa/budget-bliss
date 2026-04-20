import { useState } from "react";
import { Plus, Trash2, Pencil, Power, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useLoans, useLoanMutations, useAccounts, useBudgets, useProfile } from "@/hooks/useFinanceData";
import { fmtMoney } from "@/lib/format";

export default function LoansPage() {
  const { data: loans = [] } = useLoans();
  const { data: accounts = [] } = useAccounts();
  const { data: budgets = [] } = useBudgets();
  const { data: profile } = useProfile();
  const m = useLoanMutations();
  const currency = profile?.currency || "EGP";

  const currentMonth = format(new Date(), "yyyy-MM");
  const monthBudget = budgets.find((b: any) => b.month === currentMonth);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", lender: "", monthly_amount: "", start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: "", due_day: "1", total_payments: "", remaining_payments: "", remaining_balance: "",
    account_id: "", reminder_days: "3,1,0", active: true, notes: "",
  });

  const reset = () => { setForm({ name: "", lender: "", monthly_amount: "", start_date: format(new Date(), "yyyy-MM-dd"), end_date: "", due_day: "1", total_payments: "", remaining_payments: "", remaining_balance: "", account_id: "", reminder_days: "3,1,0", active: true, notes: "" }); setEditing(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: form.name, lender: form.lender || null,
      monthly_amount: Number(form.monthly_amount),
      start_date: form.start_date, end_date: form.end_date || null,
      due_day: Number(form.due_day) || 1,
      total_payments: form.total_payments ? Number(form.total_payments) : null,
      remaining_payments: form.remaining_payments ? Number(form.remaining_payments) : null,
      remaining_balance: form.remaining_balance ? Number(form.remaining_balance) : null,
      account_id: form.account_id || null,
      reminder_days: form.reminder_days.split(",").map((s) => Number(s.trim())).filter((n) => !isNaN(n)),
      active: form.active, notes: form.notes || null,
    };
    if (editing) await m.update.mutateAsync({ id: editing.id, ...payload });
    else await m.create.mutateAsync(payload);
    setOpen(false); reset();
  };

  const startEdit = (l: any) => {
    setEditing(l);
    setForm({
      name: l.name, lender: l.lender || "", monthly_amount: String(l.monthly_amount),
      start_date: l.start_date, end_date: l.end_date || "", due_day: String(l.due_day),
      total_payments: l.total_payments?.toString() || "", remaining_payments: l.remaining_payments?.toString() || "",
      remaining_balance: l.remaining_balance?.toString() || "",
      account_id: l.account_id || "", reminder_days: (l.reminder_days || []).join(","),
      active: l.active, notes: l.notes || "",
    });
    setOpen(true);
  };

  const totalMonthly = loans.filter((l: any) => l.active).reduce((s: number, l: any) => s + Number(l.monthly_amount), 0);
  const totalRemaining = loans.reduce((s: number, l: any) => s + Number(l.remaining_balance || 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card"><div className="text-xs text-muted-foreground mb-1">Monthly loans total</div><div className="text-xl font-bold num">{fmtMoney(totalMonthly, currency)}</div></div>
        <div className="stat-card"><div className="text-xs text-muted-foreground mb-1">Total remaining balance</div><div className="text-xl font-bold num">{fmtMoney(totalRemaining, currency)}</div></div>
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild><Button><Plus size={16} /> Add loan</Button></DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} loan</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
                <div><Label>Lender</Label><Input value={form.lender} onChange={(e) => setForm({ ...form, lender: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Monthly amount</Label><Input type="number" step="0.01" value={form.monthly_amount} onChange={(e) => setForm({ ...form, monthly_amount: e.target.value })} required /></div>
                <div><Label>Due day</Label><Input type="number" min={1} max={31} value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Start date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required /></div>
                <div><Label>End date (opt)</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Total payments</Label><Input type="number" value={form.total_payments} onChange={(e) => setForm({ ...form, total_payments: e.target.value })} /></div>
                <div><Label>Remaining payments</Label><Input type="number" value={form.remaining_payments} onChange={(e) => setForm({ ...form, remaining_payments: e.target.value })} /></div>
              </div>
              <div><Label>Remaining balance</Label><Input type="number" step="0.01" value={form.remaining_balance} onChange={(e) => setForm({ ...form, remaining_balance: e.target.value })} /></div>
              <div>
                <Label>Account</Label>
                <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pay from account" /></SelectTrigger>
                  <SelectContent>{accounts.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Reminders (days before, comma-separated)</Label><Input value={form.reminder_days} onChange={(e) => setForm({ ...form, reminder_days: e.target.value })} placeholder="3,1,0" /></div>
              <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                <Label className="m-0">Active</Label>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
              <Button type="submit" className="w-full">{editing ? "Save" : "Add"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {loans.length ? loans.map((l: any) => {
          const item = monthBudget?.items.find((i: any) => i.source_id === l.id);
          const today = new Date();
          const dueThis = new Date(today.getFullYear(), today.getMonth(), l.due_day);
          const overdue = !item?.paid && today > dueThis;
          return (
            <div key={l.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.lender || "—"} · due day {l.due_day}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => m.update.mutate({ id: l.id, active: !l.active })}><Power size={14} /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(l)}><Pencil size={14} /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => m.remove.mutate(l.id)}><Trash2 size={14} /></Button>
                </div>
              </div>
              <div className="text-2xl font-bold num mb-2">{fmtMoney(l.monthly_amount, currency)}</div>
              <div className="flex items-center justify-between text-xs">
                {item?.paid ? (
                  <span className="flex items-center gap-1 text-primary"><CheckCircle2 size={14} /> Paid this month</span>
                ) : overdue ? (
                  <span className="flex items-center gap-1 text-destructive"><AlertCircle size={14} /> Overdue</span>
                ) : (
                  <span className="text-muted-foreground">Due in {Math.max(0, Math.ceil((dueThis.getTime() - today.getTime()) / 86400000))}d</span>
                )}
                {l.remaining_payments && <span className="text-muted-foreground">{l.remaining_payments} payments left</span>}
              </div>
            </div>
          );
        }) : <div className="glass-card p-10 text-center text-sm text-muted-foreground sm:col-span-2">No loans yet</div>}
      </div>
    </div>
  );
}
