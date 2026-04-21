import { Book, ArrowRight, Wallet, Receipt, Repeat, Landmark, CreditCard, CalendarRange, Bell, Settings, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: Wallet,
    title: "1. Set Up Your Accounts",
    desc: "Go to Accounts and update your bank account balances. Add any wallets, cash, or credit cards you have. Set the balance to your current real balance.",
    link: "/accounts",
    linkLabel: "Go to Accounts",
  },
  {
    icon: Repeat,
    title: "2. Review Recurring Items",
    desc: "Your salary, fixed expenses, and subscriptions are pre-loaded. Go to Recurring to edit amounts, add new ones, or deactivate items you don't need.",
    link: "/recurring",
    linkLabel: "Go to Recurring",
  },
  {
    icon: Landmark,
    title: "3. Check Your Loans",
    desc: "Your loans are pre-loaded. Go to Loans to update due dates, remaining payments, and balances. You can add new loans or deactivate finished ones.",
    link: "/loans",
    linkLabel: "Go to Loans",
  },
  {
    icon: CalendarRange,
    title: "4. Create This Month's Budget",
    desc: 'Go to Monthly Budget and click "Create Next Month Budget". This generates a budget with all your recurring items and loans. Mark items as paid when you pay them.',
    link: "/monthly",
    linkLabel: "Go to Monthly Budget",
  },
  {
    icon: Receipt,
    title: "5. Add Daily Transactions",
    desc: "Every time you spend or receive money, add it in Transactions. Pick the type (income/expense), amount, category, and account. The dashboard updates automatically.",
    link: "/transactions",
    linkLabel: "Go to Transactions",
  },
  {
    icon: CreditCard,
    title: "6. Track Credit Cards",
    desc: "If you have credit cards, go to Accounts and add them as 'Credit Card' type. Set the credit limit, used amount, and due amount.",
    link: "/cards",
    linkLabel: "Go to Credit Cards",
  },
  {
    icon: TrendingUp,
    title: "7. View Your Dashboard",
    desc: "The Dashboard shows your total balance, income, expenses, loans, and more. Use the month filter to see different months. All numbers update in real-time.",
    link: "/",
    linkLabel: "Go to Dashboard",
  },
  {
    icon: Bell,
    title: "8. Enable Notifications",
    desc: 'Click the bell icon 🔔 in the top header to enable loan payment reminders. You\'ll get browser notifications 3 days before, 1 day before, and on the due date. Note: notifications only work when the app is opened directly (not in an iframe).',
    link: null,
    linkLabel: null,
  },
  {
    icon: Settings,
    title: "9. Customize Settings",
    desc: "Go to Settings to change your display name, currency, and timezone.",
    link: "/settings",
    linkLabel: "Go to Settings",
  },
];

const tips = [
  "💡 Create a monthly budget at the start of each month to track what's paid and what's pending.",
  '💡 Mark budget items as "Finished" if a loan is paid off — it won\'t carry to next month.',
  "💡 Use account groups to organize multiple bank accounts or wallets.",
  "💡 The Total Balance card shows the sum of all accounts NOT excluded from total.",
  "💡 If you just signed up, your accounts start at 0. Update them with your real balances!",
  "💡 Income and Expense cards show actual transactions. If no transactions yet, they show expected amounts from recurring items.",
  "💡 You can install this app on your phone: open in browser → Share → Add to Home Screen.",
];

export default function GuidePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Book size={24} /> How to Use Money Manager Pro</h2>
        <p className="text-muted-foreground mt-1">Follow these steps to get started. You can come back here anytime from the dashboard (? icon).</p>
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <step.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                {step.link && (
                  <Link to={step.link} className="inline-flex items-center gap-1 text-sm text-primary mt-2 hover:underline">
                    {step.linkLabel} <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold text-base mb-3">💡 Tips & Tricks</h3>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <p key={i} className="text-sm text-muted-foreground">{tip}</p>
          ))}
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold text-base mb-3">📱 Install as Mobile App (PWA)</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>iPhone:</strong> Open in Safari → tap Share → "Add to Home Screen"</p>
          <p><strong>Android:</strong> Open in Chrome → tap menu (⋮) → "Install app" or "Add to Home Screen"</p>
          <p>The app will look and feel like a native app with offline support.</p>
        </div>
      </div>

      <div className="glass-card p-5">
        <h3 className="font-semibold text-base mb-3">🔔 About Notifications</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>Loan payment reminders use <strong>browser notifications</strong>. They work when:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>You've clicked the bell icon and allowed notifications</li>
            <li>The app is open in your browser (or installed as PWA)</li>
            <li>Reminders fire 3 days, 1 day, and on the due day</li>
          </ul>
          <p className="text-warning">⚠️ Notifications don't work inside iframes or Lovable preview. Open the published URL directly or install as PWA.</p>
        </div>
      </div>
    </div>
  );
}
