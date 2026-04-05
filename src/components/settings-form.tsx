'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useFinance } from '@/components/finance-provider';
import type { AppLocale, FinanceSettings } from '@/lib/types';
import { HouseholdSection } from '@/components/household-section';

export function SettingsForm() {
  const t = useTranslations('settings');
  const commonT = useTranslations('common');
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const { state, hydrated, updateSettings, addCategory, removeCategory, upsertCategoryGroup, removeCategoryGroup } = useFinance();
  const [categoryName, setCategoryName] = useState('');
  const [categoryGroupId, setCategoryGroupId] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [fixedAmount, setFixedAmount] = useState(0);
  const [fixedDay, setFixedDay] = useState(1);
  
  const [groupName, setGroupName] = useState('');
  const [groupLimit, setGroupLimit] = useState(0);

  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [form, setForm] = useState<FinanceSettings>(state.settings);

  if (!hydrated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-6 rounded-[28px] border border-white/10 bg-slate-950/35 p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          await updateSettings(form);
          setLoading(false);

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
            {/* User 1 Investment */}
            <div className="grid gap-3">
              <label className="text-sm text-slate-300">{t('investmentType')} (U1)</label>
              <select
                value={form.primaryInvestmentType}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    primaryInvestmentType: e.target.value as 'percentage' | 'fixed',
                  }))
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
              >
                <option value="percentage">{t('percentage')}</option>
                <option value="fixed">{t('fixed')}</option>
              </select>
              {form.primaryInvestmentType === 'percentage' ? (
                <NumberField
                  label={t('investmentPct')}
                  value={form.primaryInvestmentPct}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, primaryInvestmentPct: value }))
                  }
                />
              ) : (
                <NumberField
                  label={t('investmentFixed')}
                  value={form.primaryInvestmentFixed}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, primaryInvestmentFixed: value }))
                  }
                />
              )}
            </div>

            {/* User 2 Investment */}
            <div className="grid gap-3">
              <label className="text-sm text-slate-300">{t('investmentType')} (U2)</label>
              <select
                disabled={form.mode === 'individual'}
                value={form.secondaryInvestmentType}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    secondaryInvestmentType: e.target.value as 'percentage' | 'fixed',
                  }))
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300 disabled:opacity-50"
              >
                <option value="percentage">{t('percentage')}</option>
                <option value="fixed">{t('fixed')}</option>
              </select>
              {form.secondaryInvestmentType === 'percentage' ? (
                <NumberField
                  label={t('partnerInvestmentPct')}
                  disabled={form.mode === 'individual'}
                  value={form.secondaryInvestmentPct}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, secondaryInvestmentPct: value }))
                  }
                />
              ) : (
                <NumberField
                  label={t('investmentFixed')}
                  disabled={form.mode === 'individual'}
                  value={form.secondaryInvestmentFixed}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, secondaryInvestmentFixed: value }))
                  }
                />
              )}
            </div>
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
              <option value="CAD">CAD</option>
              <option value="COP">COP</option>
            </select>
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:opacity-50"
        >
          {loading ? '...' : t('save')}
        </button>
      </form>

      <HouseholdSection />

      {/* Macro Categories Section */}
      <section className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">{t('macroCategories')}</h2>
          <p className="text-sm text-slate-400">{t('macroCategoriesHint')}</p>
        </div>

        <form
          className="grid gap-3 sm:grid-cols-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!groupName.trim() || groupLoading) return;

            setGroupLoading(true);
            await upsertCategoryGroup({
              name: groupName.trim(),
              color: '#607D8B',
              budgetLimit: groupLimit,
            });
            setGroupName('');
            setGroupLimit(0);
            setGroupLoading(false);
          }}
        >
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder={t('groupName')}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
          />
          <input
            type="number"
            value={groupLimit}
            onChange={(e) => setGroupLimit(Number(e.target.value))}
            placeholder={t('budgetLimit')}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
          />
          <button
            type="submit"
            disabled={groupLoading}
            className="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
          >
            {groupLoading ? '...' : t('addMacroCategory')}
          </button>
        </form>

        <div className="mt-5 grid gap-3">
          {state.categoryGroups.map((group) => (
            <div
              key={group.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{group.name}</span>
                <span className="text-xs text-slate-400">
                  (Limit: {state.settings.currency} {group.budgetLimit})
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeCategoryGroup(group.id)}
                className="text-sm text-rose-300 transition hover:text-rose-200"
              >
                {commonT('delete')}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Establishments Section */}
      <section className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">{t('establishments')}</h2>
          <p className="text-sm text-slate-400">{t('establishmentsHint')}</p>
        </div>

        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!categoryName.trim() || categoryLoading) return;

            setCategoryLoading(true);
            await addCategory({
              name: categoryName.trim(),
              color: '#38bdf8',
              groupId: categoryGroupId || undefined,
              isFixed,
              fixedAmount,
              fixedDay,
            });
            setCategoryName('');
            setIsFixed(false);
            setFixedAmount(0);
            setCategoryLoading(false);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder={t('categoryName')}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
            />
            <select
              value={categoryGroupId}
              onChange={(e) => setCategoryGroupId(e.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
            >
              <option value="">{t('selectGroup')}</option>
              {state.categoryGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <label className="flex flex-1 items-center gap-3 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
                className="size-4 accent-sky-400"
              />
              {t('isFixed')}
            </label>
            {isFixed && (
              <>
                <input
                  type="number"
                  placeholder={t('fixedAmount')}
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(Number(e.target.value))}
                  className="w-24 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs outline-none"
                />
                <input
                  type="number"
                  placeholder="Day"
                  min="1"
                  max="31"
                  value={fixedDay}
                  onChange={(e) => setFixedDay(Number(e.target.value))}
                  className="w-16 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs outline-none"
                />
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={categoryLoading}
            className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:opacity-50"
          >
            {categoryLoading ? '...' : t('addCategory')}
          </button>
        </form>

        <div className="mt-5 grid gap-3">
          {state.categories.map((category) => {
            const group = state.categoryGroups.find((g) => g.id === category.groupId);
            return (
              <div
                key={category.id}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {group?.name || 'No Group'}
                    </span>
                  </div>
                  {category.isFixed && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                      Fixed: {state.settings.currency} {category.fixedAmount} (Day {category.fixedDay})
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeCategory(category.id)}
                  className="text-sm text-rose-300 transition hover:text-rose-200 self-end sm:self-auto"
                >
                  {commonT('delete')}
                </button>
              </div>
            );
          })}
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
