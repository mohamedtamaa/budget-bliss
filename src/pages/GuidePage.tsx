import { Book, ArrowRight, Wallet, Receipt, Repeat, Landmark, CreditCard, CalendarRange, Bell, Settings, TrendingUp, Tv, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const pages = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    path: "/",
    what: "Your financial overview for any month. Shows 7 stat cards: Total Balance, Income, Expenses, Net Cash Flow, Loans Due, Subscriptions, and Credit Card Due.",
    how: "Use the month picker to filter by month. Cards show actual transaction totals when available, or expected amounts from your recurring items as fallback. Click any section title to jump to its page.",
  },
  {
    icon: Receipt,
    title: "Transactions",
    path: "/transactions",
    what: "Log every income and expense. Each transaction has: type, amount, description (optional), date, account, and category.",
    how: "Click 'Add transaction' → fill the form → save. Edit or delete any row. All transactions update the dashboard stats immediately. Use the month filter to browse history.",
  },
  {
    icon: Repeat,
    title: "Recurring",
    path: "/recurring",
    what: "Fixed monthly income and expenses that repeat every month (salary, rent, bills). Does NOT include subscriptions — those have their own page.",
    how: "Add items with name, type (income/expense), and amount. Toggle 'Active' to pause without deleting. These items auto-populate your Monthly Budget.",
  },
  {
    icon: Tv,
    title: "Subscriptions",
    path: "/subscriptions",
    what: "All your subscription services (Netflix, Spotify, ChatGPT, etc.) in one dedicated page. Shows total monthly cost.",
    how: "Add subscriptions with name and monthly amount. Pause or delete anytime. These also appear in your Monthly Budget automatically.",
  },
  {
    icon: Landmark,
    title: "Loans",
    path: "/loans",
    what: "Track all active loans with lender, monthly amount, and due day. Loan reminders fire 3 days before, 1 day before, and on due day.",
    how: "Add loans with details. Set remaining payments to track progress. Deactivate when fully paid. Loans auto-populate Monthly Budget.",
  },
  {
    icon: CreditCard,
    title: "Credit Cards",
    path: "/cards",
    what: "Overview of all credit card accounts showing credit limit, used amount, available credit, and due amounts.",
    how: "Add credit cards in the Accounts page with type 'Credit Card'. Set credit_limit, used_amount, and due_amount. This page shows a summary view.",
  },
  {
    icon: CalendarRange,
    title: "Monthly Budget",
    path: "/monthly",
    what: "A per-month budget generated from your recurring items, subscriptions, and loans. Track what's paid and what's pending.",
    how: "Click 'Create Budget' and select a month. All active recurring items and loans are pulled in. Mark items as 'Paid' when you pay them. Mark as 'Finished' to exclude from future months (e.g. a paid-off loan).",
  },
  {
    icon: Wallet,
    title: "Accounts",
    path: "/accounts",
    what: "All your money containers: bank accounts, wallets, cash, credit cards. Total Balance = sum of non-excluded accounts.",
    how: "Update balances manually to match your real balances. Toggle 'Exclude from total' for tracking-only accounts. Group accounts for organization.",
  },
  {
    icon: Settings,
    title: "Settings",
    path: "/settings",
    what: "Change display name, currency (EGP by default), and timezone.",
    how: "Edit fields and save. Currency affects all money formatting across the app.",
  },
];

const tips = [
  "💡 Create a monthly budget at the start of each month to track what's paid and what's pending.",
  '💡 Mark budget items as "Finished" if a loan is paid off — it won\'t carry to next month.',
  "💡 Use account groups to organize multiple bank accounts or wallets.",
  "💡 The Total Balance card shows the sum of all accounts NOT excluded from total.",
  "💡 If you just signed up, your accounts start at 0. Update them with your real balances!",
  "💡 Income and Expense cards show actual transactions. If none yet, they show expected amounts from recurring items.",
  "💡 You can install this app on your phone: open in browser → Share → Add to Home Screen.",
  "💡 Use Quick Add (/quick-add) for fast transaction entry — perfect as a mobile home screen shortcut.",
];

