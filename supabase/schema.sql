-- SQL Schema for Personal Finance Pro (Supabase)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. HOUSEHOLDS
CREATE TABLE IF NOT EXISTS public.households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROFILES (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    preferred_locale TEXT DEFAULT 'es',
    currency TEXT DEFAULT 'USD',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. HOUSEHOLD MEMBERS
-- Links users to a household and defines their role (User 1 or User 2)
CREATE TABLE IF NOT EXISTS public.household_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user1', 'user2')),
    income NUMERIC DEFAULT 0,
    investment_pct NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(household_id, user_id),
    UNIQUE(household_id, role) -- Ensure only one user1 and one user2 per household
);

-- 5. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    owner_type TEXT CHECK (owner_type IN ('user1', 'user2', 'shared')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- 8. POLICIES

-- Profiles: Users can only see and edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Households: Users can only see households they are part of
CREATE POLICY "Users can view own households" ON public.households
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.household_members m WHERE m.household_id = id AND m.user_id = auth.uid())
);

-- Members: Users can view members of their own households
CREATE POLICY "Users can view household members" ON public.household_members
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.household_members m WHERE m.household_id = household_members.household_id AND m.user_id = auth.uid())
);

-- Categories: Users can view and manage categories in their household
CREATE POLICY "Users can view household categories" ON public.categories
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.household_members m WHERE m.household_id = categories.household_id AND m.user_id = auth.uid())
);
CREATE POLICY "Users can manage household categories" ON public.categories
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.household_members m WHERE m.household_id = categories.household_id AND m.user_id = auth.uid())
);

-- Expenses: Users can view and manage expenses in their household
CREATE POLICY "Users can view household expenses" ON public.expenses
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.household_members m WHERE m.household_id = expenses.household_id AND m.user_id = auth.uid())
);
CREATE POLICY "Users can manage household expenses" ON public.expenses
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.household_members m WHERE m.household_id = expenses.household_id AND m.user_id = auth.uid())
);

-- 9. FUNCTIONS & TRIGGERS
-- Auto-create profile and household on Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_household_id UUID;
BEGIN
  -- 1. Create Profile
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');

  -- 2. Create personal Household
  INSERT INTO public.households (name)
  VALUES (COALESCE(new.raw_user_meta_data->>'full_name', 'Mi Hogar'))
  RETURNING id INTO new_household_id;

  -- 3. Link user to household as user1
  INSERT INTO public.household_members (household_id, user_id, role)
  VALUES (new_household_id, new.id, 'user1');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
