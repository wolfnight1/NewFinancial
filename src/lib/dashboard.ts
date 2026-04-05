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
    if (expense.owner in byOwner) {
      byOwner[expense.owner] += expense.amount;
    }
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
  if (!categories || !Array.isArray(categories) || !expenses) return [];

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
      // For the visual breakdown, we always use the multi-color palette to ensure distinction
      const displayColor = COLORS[index % COLORS.length];
      return {
        id: category.id,
        name: category.name,
        color: displayColor,
        amount: expenses
          .filter((expense) => expense.categoryId === category.id)
          .reduce((total, expense) => total + expense.amount, 0),
      };
    })
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

export function buildMonthlyTrend(expenses: Expense[], categories: Category[], groups: CategoryGroup[]) {
  if (!expenses || !Array.isArray(expenses)) return [];

  const buckets = new Map<string, any>();

  for (const expense of expenses) {
    if (!expense.date || typeof expense.date !== 'string') continue;
    const month = expense.date.slice(0, 7);
    
    const category = categories.find(c => c.id === expense.categoryId);
    const group = groups.find(g => g.id === category?.groupId);
    const groupName = group?.name || 'Otros';

    if (!buckets.has(month)) {
      buckets.set(month, { month });
    }
    
    const row = buckets.get(month);
    row[groupName] = (row[groupName] ?? 0) + expense.amount;
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function buildGroupBreakdown(expenses: Expense[], categories: Category[], groups: CategoryGroup[]) {
  if (!groups || !Array.isArray(groups) || !categories || !expenses) return [];

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
