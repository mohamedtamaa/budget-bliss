import { useState } from 'react';
import { useBudgetStore } from '@/lib/budget-store';
import { Account } from '@/lib/types';
import { Plus, Pencil, Trash2, Wallet, Building2, CreditCard, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const formatCurrency = (n: number) => new Intl.NumberFormat('en-EG', { minimumFractionDigits: 2 }).format(n);

const typeIcons: Record<string, any> = { wallet: Wallet, bank: Building2, credit_card: CreditCard, tracking: Eye };

export default function AccountsPage() {
  const { accounts, accountGroups, addAccount, updateAccount, deleteAccount, addAccountGroup } = useBudgetStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState({
    name: '', group: 'ag1', type: 'bank' as Account['type'], balance: '', excludeFromTotal: false,
    creditLimit: '', usedAmount: '', dueAmount: '', dueDate: '',
  });

  const totalBalance = accounts.filter((a) => !a.excludeFromTotal).reduce((s, a) => s + a.balance, 0);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', group: 'ag1', type: 'bank', balance: '', excludeFromTotal: false, creditLimit: '', usedAmount: '', dueAmount: '', dueDate: '' });
    setDialogOpen(true);
  };

  const openEdit = (a: Account) => {
    setEditing(a);
    setForm({
      name: a.name, group: a.group, type: a.type, balance: String(a.balance), excludeFromTotal: a.excludeFromTotal,
      creditLimit: a.creditLimit ? String(a.creditLimit) : '', usedAmount: a.usedAmount ? String(a.usedAmount) : '',
      dueAmount: a.dueAmount ? String(a.dueAmount) : '', dueDate: a.dueDate || '',
    });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.name) { toast.error('Name required'); return; }
    const data: any = {
      name: form.name, group: form.group, type: form.type, balance: parseFloat(form.balance) || 0,
      excludeFromTotal: form.excludeFromTotal,
    };
    if (form.type === 'credit_card') {
      data.creditLimit = parseFloat(form.creditLimit) || 0;
      data.usedAmount = parseFloat(form.usedAmount) || 0;
      data.dueAmount = parseFloat(form.dueAmount) || 0;
      data.dueDate = form.dueDate || undefined;
    }
    if (editing) { updateAccount(editing.id, data); toast.success('Updated'); }
    else { addAccount(data); toast.success('Added'); }
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="stat-card inline-flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Total Balance:</span>
          <span className="text-lg font-bold text-success">{formatCurrency(totalBalance)}</span>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus size={16} /> Add Account</Button>
      </div>

      {accountGroups.map((g) => {
        const groupAccounts = accounts.filter((a) => a.group === g.id);
        if (groupAccounts.length === 0) return null;
        return (
          <div key={g.id}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">{g.name}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {groupAccounts.map((a) => {
                const Icon = typeIcons[a.type] || Wallet;
                return (
                  <div key={a.id} className="glass-card p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{a.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{a.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-secondary rounded-lg"><Pencil size={14} className="text-muted-foreground" /></button>
                        <button onClick={() => { deleteAccount(a.id); toast.success('Deleted'); }} className="p-1.5 hover:bg-destructive/10 rounded-lg"><Trash2 size={14} className="text-destructive" /></button>
                      </div>
                    </div>
                    <p className={`text-xl font-bold ${a.balance >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(a.balance)}</p>
                    {a.excludeFromTotal && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground mt-1 inline-block">Excluded from total</span>}
                    {a.type === 'credit_card' && a.creditLimit && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-loan rounded-full" style={{ width: `${((a.usedAmount || 0) / a.creditLimit) * 100}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{formatCurrency(a.usedAmount || 0)} / {formatCurrency(a.creditLimit)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Account</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Account name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" />
            <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="wallet">Wallet</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="tracking">Tracking Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.group} onValueChange={(v) => setForm({ ...form, group: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {accountGroups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Balance" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} className="bg-secondary border-border" />
            {form.type === 'credit_card' && (
              <>
                <Input type="number" placeholder="Credit Limit" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} className="bg-secondary border-border" />
                <Input type="number" placeholder="Used Amount" value={form.usedAmount} onChange={(e) => setForm({ ...form, usedAmount: e.target.value })} className="bg-secondary border-border" />
                <Input type="number" placeholder="Due Amount" value={form.dueAmount} onChange={(e) => setForm({ ...form, dueAmount: e.target.value })} className="bg-secondary border-border" />
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="bg-secondary border-border" />
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm">Exclude from total balance</span>
              <Switch checked={form.excludeFromTotal} onCheckedChange={(v) => setForm({ ...form, excludeFromTotal: v })} />
            </div>
            <Button onClick={save} className="w-full">{editing ? 'Update' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
