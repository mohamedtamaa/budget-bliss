import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  TrendingUp, Wallet, Landmark, CreditCard, Repeat, Tv, ArrowUpRight, ArrowDownRight,
  HelpCircle, Plus, Trash2, CheckCircle2, Receipt
} from "lucide-react";
import { MonthFilter } from "@/components/MonthFilter";
import {
  useAccounts, useTransactions, useLoans, useRecurring, useProfile,
} from "@/hooks/useFinanceData";
import { useMonthlyPayments, useDashboardSections, useDashboardSectionMutations } from "@/hooks/useMonthlyPayments";
import { fmtMoney } from "@/lib/format";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SOURCE_OPTIONS: Record<string, string> = {
  income: "Income",
  expenses: "Expenses (no loans/subs/recurring)",
  recurring_paid: "Recurring paid",
  loans_paid: "Loans paid",
  subs_paid: "Subscriptions paid",
  total_paid: "Total paid (loans+subs+recurring)",
  recurring_total: "Recurring total",
  loans_total: "Loans monthly total",
  subs_total: "Subscriptions total",
  cards_due: "Credit card due",
  accounts_balance: "Accounts balance",
  net_cash: "Net cash",
  loans_remaining: "Loans remaining",
  subs_remaining: "Subscriptions remaining",
  recurring_remaining: "Recurring remaining",
};