import { LayoutDashboard } from "lucide-react";

export default function GuidePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2"><Book size={24} /> Money Manager Pro — Full Guide</h2>
        <p className="text-muted-foreground mt-1">Complete documentation for every page. Come back here anytime from the dashboard (? icon).</p>
      </div>

      {/* Quick Start */}
      <div className="glass-card p-5 border-primary/30 border">
        <h3 className="font-semibold text-base mb-2">🚀 Quick Start (3 steps)</h3>
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal ml-5">
          <li>Go to <Link to="/accounts" className="text-primary underline">Accounts</Link> → set your real bank balance.</li>
          <li>Go to <Link to="/monthly" className="text-primary underline">Monthly Budget</Link> → click "Create Budget" for this month.</li>
          <li>Start adding <Link to="/transactions" className="text-primary underline">Transactions</Link> daily — everything updates automatically.</li>
        </ol>
      </div>

      {/* Page-by-page docs */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">📄 Page-by-Page Documentation</h3>
        {pages.map((page, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <page.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base">{page.title}</h4>
                <p className="text-sm text-muted-foreground mt-1"><strong>What it does:</strong> {page.what}</p>
                <p className="text-sm text-muted-foreground mt-1"><strong>How to use:</strong> {page.how}</p>
                <Link to={page.path} className="inline-flex items-center gap-1 text-sm text-primary mt-2 hover:underline">
                  Open {page.title} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Add Widget */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-base mb-3 flex items-center gap-2"><Zap size={18} /> Quick Add Widget (Mobile)</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>The <strong>Quick Add</strong> page (<code>/quick-add</code>) is a minimal, full-screen form designed for fast transaction entry from your phone.</p>
          <p><strong>How to add as a home screen shortcut:</strong></p>
          <ol className="list-decimal ml-5 space-y-1">
            <li><strong>Android:</strong> If the app is installed as PWA, long-press the app icon → you'll see "Quick Add Transaction" shortcut. Alternatively, open <code>/quick-add</code> in Chrome → menu → "Add to Home Screen".</li>
            <li><strong>iPhone:</strong> Open <code>/quick-add</code> in Safari → Share → "Add to Home Screen" → name it "Quick Add".</li>
          </ol>
          <p>This gives you a dedicated home screen icon that opens directly to the transaction form — no navigation needed.</p>
        </div>
      </div>

      {/* Tips */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-base mb-3">💡 Tips & Tricks</h3>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <p key={i} className="text-sm text-muted-foreground">{tip}</p>
          ))}
        </div>
      </div>

      {/* PWA */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-base mb-3">📱 Install as Mobile App (PWA)</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>iPhone:</strong> Open in Safari → tap Share → "Add to Home Screen"</p>
          <p><strong>Android:</strong> Open in Chrome → tap menu (⋮) → "Install app" or "Add to Home Screen"</p>
          <p>The app will look and feel like a native app. Quick Add shortcut will also appear.</p>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-base mb-3">🔔 Notifications</h3>
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

      {/* Data flow */}
      <div className="glass-card p-5">
        <h3 className="font-semibold text-base mb-3">🔄 How Data Flows</h3>
        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Recurring Items + Subscriptions + Loans</strong> → auto-populate → <strong>Monthly Budget</strong></p>
          <p><strong>Transactions</strong> → update → <strong>Dashboard stats</strong> (income, expenses, net cash flow)</p>
          <p><strong>Accounts</strong> → feed → <strong>Total Balance</strong> on Dashboard</p>
          <p><strong>Monthly Budget "Paid"</strong> → tracks what you've actually paid this month</p>
          <p><strong>Monthly Budget "Finished"</strong> → excludes item from next month's budget</p>
        </div>
      </div>
    </div>
  );
}
