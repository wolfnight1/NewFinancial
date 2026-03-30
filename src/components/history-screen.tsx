'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useFinance } from '@/components/finance-provider';
import { formatCurrency, formatLongDate } from '@/lib/format';
import type { AppLocale } from '@/lib/types';

export function HistoryScreen() {
  const t = useTranslations('transactions');
  const { state, hydrated } = useFinance();
  const locale = useLocale() as AppLocale;
  const [query, setQuery] = useState('');

  const filteredExpenses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return state.expenses.filter((expense) => {
      const category = state.categories.find((item) => item.id === expense.categoryId);
      const haystack = `${expense.note} ${category?.name ?? ''}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [query, state.categories, state.expenses]);

  if (!hydrated) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('search')}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300 md:max-w-sm"
      />

      <div className="grid gap-3">
        {filteredExpenses.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
            {t('noResults')}
          </p>
        ) : (
          filteredExpenses.map((expense) => {
            const category = state.categories.find((item) => item.id === expense.categoryId);

            return (
              <article
                key={expense.id}
                className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-medium">{category?.name ?? expense.categoryId}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {expense.note || t('emptyNote')} • {formatLongDate(expense.date, locale)}
                  </p>
                </div>
                <p className="text-lg font-semibold">
                  {formatCurrency(expense.amount, locale, state.settings.currency)}
                </p>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
