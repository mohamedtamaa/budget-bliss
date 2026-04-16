import { useState } from 'react';
import { useBudgetStore } from '@/lib/budget-store';
import { format, addMonths, parse } from 'date-fns';
import { CalendarPlus, Check, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const formatCurrency = (n: number) => new Intl.NumberFormat('en-EG', { minimumFractionDigits: 2 }).format(n);

export default function MonthlyBudgetPage() {
  const { monthlyBudgets, createNextMonthBudget, toggleBudgetItemPaid } = useBudgetStore();
  const sorted = [...monthlyBudgets].sort((a, b) => b.month.localeCompare(a.month));
  const [selectedMonth, setSelectedMonth] = useState(sorted[0]?.month || format(new Date(), 'yyyy-MM'));
  const budget = monthlyBudgets.find((b) => b.month === selectedMonth);

  const handleCreate = () => {
    const latestMonth = sorted[0]?.month || format(new Date(), 'yyyy-MM');
    const success = createNextMonthBudget(latestMonth);
    if (success) {
      const next = format(addMonths(parse(latestMonth + '-01', 'yyyy-MM-dd', new Date()), 1), 'yyyy-MM');
      setSelectedMonth(next);
      toast.success(`Budget for ${next} created!`);
    } else {
      toast.error('Next month budget already exists');
    }
  };

  const incomeItems = budget?.items.filter((i) => i.type === 'income') || [];
  const expenseItems = budget?.items.filter((i) => i.type === 'expense' || i.type === 'subscription') || [];
  const loanItems = budget?.items.filter((i) => i.type === 'loan') || [];

  const totalIncome = incomeItems.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenseItems.reduce((s, i) => s + i.amount, 0);
  const totalLoans = loanItems.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48 bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            {sorted.map((b) => <SelectItem key={b.month} value={b.month}>{b.month}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={handleCreate} className="gap-2"><CalendarPlus size={16} /> Create Next Month</Button>
      </div>

      {budget ? (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="stat-card">
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="text-xl font-bold text-success">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="text-xl font-bold text-warning">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="stat-card">
              <p className="text-xs text-muted-foreground">Loans</p>
              <p className="text-xl font-bold text-loan">{formatCurrency(totalLoans)}</p>
            </div>
          </div>

          {/* Sections */}
          {[
            { title: 'Income', items: incomeItems, color: 'text-success' },
            { title: 'Expenses & Subscriptions', items: expenseItems, color: 'text-warning' },
            { title: 'Loan Payments', items: loanItems, color: 'text-loan' },
          ].map((section) => (
            <div key={section.title} className="glass-card p-4">
              <h3 className={`text-sm font-medium mb-3 ${section.color}`}>{section.title}</h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleBudgetItemPaid(budget.id, item.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          item.paid ? 'bg-primary border-primary' : 'border-muted-foreground/30 hover:border-primary/50'
                        }`}
                      >
                        {item.paid && <Check size={12} className="text-primary-foreground" />}
                      </button>
                      <span className={`text-sm ${item.paid ? 'line-through text-muted-foreground' : ''}`}>{item.name}</span>
                    </div>
                    <span className={`text-sm font-medium ${item.paid ? 'text-muted-foreground' : ''}`}>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                {section.items.length === 0 && <p className="text-sm text-muted-foreground">No items</p>}
              </div>
            </div>
          ))}

          {/* Net */}
          <div className="stat-card glow-primary">
            <div className="flex justify-between items-center">
              <span className="font-medium">Net Balance</span>
              <span className={`text-xl font-bold ${totalIncome - totalExpenses - totalLoans >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(totalIncome - totalExpenses - totalLoans)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground">No budget for this month. Create one!</p>
        </div>
      )}
    </div>
  );
}
