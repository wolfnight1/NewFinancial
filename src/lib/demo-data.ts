import type { FinanceState } from '@/lib/types';

export const DEFAULT_STATE: FinanceState = {
  settings: {
    mode: 'couple',
    primaryUserName: 'Alex',
    secondaryUserName: 'Sam',
    primaryIncome: 3200,
    secondaryIncome: 2800,
    primaryInvestmentPct: 12,
    secondaryInvestmentPct: 15,
    language: 'es',
    currency: 'USD',
  },
  categories: [
    { id: 'rent', name: 'Housing', color: '#f97316' },
    { id: 'groceries', name: 'Groceries', color: '#22c55e' },
    { id: 'transport', name: 'Transport', color: '#0ea5e9' },
    { id: 'fun', name: 'Fun', color: '#eab308' },
    { id: 'health', name: 'Health', color: '#ef4444' },
  ],
  expenses: [
    {
      id: 'exp-1',
      owner: 'shared',
      categoryId: 'rent',
      amount: 1450,
      date: '2026-03-01',
      note: 'Monthly rent',
    },
    {
      id: 'exp-2',
      owner: 'user1',
      categoryId: 'transport',
      amount: 86,
      date: '2026-03-08',
      note: 'Gas refill',
    },
    {
      id: 'exp-3',
      owner: 'user2',
      categoryId: 'health',
      amount: 64,
      date: '2026-03-14',
      note: 'Medicine',
    },
    {
      id: 'exp-4',
      owner: 'shared',
      categoryId: 'groceries',
      amount: 212,
      date: '2026-03-19',
      note: 'Weekly market',
    },
    {
      id: 'exp-5',
      owner: 'user1',
      categoryId: 'fun',
      amount: 58,
      date: '2026-03-22',
      note: 'Movie night',
    },
  ],
};
