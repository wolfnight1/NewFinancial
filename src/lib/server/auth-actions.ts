'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import { hasSupabaseEnv } from '@/lib/env';

export async function signInWithGoogle(formData: FormData) {
  const locale = String(formData.get('locale') ?? 'es');

  if (!hasSupabaseEnv()) {
    redirect(`/${locale}/dashboard?demo=1`);
  }

  const requestHeaders = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ??
    requestHeaders.get('origin') ??
    'http://localhost:3000';
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=/${locale}/dashboard`,
    },
  });

  if (error || !data.url) {
    redirect(`/${locale}?error=google-auth`);
  }

  redirect(data.url);
}
