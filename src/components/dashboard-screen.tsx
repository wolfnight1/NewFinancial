'use client';

import { useLocale, useTranslations } from 'next-intl';
import { BarChart3, PiggyBank, Receipt, Scale } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFinance } from '@/components/finance-provider';
import {
  buildCategoryBreakdown,
  buildDashboardSummary,
  buildMonthlyTrend,
  buildGroupBreakdown,
} from '@/lib/dashboard';
import { formatCurrency, formatLongDate } from '@/lib/format';
import type { AppLocale, ExpenseOwner } from '@/lib/types';

export function DashboardScreen() {
  const t = useTranslations('dashboard');
  const commonT = useTranslations('common');
  const { state, hydrated } = useFinance();
  const locale = useLocale() as AppLocale;

  if (!hydrated) {
    return <LoadingCard label={commonT('loading')} />;
  }

  const summary = buildDashboardSummary(state.settings, state.expenses);
  const categoryBreakdown = buildCategoryBreakdown(state.expenses, state.categories);
  const groupBreakdown = buildGroupBreakdown(state.expenses, state.categories, state.categoryGroups);
  const monthlyTrend = buildMonthlyTrend(state.expenses);
  const ownerLabels: Record<ExpenseOwner, string> = {
    user1: state.settings.primaryUserName,
    user2: state.settings.secondaryUserName,
    shared: t('sharedExpenses'),
  };

  const cards = [
    {
      label: t('totalIncome'),
      value: formatCurrency(summary.totalIncome, locale, state.settings.currency),
      icon: Scale,
    },
    {
      label: t('totalExpenses'),
      value: formatCurrency(summary.totalExpenses, locale, state.settings.currency),
      icon: Receipt,
    },
    {
      label: t('investment'),
      value: formatCurrency(summary.totalInvestment, locale, state.settings.currency),
      icon: PiggyBank,
    },
    {
      label: t('balance'),
      value: formatCurrency(summary.balance, locale, state.settings.currency),
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-[28px] border border-white/10 bg-white/8 p-5 shadow-xl shadow-slate-950/10"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-300">{label}</p>
              <div className="rounded-2xl bg-sky-300/15 p-2 text-sky-200">
                <Icon className="size-4" />
              </div>
            </div>
            <p className="mt-6 text-3xl font-semibold tracking-tight">{value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <article className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">{t('monthlyTrend')}</h2>
            <p className="text-sm text-slate-400">{t('monthlyTrendHint')}</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  formatter={(value: number) =>
                    formatCurrency(value, locale, state.settings.currency)
                  }
                />
                <Bar dataKey="expenses" radius={[12, 12, 0, 0]} fill="#7dd3fc" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
          <h2 className="text-lg font-semibold">{t('byCategory')}</h2>
          <p className="text-sm text-slate-400">{t('categoryHint')}</p>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={4}
                >
                  {categoryBreakdown.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    formatCurrency(value, locale, state.settings.currency)
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3">
            {categoryBreakdown.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}</span>
                </div>
                <span className="text-slate-300">
                  {formatCurrency(entry.amount, locale, state.settings.currency)}
                </span>
              </div>
            ))}
          </div>
        </article>
      </div>

      {/* Budget Progress Section */}
      <section className="mb-6 rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
        <h2 className="text-lg font-semibold mb-5">{useTranslations('settings')('macroCategories')} - {t('balance')}</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groupBreakdown.map((group) => {
            const isOverBudget = group.limit > 0 && group.spent > group.limit;
            return (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-200">{group.name}</span>
                  <span className={isOverBudget ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    {formatCurrency(group.spent, locale, state.settings.currency)} 
                    {group.limit > 0 && ` / ${formatCurrency(group.limit, locale, state.settings.currency)}`}
                  </span>
                </div>
                {group.limit > 0 && (
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full ${
                        isOverBudget ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.4)]'
                      }`}
                      style={{ width: `${Math.min(group.percent, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
          <h2 className="text-lg font-semibold">{t('spendingOwners')}</h2>
          <div className="mt-5 grid gap-3">
            {Object.entries(summary.byOwner).map(([owner, amount]) => (
              <div
                key={owner}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-sm text-slate-400">
                  {ownerLabels[owner as ExpenseOwner]}
                </p>
                <p className="mt-2 text-2xl font-semibold">
                  {formatCurrency(amount, locale, state.settings.currency)}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
          <h2 className="text-lg font-semibold">{t('recentTransactions')}</h2>
          <div className="mt-5 grid gap-3">
            {state.expenses.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
                {t('noData')}
              </p>
            ) : (
              state.expenses.slice(0, 5).map((expense) => {
                const category = state.categories.find(
                  (item) => item.id === expense.categoryId
                );

                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <div>
                      <p className="font-medium">
                        {category?.name ?? expense.categoryId}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {ownerLabels[expense.owner]} •{' '}
                        {formatLongDate(expense.date, locale)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">
                        {formatCurrency(expense.amount, locale, state.settings.currency)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{expense.note}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-10 text-center text-sm text-slate-400">
      {label}
    </div>
  );
}
