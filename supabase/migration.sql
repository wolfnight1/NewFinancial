ALTER TABLE public.households ADD COLUMN IF NOT EXISTS usage_mode TEXT DEFAULT 'individual';
