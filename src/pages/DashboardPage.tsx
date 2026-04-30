import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  TrendingUp, Wallet, Landmark, CreditCard, Repeat, Tv, ArrowUpRight, ArrowDownRight,
  HelpCircle, Plus, Trash2, CheckCircle2, Receipt, Pencil, Info
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
    const creditCardIds = new Set(accounts.filter((a: any) => a.type === "credit_card").map((a: any) => a.id));
    const monthTx = transactions.filter((t: any) => t.date?.startsWith(month) && t.included_in_total);
    // Expenses paid via a credit card are tracked on the card itself — exclude them from monthly expenses
    const monthTxNoCards = monthTx.filter((t: any) => !creditCardIds.has(t.account_id));
    const txIncome = monthTxNoCards.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0);
    const txExpense = monthTxNoCards.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0);

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
    const expenses = txExpense;
    // Paid Obligations excludes cards (cards have their own card so we don't double-count visually)
    const totalPaidWithCards = recurringPaid + subsPaid + loansPaid + cardsDue;
    const totalPaid = recurringPaid + subsPaid + loansPaid;
    // Net Cash: cards are tracked separately and paid on their own — don't subtract them from net cash here
    const netCash = income - expenses - totalPaid;

    return {
      income, expenses,
      recurringTotal, recurringPaid, recurringRemaining: recurringTotal - recurringPaid,
      subsTotal, subsPaid, subsRemaining: subsTotal - subsPaid,
      loansTotal, loansPaid, loansRemaining: loansTotal - loansPaid,
      cardsDue, accountsBalance, totalPaid, totalPaidWithCards, netCash,
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
    const ccIds = new Set(accounts.filter((a: any) => a.type === "credit_card").map((a: any) => a.id));
    const arr: any[] = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const k = format(d, "yyyy-MM");
      const tx = transactions.filter((t: any) => t.date?.startsWith(k) && t.included_in_total && !ccIds.has(t.account_id));
      arr.push({
        name: format(d, "MMM"),
        income: tx.filter((t: any) => t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0),
        expense: tx.filter((t: any) => t.type === "expense").reduce((s: number, t: any) => s + Number(t.amount), 0),
      });
    }
    const allZero = arr.every((x) => x.income === 0 && x.expense === 0);
    if (allZero && (stats.income > 0 || stats.expenses > 0 || stats.totalPaid > 0)) {
      arr[arr.length - 1] = {
        name: arr[arr.length - 1].name,
        income: stats.income,
        expense: stats.expenses + stats.totalPaid,
      };
    }
    return arr;
  }, [transactions, accounts, stats]);

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

  // Built-in card details: clicking shows breakdown
  const builtInDetails: Record<string, { title: string; description: string; rows: { label: string; value: number }[] }> = {
    income: {
      title: "Income",
      description: "All money coming in this month.",
      rows: [
        { label: "Transaction income", value: transactions.filter((t: any) => t.date?.startsWith(month) && t.included_in_total && t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0) },
        { label: "Paid recurring income", value: stats.income - transactions.filter((t: any) => t.date?.startsWith(month) && t.included_in_total && t.type === "income").reduce((s: number, t: any) => s + Number(t.amount), 0) },
      ],
    },
    expenses: {
      title: "Expenses",
      description: "Pure transaction expenses (does NOT include loans, subs, or recurring — those have their own card).",
      rows: [{ label: "Transaction expenses", value: stats.expenses }],
    },
    totalPaidAll: {
      title: "Paid Obligations",
      description: "Sum of every fixed obligation already settled this month, plus current credit-card amount due (kept separate from monthly expenses).",
      rows: [
        { label: "Loans paid", value: stats.loansPaid },
        { label: "Subscriptions paid", value: stats.subsPaid },
        { label: "Recurring paid", value: stats.recurringPaid },
        { label: "Credit card due (tracked separately)", value: stats.cardsDue },
      ],
    },
    netCash: {
      title: "Net Cash Remaining",
      description: "Income − Expenses − (Loans + Subs + Recurring paid). Credit cards are tracked separately and not subtracted here — pay them from the Credit Cards page.",
      rows: [
        { label: "Income", value: stats.income },
        { label: "− Expenses (excludes credit-card spending)", value: -stats.expenses },
        { label: "− Total paid (loans+subs+recurring)", value: -stats.totalPaid },
      ],
    },
    loansTotal: { title: "Loans Total", description: "Monthly amount of all active loans.", rows: loans.filter((l: any) => l.active).map((l: any) => ({ label: l.name, value: Number(l.monthly_amount) })) },
    subsTotal: { title: "Subscriptions Total", description: "All active subscriptions.", rows: recurring.filter((r: any) => r.active && r.type === "subscription").map((r: any) => ({ label: r.name, value: Number(r.amount) })) },
    recurringTotal: { title: "Recurring Total", description: "All active recurring expense items.", rows: recurring.filter((r: any) => r.active && r.type === "expense").map((r: any) => ({ label: r.name, value: Number(r.amount) })) },
    cardsDue: { title: "Credit Card Due", description: "Amount due across all credit cards.", rows: accounts.filter((a: any) => a.type === "credit_card").map((a: any) => ({ label: a.name, value: Number(a.due_amount || 0) })) },
    loansRem: {
      title: "Loans Remaining",
      description: "Active loans not yet marked paid this month.",
      rows: loans.filter((l: any) => l.active && !payments.some((p: any) => p.source_id === l.id && p.source_type === "loan")).map((l: any) => ({ label: l.name, value: Number(l.monthly_amount) })),
    },
    subsRem: {
      title: "Subscriptions Remaining",
      description: "Active subscriptions not yet marked paid this month.",
      rows: recurring.filter((r: any) => r.active && r.type === "subscription" && !payments.some((p: any) => p.source_id === r.id && p.source_type === "subscription")).map((r: any) => ({ label: r.name, value: Number(r.amount) })),
    },
    recurringRem: {
      title: "Recurring Remaining",
      description: "Active recurring expenses not yet marked paid this month.",
      rows: recurring.filter((r: any) => r.active && r.type === "expense" && !payments.some((p: any) => p.source_id === r.id && p.source_type === "recurring")).map((r: any) => ({ label: r.name, value: Number(r.amount) })),
    },
  };

  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [editSection, setEditSection] = useState<any | null>(null);

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <StatCard icon={ArrowUpRight} label="Income" value={fmtMoney(stats.income, currency)} accent="positive" onClick={() => setDetailKey("income")} />
          <StatCard icon={ArrowDownRight} label="Expenses" value={fmtMoney(stats.expenses, currency)} accent="negative" onClick={() => setDetailKey("expenses")} />
          <StatCard icon={CheckCircle2} label="Paid Obligations" sub="Loans + Subs + Recurring + Cards" value={fmtMoney(stats.totalPaidWithCards, currency)} accent="warning" onClick={() => setDetailKey("totalPaidAll")} />
          <StatCard icon={TrendingUp} label="Net Cash Remaining" value={fmtMoney(stats.netCash, currency)} accent={stats.netCash >= 0 ? "positive" : "negative"} onClick={() => setDetailKey("netCash")} />
        </div>
      </section>

      {/* === GROUP 2: Total monthly amounts === */}
      <section>
        <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Monthly Totals (Paid + Unpaid)</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <StatCard icon={Landmark} label="Loans Total" value={fmtMoney(stats.loansTotal, currency)} accent="warning" onClick={() => setDetailKey("loansTotal")} />
          <StatCard icon={Tv} label="Subscriptions Total" value={fmtMoney(stats.subsTotal, currency)} accent="info" onClick={() => setDetailKey("subsTotal")} />
          <StatCard icon={Repeat} label="Recurring Total" value={fmtMoney(stats.recurringTotal, currency)} accent="info" onClick={() => setDetailKey("recurringTotal")} />
          <StatCard icon={CreditCard} label="Credit Card Due" value={fmtMoney(stats.cardsDue, currency)} accent="warning" onClick={() => setDetailKey("cardsDue")} />
        </div>
      </section>

      {/* === GROUP 3: Remaining === */}
      <section>
        <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Remaining To Pay</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
          <RemainingCard
            icon={Landmark}
            label="Loans Remaining"
            total={stats.loansRemaining}
            currency={currency}
            items={loans.filter((l: any) => l.active && !payments.some((p: any) => p.source_id === l.id && p.source_type === "loan")).map((l: any) => ({ name: l.name, amount: Number(l.monthly_amount) }))}
            onClick={() => setDetailKey("loansRem")}
          />
          <RemainingCard
            icon={Tv}
            label="Subscriptions Remaining"
            total={stats.subsRemaining}
            currency={currency}
            items={recurring.filter((r: any) => r.active && r.type === "subscription" && !payments.some((p: any) => p.source_id === r.id && p.source_type === "subscription")).map((r: any) => ({ name: r.name, amount: Number(r.amount) }))}
            onClick={() => setDetailKey("subsRem")}
          />
          <RemainingCard
            icon={Repeat}
            label="Recurring Remaining"
            total={stats.recurringRemaining}
            currency={currency}
            items={recurring.filter((r: any) => r.active && r.type === "expense" && !payments.some((p: any) => p.source_id === r.id && p.source_type === "recurring")).map((r: any) => ({ name: r.name, amount: Number(r.amount) }))}
            onClick={() => setDetailKey("recurringRem")}
          />
        </div>
      </section>

      {/* === GROUP 4: Custom sections === */}
      <section>
        <div className="flex items-center justify-between mb-2 gap-2">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Your Custom Sections</h3>
          <SectionFormDialog
            trigger={<Button size="sm" variant="outline" className="gap-1.5"><Plus size={14} /> Add</Button>}
            onSave={(name, formula) => sectionM.create.mutate({ name, formula })}
          />
        </div>
        {customSections.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {customSections.map((s: any) => {
              const value = computeSection(s.formula);
              return (
                <button
                  key={s.id}
                  onClick={() => setEditSection(s)}
                  className="stat-card text-left relative group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-primary text-primary flex items-center justify-center"><Wallet size={18} /></div>
                    <Pencil size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100" />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1 font-medium truncate">{s.name}</div>
                  <div className={`text-base sm:text-xl font-bold num truncate ${value < 0 ? "text-destructive" : ""}`}>{fmtMoney(value, currency)}</div>
                  <div className="text-[10px] text-muted-foreground/70 mt-1 truncate">
                    {(s.formula || []).map((f: any, i: number) => (
                      <span key={i}>{i > 0 ? ` ${f.op} ` : f.op === "-" ? "-" : ""}{SOURCE_OPTIONS[f.source] || f.source}</span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-6 text-sm text-muted-foreground text-center">
            No custom sections yet. Tap "Add" to combine any totals into your own card.
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

      {/* Built-in card details modal */}
      <Dialog open={!!detailKey} onOpenChange={(o) => !o && setDetailKey(null)}>
        <DialogContent className="max-w-md">
          {detailKey && builtInDetails[detailKey] && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Info size={16} className="text-primary" /> {builtInDetails[detailKey].title}</DialogTitle>
                <DialogDescription>{builtInDetails[detailKey].description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5 max-h-[50vh] overflow-auto">
                {builtInDetails[detailKey].rows.length > 0 ? builtInDetails[detailKey].rows.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-2 px-3 rounded-lg bg-secondary/40">
                    <span className="text-muted-foreground truncate">{r.label}</span>
                    <span className={`num font-semibold ${r.value < 0 ? "text-destructive" : ""}`}>{fmtMoney(Math.abs(r.value), currency)}</span>
                  </div>
                )) : <div className="text-sm text-muted-foreground text-center py-4">Nothing here yet.</div>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit custom section modal */}
      {editSection && (
        <SectionFormDialog
          open
          onOpenChange={(o) => { if (!o) setEditSection(null); }}
          initial={editSection}
          onSave={(name, formula) => { sectionM.update.mutate({ id: editSection.id, name, formula }); setEditSection(null); }}
          onDelete={() => { sectionM.remove.mutate(editSection.id); setEditSection(null); }}
        />
      )}
    </div>
  );
}

function StatCard({
  icon: Icon, label, sub, value, accent, onClick,
}: { icon: any; label: string; sub?: string; value: string; accent: "primary" | "positive" | "negative" | "warning" | "info"; onClick?: () => void }) {
  const accents: Record<string, string> = {
    primary: "bg-gradient-primary text-primary",
    positive: "bg-gradient-positive text-primary",
    negative: "bg-gradient-negative text-destructive",
    warning: "bg-gradient-warning text-warning",
    info: "bg-gradient-info text-info",
  };
  return (
    <button onClick={onClick} className="stat-card text-left w-full">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${accents[accent]}`}><Icon size={16} /></div>
        {onClick && <Info size={12} className="text-muted-foreground/60" />}
      </div>
      <div className="text-[11px] sm:text-xs text-muted-foreground mb-0.5 font-medium leading-tight">{label}</div>
      {sub && <div className="text-[9px] text-muted-foreground/60 mb-1 leading-tight">{sub}</div>}
      <div className="text-base sm:text-xl font-bold num truncate">{value}</div>
    </button>
  );
}

function RemainingCard({
  icon: Icon, label, total, currency, items, onClick,
}: { icon: any; label: string; total: number; currency: string; items: { name: string; amount: number }[]; onClick: () => void }) {
  return (
    <button onClick={onClick} className="stat-card text-left w-full">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${total > 0 ? "bg-gradient-negative text-destructive" : "bg-gradient-positive text-primary"}`}><Icon size={16} /></div>
        <Info size={12} className="text-muted-foreground/60" />
      </div>
      <div className="text-[11px] sm:text-xs text-muted-foreground mb-0.5 font-medium">{label}</div>
      <div className={`text-base sm:text-xl font-bold num ${total > 0 ? "text-destructive" : ""}`}>{fmtMoney(total, currency)}</div>
      {items.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-border/40 pt-2">
          {items.slice(0, 3).map((it, i) => (
            <div key={i} className="flex items-center justify-between text-[10px] sm:text-xs">
              <span className="text-muted-foreground truncate pr-2">{it.name}</span>
              <span className="num font-medium shrink-0">{fmtMoney(it.amount, currency)}</span>
            </div>
          ))}
          {items.length > 3 && <div className="text-[10px] text-muted-foreground/60">+{items.length - 3} more</div>}
        </div>
      )}
    </button>
  );
}

function SectionFormDialog({
  trigger, open: controlledOpen, onOpenChange, initial, onSave, onDelete,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  initial?: { name: string; formula: any[] };
  onSave: (name: string, formula: any[]) => void;
  onDelete?: () => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [name, setName] = useState(initial?.name || "");
  const [steps, setSteps] = useState<any[]>(initial?.formula?.length ? initial.formula : [{ source: "income", op: "+" }]);

  const submit = () => {
    if (!name.trim() || steps.length === 0) return;
    onSave(name.trim(), steps);
    if (!initial) { setName(""); setSteps([{ source: "income", op: "+" }]); }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit section" : "Create custom section"}</DialogTitle>
          <DialogDescription>Combine any totals using + and − to build your own card.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Section name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Disposable money" />
          </div>
          <div>
            <Label>Formula</Label>
            <div className="space-y-2 mt-1 max-h-[40vh] overflow-auto">
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
        <DialogFooter className="gap-2">
          {onDelete && (
            <Button variant="destructive" onClick={onDelete} className="mr-auto"><Trash2 size={14} /> Delete</Button>
          )}
          <Button onClick={submit} disabled={!name.trim()}>{initial ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
