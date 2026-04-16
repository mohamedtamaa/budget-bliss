import { useState } from 'react';
import { useBudgetStore } from '@/lib/budget-store';
import { Loan } from '@/lib/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const formatCurrency = (n: number) => new Intl.NumberFormat('en-EG', { minimumFractionDigits: 2 }).format(n);

export default function LoansPage() {
  const { loans, addLoan, updateLoan, deleteLoan } = useBudgetStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Loan | null>(null);
  const [form, setForm] = useState({
    name: '', monthlyAmount: '', startDate: '', endDate: '', remainingPayments: '', dueDay: '', notes: '', active: true, accountId: '',
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', monthlyAmount: '', startDate: '', endDate: '', remainingPayments: '', dueDay: '', notes: '', active: true, accountId: '' });
    setDialogOpen(true);
  };

  const openEdit = (l: Loan) => {
    setEditing(l);
    setForm({
      name: l.name, monthlyAmount: String(l.monthlyAmount), startDate: l.startDate, endDate: l.endDate || '',
      remainingPayments: l.remainingPayments ? String(l.remainingPayments) : '', dueDay: String(l.dueDay),
      notes: l.notes || '', active: l.active, accountId: l.accountId || '',
    });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.name || !form.monthlyAmount || !form.dueDay) { toast.error('Fill required fields'); return; }
    const data = {
      name: form.name, monthlyAmount: parseFloat(form.monthlyAmount), startDate: form.startDate,
      endDate: form.endDate || undefined, remainingPayments: form.remainingPayments ? parseInt(form.remainingPayments) : undefined,
      dueDay: parseInt(form.dueDay), notes: form.notes || undefined, active: form.active, accountId: form.accountId || undefined,
    };
    if (editing) { updateLoan(editing.id, data); toast.success('Updated'); }
    else { addLoan(data); toast.success('Added'); }
    setDialogOpen(false);
  };

  const totalMonthly = loans.filter((l) => l.active).reduce((s, l) => s + l.monthlyAmount, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="stat-card inline-flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Total Monthly Loans:</span>
          <span className="text-lg font-bold text-loan">{formatCurrency(totalMonthly)}</span>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus size={16} /> Add Loan</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loans.map((l) => (
          <div key={l.id} className={`glass-card p-4 ${!l.active ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <p className="font-medium">{l.name}</p>
              <div className="flex gap-1">
                <button onClick={() => openEdit(l)} className="p-1.5 hover:bg-secondary rounded-lg"><Pencil size={14} className="text-muted-foreground" /></button>
                <button onClick={() => { deleteLoan(l.id); toast.success('Deleted'); }} className="p-1.5 hover:bg-destructive/10 rounded-lg"><Trash2 size={14} className="text-destructive" /></button>
              </div>
            </div>
            <p className="text-xl font-bold text-loan">{formatCurrency(l.monthlyAmount)}<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              <p>Due day: {l.dueDay}</p>
              {l.remainingPayments && <p>{l.remainingPayments} payments remaining</p>}
              {l.endDate && <p>Ends: {l.endDate}</p>}
              {l.notes && <p>{l.notes}</p>}
            </div>
            <div className="mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${l.active ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                {l.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Loan</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Loan name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" />
            <Input type="number" placeholder="Monthly amount" value={form.monthlyAmount} onChange={(e) => setForm({ ...form, monthlyAmount: e.target.value })} className="bg-secondary border-border" />
            <Input type="number" placeholder="Due day (1-31)" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} className="bg-secondary border-border" />
            <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="bg-secondary border-border" />
            <Input type="date" placeholder="End date (optional)" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="bg-secondary border-border" />
            <Input type="number" placeholder="Remaining payments" value={form.remainingPayments} onChange={(e) => setForm({ ...form, remainingPayments: e.target.value })} className="bg-secondary border-border" />
            <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-secondary border-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm">Active</span>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
            <Button onClick={save} className="w-full">{editing ? 'Update' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
