'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Landmark, LayoutDashboard, List, Settings, Wallet } from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';
import { LanguageSwitcher } from '@/components/language-switcher';
import type { AppLocale } from '@/lib/types';

const NAV_ITEMS = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/expenses', key: 'addExpense', icon: Wallet },
  { href: '/history', key: 'transactions', icon: List },
  { href: '/settings', key: 'settings', icon: Settings },
] as const;

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const t = useTranslations('nav');
  const appT = useTranslations('app');
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_32%),linear-gradient(180deg,_#08111f_0%,_#0f172a_48%,_#172033_100%)] text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sky-200">
              <div className="rounded-2xl bg-sky-400/15 p-2">
                <Landmark className="size-5" />
              </div>
              <span className="text-sm font-semibold uppercase tracking-[0.25em]">
                {appT('name')}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-300">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/"
              locale={locale}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              {t('logout')}
            </Link>
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-white/10 bg-slate-950/35 p-3 backdrop-blur">
            <nav className="grid gap-2">
              {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
                const active = pathname.endsWith(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    locale={locale}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      active
                        ? 'bg-sky-300 text-slate-950'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="size-4" />
                    {t(key)}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-10 px-4 pb-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                © 2026 <a href="https://www.dshaytech.com" target="_blank" rel="noopener noreferrer" className="hover:text-sky-300 underline underline-offset-2">DshayTech</a>
              </p>
              <p className="mt-1 text-[10px] text-slate-600 font-medium">
                Version V0.15
              </p>
            </div>
          </aside>

          <section className="space-y-6">{children}</section>
        </div>
      </div>
    </div>
  );
}
