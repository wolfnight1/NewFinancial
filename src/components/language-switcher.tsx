'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import type { AppLocale } from '@/lib/types';

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('settings');

  return (
    <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
      {(['es', 'en'] as const).map((nextLocale) => (
        <button
          key={nextLocale}
          type="button"
          onClick={() => router.replace(pathname, { locale: nextLocale })}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
            locale === nextLocale
              ? 'bg-white text-slate-950'
              : 'text-slate-300 hover:text-white'
          }`}
          aria-label={`${t('language')}: ${nextLocale.toUpperCase()}`}
        >
          {nextLocale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
