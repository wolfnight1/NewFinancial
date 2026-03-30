import type { Category, Expense, ExpenseOwner, FinanceSettings } from '@/lib/types';

type Summary = {
  totalIncome: number;
  totalExpenses: number;
  totalInvestment: number;
  balance: number;
  byOwner: Record<ExpenseOwner, number>;
};

export function buildDashboardSummary(
  settings: FinanceSettings,
  expenses: Expense[]
): Summary {
  const totalIncome =
    settings.primaryIncome +
    (settings.mode === 'couple' ? settings.secondaryIncome : 0);

  const totalInvestment =
    settings.primaryIncome * (settings.primaryInvestmentPct / 100) +
    (settings.mode === 'couple'
      ? settings.secondaryIncome * (settings.secondaryInvestmentPct / 100)
      : 0);

  const byOwner: Record<ExpenseOwner, number> = {
    user1: 0,
    user2: 0,
    shared: 0,
  };

  const totalExpenses = expenses.reduce((total, expense) => {
    byOwner[expense.owner] += expense.amount;
    return total + expense.amount;
  }, 0);

  return {
    totalIncome,
    totalExpenses,
    totalInvestment,
    balance: totalIncome - totalExpenses - totalInvestment,
    byOwner,
  };
}

export function buildCategoryBreakdown(expenses: Expense[], categories: Category[]) {
  return categories
    .map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      amount: expenses
        .filter((expense) => expense.categoryId === category.id)
        .reduce((total, expense) => total + expense.amount, 0),
    }))
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function buildMonthlyTrend(expenses: Expense[]) {
  const buckets = new Map<string, number>();

  for (const expense of expenses) {
    const key = expense.date.slice(0, 7);
    buckets.set(key, (buckets.get(key) ?? 0) + expense.amount);
  }

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, amount]) => ({
      month,
      expenses: amount,
    }));
}
