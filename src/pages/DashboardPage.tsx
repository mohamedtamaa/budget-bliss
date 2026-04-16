import { useBudgetStore } from '@/lib/budget-store';
import { format } from 'date-fns';
import {
  TrendingUp, TrendingDown, Landmark, DollarSign, CreditCard,
  ArrowUpRight, ArrowDownRight, Calendar
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-EG', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function DashboardPage() {
  const { transactions, recurringItems, loans, monthlyBudgets, accounts } = useBudgetStore();
  const currentMonth = format(new Date(), 'yyyy-MM');
  const currentBudget = monthlyBudgets.find((b) => b.month === currentMonth);

  const totalIncome = recurringItems
    .filter((r) => r.type === 'income' && r.active && r.includedInTotal)
    .reduce((s, r) => s + r.amount, 0);

  const totalExpenses = recurringItems
    .filter((r) => (r.type === 'expense' || r.type === 'subscription') && r.active && r.includedInTotal)
    .reduce((s, r) => s + r.amount, 0);

  const totalLoans = loans.filter((l) => l.active).reduce((s, l) => s + l.monthlyAmount, 0);
  const netBalance = totalIncome - totalExpenses - totalLoans;

  const recentTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  const totalAccountBalance = accounts
    .filter((a) => !a.excludeFromTotal)
    .reduce((s, a) => s + a.balance, 0);

  const creditCards = accounts.filter((a) => a.type === 'credit_card');

  // Chart data
  const expenseCategories = recurringItems
    .filter((r) => r.type === 'expense' || r.type === 'subscription')
    .reduce((acc, r) => {
      const existing = acc.find((a) => a.name === r.category);
      if (existing) existing.value += r.amount;
      else acc.push({ name: r.category, value: r.amount });
      return acc;
    }, [] as { name: string; value: number }[]);

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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} label="Total Income" value={formatCurrency(totalIncome)} color="text-success" bgColor="bg-success/10" />
        <StatCard icon={TrendingDown} label="Total Expenses" value={formatCurrency(totalExpenses)} color="text-warning" bgColor="bg-warning/10" />
        <StatCard icon={Landmark} label="Total Loans" value={formatCurrency(totalLoans)} color="text-loan" bgColor="bg-loan/10" />
        <StatCard icon={DollarSign} label="Net Balance" value={formatCurrency(netBalance)} color={netBalance >= 0 ? 'text-success' : 'text-destructive'} bgColor={netBalance >= 0 ? 'bg-success/10' : 'bg-destructive/10'} />
      </div>

      {/* Account Balance + Credit Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
              <DollarSign size={16} className="text-info" />
            </div>
            <span className="text-sm text-muted-foreground">Total Account Balance</span>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(totalAccountBalance)}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
              <Calendar size={16} className="text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Budget Progress</span>
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
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(222,41%,10%)', border: '1px solid hsl(215,28%,20%)', borderRadius: 8 }}
                labelStyle={{ color: 'hsl(210,40%,96%)' }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {incomeVsExpense.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={expenseCategories} cx="50%" cy="50%" outerRadius={90} innerRadius={55} dataKey="value" paddingAngle={3}>
                {expenseCategories.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(222,41%,10%)', border: '1px solid hsl(215,28%,20%)', borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {expenseCategories.map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground capitalize">{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {recentTransactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {t.type === 'income' ? <ArrowUpRight size={14} className="text-success" /> : <ArrowDownRight size={14} className="text-destructive" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.description}</p>
                  <p className="text-xs text-muted-foreground capitalize">{t.category} · {t.date}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-success' : 'text-foreground'}`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Loans */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-muted-foreground mb-4">Active Loans</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loans.filter((l) => l.active).map((l) => (
            <div key={l.id} className="bg-secondary/50 rounded-lg p-3">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium">{l.name}</p>
                <span className="text-xs bg-loan/10 text-loan px-2 py-0.5 rounded-full">Day {l.dueDay}</span>
              </div>
              <p className="text-lg font-bold mt-1">{formatCurrency(l.monthlyAmount)}</p>
              {l.remainingPayments && <p className="text-xs text-muted-foreground">{l.remainingPayments} payments left</p>}
            </div>
          ))}
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
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center`}>
          <Icon size={16} className={color} />
        </div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
