# CoinPilot Blueprint

## Functional Summary

CoinPilot is a bilingual personal finance app for individuals or couples. It tracks personal and shared expenses, editable categories, net income, investment percentages, and basic financial analysis.

## Recommended Stack

- Next.js 16 + React 19 + TypeScript
- Supabase Auth + Postgres
- Tailwind CSS v4
- `next-intl`
- PWA-ready architecture for future Android packaging

## System Architecture

- App Router pages for landing, dashboard, expense capture, history, and settings.
- Client state provider for local demo mode and fast iteration.
- Supabase target backend for auth, persistence, and row-level security.
- Locale routing under `/{locale}`.
- Derived analytics layer for totals, investment amount, balance, category breakdown, and monthly trend.

## Suggested Database Model

```sql
create table households (
  id uuid primary key default gen_random_uuid(),
  mode text not null check (mode in ('individual', 'couple')),
  currency text not null default 'USD',
  language text not null default 'es',
  created_at timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'partner')),
  display_name text not null,
  monthly_income numeric not null default 0,
  investment_pct numeric not null default 0
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  color text not null default '#38bdf8'
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  owner_scope text not null check (owner_scope in ('user1', 'user2', 'shared')),
  category_id uuid not null references categories(id) on delete restrict,
  amount numeric not null check (amount >= 0),
  expense_date date not null,
  note text not null default '',
  created_at timestamptz not null default now()
);
```

## Navigation Flow

1. Login
2. Dashboard
3. Add Expense
4. History
5. Settings

## Delivery Phases

1. Foundation: auth, i18n, layout, design system, typed domain model.
2. MVP: settings, categories, expense capture, dashboard analytics, transaction history.
3. Production data: Supabase schema, protected routes, server actions, RLS, sync.
4. Premium runway: exports, budgets, reminders, subscriptions, mobile packaging.
