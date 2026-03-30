import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { DashboardScreen } from '@/components/dashboard-screen';

export default async function DashboardPage() {
  const t = await getTranslations('dashboard');

  return (
    <AppShell title={t('title')} subtitle={t('subtitle')}>
      <DashboardScreen />
    </AppShell>
  );
}
