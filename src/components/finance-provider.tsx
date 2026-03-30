'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { DEFAULT_STATE } from '@/lib/demo-data';
import type { Category, Expense, FinanceSettings, FinanceState } from '@/lib/types';

const STORAGE_KEY = 'coinpilot-state-v1';

type FinanceContextValue = {
  state: FinanceState;
  hydrated: boolean;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateSettings: (settings: FinanceSettings) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  removeCategory: (categoryId: string) => void;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const rawState = window.localStorage.getItem(STORAGE_KEY);

      if (rawState) {
        try {
          setState(JSON.parse(rawState) as FinanceState);
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }

      setHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const value = useMemo<FinanceContextValue>(
    () => ({
      state,
      hydrated,
      addExpense(expense) {
        setState((current) => ({
          ...current,
          expenses: [{ ...expense, id: createId('exp') }, ...current.expenses],
        }));
      },
      updateSettings(settings) {
        setState((current) => ({
          ...current,
          settings,
        }));
      },
      addCategory(category) {
        setState((current) => ({
          ...current,
          categories: [...current.categories, { ...category, id: createId('cat') }],
        }));
      },
      removeCategory(categoryId) {
        setState((current) => ({
          ...current,
          categories: current.categories.filter((category) => category.id !== categoryId),
          expenses: current.expenses.filter((expense) => expense.categoryId !== categoryId),
        }));
      },
    }),
    [hydrated, state]
  );

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error('useFinance must be used inside FinanceProvider');
  }

  return context;
}
