import { useState } from 'react';
import { useBudgetStore } from '@/lib/budget-store';
import { Transaction } from '@/lib/types';
import { format } from 'date-fns';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import MonthFilter from '@/components/MonthFilter';

const formatCurrency = (n: number) => new Intl.NumberFormat('en-EG', { minimumFractionDigits: 2 }).format(n);

export default function TransactionsPage() {
  const { transactions, accounts, categoryGroups, addTransaction, updateTransaction, deleteTransaction } = useBudgetStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'expense' as 'income' | 'expense',
    category: '',
    subcategory: '',
    description: '',
    amount: '',
    accountId: accounts[0]?.id || '',
    notes: '',
    includedInTotal: true,
    isEssential: false,
  });

  const allCategories = categoryGroups.filter((g) => g.type === form.type);
  const selectedGroup = categoryGroups.find((g) => g.id === form.category);

  const filtered = transactions
    .filter((t) => t.date.startsWith(selectedMonth))
    .filter((t) => (typeFilter === 'all' || t.type === typeFilter))
    .filter((t) => (t.description || '').toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  const monthIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpenses = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const openAdd = () => {
    setEditing(null);
    setForm({ date: format(new Date(), 'yyyy-MM-dd'), type: 'expense', category: '', subcategory: '', description: '', amount: '', accountId: accounts[0]?.id || '', notes: '', includedInTotal: true, isEssential: false });
    setDialogOpen(true);
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setForm({ ...t, amount: String(t.amount), isEssential: t.isEssential || false, notes: t.notes || '', description: t.description || '', subcategory: t.subcategory || '' });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.amount) { toast.error('Amount is required'); return; }
    const data = { ...form, amount: parseFloat(form.amount), description: form.description || undefined, subcategory: form.subcategory || undefined };
    if (editing) {
      updateTransaction(editing.id, data);
      toast.success('Transaction updated');
    } else {
      addTransaction(data);
      toast.success('Transaction added');
    }
    setDialogOpen(false);
  };

  const getCategoryName = (catId: string) => {
    const group = categoryGroups.find((g) => g.id === catId);
    return group?.name || catId || '-';
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <MonthFilter value={selectedMonth} onChange={setSelectedMonth} />
        <Button onClick={openAdd} className="gap-2"><Plus size={16} /> Add Transaction</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="text-lg font-bold text-success">{formatCurrency(monthIncome)}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted-foreground">Expenses</p>
          <p className="text-lg font-bold text-warning">{formatCurrency(monthExpenses)}</p>
        </div>
        <div className="stat-card col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Net</p>
          <p className={`text-lg font-bold ${monthIncome - monthExpenses >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(monthIncome - monthExpenses)}</p>
        </div>
      </div>

      <div className="flex gap-2 w-full">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32 bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-3 text-muted-foreground font-medium">Date</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Type</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Category</th>
              <th className="text-left p-3 text-muted-foreground font-medium">Description</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Amount</th>
              <th className="text-right p-3 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                <td className="p-3">{t.date}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.type === 'income' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                    {t.type}
                  </span>
                </td>
                <td className="p-3 capitalize">
                  {getCategoryName(t.category)}
                  {t.subcategory && <span className="text-muted-foreground text-xs ml-1">/ {t.subcategory}</span>}
                </td>
                <td className="p-3">{t.description || '-'}</td>
                <td className={`p-3 text-right font-medium ${t.type === 'income' ? 'text-success' : ''}`}>{formatCurrency(t.amount)}</td>
                <td className="p-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-secondary rounded-lg"><Pencil size={14} className="text-muted-foreground" /></button>
                    <button onClick={() => { deleteTransaction(t.id); toast.success('Deleted'); }} className="p-1.5 hover:bg-destructive/10 rounded-lg"><Trash2 size={14} className="text-destructive" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No transactions found for this month</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit' : 'Add'} Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-secondary border-border" />
            <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v, category: '', subcategory: '' })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v, subcategory: '' })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {allCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                {allCategories.length === 0 && <div className="p-2 text-xs text-muted-foreground">No categories. Add them in Settings.</div>}
              </SelectContent>
            </Select>
            {selectedGroup && selectedGroup.subcategories.length > 0 && (
              <Select value={form.subcategory} onValueChange={(v) => setForm({ ...form, subcategory: v })}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                <SelectContent>
                  {selectedGroup.subcategories.map((sc) => <SelectItem key={sc} value={sc}>{sc}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border" />
            <Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="bg-secondary border-border" />
            <Select value={form.accountId} onValueChange={(v) => setForm({ ...form, accountId: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select account" /></SelectTrigger>
              <SelectContent>
                {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-secondary border-border" />
            <Button onClick={save} className="w-full">{editing ? 'Update' : 'Add'} Transaction</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
