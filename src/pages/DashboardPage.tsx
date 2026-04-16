import { useState } from 'react';
import { useBudgetStore } from '@/lib/budget-store';
import { format } from 'date-fns';
import {
  TrendingUp, TrendingDown, Landmark, DollarSign, CreditCard,
  ArrowUpRight, ArrowDownRight, Calendar, Wallet, Receipt, CheckCircle2,
  ChevronDown, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import MonthFilter from '@/components/MonthFilter';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-EG', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function DashboardPage() {
  const { transactions, recurringItems, loans, monthlyBudgets, accounts, categoryGroups } = useBudgetStore();
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const currentBudget = monthlyBudgets.find((b) => b.month === selectedMonth);

  const monthTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));

  // Budget-based totals for the month
  const budgetIncome = currentBudget?.items.filter((i) => i.type === 'income').reduce((s, i) => s + i.amount, 0) || 0;
  const budgetExpenses = currentBudget?.items.filter((i) => i.type === 'expense' || i.type === 'subscription').reduce((s, i) => s + i.amount, 0) || 0;
  const budgetLoans = currentBudget?.items.filter((i) => i.type === 'loan').reduce((s, i) => s + i.amount, 0) || 0;
  const budgetSubscriptions = currentBudget?.items.filter((i) => i.type === 'subscription').reduce((s, i) => s + i.amount, 0) || 0;

  // Recurring-based fallbacks
  const recurringIncome = recurringItems.filter((r) => r.type === 'income' && r.active && r.includedInTotal).reduce((s, r) => s + r.amount, 0);
  const recurringExpenses = recurringItems.filter((r) => (r.type === 'expense' || r.type === 'subscription') && r.active && r.includedInTotal).reduce((s, r) => s + r.amount, 0);
  const recurringLoans = loans.filter((l) => l.active).reduce((s, l) => s + l.monthlyAmount, 0);
  const recurringSubscriptions = recurringItems.filter((r) => r.type === 'subscription' && r.active && r.includedInTotal).reduce((s, r) => s + r.amount, 0);

  const totalIncome = currentBudget ? budgetIncome : recurringIncome;
  const totalExpenses = currentBudget ? budgetExpenses : recurringExpenses;
  const totalLoans = currentBudget ? budgetLoans : recurringLoans;
  const totalSubscriptions = currentBudget ? budgetSubscriptions : recurringSubscriptions;

  // Daily expenses from transactions
  const dailyExpenses = monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const dailyIncome = monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  // Total paid this month (budget items marked as paid)
  const totalPaid = currentBudget?.items.filter((i) => i.paid).reduce((s, i) => s + i.amount, 0) || 0;

  // What I have now = total account balance
  const totalAccountBalance = accounts.filter((a) => !a.excludeFromTotal).reduce((s, a) => s + a.balance, 0);

  const netBalance = totalIncome - totalExpenses - totalLoans;

  const creditCards = accounts.filter((a) => a.type === 'credit_card');

  // Expense breakdown by main category group
  const expenseByGroup = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      const group = categoryGroups.find((g) => g.id === t.category);
      const groupName = group?.name || t.category || 'Other';
      const existing = acc.find((a) => a.name === groupName);
      if (existing) {
        existing.value += t.amount;
        if (t.subcategory) {
          const sub = existing.subs.find((s) => s.name === t.subcategory);
          if (sub) sub.value += t.amount;
          else existing.subs.push({ name: t.subcategory, value: t.amount });
        }
      } else {
        acc.push({
          name: groupName,
          groupId: group?.id || '',
          value: t.amount,
          subs: t.subcategory ? [{ name: t.subcategory, value: t.amount }] : [],
        });
      }
      return acc;
    }, [] as { name: string; groupId: string; value: number; subs: { name: string; value: number }[] }[]);

  const COLORS = ['hsl(160,84%,39%)', 'hsl(38,92%,50%)', 'hsl(217,91%,60%)', 'hsl(280,67%,60%)', 'hsl(0,72%,51%)', 'hsl(160,60%,50%)'];

  const budgetItemsPaid = currentBudget?.items.filter((i) => i.paid).length || 0;
  const budgetItemsTotal = currentBudget?.items.length || 1;
  const budgetProgress = Math.round((budgetItemsPaid / budgetItemsTotal) * 100);

  const incomeVsExpense = [
    { name: 'Income', amount: totalIncome },
    { name: 'Expenses', amount: totalExpenses },
    { name: 'Loans', amount: totalLoans },
    { name: 'Net', amount: netBalance },
  ];

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const recentTransactions = [...monthTransactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <MonthFilter value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Summary Cards - 6 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={TrendingUp} label="Total Income" value={formatCurrency(totalIncome)} color="text-success" bgColor="bg-success/10" />
        <StatCard icon={Landmark} label="Total Loans" value={formatCurrency(totalLoans)} color="text-loan" bgColor="bg-loan/10" />
        <StatCard icon={Receipt} label="Subscriptions" value={formatCurrency(totalSubscriptions)} color="text-info" bgColor="bg-info/10" />
        <StatCard icon={TrendingDown} label="Daily Expenses" value={formatCurrency(dailyExpenses)} color="text-warning" bgColor="bg-warning/10" />
        <StatCard icon={CheckCircle2} label="Paid This Month" value={formatCurrency(totalPaid)} color="text-primary" bgColor="bg-primary/10" />
        <StatCard icon={Wallet} label="What I Have" value={formatCurrency(totalAccountBalance)} color={totalAccountBalance >= 0 ? 'text-success' : 'text-destructive'} bgColor={totalAccountBalance >= 0 ? 'bg-success/10' : 'bg-destructive/10'} />
      </div>

      {/* Budget Progress + Credit Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign size={16} className="text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Net Balance</span>
          </div>
          <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(netBalance)}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <Calendar size={16} className="text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Budget Progress ({selectedMonth})</span>
          </div>
          <p className="text-2xl font-bold">{budgetProgress}%</p>
          <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${budgetProgress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{budgetItemsPaid}/{budgetItemsTotal} items paid</p>
        </div>

        {creditCards.map((cc) => (
          <div key={cc.id} className="stat-card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-loan/10 flex items-center justify-center">
                <CreditCard size={16} className="text-loan" />
              </div>
              <span className="text-sm text-muted-foreground">{cc.name}</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(cc.usedAmount || 0)} <span className="text-xs text-muted-foreground">/ {formatCurrency(cc.creditLimit || 0)}</span></p>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-loan rounded-full" style={{ width: `${((cc.usedAmount || 0) / (cc.creditLimit || 1)) * 100}%` }} />
            </div>
            {cc.dueDate && <p className="text-xs text-muted-foreground mt-1">Due: {cc.dueDate}</p>}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={incomeVsExpense}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215,28%,20%)" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(215,20%,55%)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(215,20%,55%)', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(222,41%,10%)', border: '1px solid hsl(215,28%,20%)', borderRadius: 8 }} labelStyle={{ color: 'hsl(210,40%,96%)' }} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {incomeVsExpense.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Expense Breakdown ({selectedMonth})</h3>
          {expenseByGroup.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={expenseByGroup} cx="50%" cy="50%" outerRadius={90} innerRadius={55} dataKey="value" paddingAngle={3}>
                    {expenseByGroup.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(222,41%,10%)', border: '1px solid hsl(215,28%,20%)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {expenseByGroup.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground capitalize">{c.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-8 text-sm">No expense transactions this month</p>
          )}
        </div>
      </div>

      {/* Expense Overview by Groups */}
      {expenseByGroup.length > 0 && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Expense Groups Overview</h3>
          <div className="space-y-2">
            {expenseByGroup.map((group) => (
              <div key={group.name}>
                <button
                  onClick={() => group.subs.length > 0 && toggleGroup(group.name)}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {group.subs.length > 0 ? (
                      expandedGroups.has(group.name) ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />
                    ) : <div className="w-3.5" />}
                    <span className="text-sm font-medium capitalize">{group.name}</span>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(group.value)}</span>
                </button>
                {expandedGroups.has(group.name) && group.subs.length > 0 && (
                  <div className="ml-8 space-y-1 mb-2">
                    {group.subs.map((sub) => (
                      <div key={sub.name} className="flex justify-between py-1 px-3 text-xs text-muted-foreground">
                        <span className="capitalize">{sub.name}</span>
                        <span>{formatCurrency(sub.value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Recent Transactions ({selectedMonth})</h3>
        <div className="space-y-3">
          {recentTransactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {t.type === 'income' ? <ArrowUpRight size={14} className="text-success" /> : <ArrowDownRight size={14} className="text-destructive" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.description || t.category || 'Transaction'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{t.category} · {t.date}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </span>
            </div>
          ))}
          {recentTransactions.length === 0 && <p className="text-center text-muted-foreground py-4 text-sm">No transactions this month</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bgColor }: {
  icon: any; label: string; value: string; color: string; bgColor: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon size={14} className={color} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}