export default function DashboardPage() {
  const { data: profile } = useProfile();
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions();
  const { data: loans = [] } = useLoans();
  const { data: recurring = [] } = useRecurring();
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const { data: payments = [] } = useMonthlyPayments(month);
  const { data: customSections = [] } = useDashboardSections();
  const sectionM = useDashboardSectionMutations();
  const currency = profile?.currency || "EGP";

  const stats = useMemo(() => {
    const monthTx = transactions.filter((t: any) => t.date?.startsWith(month) && t.included_in_total);
    const txIncome = monthTx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const txExpense = monthTx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);

    // Recurring breakdown (non-subscription)
    const recExp = recurring.filter((r: any) => r.active && r.type === "expense");
    const recInc = recurring.filter((r: any) => r.active && r.type === "income");
    const subs = recurring.filter((r: any) => r.active && r.type === "subscription");
    const activeLoans = loans.filter((l: any) => l.active);

    const isPaid = (st: string, id: string) => payments.some((p: any) => p.source_type === st && p.source_id === id);

    const recurringTotal = recExp.reduce((s: number, r: any) => s + Number(r.amount), 0);
    const recurringPaid = recExp.filter((r: any) => isPaid("recurring", r.id)).reduce((s: number, r: any) => s + Number(r.amount), 0);
    const recurringIncomePaid = recInc.filter((r: any) => isPaid("recurring", r.id)).reduce((s: number, r: any) => s + Number(r.amount), 0);

    const subsTotal = subs.reduce((s: number, r: any) => s + Number(r.amount), 0);
    const subsPaid = subs.filter((r: any) => isPaid("subscription", r.id)).reduce((s: number, r: any) => s + Number(r.amount), 0);

    const loansTotal = activeLoans.reduce((s: number, l: any) => s + Number(l.monthly_amount), 0);
    const loansPaid = activeLoans.filter((l: any) => isPaid("loan", l.id)).reduce((s: number, l: any) => s + Number(l.monthly_amount), 0);

    const accountsBalance = accounts.filter((a: any) => !a.exclude_from_total && a.type !== "credit_card").reduce((s: number, a: any) => s + Number(a.balance), 0);
    const cardsDue = accounts.filter((a: any) => a.type === "credit_card").reduce((s: number, a: any) => s + Number(a.due_amount || 0), 0);

    const income = txIncome + recurringIncomePaid;
    // expenses excludes loans/subs/recurring
    const expenses = txExpense;
    const totalPaid = recurringPaid + subsPaid + loansPaid;
    const netCash = income - expenses - totalPaid - cardsDue;

    return {
      income, expenses,
      recurringTotal, recurringPaid, recurringRemaining: recurringTotal - recurringPaid,
      subsTotal, subsPaid, subsRemaining: subsTotal - subsPaid,
      loansTotal, loansPaid, loansRemaining: loansTotal - loansPaid,
      cardsDue, accountsBalance, totalPaid, netCash,
      hasTx: monthTx.length > 0,
    };
  }, [transactions, accounts, recurring, loans, payments, month]);

  const sourceValues: Record<string, number> = {
    income: stats.income,
    expenses: stats.expenses,
    recurring_paid: stats.recurringPaid,
    loans_paid: stats.loansPaid,
    subs_paid: stats.subsPaid,
    total_paid: stats.totalPaid,
    recurring_total: stats.recurringTotal,
    loans_total: stats.loansTotal,
    subs_total: stats.subsTotal,
    cards_due: stats.cardsDue,
    accounts_balance: stats.accountsBalance,
    net_cash: stats.netCash,
    loans_remaining: stats.loansRemaining,
    subs_remaining: stats.subsRemaining,
    recurring_remaining: stats.recurringRemaining,
  };

  const computeSection = (formula: any[]) =>
    (formula || []).reduce((acc, step) => {
      const v = sourceValues[step.source] || 0;
      return step.op === "-" ? acc - v : acc + v;
    }, 0);

  // Charts
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
    // If literally everything is 0, show expected from recurring on current month so chart isn't empty
    const allZero = arr.every((x) => x.income === 0 && x.expense === 0);
    if (allZero && (stats.income > 0 || stats.expenses > 0 || stats.totalPaid > 0)) {
      arr[arr.length - 1] = {
        name: arr[arr.length - 1].name,
        income: stats.income,
        expense: stats.expenses + stats.totalPaid,
      };
    }
    return arr;
  }, [transactions, stats]);

  const breakdown = useMemo(() => {
    const data = [
      { name: "Recurring", value: stats.recurringPaid },
      { name: "Loans", value: stats.loansPaid },
      { name: "Subscriptions", value: stats.subsPaid },
      { name: "Other expenses", value: stats.expenses },
      { name: "Cards due", value: stats.cardsDue },
    ].filter((d) => d.value > 0);
    return data;
  }, [stats]);

  const pieColors = ["hsl(158, 75%, 48%)", "hsl(217, 92%, 60%)", "hsl(38, 92%, 56%)", "hsl(0, 78%, 58%)", "hsl(280, 70%, 60%)"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}</h2>
          <p className="text-sm text-muted-foreground">Your financial overview for {format(new Date(month + "-01"), "MMMM yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/guide" className="text-muted-foreground hover:text-primary transition-colors" title="How to use">
            <HelpCircle size={20} />
          </Link>
          <MonthFilter value={month} onChange={setMonth} />
        </div>
      </div>

      {/* === GROUP 1: Cash flow === */}
      <section>
        <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Cash Flow This Month</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={ArrowUpRight} label="Income" value={fmtMoney(stats.income, currency)} accent="positive" hint="Transactions + paid recurring income" />
          <StatCard icon={ArrowDownRight} label="Expenses" value={fmtMoney(stats.expenses, currency)} accent="negative" hint="Transaction expenses (excludes loans, subs, recurring)" />
          <StatCard icon={CheckCircle2} label="Loans + Subs + Recurring Paid" value={fmtMoney(stats.totalPaid, currency)} accent="warning" hint="Sum of items you marked as paid this month" />
          <StatCard icon={TrendingUp} label="Net Cash Remaining" value={fmtMoney(stats.netCash, currency)} accent={stats.netCash >= 0 ? "positive" : "negative"} hint="Income − Expenses − Paid − Cards due" />
        </div>
      </section>

      {/* === GROUP 2: Total monthly amounts === */}
      <section>
        <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Monthly Totals (Paid + Unpaid)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={Landmark} label="Loans Total" value={fmtMoney(stats.loansTotal, currency)} accent="warning" />
          <StatCard icon={Tv} label="Subscriptions Total" value={fmtMoney(stats.subsTotal, currency)} accent="info" />
          <StatCard icon={Repeat} label="Recurring Total" value={fmtMoney(stats.recurringTotal, currency)} accent="info" />
          <StatCard icon={CreditCard} label="Credit Card Due" value={fmtMoney(stats.cardsDue, currency)} accent="warning" />
        </div>
      </section>

      {/* === GROUP 3: Remaining === */}
      <section>
        <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Remaining To Pay</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <StatCard icon={Landmark} label="Loans Remaining" value={fmtMoney(stats.loansRemaining, currency)} accent={stats.loansRemaining > 0 ? "negative" : "positive"} />
          <StatCard icon={Tv} label="Subscriptions Remaining" value={fmtMoney(stats.subsRemaining, currency)} accent={stats.subsRemaining > 0 ? "negative" : "positive"} />
          <StatCard icon={Repeat} label="Recurring Remaining" value={fmtMoney(stats.recurringRemaining, currency)} accent={stats.recurringRemaining > 0 ? "negative" : "positive"} />
        </div>
      </section>

      {/* === GROUP 4: Custom sections === */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Your Custom Sections</h3>
          <CustomSectionDialog onCreate={(name, formula) => sectionM.create.mutate({ name, formula })} />
        </div>
        {customSections.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {customSections.map((s: any) => {
              const value = computeSection(s.formula);
              return (
                <div key={s.id} className="stat-card relative group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-primary text-primary flex items-center justify-center"><Wallet size={18} /></div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => sectionM.remove.mutate(s.id)}>
                      <Trash2 size={13} />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1 font-medium truncate">{s.name}</div>
                  <div className={`text-lg sm:text-xl font-bold num truncate ${value < 0 ? "text-destructive" : ""}`}>{fmtMoney(value, currency)}</div>
                  <div className="text-[10px] text-muted-foreground/70 mt-1 truncate">
                    {(s.formula || []).map((f: any, i: number) => (
                      <span key={i}>{i > 0 ? ` ${f.op} ` : f.op === "-" ? "-" : ""}{SOURCE_OPTIONS[f.source] || f.source}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-6 text-sm text-muted-foreground text-center">
            No custom sections yet. Click "Add Section" to combine any totals into your own card.
          </div>
        )}
      </section>

      {/* === Charts === */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">Income vs Outflow (last 6 months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={last6}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Income" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" name="Outflow" fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-4">Where money goes ({format(new Date(month + "-01"), "MMM")})</h3>
          {breakdown.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {breakdown.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v: any) => fmtMoney(Number(v), currency)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground text-center px-4">
              Nothing to show yet. <Link to="/transactions" className="text-primary ml-1 underline">Add a transaction</Link> or mark a loan/sub as paid.
            </div>
          )}
        </div>
      </div>

      {/* === Recent transactions === */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2"><Receipt size={16} /> Recent Transactions</h3>
          <Link to="/transactions" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {transactions.length ? (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((t: any) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/40">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${t.type === "income" ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"}`}>
                    {t.type === "income" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{t.description || t.type}</div>
                    <div className="text-xs text-muted-foreground">{t.date}</div>
                  </div>
                </div>
                <div className={`text-sm font-semibold num shrink-0 ${t.type === "income" ? "text-primary" : "text-destructive"}`}>
                  {t.type === "income" ? "+" : "-"}{fmtMoney(t.amount, currency)}
                </div>
              </div>
            ))}
          </div>
        ) : <div className="h-[100px] flex items-center justify-center text-sm text-muted-foreground">No transactions yet.</div>}
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
      <div className="text-xs text-muted-foreground mb-1 font-medium truncate">{label}</div>
      <div className="text-lg sm:text-xl font-bold num truncate">{value}</div>
      {hint && <div className="text-[10px] text-muted-foreground/60 mt-0.5 line-clamp-2">{hint}</div>}
    </div>
  );
}

function CustomSectionDialog({ onCreate }: { onCreate: (name: string, formula: any[]) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [steps, setSteps] = useState<any[]>([{ source: "income", op: "+" }]);

  const reset = () => { setName(""); setSteps([{ source: "income", op: "+" }]); };

  const submit = () => {
    if (!name.trim() || steps.length === 0) return;
    onCreate(name.trim(), steps);
    setOpen(false); reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5"><Plus size={14} /> Add Section</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Create custom section</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Section name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Disposable money" />
          </div>
          <div>
            <Label>Formula</Label>
            <div className="space-y-2 mt-1">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <Select value={s.op} onValueChange={(v) => setSteps(steps.map((x, j) => j === i ? { ...x, op: v } : x))}>
                    <SelectTrigger className="w-16"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+">+</SelectItem>
                      <SelectItem value="-">−</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={s.source} onValueChange={(v) => setSteps(steps.map((x, j) => j === i ? { ...x, source: v } : x))}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SOURCE_OPTIONS).map(([k, label]) => <SelectItem key={k} value={k}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {steps.length > 1 && (
                    <Button size="icon" variant="ghost" className="h-10 w-10 text-destructive" onClick={() => setSteps(steps.filter((_, j) => j !== i))}>
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => setSteps([...steps, { source: "expenses", op: "-" }])}>
              <Plus size={14} /> Add step
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!name.trim()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
