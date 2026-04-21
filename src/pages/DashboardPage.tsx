import { useMemo, useState } from "react";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Wallet, Landmark, CreditCard, Repeat, Calendar, ArrowUpRight, ArrowDownRight, HelpCircle } from "lucide-react";
import { MonthFilter } from "@/components/MonthFilter";
import { useAccounts, useTransactions, useLoans, useRecurring, useBudgets, useProfile } from "@/hooks/useFinanceData";
import { fmtMoney } from "@/lib/format";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Link } from "react-router-dom";

export default function DashboardPage() {
  const { data: profile } = useProfile();
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: loans = [] } = useLoans();
  const { data: recurring = [] } = useRecurring();
  const { data: budgets = [] } = useBudgets();
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const currency = profile?.currency || "EGP";
  const monthBudget = budgets.find((b: any) => b.month === month);

  const stats = useMemo(() => {
    const monthTx = transactions.filter((t: any) => t.date?.startsWith(month) && t.included_in_total);
    const income = monthTx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const expense = monthTx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);

    // Calculate from budget items if available, otherwise from source tables directly
    const items = monthBudget?.items || [];
    let loansDue = items.filter((i: any) => i.type === "loan").reduce((s: number, i: any) => s + Number(i.amount), 0);
    let subsDue = items.filter((i: any) => i.type === "subscription").reduce((s: number, i: any) => s + Number(i.amount), 0);
    let paidThisMonth = items.filter((i: any) => i.paid).reduce((s: number, i: any) => s + Number(i.amount), 0);

    // Fallback: if no budget items, calculate from loans and recurring tables
    if (!monthBudget) {
      loansDue = loans.filter((l: any) => l.active).reduce((s: number, l: any) => s + Number(l.monthly_amount), 0);
      subsDue = recurring.filter((r: any) => r.active && r.type === "subscription").reduce((s: number, r: any) => s + Number(r.amount), 0);
    }

    // Also calculate expected recurring income/expense when no transactions yet
    const recurringIncome = recurring.filter((r: any) => r.active && r.type === "income").reduce((s: number, r: any) => s + Number(r.amount), 0);
    const recurringExpense = recurring.filter((r: any) => r.active && (r.type === "expense" || r.type === "subscription")).reduce((s: number, r: any) => s + Number(r.amount), 0);

    const totalBalance = accounts.filter((a: any) => !a.exclude_from_total).reduce((s: number, a: any) => s + Number(a.balance), 0);
    const cardDue = accounts.filter((a: any) => a.type === "credit_card").reduce((s: number, a: any) => s + Number(a.due_amount || 0), 0);

    return {
      income: income || recurringIncome,
      expense: expense || recurringExpense,
      loansDue,
      subsDue,
      paidThisMonth,
      totalBalance,
      cardDue,
      net: (income || recurringIncome) - (expense || recurringExpense) - loansDue,
      hasTransactions: monthTx.length > 0,
      recurringIncome,
      recurringExpense,
    };
  }, [transactions, accounts, monthBudget, month, loans, recurring]);

  const last6 = useMemo(() => {
    const arr: any[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const k = format(d, "yyyy-MM");
      const tx = transactions.filter((t: any) => t.date?.startsWith(k) && t.included_in_total);
      arr.push({
        name: format(d, "MMM"),
        income: tx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0),
        expense: tx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0),
      });
    }
    return arr;
  }, [transactions]);

  const expenseBreakdown = useMemo(() => {
    const monthTx = transactions.filter((t: any) => t.date?.startsWith(month) && t.type === "expense");
    const map: Record<string, number> = {};
    monthTx.forEach((t: any) => {
      const cat = t.category_id || "Uncategorized";
      map[cat] = (map[cat] || 0) + Number(t.amount);
    });
    return Object.entries(map).map(([k, v]) => ({ name: k.slice(0, 8), value: v })).slice(0, 6);
  }, [transactions, month]);

  const upcomingLoans = loans.filter((l: any) => l.active).slice(0, 5);
  const upcomingRec = recurring.filter((r: any) => r.active && r.type === "subscription").slice(0, 5);
  const upcoming = [...upcomingLoans.map((l: any) => ({ ...l, _type: "loan", amount: l.monthly_amount })), ...upcomingRec.map((r: any) => ({ ...r, _type: "subscription", amount: r.amount }))].slice(0, 5);
  const recent = transactions.slice(0, 5);
  const pieColors = ["hsl(158, 75%, 48%)", "hsl(217, 92%, 60%)", "hsl(38, 92%, 56%)", "hsl(0, 78%, 58%)", "hsl(280, 70%, 60%)", "hsl(180, 70%, 50%)"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}</h2>
          <p className="text-sm text-muted-foreground">
            Here's your financial overview
            {!stats.hasTransactions && <span className="ml-1 text-warning">• Showing expected amounts from recurring items</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/guide" className="text-muted-foreground hover:text-primary transition-colors" title="How to use">
            <HelpCircle size={20} />
          </Link>
          <MonthFilter value={month} onChange={setMonth} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={Wallet} label="Total Balance" value={fmtMoney(stats.totalBalance, currency)} accent="primary" hint="Sum of all accounts" />
        <StatCard icon={ArrowUpRight} label="Income" value={fmtMoney(stats.income, currency)} accent="positive" hint={!stats.hasTransactions ? "Expected from recurring" : undefined} />
        <StatCard icon={ArrowDownRight} label="Expenses" value={fmtMoney(stats.expense, currency)} accent="negative" hint={!stats.hasTransactions ? "Expected from recurring" : undefined} />
        <StatCard icon={TrendingUp} label="Net Cash Flow" value={fmtMoney(stats.net, currency)} accent={stats.net >= 0 ? "positive" : "negative"} />
        <StatCard icon={Landmark} label="Loans Due" value={fmtMoney(stats.loansDue, currency)} accent="warning" />
        <StatCard icon={Repeat} label="Subscriptions" value={fmtMoney(stats.subsDue, currency)} accent="info" />
        <StatCard icon={CreditCard} label="Credit Card Due" value={fmtMoney(stats.cardDue, currency)} accent="warning" />
        <StatCard icon={TrendingDown} label="Paid This Month" value={fmtMoney(stats.paidThisMonth, currency)} accent="positive" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={last6}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">Expense Breakdown</h3>
          {expenseBreakdown.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={expenseBreakdown} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {expenseBreakdown.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No expenses this month. <Link to="/transactions" className="text-primary ml-1 underline">Add one →</Link></div>}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><Calendar size={16} /> Upcoming Payments</h3>
            <span className="text-xs text-muted-foreground">{upcoming.length} active</span>
          </div>
          {upcoming.length ? (
            <div className="space-y-2">
              {upcoming.map((i: any) => (
                <div key={i.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${i._type === "loan" ? "bg-warning/15 text-warning" : "bg-info/15 text-info"}`}>
                      {i._type === "loan" ? <Landmark size={16} /> : <Repeat size={16} />}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{i.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{i._type}{i.lender ? ` • ${i.lender}` : ""}</div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold num">{fmtMoney(i.amount, currency)}</div>
                </div>
              ))}
            </div>
          ) : <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">No upcoming payments</div>}
        </div>
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">Recent Transactions</h3>
          {recent.length ? (
            <div className="space-y-2">
              {recent.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${t.type === "income" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                      {t.type === "income" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{t.description || t.type}</div>
                      <div className="text-xs text-muted-foreground">{t.date}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold num ${t.type === "income" ? "text-primary" : "text-destructive"}`}>
                    {t.type === "income" ? "+" : "-"}{fmtMoney(t.amount, currency)}
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">No transactions yet. <Link to="/transactions" className="text-primary ml-1 underline">Add one →</Link></div>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, hint }: { icon: any; label: string; value: string; accent: "primary" | "positive" | "negative" | "warning" | "info"; hint?: string }) {
  const accents: Record<string, string> = {
    primary: "bg-gradient-primary text-primary",
    positive: "bg-gradient-positive text-primary",
    negative: "bg-gradient-negative text-destructive",
    warning: "bg-gradient-warning text-warning",
    info: "bg-gradient-info text-info",
  };
  return (
    <div className="stat-card group" title={hint}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accents[accent]}`}><Icon size={18} /></div>
      </div>
      <div className="text-xs text-muted-foreground mb-1 font-medium">{label}</div>
      <div className="text-lg sm:text-xl font-bold num truncate">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{hint}</div>}
    </div>
  );
}
