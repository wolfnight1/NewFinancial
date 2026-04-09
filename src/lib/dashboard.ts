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

export const CHART_COLORS = [
  '#34d399', // emerald
  '#fb7185', // rose
  '#818cf8', // indigo
  '#fbbf24', // amber
  '#a78bfa', // violet
  '#38bdf8', // sky
  '#f87171', // red
  '#e879f9', // fuchsia
  '#2dd4bf', // teal
  '#c084fc', // purple
];

export function buildCategoryBreakdown(expenses: Expense[], categories: Category[]) {
  if (!categories || !Array.isArray(categories) || !expenses) return [];

  // Sort categories by amount to assign colors predictably based on spending rank
  const breakdown = categories
    .map((category) => {
      const filtered = expenses.filter((expense) => expense.categoryId === category.id);
      return {
        id: category.id,
        name: (category.name || '').trim(),
        amount: filtered.reduce((total, expense) => total + expense.amount, 0),
        count: filtered.length,
        registrations: filtered.map(e => e.amount), // List of individual amounts
      };
    })
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Assign colors from the palette to the active categories
  return breakdown.map((item, index) => ({
    ...item,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

export function buildTrendData(
  expenses: Expense[],
  categories: Category[],
  groups: CategoryGroup[],
  period: 'month' | 'year' = 'month'
) {
  try {
    if (!expenses || !Array.isArray(expenses)) return [];
    const catList = Array.isArray(categories) ? categories : [];
    const groupList = Array.isArray(groups) ? groups : [];

    const buckets = new Map<string, any>();

    for (const expense of expenses) {
      if (!expense || !expense.date || typeof expense.date !== 'string') continue;
      
      const label = period === 'month' ? expense.date.slice(0, 7) : expense.date.slice(0, 4);
      
      const category = catList.find(c => c.id === expense.categoryId);
      // Synchronize series names with the individual category names to match the Pie Chart
      const seriesName = (category?.name || 'Otros').trim();
      const amount = Number(expense.amount) || 0;

      if (!buckets.has(label)) {
        const newRow = Object.create(null);
        newRow.label = label;
        buckets.set(label, newRow);
      }
      
      const row = buckets.get(label);
      row[seriesName] = (row[seriesName] || 0) + amount;
    }

    return Array.from(buckets.values())
      .sort((a: any, b: any) => (a.label || '').localeCompare(b.label || ''));
  } catch (error) {
    console.error('Critical error in buildTrendData:', error);
    return [];
  }
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
