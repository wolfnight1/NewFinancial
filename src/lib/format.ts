import type { AppLocale } from '@/lib/types';

export function formatCurrency(
  value: number,
  locale: AppLocale,
  currency: string
) {
  return new Intl.NumberFormat(locale === 'es' ? 'es-CO' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatLongDate(value: string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-CO' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}
