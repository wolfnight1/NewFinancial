export type AppLocale = 'en' | 'es';

export type AppMode = 'individual' | 'couple';

export type ExpenseOwner = 'user1' | 'user2' | 'shared';

export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Expense = {
  id: string;
  owner: ExpenseOwner;
  categoryId: string;
  amount: number;
  date: string;
  note: string;
};

export type FinanceSettings = {
  mode: AppMode;
  primaryUserName: string;
  secondaryUserName: string;
  primaryIncome: number;
  secondaryIncome: number;
  primaryInvestmentPct: number;
  secondaryInvestmentPct: number;
  primaryInvestmentType: 'percentage' | 'fixed';
  secondaryInvestmentType: 'percentage' | 'fixed';
  primaryInvestmentFixed: number;
  secondaryInvestmentFixed: number;
  language: AppLocale;
  currency: string;
};

export type FinanceState = {
  settings: FinanceSettings;
  categories: Category[];
  expenses: Expense[];
};
