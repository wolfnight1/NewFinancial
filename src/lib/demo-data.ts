import type { FinanceState } from '@/lib/types';

export const DEFAULT_STATE: FinanceState = {
  settings: {
    mode: 'couple',
    primaryUserName: 'Usuario A',
    secondaryUserName: 'Usuario B',
    primaryIncome: 1000,
    secondaryIncome: 1000,
    primaryInvestmentPct: 10,
    secondaryInvestmentPct: 10,
    primaryInvestmentType: 'percentage',
    secondaryInvestmentType: 'percentage',
    primaryInvestmentFixed: 0,
    secondaryInvestmentFixed: 0,
    language: 'es',
    currency: 'USD',
  },
  categories: [
    { id: 'cat-1', name: 'Categoría 1', color: '#38bdf8' },
    { id: 'cat-2', name: 'Categoría 2', color: '#818cf8' },
    { id: 'cat-3', name: 'Categoría 3', color: '#34d399' },
  ],
  categoryGroups: [
    { id: 'g-1', name: 'Grupo A', color: '#673AB7', budgetLimit: 500 },
    { id: 'g-2', name: 'Grupo B', color: '#4CAF50', budgetLimit: 500 },
  ],
  expenses: [
    {
      id: 'e-1',
      owner: 'shared',
      categoryId: 'cat-1',
      amount: 50,
      date: '2026-01-01',
      note: 'Gasto de ejemplo',
    },
  ],
};
