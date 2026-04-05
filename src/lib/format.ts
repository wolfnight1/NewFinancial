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
  if (!value || typeof value !== 'string') return '';
  
  try {
    const date = new Date(`${value}T00:00:00`);
    if (isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(locale === 'es' ? 'es-CO' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', value, error);
    return value;
  }
}
