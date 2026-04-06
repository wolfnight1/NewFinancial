import type { AppLocale } from '@/lib/types';

export function formatCurrency(
  value: number,
  locale: AppLocale,
  currency: string
) {
  try {
    return new Intl.NumberFormat(locale === 'es' ? 'es-CO' : 'en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch (error) {
    console.error('Error formatting currency:', currency, error);
    return `${currency || ''} ${Number(value || 0).toLocaleString()}`;
  }
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
