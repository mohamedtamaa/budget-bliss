export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  description?: string;
  amount: number;
  accountId: string;
  notes?: string;
  includedInTotal: boolean;
  isEssential?: boolean;
}

export interface CategoryGroup {
  id: string;
  name: string;
  type: 'income' | 'expense';
  subcategories: string[];
}

export interface RecurringItem {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'loan' | 'subscription';
  category: string;
  subcategory?: string;
  amount: number;
  startDate: string;
  endDate?: string;
  active: boolean;
  accountId?: string;
  includedInTotal: boolean;
}

export interface Loan {
  id: string;
  name: string;
  monthlyAmount: number;
  startDate: string;
  endDate?: string;
  remainingPayments?: number;
  dueDay: number;
  notes?: string;
  active: boolean;
  accountId?: string;
}

export interface MonthlyBudget {
  id: string;
  month: string; // YYYY-MM
  items: MonthlyBudgetItem[];
  createdAt: string;
}

export interface MonthlyBudgetItem {
  id: string;
  sourceId?: string; // recurring/loan id
  sourceType: 'recurring' | 'loan' | 'manual';
  name: string;
  type: 'income' | 'expense' | 'loan' | 'subscription';
  category?: string;
  subcategory?: string;
  amount: number;
  paid: boolean;
  paidDate?: string;
  finished?: boolean; // mark as finished, won't carry to next month
}

export interface Account {
  id: string;
  name: string;
  group: string;
  type: 'wallet' | 'bank' | 'tracking' | 'credit_card';
  balance: number;
  excludeFromTotal: boolean;
  creditLimit?: number;
  usedAmount?: number;
  dueAmount?: number;
  dueDate?: string;
}

export interface AccountGroup {
  id: string;
  name: string;
}

export type CategoryType = 'housing' | 'transport' | 'food' | 'utilities' | 'subscriptions' | 'personal' | 'debt' | 'salary' | 'freelance' | 'other';
