import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Trash2, CalendarPlus, Flag } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { MonthFilter } from "@/components/MonthFilter";
import { useBudgets, useBudgetActions, useProfile } from "@/hooks/useFinanceData";
import { fmtMoney } from "@/lib/format";

export default function MonthlyBudgetPage() {
  const { data: budgets = [] } = useBudgets();
  const { data: profile } = useProfile();
  const a = useBudgetActions();
  const currency = profile?.currency || "EGP";

  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const budget = budgets.find((b: any) => b.month === month);

  const totals = useMemo(() => {
    const items = budget?.items || [];
    const income = items.filter((i: any) => i.type === "income").reduce((s: number, i: any) => s + Number(i.amount), 0);
    const expenses = items.filter((i: any) => i.type !== "income").reduce((s: number, i: any) => s + Number(i.amount), 0);
    const paid = items.filter((i: any) => i.paid).reduce((s: number, i: any) => s + Number(i.amount), 0);
    const unpaid = items.filter((i: any) => !i.paid).reduce((s: number, i: any) => s + Number(i.amount), 0);
    return { income, expenses, paid, unpaid };
  }, [budget]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthFilter value={month} onChange={setMonth} />
        {!budget ? (
          <Button onClick={() => a.createMonthBudget.mutate(month)} disabled={a.createMonthBudget.isPending}>
            <CalendarPlus size={16} /> Create budget for {format(new Date(month + "-01"), "MMMM yyyy")}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => a.deleteBudget.mutate(budget.id)}>
            <Trash2 size={14} /> Delete budget
          </Button>
        )}
      </div>

      {budget ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="stat-card"><div className="text-xs text-muted-foreground mb-1">Income</div><div className="text-lg font-bold text-primary num">{fmtMoney(totals.income, currency)}</div></div>
            <div className="stat-card"><div className="text-xs text-muted-foreground mb-1">Expenses</div><div className="text-lg font-bold text-destructive num">{fmtMoney(totals.expenses, currency)}</div></div>
            <div className="stat-card"><div className="text-xs text-muted-foreground mb-1">Paid</div><div className="text-lg font-bold num">{fmtMoney(totals.paid, currency)}</div></div>
            <div className="stat-card"><div className="text-xs text-muted-foreground mb-1">Unpaid</div><div className="text-lg font-bold text-warning num">{fmtMoney(totals.unpaid, currency)}</div></div>
          </div>

          <div className="glass-card divide-y divide-border/40">
            {budget.items.length ? budget.items.map((i: any) => (
              <div key={i.id} className="flex items-center justify-between p-4 gap-3">
                <button onClick={() => a.togglePaid.mutate({ item: i })} className="shrink-0">
                  {i.paid ? <CheckCircle2 className="text-primary" size={22} /> : <Circle className="text-muted-foreground" size={22} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium truncate ${i.paid ? "line-through text-muted-foreground" : ""}`}>{i.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{i.type} · {i.source_type}{i.finished ? " · finished" : ""}</div>
                </div>
                <div className={`font-semibold num shrink-0 ${i.type === "income" ? "text-primary" : ""}`}>{fmtMoney(i.amount, currency)}</div>
                <Button
                  size="icon" variant="ghost" className={`h-8 w-8 ${i.finished ? "text-warning" : ""}`}
                  title={i.finished ? "Marked finished — won't carry to next month" : "Mark finished (no carryover)"}
                  onClick={() => a.toggleFinished.mutate(i)}>
                  <Flag size={14} />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => a.removeItem.mutate(i.id)}><Trash2 size={14} /></Button>
              </div>
            )) : <div className="p-10 text-center text-sm text-muted-foreground">No items in this budget</div>}
          </div>
        </>
      ) : (
        <div className="glass-card p-10 text-center">
          <CalendarPlus className="mx-auto text-muted-foreground mb-3" size={32} />
          <h3 className="font-semibold mb-1">No budget for {format(new Date(month + "-01"), "MMMM yyyy")}</h3>
          <p className="text-sm text-muted-foreground">Create one to auto-load active recurring items and loans.</p>
        </div>
      )}
    </div>
  );
}
