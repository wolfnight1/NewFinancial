import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { GoogleLoginForm } from '@/components/google-login-form';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('login');
  const appT = await getTranslations('app');

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.16),_transparent_30%),linear-gradient(180deg,_#08111f_0%,_#10223c_52%,_#172033_100%)] p-6 text-center text-zinc-50">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.04)_50%,transparent_100%)]" />
      <div className="relative max-w-3xl space-y-8 rounded-[32px] border border-white/10 bg-white/6 px-6 py-12 shadow-2xl shadow-cyan-950/30 backdrop-blur sm:px-10">
        <div className="space-y-5">
          <div className="inline-block rounded-full bg-cyan-300/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
            {appT('tagline')}
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">{appT('name')}</h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300 sm:text-xl">{t('subtitle')}</p>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <GoogleLoginForm locale={locale} />
          <Link
            href="/dashboard"
            locale={locale}
            className="w-full rounded-2xl border border-white/10 px-8 py-4 text-base font-semibold text-slate-100 transition hover:bg-white/10 sm:w-auto"
          >
            {t('demo')}
          </Link>
        </div>

        <div className="mx-auto grid max-w-2xl gap-3 text-left sm:grid-cols-3">
          <Feature label={t('featureOne')} />
          <Feature label={t('featureTwo')} />
          <Feature label={t('featureThree')} />
        </div>

        <p className="mx-auto max-w-md text-xs text-slate-500">{t('terms')}</p>
      </div>

      <div className="fixed right-6 top-6 flex gap-4">
        <Link href="/" locale="en" className="text-xs transition-colors hover:text-cyan-300">EN</Link>
        <Link href="/" locale="es" className="text-xs transition-colors hover:text-cyan-300">ES</Link>
      </div>
    </main>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/20 px-4 py-3 text-sm text-slate-200">
      {label}
    </div>
  );
}
