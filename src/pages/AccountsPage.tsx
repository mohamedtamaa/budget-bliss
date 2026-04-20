import { useState } from "react";
import { Plus, Trash2, Pencil, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAccounts, useAccountMutations, useProfile } from "@/hooks/useFinanceData";
import { fmtMoney } from "@/lib/format";

const TYPES = [
  { v: "cash", label: "Cash" },
  { v: "wallet", label: "Wallet" },
  { v: "bank", label: "Bank" },
  { v: "tracking", label: "Tracking only" },
  { v: "credit_card", label: "Credit card" },
];

export default function AccountsPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: profile } = useProfile();
  const m = useAccountMutations();
  const currency = profile?.currency || "EGP";

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", type: "bank", balance: "0", exclude_from_total: false });

  const reset = () => { setForm({ name: "", type: "bank", balance: "0", exclude_from_total: false }); setEditing(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { name: form.name, type: form.type, balance: Number(form.balance) || 0, exclude_from_total: form.exclude_from_total };
    if (editing) await m.update.mutateAsync({ id: editing.id, ...payload });
    else await m.create.mutateAsync(payload);
    setOpen(false); reset();
  };

  const startEdit = (a: any) => {
    setEditing(a);
    setForm({ name: a.name, type: a.type, balance: String(a.balance), exclude_from_total: a.exclude_from_total });
    setOpen(true);
  };

  const total = accounts.filter((a: any) => !a.exclude_from_total).reduce((s: number, a: any) => s + Number(a.balance), 0);

  return (
    <div className="space-y-5">
      <div className="stat-card">
        <div className="text-xs text-muted-foreground mb-1">Total balance (included)</div>
        <div className="text-2xl font-bold gradient-text num">{fmtMoney(total, currency)}</div>
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild><Button><Plus size={16} /> Add account</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} account</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Balance</Label><Input type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} /></div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                <Label className="m-0">Exclude from total</Label>
                <Switch checked={form.exclude_from_total} onCheckedChange={(v) => setForm({ ...form, exclude_from_total: v })} />
              </div>
              <Button type="submit" className="w-full">{editing ? "Save" : "Add"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {accounts.length ? accounts.map((a: any) => (
          <div key={a.id} className="glass-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                  <Wallet size={18} />
                </div>
                <div>
                  <div className="font-semibold">{a.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{a.type.replace("_", " ")}{a.exclude_from_total ? " · excluded" : ""}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(a)}><Pencil size={14} /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => m.remove.mutate(a.id)}><Trash2 size={14} /></Button>
              </div>
            </div>
            <div className="text-2xl font-bold num">{fmtMoney(a.balance, currency)}</div>
          </div>
        )) : <div className="glass-card p-10 text-center text-sm text-muted-foreground sm:col-span-2">No accounts yet</div>}
      </div>
    </div>
  );
}
