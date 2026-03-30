'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useFinance } from '@/components/finance-provider';
import type { AppLocale, FinanceSettings } from '@/lib/types';

export function SettingsForm() {
  const t = useTranslations('settings');
  const commonT = useTranslations('common');
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const { state, hydrated, updateSettings, addCategory, removeCategory } = useFinance();
  const [categoryName, setCategoryName] = useState('');
  const [form, setForm] = useState<FinanceSettings>(state.settings);

  if (!hydrated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-6 rounded-[28px] border border-white/10 bg-slate-950/35 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          updateSettings(form);

          if (form.language !== locale) {
            router.replace('/settings', { locale: form.language });
          }
        }}
      >
        <section className="grid gap-5">
          <div>
            <h2 className="text-lg font-semibold">{t('profile')}</h2>
            <p className="text-sm text-slate-400">{t('profileHint')}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label={t('displayName')}
              value={form.primaryUserName}
              onChange={(value) =>
                setForm((current) => ({ ...current, primaryUserName: value }))
              }
            />
            <Field
              label={t('partnerName')}
              value={form.secondaryUserName}
              onChange={(value) =>
                setForm((current) => ({ ...current, secondaryUserName: value }))
              }
              disabled={form.mode === 'individual'}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-300">{t('mode')}</label>
            <select
              value={form.mode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  mode: event.target.value as FinanceSettings['mode'],
                }))
              }
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
            >
              <option value="individual">{t('individual')}</option>
              <option value="couple">{t('couple')}</option>
            </select>
          </div>
        </section>

        <section className="grid gap-5">
          <div>
            <h2 className="text-lg font-semibold">{t('financial')}</h2>
            <p className="text-sm text-slate-400">{t('financialHint')}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <NumberField
              label={t('income')}
              value={form.primaryIncome}
              onChange={(value) =>
                setForm((current) => ({ ...current, primaryIncome: value }))
              }
            />
            <NumberField
              label={t('partnerIncome')}
              value={form.secondaryIncome}
              onChange={(value) =>
                setForm((current) => ({ ...current, secondaryIncome: value }))
              }
              disabled={form.mode === 'individual'}
            />
            <NumberField
              label={t('investmentPct')}
              value={form.primaryInvestmentPct}
              onChange={(value) =>
                setForm((current) => ({ ...current, primaryInvestmentPct: value }))
              }
            />
            <NumberField
              label={t('partnerInvestmentPct')}
              value={form.secondaryInvestmentPct}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  secondaryInvestmentPct: value,
                }))
              }
              disabled={form.mode === 'individual'}
            />
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm text-slate-300">{t('language')}</label>
            <select
              value={form.language}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  language: event.target.value as AppLocale,
                }))
              }
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
            >
              <option value="es">{t('spanish')}</option>
              <option value="en">{t('english')}</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-300">{t('currency')}</label>
            <select
              value={form.currency}
              onChange={(event) =>
                setForm((current) => ({ ...current, currency: event.target.value }))
              }
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
            >
              <option value="USD">USD</option>
              <option value="COP">COP</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </section>

        <button
          type="submit"
          className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
        >
          {t('save')}
        </button>
      </form>

      <section className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">{t('categories')}</h2>
          <p className="text-sm text-slate-400">{t('categoriesHint')}</p>
        </div>

        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();

            if (!categoryName.trim()) {
              return;
            }

            addCategory({
              name: categoryName.trim(),
              color: '#38bdf8',
            });
            setCategoryName('');
          }}
        >
          <input
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder={t('categoryName')}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
          />
          <button
            type="submit"
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
          >
            {t('addCategory')}
          </button>
        </form>

        <div className="mt-5 grid gap-3">
          {state.categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <span>{category.name}</span>
              </div>

              <button
                type="button"
                onClick={() => removeCategory(category.id)}
                className="text-sm text-rose-300 transition hover:text-rose-200"
              >
                {commonT('delete')}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm text-slate-300">{label}</label>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300 disabled:opacity-50"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm text-slate-300">{label}</label>
      <input
        min="0"
        step="1"
        type="number"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300 disabled:opacity-50"
      />
    </div>
  );
}
