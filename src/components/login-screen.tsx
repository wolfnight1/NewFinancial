'use client';

import { useTranslations } from 'next-intl';
import { Landmark, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase-browser';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

export function LoginScreen() {
  const t = useTranslations('login');
  const appT = useTranslations('app');
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const locale = params?.locale as string ?? 'es';

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const isNative = Capacitor.isNativePlatform();
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: isNative,
          redirectTo: `${window.location.origin}/${locale}/auth/callback`,
        },
      });

      if (error) {
        console.error('Error logging in:', error.message);
        setLoading(false);
        return;
      }

      if (isNative && data?.url) {
        await Browser.open({ url: data.url });
        setLoading(false);
      }
    } catch (err) {
      console.error('Unexpected error during login:', err);
      setLoading(false);
    }
  };

  const features = [
    { icon: Users, text: t('featureOne') },
    { icon: TrendingUp, text: t('featureTwo') },
    { icon: ShieldCheck, text: t('featureThree') },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.15),_transparent_40%),linear-gradient(180deg,_#08111f_0%,_#0f172a_100%)] p-6 text-slate-50">
      <div className="w-full max-w-md space-y-8 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex items-center gap-3 text-sky-300">
            <div className="rounded-2xl bg-sky-400/20 p-3 shadow-lg shadow-sky-400/10">
              <Landmark className="size-8" />
            </div>
            <span className="text-xl font-bold uppercase tracking-[0.3em]">
              {appT('name')}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            {t('subtitle')}
          </p>
        </div>

        <div className="space-y-4 py-4">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 text-sm text-slate-200">
              <div className="rounded-xl bg-sky-400/10 p-2 text-sky-400">
                <feature.icon className="size-5" />
              </div>
              <p>{feature.text}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-slate-950 transition-all hover:bg-sky-50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          >
            <svg className="size-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {loading ? '...' : t('google')}
          </button>

          <p className="px-8 text-center text-xs leading-relaxed text-slate-500">
            {t('terms')}
          </p>
        </div>
      </div>
    </div>
  );
}
