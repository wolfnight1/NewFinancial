import { getTranslations } from 'next-intl/server';
import { AppShell } from '@/components/app-shell';
import { ExpenseForm } from '@/components/expense-form';

export default async function ExpensesPage() {
  const t = await getTranslations('expense');

  return (
    <AppShell title={t('title')} subtitle={t('subtitle')}>
      <ExpenseForm />
    </AppShell>
  );
}
