import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { SettingsForm } from '@/components/settings-form';

export default async function SettingsPage() {
  const t = await getTranslations('settings');

  return (
    <AppShell title={t('title')} subtitle={t('subtitle')}>
      <SettingsForm />
    </AppShell>
  );
}
