'use client';

import { useMemo, useState } from 'react';
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
  buildTrendData,
  buildGroupBreakdown,
} from '@/lib/dashboard';
import { formatCurrency, formatLongDate } from '@/lib/format';
import type { AppLocale, ExpenseOwner } from '@/lib/types';

export function DashboardScreen() {
  const settingsT = useTranslations('settings');
  const t = useTranslations('dashboard');
  const commonT = useTranslations('common');
  const { state, hydrated } = useFinance();
  const locale = useLocale() as AppLocale;

  const [trendPeriod, setTrendPeriod] = useState<'month' | 'year'>('month');

  if (!hydrated || !state.settings) {
    return <LoadingCard label={commonT('loading')} />;
  }

  try {
    const categories = Array.isArray(state.categories) ? state.categories : [];
    const groups = Array.isArray(state.categoryGroups) ? state.categoryGroups : [];
    const expenses = Array.isArray(state.expenses) ? state.expenses : [];

    const summary = buildDashboardSummary(state.settings, expenses);
    const categoryBreakdown = buildCategoryBreakdown(expenses, categories);
    const groupBreakdown = buildGroupBreakdown(expenses, categories, groups);
    
    const monthlyTrend = buildTrendData(expenses, categories, groups, trendPeriod);

    // Map of ALL category/group names to their defined colors for the chart series
    const seriesMetaData = Object.create(null) as Record<string, string>;
    seriesMetaData['Otros'] = '#94a3b8';

    groups.forEach(g => { 
      if (g?.name) seriesMetaData[g.name.trim()] = g.color || '#94a3b8'; 
    });
    categories.forEach(c => { 
      if (c?.name) seriesMetaData[c.name.trim()] = c.color || '#94a3b8'; 
    });

    // Extract all unique series names present in the data rows (excluding the 'label' key)
    const activeSeries: string[] = [];
    const seriesSet = new Set<string>();
    monthlyTrend.forEach((row: any) => {
      Object.keys(row).forEach(key => {
        if (key !== 'label' && typeof row[key] === 'number' && row[key] > 0) seriesSet.add(key);
      });
    });
    seriesSet.forEach(s => activeSeries.push(s));

    const ownerLabels: Record<ExpenseOwner, string> = {
      user1: state.settings.primaryUserName || 'User 1',
      user2: state.settings.secondaryUserName || 'User 2',
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
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">{t('monthlyTrend')}</h2>
                <p className="text-sm text-slate-400">{t('monthlyTrendHint')}</p>
              </div>
              <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
                {(['month', 'year'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setTrendPeriod(p)}
                    className={`rounded-lg px-4 py-1.5 text-xs font-medium transition ${
                      trendPeriod === p
                        ? 'bg-sky-300 text-slate-950 shadow-lg shadow-sky-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p === 'month' ? 'Mensual' : 'Anual'}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend} barGap={4} barSize={24}>
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: 'rgba(255, 255, 255, 0.1)', 
                      borderRadius: '16px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)'
                    }}
                    itemStyle={{ fontSize: '12px' }}
                    formatter={(value: number) =>
                      formatCurrency(value, locale, state.settings.currency)
                    }
                  />
                  {activeSeries.map((seriesName) => (
                    <Bar 
                      key={seriesName} 
                      dataKey={seriesName} 
                      fill={seriesMetaData[seriesName] || '#94a3b8'} 
                      radius={[4, 4, 0, 0]} 
                    />
                  ))}
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
                    {categoryBreakdown.map((entry: any) => (
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
              {categoryBreakdown.map((entry: any) => (
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
          <h2 className="text-lg font-semibold mb-5">{settingsT('macroCategories')} - {t('balance')}</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groupBreakdown.map((group: any) => {
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
                    {formatCurrency(amount as number, locale, state.settings.currency)}
                  </p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
            <h2 className="text-lg font-semibold">{t('recentTransactions')}</h2>
            <div className="mt-5 grid gap-3">
              {expenses.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
                  {t('noData')}
                </p>
              ) : (
                expenses.slice(0, 5).map((expense: any) => {
                  const category = categories.find(
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
                          {ownerLabels[expense.owner as ExpenseOwner] || expense.owner} •{' '}
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
  } catch (error) {
    console.error('Critical Dashboard Render Error:', error);
    return <LoadingCard label="Hubo un error al cargar tus datos. Por favor revisa tu configuración." />;
  }
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-10 text-center text-sm text-slate-400">
      {label}
    </div>
  );
}
