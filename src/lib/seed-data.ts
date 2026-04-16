import { Transaction, RecurringItem, Loan, MonthlyBudget, Account, AccountGroup } from './types';
import { format, subDays } from 'date-fns';

const now = new Date();
const currentMonth = format(now, 'yyyy-MM');

export const seedAccountGroups: AccountGroup[] = [
  { id: 'ag1', name: 'Cash' },
  { id: 'ag2', name: 'Banks' },
  { id: 'ag3', name: 'Credit Cards' },
  { id: 'ag4', name: 'Tracking' },
];

export const seedAccounts: Account[] = [
  { id: 'acc1', name: 'Wallet', group: 'ag1', type: 'wallet', balance: 3500, excludeFromTotal: false },
  { id: 'acc2', name: 'QNB Bank', group: 'ag2', type: 'bank', balance: 12000, excludeFromTotal: false },
  { id: 'acc3', name: 'Ahly Bank', group: 'ag2', type: 'bank', balance: 8500, excludeFromTotal: false },
  { id: 'acc4', name: 'Credit Card', group: 'ag3', type: 'credit_card', balance: -2500, excludeFromTotal: false, creditLimit: 15000, usedAmount: 2500, dueAmount: 2500, dueDate: format(new Date(now.getFullYear(), now.getMonth(), 25), 'yyyy-MM-dd') },
  { id: 'acc5', name: 'Tracking Only', group: 'ag4', type: 'tracking', balance: 0, excludeFromTotal: true },
];

export const seedRecurringItems: RecurringItem[] = [
  { id: 'r1', name: 'Salary', type: 'income', category: 'salary', amount: 21500, startDate: '2024-01-01', active: true, accountId: 'acc2', includedInTotal: true },
  { id: 'r2', name: 'Safwa Salary', type: 'income', category: 'salary', amount: 1000, startDate: '2024-01-01', active: true, accountId: 'acc2', includedInTotal: true },
  { id: 'r3', name: 'Red Sea Life Salary', type: 'income', category: 'salary', amount: 15000, startDate: '2024-01-01', active: true, accountId: 'acc3', includedInTotal: true },
  { id: 'r4', name: 'House', type: 'expense', category: 'housing', amount: 5000, startDate: '2024-01-01', active: true, accountId: 'acc1', includedInTotal: true },
  { id: 'r5', name: 'Zein', type: 'expense', category: 'personal', amount: 2000, startDate: '2024-01-01', active: true, accountId: 'acc1', includedInTotal: true },
  { id: 'r6', name: 'Mohamed', type: 'expense', category: 'personal', amount: 5000, startDate: '2024-01-01', active: true, accountId: 'acc1', includedInTotal: true },
  { id: 'r7', name: 'ChatGPT', type: 'subscription', category: 'subscriptions', amount: 700, startDate: '2024-01-01', active: true, accountId: 'acc4', includedInTotal: true },
  { id: 'r8', name: 'Wifi', type: 'expense', category: 'utilities', amount: 438.8, startDate: '2024-01-01', active: true, accountId: 'acc2', includedInTotal: true },
  { id: 'r9', name: 'Etisalat', type: 'expense', category: 'utilities', amount: 474.84, startDate: '2024-01-01', active: true, accountId: 'acc2', includedInTotal: true },
  { id: 'r10', name: 'Compound', type: 'expense', category: 'housing', amount: 500, startDate: '2024-01-01', active: true, accountId: 'acc1', includedInTotal: true },
];

export const seedLoans: Loan[] = [
  { id: 'l1', name: 'QNB Loan', monthlyAmount: 627.81, startDate: '2024-01-01', endDate: '2027-01-01', remainingPayments: 24, dueDay: 5, active: true, accountId: 'acc2' },
  { id: 'l2', name: 'Ahly Loan', monthlyAmount: 659.08, startDate: '2024-01-01', endDate: '2027-06-01', remainingPayments: 30, dueDay: 10, active: true, accountId: 'acc3' },
  { id: 'l3', name: 'Sohola 1', monthlyAmount: 678, startDate: '2024-03-01', endDate: '2026-03-01', remainingPayments: 12, dueDay: 15, active: true, accountId: 'acc2' },
  { id: 'l4', name: 'Sohola 2', monthlyAmount: 1153, startDate: '2024-06-01', endDate: '2026-06-01', remainingPayments: 18, dueDay: 20, active: true, accountId: 'acc2' },
  { id: 'l5', name: 'Sohola 3', monthlyAmount: 3211.5, startDate: '2024-09-01', endDate: '2026-09-01', remainingPayments: 20, dueDay: 1, active: true, accountId: 'acc2' },
  { id: 'l6', name: 'Value', monthlyAmount: 722, startDate: '2024-01-01', endDate: '2026-12-01', remainingPayments: 15, dueDay: 25, active: true, accountId: 'acc3' },
];

const generateTransactions = (): Transaction[] => {
  const txns: Transaction[] = [];
  // recent transactions from seed data
  const expenses = [
    { cat: 'food', desc: 'Groceries', amt: 450, acc: 'acc1' },
    { cat: 'transport', desc: 'Uber rides', amt: 180, acc: 'acc1' },
    { cat: 'food', desc: 'Restaurant dinner', amt: 320, acc: 'acc4' },
    { cat: 'personal', desc: 'Pharmacy', amt: 95, acc: 'acc1' },
    { cat: 'utilities', desc: 'Electricity bill', amt: 280, acc: 'acc2' },
    { cat: 'food', desc: 'Coffee shop', amt: 85, acc: 'acc1' },
    { cat: 'personal', desc: 'Clothing', amt: 650, acc: 'acc4' },
    { cat: 'food', desc: 'Supermarket', amt: 520, acc: 'acc1' },
  ];
  expenses.forEach((e, i) => {
    txns.push({
      id: `t${i + 1}`,
      date: format(subDays(now, i * 2 + 1), 'yyyy-MM-dd'),
      type: 'expense',
      category: e.cat,
      description: e.desc,
      amount: e.amt,
      accountId: e.acc,
      includedInTotal: true,
      isEssential: e.cat === 'food' || e.cat === 'utilities',
    });
  });
  return txns;
};

export const seedTransactions: Transaction[] = generateTransactions();

export const seedMonthlyBudgets: MonthlyBudget[] = [
  {
    id: 'mb1',
    month: currentMonth,
    createdAt: format(now, 'yyyy-MM-dd'),
    items: [
      ...seedRecurringItems.map((r, i) => ({
        id: `mbi${i}`,
        sourceId: r.id,
        sourceType: 'recurring' as const,
        name: r.name,
        type: r.type,
        amount: r.amount,
        paid: i < 3, // first 3 income items marked as paid
      })),
      ...seedLoans.map((l, i) => ({
        id: `mbil${i}`,
        sourceId: l.id,
        sourceType: 'loan' as const,
        name: l.name,
        type: 'loan' as const,
        amount: l.monthlyAmount,
        paid: false,
      })),
    ],
  },
];
