-- Invitations System for Personal Finance Pro

-- 1. INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL, -- 6 character code
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS FOR INVITATIONS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create invitations for their household" ON public.invitations
FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.household_members m WHERE m.household_id = household_id AND m.user_id = auth.uid())
);

CREATE POLICY "Users can view invitations for their household" ON public.invitations
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.household_members m WHERE m.household_id = household_id AND m.user_id = auth.uid())
);

-- Anyone can check a code, but we limit output
CREATE POLICY "Public can view invitation codes for join" ON public.invitations
FOR SELECT USING (NOT is_used AND expires_at > NOW());

-- 3. FUNCTION TO JOIN HOUSEHOLD BY CODE
CREATE OR REPLACE FUNCTION public.join_household_params(invite_code TEXT)
RETURNS JSONB AS $$
DECLARE
    target_household_id UUID;
    member_count RECORD;
    result JSONB;
BEGIN
    -- Find invitation
    SELECT household_id INTO target_household_id 
    FROM public.invitations 
    WHERE code = invite_code AND NOT is_used AND expires_at > NOW();

    IF target_household_id IS NULL THEN
        RETURN jsonb_build_object('error', 'Código inválido o expirado');
    END IF;

    -- Check if household is full (max 2)
    SELECT count(*) INTO member_count FROM public.household_members WHERE household_id = target_household_id;

    IF member_count.count >= 2 THEN
        RETURN jsonb_build_object('error', 'Hogar lleno (máximo 2 personas)');
    END IF;

    -- Check if user is already in a household (should we let them join another?)
    -- Most simple logic: Delete their current empty household connection if it's the only member
    -- For now, just add them.

    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES (target_household_id, auth.uid(), 'user2')
    ON CONFLICT (household_id, user_id) DO NOTHING;

    -- Mark invitation as used
    UPDATE public.invitations SET is_used = true WHERE code = invite_code;

    RETURN jsonb_build_object('success', true, 'household_id', target_household_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
