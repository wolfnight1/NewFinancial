import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { HistoryScreen } from '@/components/history-screen';

export default async function HistoryPage() {
  const t = await getTranslations('transactions');

  return (
    <AppShell title={t('title')} subtitle={t('subtitle')}>
      <HistoryScreen />
    </AppShell>
  );
}
