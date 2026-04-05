import type { Category, CategoryGroup, Expense, ExpenseOwner, FinanceSettings } from '@/lib/types';

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
  if (!settings) {
    return {
      totalIncome: 0,
      totalExpenses: 0,
      totalInvestment: 0,
      balance: 0,
      byOwner: { user1: 0, user2: 0, shared: 0 }
    };
  }

  const totalIncome =
    (settings.primaryIncome || 0) +
    (settings.mode === 'couple' ? (settings.secondaryIncome || 0) : 0);

  const primaryInvestment =
    settings.primaryInvestmentType === 'fixed'
      ? (settings.primaryInvestmentFixed || 0)
      : (settings.primaryIncome || 0) * ((settings.primaryInvestmentPct || 0) / 100);

  const secondaryInvestment =
    settings.mode === 'couple'
      ? settings.secondaryInvestmentType === 'fixed'
        ? (settings.secondaryInvestmentFixed || 0)
        : (settings.secondaryIncome || 0) * ((settings.secondaryInvestmentPct || 0) / 100)
      : 0;

  const totalInvestment = (primaryInvestment || 0) + (secondaryInvestment || 0);

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
  const COLORS = [
    '#38bdf8', // sky-400
    '#818cf8', // indigo-400
    '#34d399', // emerald-400
    '#fbbf24', // amber-400
    '#f87171', // red-400
    '#a78bfa', // violet-400
    '#fb7185', // rose-400
    '#2dd4bf', // teal-400
    '#e879f9', // fuchsia-400
  ];

  return categories
    .map((category, index) => {
      const fallbackColor = COLORS[index % COLORS.length] || '#38bdf8';
      return {
        id: category.id,
        name: category.name,
        color: category.color || fallbackColor,
        amount: expenses
          .filter((expense) => expense.categoryId === category.id)
          .reduce((total, expense) => total + expense.amount, 0),
      };
    })
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

export function buildGroupBreakdown(expenses: Expense[], categories: Category[], groups: CategoryGroup[]) {
  return groups.map(group => {
    const groupCategoryIds = new Set(
      categories.filter(c => c.groupId === group.id).map(c => c.id)
    );

    const spent = expenses
      .filter(e => groupCategoryIds.has(e.categoryId))
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      id: group.id,
      name: group.name,
      color: group.color,
      limit: group.budgetLimit,
      spent,
      percent: group.budgetLimit > 0 ? (spent / group.budgetLimit) * 100 : 0
    };
  }).sort((a, b) => b.spent - a.spent);
}
