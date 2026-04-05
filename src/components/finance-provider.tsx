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
import type { Category, CategoryGroup, Expense, FinanceSettings, FinanceState } from '@/lib/types';
import { 
  addExpense as dbAddExpense, 
  getExpenses, 
  getCategories, 
  getCategoryGroups,
  upsertCategory as dbUpsertCategory, 
  removeCategory as dbRemoveCategory,
  upsertCategoryGroup as dbUpsertGroup,
  removeCategoryGroup as dbRemoveGroup,
  checkAndInsertFixedExpenses as dbCheckFixed 
} from '@/lib/server/finance-actions';
import { getFinanceSettings, updateHouseholdSettings } from '@/lib/server/settings-actions';

type FinanceContextValue = {
  state: FinanceState;
  hydrated: boolean;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateSettings: (settings: FinanceSettings) => Promise<void>;
  addCategory: (category: Partial<Category>) => Promise<void>;
  removeCategory: (categoryId: string) => Promise<void>;
  upsertCategoryGroup: (group: Partial<CategoryGroup>) => Promise<void>;
  removeCategoryGroup: (groupId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FinanceState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Load initial data from Supabase
  const refresh = async () => {
    try {
      // Run auto-check for fixed expenses
      await dbCheckFixed();

      const [settings, categories, groups, expenses] = await Promise.all([
        getFinanceSettings(),
        getCategories(),
        getCategoryGroups(),
        getExpenses()
      ]);

      setState({
        settings: settings || DEFAULT_STATE.settings,
        categories: categories || [],
        categoryGroups: groups || [],
        expenses: expenses || []
      });
    } catch (error) {
      console.error('Error refreshing finance state:', error);
    } finally {
      setHydrated(true);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo<FinanceContextValue>(
    () => ({
      state,
      hydrated,
      async addExpense(expense) {
        const res = await dbAddExpense(expense);
        if (res.success) {
          await refresh();
        } else {
          alert(res.error || 'Error al guardar el gasto');
        }
      },
      async updateSettings(settings) {
        const res = await updateHouseholdSettings(settings);
        if (res.success) {
          await refresh();
        } else {
          alert(res.error || 'Error al guardar configuración');
        }
      },
      async addCategory(category) {
        const res = await dbUpsertCategory(category);
        if (res.success) {
          await refresh();
        } else {
          alert(res.error || 'Error al guardar categoría');
        }
      },
      async removeCategory(categoryId) {
        const res = await dbRemoveCategory(categoryId);
        if (res.success) {
          await refresh();
        } else {
          alert(res.error || 'Error al eliminar categoría');
        }
      },
      async upsertCategoryGroup(group) {
        const res = await dbUpsertGroup(group);
        if (res.success) {
          await refresh();
        } else {
          alert(res.error || 'Error al guardar grupo');
        }
      },
      async removeCategoryGroup(groupId) {
        const res = await dbRemoveGroup(groupId);
        if (res.success) {
          await refresh();
        } else {
          alert(res.error || 'Error al eliminar grupo');
        }
      },
      refresh
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
