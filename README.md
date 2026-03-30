# CoinPilot

Bilingual personal finance app for individuals or couples. The current codebase includes a responsive product shell, dashboard, expense capture, history, settings, and Google auth wiring for Supabase.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS v4
- `next-intl`
- Supabase Auth + Postgres target architecture

## Local Run

1. Install dependencies.
2. Start the development server.

```bash
npm run dev
```

Open `http://localhost:3000`.

Without Supabase env vars, the app still works in demo mode using persisted local browser state.

## Supabase Setup

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

In Supabase Auth, enable Google and add these redirect URLs:

- `http://localhost:3000/auth/callback`
- your production domain callback URL

## Product Blueprint

See [docs/product-blueprint.md](/C:/David/Personal Financial/docs/product-blueprint.md) for the functional summary, architecture, database model, and delivery phases.

## Deployment

This app is ready to deploy on Vercel. Add the same environment variables in the hosting dashboard and configure the matching Google OAuth redirect URL.
