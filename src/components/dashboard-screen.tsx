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
  buildNestedBreakdown,
  CHART_COLORS,
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
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<'groups' | 'establishments'>('groups');
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  if (!hydrated || !state.settings) {
    return <LoadingCard label={commonT('loading')} />;
  }

  const navigateMonth = (direction: number) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction, 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  try {
    const categories = Array.isArray(state.categories) ? state.categories : [];
    const groups = Array.isArray(state.categoryGroups) ? state.categoryGroups : [];
    const expenses = Array.isArray(state.expenses) ? state.expenses : [];

    // Filter expenses for the breakdown charts and summary based on the selected month
    const filteredExpenses = expenses.filter(e => e.date.startsWith(selectedMonth));

    const summary = buildDashboardSummary(state.settings, filteredExpenses);
    const categoryBreakdown = buildCategoryBreakdown(filteredExpenses, categories);
    const groupBreakdown = buildGroupBreakdown(filteredExpenses, categories, groups);
    
    const monthlyTrend = buildTrendData(expenses, categories, groups, trendPeriod);
    const nestedBreakdown = buildNestedBreakdown(filteredExpenses, categories, groups);
    
    // Choose data for Pie Chart based on viewMode
    const pieData = viewMode === 'groups' 
      ? nestedBreakdown.map(g => ({ id: g.id, name: g.name, amount: g.amount, color: g.color }))
      : categoryBreakdown;
    
    // Formatter for the selected month label
    const [selYear, selMonth] = selectedMonth.split('-').map(Number);
    const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
        .format(new Date(selYear, selMonth - 1));

    // Map of ALL category/group names to their assigned colors
    const seriesMetaData = Object.create(null) as Record<string, string>;
    seriesMetaData['Otros'] = '#94a3b8';

    // 1. Assign colors from groups (Macro Categories)
    groups.forEach(g => { 
      if (g?.name) seriesMetaData[g.name.trim()] = g.color || '#94a3b8'; 
    });

    // 2. Assign colors from the active category breakdown to ensure 1:1 match with Pie Chart
    categoryBreakdown.forEach((item: any) => {
      if (item.name) seriesMetaData[item.name.trim()] = item.color;
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-2">
          <div className="flex items-center gap-4 rounded-[20px] border border-white/10 bg-white/5 p-1.5 px-4 shadow-lg shadow-black/20">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1 px-2 text-slate-400 hover:text-sky-300 transition-colors"
            >
              <span className="text-2xl font-light">&lsaquo;</span>
            </button>
            <div className="flex flex-col items-center min-w-32">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">
                Mes en pantalla
              </span>
              <span className="text-sm font-bold uppercase tracking-widest text-sky-200">
                {monthLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1 px-2 text-slate-400 hover:text-sky-300 transition-colors"
            >
              <span className="text-2xl font-light">&rsaquo;</span>
            </button>
          </div>
        </div>

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
                    content={
                      <CustomChartTooltip 
                        currency={state.settings.currency} 
                        locale={locale} 
                      />
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
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {viewMode === 'groups' ? t('byGroup') : t('byCategory')}
                </h2>
                <p className="text-sm text-slate-400">{t('categoryHint')}</p>
              </div>
              <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
                {(['groups', 'establishments'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase transition ${
                      viewMode === mode
                        ? 'bg-sky-300 text-slate-950 shadow-lg shadow-sky-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode === 'groups' ? 'Grupos' : 'Stores'}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {pieData.map((entry: any) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <CustomChartTooltip 
                        currency={state.settings.currency} 
                        locale={locale} 
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3">
              {viewMode === 'groups' ? (
                nestedBreakdown.map((group) => (
                  <div key={group.id} className="space-y-2">
                    {/* Level 1: Group Row */}
                    <div 
                      onClick={() => toggleGroupExpansion(group.id)}
                      className={`flex items-center justify-between text-sm p-2 rounded-xl cursor-pointer transition-all duration-300 ${
                        expandedGroups.includes(group.id) ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`size-3 rounded-full transition-transform duration-300 ${expandedGroups.includes(group.id) ? 'scale-125' : ''}`}
                          style={{ backgroundColor: group.color }}
                        />
                        <span className={expandedGroups.includes(group.id) ? 'font-bold text-white' : 'font-medium'}>
                          {group.name}
                        </span>
                      </div>
                      <span className="text-slate-300 font-bold">
                        {formatCurrency(group.amount, locale, state.settings.currency)}
                      </span>
                    </div>

                    {/* Level 2: Establishments (Indented) */}
                    {expandedGroups.includes(group.id) && group.establishments.map((est) => (
                      <div key={est.id} className="ml-6 space-y-1 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div 
                          onClick={() => toggleCategoryExpansion(est.id)}
                          className={`flex items-center justify-between text-[13px] p-2 rounded-lg cursor-pointer transition-all ${
                            expandedCategories.includes(est.id) ? 'bg-white/5' : 'hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full" style={{ backgroundColor: est.color }} />
                            <span className={expandedCategories.includes(est.id) ? 'text-sky-200' : 'text-slate-300'}>
                              {est.name}
                            </span>
                          </div>
                          <span className="text-slate-400 font-medium">
                            {formatCurrency(est.amount, locale, state.settings.currency)}
                          </span>
                        </div>

                        {/* Level 3: Transactions (Date + Amount) */}
                        {expandedCategories.includes(est.id) && (
                          <div className="ml-4 pb-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            {est.transactions.map((tx) => (
                              <div key={tx.id} className="flex items-center justify-between text-[11px] px-3 py-1 bg-white/5 rounded-md border-l border-white/10">
                                <span className="text-slate-500">{tx.date}</span>
                                <span className="text-slate-300 font-medium">
                                  {formatCurrency(tx.amount, locale, state.settings.currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                categoryBreakdown.map((entry: any) => (
                  <div 
                    key={entry.id} 
                    onClick={() => setSelectedCategoryId(selectedCategoryId === entry.id ? null : entry.id)}
                    className={`flex items-center justify-between text-sm p-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedCategoryId === entry.id ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`size-3 rounded-full transition-transform duration-300 ${selectedCategoryId === entry.id ? 'scale-125 shadow-[0_0_8px_rgba(255,255,255,0.4)]' : ''}`}
                        style={{ backgroundColor: entry.color }}
                      />
                      <div className="flex flex-col">
                        <span className={selectedCategoryId === entry.id ? 'font-semibold text-white' : ''}>
                          {entry.name}
                        </span>
                        {selectedCategoryId === entry.id && (
                          <div className="mt-2 space-y-1 animate-in fade-in slide-in-from-top-1">
                            <span className="text-[10px] text-sky-300 block mb-2">
                              {entry.count} {entry.count === 1 ? 'registro' : 'registros'} este mes:
                            </span>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              {entry.registrations?.map((amt: number, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-[11px] text-slate-400">
                                  <span className="font-medium text-slate-500">{i + 1}.</span>
                                  <span>{formatCurrency(amt, locale, state.settings.currency)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`text-slate-300 ${selectedCategoryId === entry.id ? 'font-bold text-sky-200' : ''}`}>
                      {formatCurrency(entry.amount, locale, state.settings.currency)}
                    </span>
                  </div>
                ))
              )}
              
              {pieData.length > 0 && (
                <div className="mt-2 pt-3 flex items-center justify-between text-sm font-semibold border-t border-white/10">
                  <span>{t('totalExpenses')}</span>
                  <span className="text-slate-200">
                    {formatCurrency(
                      pieData.reduce((sum: number, entry: any) => sum + entry.amount, 0),
                      locale,
                      state.settings.currency
                    )}
                  </span>
                </div>
              )}
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

function CustomChartTooltip({ active, payload, label, currency, locale }: any) {
  if (active && payload && payload.length) {
    // If it's a Pie chart, label might be undefined but name is in payload
    const title = label || payload[0].payload?.name || payload[0].name;

    return (
      <div className="max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md scrollbar-hide select-none transition-all duration-300">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          {title}
        </p>
        <div className="space-y-2.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-slate-300">{entry.name}:</span>
              </div>
              <span className="font-bold text-white">
                {formatCurrency(entry.value, locale, currency)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

function LoadingCard({ label }: { label: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-10 text-center text-sm text-slate-400">
      {label}
    </div>
  );
}
