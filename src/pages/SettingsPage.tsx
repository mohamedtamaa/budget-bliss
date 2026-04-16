import { useBudgetStore } from '@/lib/budget-store';
import { Info } from 'lucide-react';

export default function SettingsPage() {
  const { recurringItems, loans } = useBudgetStore();

  const rules = [
    { label: 'Included in Income', desc: 'Items flagged as includedInTotal will count toward income totals', count: recurringItems.filter((r) => r.type === 'income' && r.includedInTotal).length },
    { label: 'Essential Expenses', desc: 'Housing, utilities, and debt payments are considered essential', count: recurringItems.filter((r) => ['housing', 'utilities'].includes(r.category)).length },
    { label: 'Optional Expenses', desc: 'Personal and subscription costs that can be reduced', count: recurringItems.filter((r) => ['personal', 'subscriptions'].includes(r.category)).length },
    { label: 'Active Loans', desc: 'Loans that auto-populate monthly budgets until end date', count: loans.filter((l) => l.active).length },
    { label: 'Auto-Stop on End Date', desc: 'Recurring items and loans with end dates will automatically stop being included in future budgets once the end date has passed', count: recurringItems.filter((r) => r.endDate).length + loans.filter((l) => l.endDate).length },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="glass-card p-5">
        <h3 className="font-medium mb-4">Budget Rules & Logic</h3>
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.label} className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Info size={14} className="text-info" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{rule.label}</p>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{rule.count} items</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-medium mb-4">How It Works</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>1. Add your <strong className="text-foreground">recurring items</strong> (salary, rent, subscriptions) and <strong className="text-foreground">loans</strong>.</p>
          <p>2. Go to <strong className="text-foreground">Monthly Budget</strong> and click <strong className="text-foreground">"Create Next Month"</strong> to generate a new budget.</p>
          <p>3. All active recurring items and loans will be automatically included.</p>
          <p>4. Mark items as <strong className="text-foreground">paid</strong> throughout the month to track progress.</p>
          <p>5. Items with <strong className="text-foreground">end dates</strong> will stop appearing after their end date passes.</p>
          <p>6. Use <strong className="text-foreground">Transactions</strong> for daily tracking of variable expenses.</p>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-medium mb-2">Data Storage</h3>
        <p className="text-sm text-muted-foreground">All data is stored locally in your browser. Clearing browser data will reset everything.</p>
      </div>
    </div>
  );
}
