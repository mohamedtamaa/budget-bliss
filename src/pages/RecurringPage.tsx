import { useState } from 'react';
import { useBudgetStore } from '@/lib/budget-store';
import { RecurringItem } from '@/lib/types';
import { Plus, Pencil, Trash2, Check, X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const categories = ['housing', 'transport', 'food', 'utilities', 'subscriptions', 'personal', 'debt', 'salary', 'freelance', 'other'];
const formatCurrency = (n: number) => new Intl.NumberFormat('en-EG', { minimumFractionDigits: 2 }).format(n);

export default function RecurringPage() {
  const { recurringItems, accounts, addRecurringItem, updateRecurringItem, deleteRecurringItem } = useBudgetStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringItem | null>(null);
  const [form, setForm] = useState({
    name: '', type: 'expense' as RecurringItem['type'], category: 'other', amount: '',
    startDate: '', endDate: '', active: true, accountId: '', includedInTotal: true,
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', type: 'expense', category: 'other', amount: '', startDate: '', endDate: '', active: true, accountId: accounts[0]?.id || '', includedInTotal: true });
    setDialogOpen(true);
  };

  const openEdit = (r: RecurringItem) => {
    setEditing(r);
    setForm({ ...r, amount: String(r.amount), endDate: r.endDate || '', accountId: r.accountId || '' });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.name || !form.amount) { toast.error('Fill required fields'); return; }
    const data = { ...form, amount: parseFloat(form.amount), endDate: form.endDate || undefined };
    if (editing) {
      updateRecurringItem(editing.id, data);
      toast.success('Updated');
    } else {
      addRecurringItem(data);
      toast.success('Added');
    }
    setDialogOpen(false);
  };

  const typeColors: Record<string, string> = {
    income: 'bg-success/10 text-success',
    expense: 'bg-warning/10 text-warning',
    loan: 'bg-loan/10 text-loan',
    subscription: 'bg-info/10 text-info',
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground text-sm">Manage recurring items that auto-populate monthly budgets</p>
        <Button onClick={openAdd} className="gap-2"><Plus size={16} /> Add Recurring</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {recurringItems.map((r) => (
          <div key={r.id} className={`glass-card p-4 ${!r.active ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-medium">{r.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[r.type] || ''}`}>{r.type}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-secondary rounded-lg"><Pencil size={14} className="text-muted-foreground" /></button>
                <button onClick={() => { deleteRecurringItem(r.id); toast.success('Deleted'); }} className="p-1.5 hover:bg-destructive/10 rounded-lg"><Trash2 size={14} className="text-destructive" /></button>
              </div>
            </div>
            <p className="text-xl font-bold">{formatCurrency(r.amount)}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">{r.category}</p>
            <div className="flex items-center gap-2 mt-2">
              {r.active ? <Check size={12} className="text-success" /> : <XIcon size={12} className="text-destructive" />}
              <span className="text-xs text-muted-foreground">{r.active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Recurring Item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" />
            <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
                <SelectItem value="subscription">Subscription</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="bg-secondary border-border" />
            <Input type="date" placeholder="Start Date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="bg-secondary border-border" />
            <Input type="date" placeholder="End Date (optional)" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="bg-secondary border-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm">Active</span>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Included in totals</span>
              <Switch checked={form.includedInTotal} onCheckedChange={(v) => setForm({ ...form, includedInTotal: v })} />
            </div>
            <Button onClick={save} className="w-full">{editing ? 'Update' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
