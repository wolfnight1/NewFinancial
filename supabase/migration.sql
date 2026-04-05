ALTER TABLE public.households ADD COLUMN IF NOT EXISTS usage_mode TEXT DEFAULT 'individual';

-- Enable RLS on category_groups
ALTER TABLE public.category_groups ENABLE ROW LEVEL SECURITY;

-- Allow all for house members
CREATE POLICY "Users can manage own household groups" ON public.category_groups
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.household_members m WHERE m.household_id = category_groups.household_id AND m.user_id = auth.uid())
);
