import { useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useAccounts, useAccountMutations, useTransactionMutations, useProfile } from "@/hooks/useFinanceData";
import { fmtMoney } from "@/lib/format";

export default function CreditCardsPage() {
  const { data: accounts = [] } = useAccounts();
  const { data: profile } = useProfile();
  const am = useAccountMutations();
  const tm = useTransactionMutations();
  const currency = profile?.currency || "EGP";

  const cards = accounts.filter((a: any) => a.type === "credit_card");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", credit_limit: "", used_amount: "", due_amount: "", due_date: "", notes: "",
  });

  const reset = () => { setForm({ name: "", credit_limit: "", used_amount: "", due_amount: "", due_date: "", notes: "" }); setEditing(null); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      name: form.name, type: "credit_card",
      credit_limit: Number(form.credit_limit) || 0,
      used_amount: Number(form.used_amount) || 0,
      due_amount: Number(form.due_amount) || 0,
      due_date: form.due_date || null,
      notes: form.notes || null,
    };
    if (editing) await am.update.mutateAsync({ id: editing.id, ...payload });
    else await am.create.mutateAsync(payload);
    setOpen(false); reset();
  };

  const startEdit = (c: any) => {
    setEditing(c);
    setForm({
      name: c.name, credit_limit: String(c.credit_limit || ""), used_amount: String(c.used_amount || ""),
      due_amount: String(c.due_amount || ""), due_date: c.due_date || "", notes: c.notes || "",
    });
    setOpen(true);
  };

  const payCard = async (c: any) => {
    if (!c.due_amount) return;
    await tm.create.mutateAsync({
      date: format(new Date(), "yyyy-MM-dd"),
      type: "card_payment",
      amount: c.due_amount,
      account_id: c.id,
      description: `Payment for ${c.name}`,
    });
    await am.update.mutateAsync({ id: c.id, due_amount: 0, used_amount: Math.max(0, (c.used_amount || 0) - (c.due_amount || 0)) });
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild><Button><Plus size={16} /> Add card</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} credit card</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div><Label>Card name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Credit limit</Label><Input type="number" step="0.01" value={form.credit_limit} onChange={(e) => setForm({ ...form, credit_limit: e.target.value })} /></div>
                <div><Label>Used amount</Label><Input type="number" step="0.01" value={form.used_amount} onChange={(e) => setForm({ ...form, used_amount: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Due amount</Label><Input type="number" step="0.01" value={form.due_amount} onChange={(e) => setForm({ ...form, due_amount: e.target.value })} /></div>
                <div><Label>Due date</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              </div>
              <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              <Button type="submit" className="w-full">{editing ? "Save" : "Add"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {cards.length ? cards.map((c: any) => {
          const limit = Number(c.credit_limit) || 0;
          const used = Number(c.used_amount) || 0;
          const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
          const available = Math.max(0, limit - used);
          return (
            <div key={c.id} className="glass-card p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-primary opacity-10 blur-2xl" />
              <div className="flex items-start justify-between mb-4 relative">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Credit Card</div>
                  <div className="font-semibold text-lg">{c.name}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(c)}><Pencil size={14} /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => am.remove.mutate(c.id)}><Trash2 size={14} /></Button>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Used {fmtMoney(used, currency)}</span>
                    <span>Limit {fmtMoney(limit, currency)}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">{pct.toFixed(0)}% utilization · {fmtMoney(available, currency)} available</div>
                </div>
                <div className="flex items-end justify-between pt-2 border-t border-border/40">
                  <div>
                    <div className="text-xs text-muted-foreground">Due {c.due_date || "—"}</div>
                    <div className="text-xl font-bold num text-warning">{fmtMoney(c.due_amount || 0, currency)}</div>
                  </div>
                  {c.due_amount > 0 && <Button size="sm" onClick={() => payCard(c)}>Mark paid</Button>}
                </div>
              </div>
            </div>
          );
        }) : <div className="glass-card p-10 text-center text-sm text-muted-foreground sm:col-span-2">No cards yet</div>}
      </div>
    </div>
  );
}
