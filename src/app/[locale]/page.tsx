import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

export default function LandingPage() {
  const t = useTranslations('login');
  const appT = useTranslations('app');

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-zinc-950 text-zinc-50">
      <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="space-y-4">
          <div className="inline-block px-3 py-1 text-xs font-semibold tracking-wider text-emerald-400 uppercase bg-emerald-400/10 rounded-full">
            {appT('tagline')}
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
            {appT('name')}
          </h1>
          <p className="text-lg text-zinc-400 sm:text-xl max-w-lg mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="w-full sm:w-auto px-8 py-4 bg-zinc-50 text-zinc-950 font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 shadow-xl shadow-white/5">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {t('google')}
          </button>
        </div>

        <p className="text-xs text-zinc-500 max-w-xs mx-auto">
          {t('terms')}
        </p>
      </div>

      <div className="fixed top-6 right-6 flex gap-4">
        <Link href="/" locale="en" className="text-xs hover:text-emerald-400 transition-colors">EN</Link>
        <Link href="/" locale="es" className="text-xs hover:text-emerald-400 transition-colors">ES</Link>
      </div>
    </main>
  );
}
