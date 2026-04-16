import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction, RecurringItem, Loan, MonthlyBudget, Account, AccountGroup, MonthlyBudgetItem } from './types';
import { seedTransactions, seedRecurringItems, seedLoans, seedMonthlyBudgets, seedAccounts, seedAccountGroups } from './seed-data';
import { format, addMonths, parse, isAfter, isBefore } from 'date-fns';

interface BudgetStore {
  transactions: Transaction[];
  recurringItems: RecurringItem[];
  loans: Loan[];
  monthlyBudgets: MonthlyBudget[];
  accounts: Account[];
  accountGroups: AccountGroup[];

  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addRecurringItem: (r: Omit<RecurringItem, 'id'>) => void;
  updateRecurringItem: (id: string, r: Partial<RecurringItem>) => void;
  deleteRecurringItem: (id: string) => void;

  addLoan: (l: Omit<Loan, 'id'>) => void;
  updateLoan: (id: string, l: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;

  addAccount: (a: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, a: Partial<Account>) => void;
  deleteAccount: (id: string) => void;

  addAccountGroup: (g: Omit<AccountGroup, 'id'>) => void;

  createNextMonthBudget: (currentMonth: string) => boolean;
  toggleBudgetItemPaid: (budgetId: string, itemId: string) => void;
}

const uid = () => crypto.randomUUID();

export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      transactions: seedTransactions,
      recurringItems: seedRecurringItems,
      loans: seedLoans,
      monthlyBudgets: seedMonthlyBudgets,
      accounts: seedAccounts,
      accountGroups: seedAccountGroups,

      addTransaction: (t) => set((s) => ({ transactions: [...s.transactions, { ...t, id: uid() }] })),
      updateTransaction: (id, t) => set((s) => ({ transactions: s.transactions.map((x) => (x.id === id ? { ...x, ...t } : x)) })),
      deleteTransaction: (id) => set((s) => ({ transactions: s.transactions.filter((x) => x.id !== id) })),

      addRecurringItem: (r) => set((s) => ({ recurringItems: [...s.recurringItems, { ...r, id: uid() }] })),
      updateRecurringItem: (id, r) => set((s) => ({ recurringItems: s.recurringItems.map((x) => (x.id === id ? { ...x, ...r } : x)) })),
      deleteRecurringItem: (id) => set((s) => ({ recurringItems: s.recurringItems.filter((x) => x.id !== id) })),

      addLoan: (l) => set((s) => ({ loans: [...s.loans, { ...l, id: uid() }] })),
      updateLoan: (id, l) => set((s) => ({ loans: s.loans.map((x) => (x.id === id ? { ...x, ...l } : x)) })),
      deleteLoan: (id) => set((s) => ({ loans: s.loans.filter((x) => x.id !== id) })),

      addAccount: (a) => set((s) => ({ accounts: [...s.accounts, { ...a, id: uid() }] })),
      updateAccount: (id, a) => set((s) => ({ accounts: s.accounts.map((x) => (x.id === id ? { ...x, ...a } : x)) })),
      deleteAccount: (id) => set((s) => ({ accounts: s.accounts.filter((x) => x.id !== id) })),

      addAccountGroup: (g) => set((s) => ({ accountGroups: [...s.accountGroups, { ...g, id: uid() }] })),

      createNextMonthBudget: (currentMonth: string) => {
        const nextDate = addMonths(parse(currentMonth + '-01', 'yyyy-MM-dd', new Date()), 1);
        const nextMonth = format(nextDate, 'yyyy-MM');
        const exists = get().monthlyBudgets.find((b) => b.month === nextMonth);
        if (exists) return false;

        const nextMonthEnd = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0);
        const items: MonthlyBudgetItem[] = [];

        get().recurringItems.forEach((r) => {
          if (!r.active) return;
          const start = new Date(r.startDate);
          if (isAfter(start, nextMonthEnd)) return;
          if (r.endDate && isBefore(new Date(r.endDate), nextDate)) return;
          items.push({
            id: uid(),
            sourceId: r.id,
            sourceType: 'recurring',
            name: r.name,
            type: r.type,
            amount: r.amount,
            paid: false,
          });
        });

        get().loans.forEach((l) => {
          if (!l.active) return;
          const start = new Date(l.startDate);
          if (isAfter(start, nextMonthEnd)) return;
          if (l.endDate && isBefore(new Date(l.endDate), nextDate)) return;
          items.push({
            id: uid(),
            sourceId: l.id,
            sourceType: 'loan',
            name: l.name,
            type: 'loan',
            amount: l.monthlyAmount,
            paid: false,
          });
        });

        set((s) => ({
          monthlyBudgets: [
            ...s.monthlyBudgets,
            { id: uid(), month: nextMonth, items, createdAt: format(new Date(), 'yyyy-MM-dd') },
          ],
        }));
        return true;
      },

      toggleBudgetItemPaid: (budgetId, itemId) =>
        set((s) => ({
          monthlyBudgets: s.monthlyBudgets.map((b) =>
            b.id === budgetId
              ? {
                  ...b,
                  items: b.items.map((i) =>
                    i.id === itemId ? { ...i, paid: !i.paid, paidDate: !i.paid ? format(new Date(), 'yyyy-MM-dd') : undefined } : i
                  ),
                }
              : b
          ),
        })),
    }),
    { name: 'mohamed-budget-store' }
  )
);
