'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useFinance } from '@/components/finance-provider';
import type { AppLocale, ExpenseOwner } from '@/lib/types';

export function ExpenseForm() {
  const t = useTranslations('expense');
  const { state, addExpense, hydrated } = useFinance();
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    owner: 'shared' as ExpenseOwner,
    categoryId: state.categories[0]?.id ?? '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    note: '',
  });

  if (!hydrated) {
    return null;
  }

  return (
    <form
      className="grid gap-5 rounded-[28px] border border-white/10 bg-slate-950/35 p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);

        await addExpense({
          owner: form.owner,
          categoryId: form.categoryId,
          amount: Number(form.amount),
          date: form.date,
          note: form.note.trim(),
        });

        setLoading(false);
        router.push('/dashboard', { locale });
      }}
    >
      <div className="grid gap-2">
        <label className="text-sm text-slate-300">{t('payer')}</label>
        <select
          value={form.owner}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              owner: event.target.value as ExpenseOwner,
            }))
          }
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
        >
          <option value="user1">{state.settings.primaryUserName}</option>
          {state.settings.mode === 'couple' && (
            <option value="user2">{state.settings.secondaryUserName}</option>
          )}
          <option value="shared">{t('shared')}</option>
        </select>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm text-slate-300">{t('category')}</label>
          <select
            value={form.categoryId}
            onChange={(event) =>
              setForm((current) => ({ ...current, categoryId: event.target.value }))
            }
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
          >
            {state.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-300">{t('amount')}</label>
          <input
            required
            min="0"
            step="0.01"
            type="number"
            inputMode="decimal"
            value={form.amount}
            onChange={(event) =>
              setForm((current) => ({ ...current, amount: event.target.value }))
            }
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm text-slate-300">{t('date')}</label>
          <input
            required
            type="date"
            value={form.date}
            onChange={(event) =>
              setForm((current) => ({ ...current, date: event.target.value }))
            }
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm text-slate-300">{t('description')}</label>
          <input
            type="text"
            value={form.note}
            onChange={(event) =>
              setForm((current) => ({ ...current, note: event.target.value }))
            }
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:opacity-50"
      >
        {loading ? '...' : t('save')}
      </button>
    </form>
  );
}
