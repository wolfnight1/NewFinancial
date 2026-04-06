import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. Run next-intl middleware first
  const response = intlMiddleware(request);

  // 2. Initialize Supabase client to refresh session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // This will refresh the session if it's expired
  const { data: { user } } = await supabase.auth.getUser();

  // 3. Logic for protecting routes
  // Protected routes: dashboard, expenses, history, settings
  const { pathname } = request.nextUrl;
  
  // Exclude auth routes and public assets
  const isAuthRoute = pathname.includes('/login') || pathname.includes('/auth/');
  const isPublicAsset = pathname.match(/\.(.*)$/) || pathname === '/favicon.ico';
  const isRootRoute = pathname === '/' || pathname === '/es' || pathname === '/en';
  
  if (!user && !isAuthRoute && !isPublicAsset && !isRootRoute) {
    // If not logged in and trying to access a protected route, redirect to login
    // We let them view the root route (landing page) if not logged in.
    const locale = pathname.split('/')[1] || routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (isAuthRoute || isRootRoute)) {
    // If logged in and trying to access login OR the landing page, redirect to dashboard
    const locale = pathname.split('/')[1] || routing.defaultLocale;
    const dashboardUrl = new URL(`/${locale}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  // Match all paths except for static files and next internals
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
