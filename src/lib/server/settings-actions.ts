'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { FinanceSettings } from '@/lib/types';

/**
 * Updates financial settings for the current user in their household
 */
export async function updateHouseholdSettings(settings: FinanceSettings) {
  const supabase = await createClient();
  
  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // 2. Get current role to know which name to update
  const { data: member, error: memberSelectError } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .single();

  if (memberSelectError || !member) {
    console.error('Member select error:', memberSelectError);
    return { error: 'No se encontró la información del hogar' };
  }

  // 3. Get all members of this household to update both David and Jenny
  const { data: allMembers } = await supabase
    .from('household_members')
    .select('user_id, role')
    .eq('household_id', member.household_id);

  const u1Member = allMembers?.find(m => m.role === 'user1');
  const u2Member = allMembers?.find(m => m.role === 'user2');

  // 4. Update Profile 1 (David/User1)
  if (u1Member) {
    await supabase.from('profiles').update({
      full_name: settings.primaryUserName,
      preferred_locale: settings.language,
      currency: settings.currency,
      updated_at: new Date().toISOString()
    }).eq('id', u1Member.user_id);

    await supabase.from('household_members').update({
      income: settings.primaryIncome,
      investment_pct: settings.primaryInvestmentPct,
      investment_type: settings.primaryInvestmentType,
      investment_fixed_amount: settings.primaryInvestmentFixed
    }).eq('user_id', u1Member.user_id);
  }

  // 5. Update Profile 2 (Jenny/User2) if in couple mode
  if (settings.mode === 'couple' && u2Member) {
    await supabase.from('profiles').update({
      full_name: settings.secondaryUserName,
      updated_at: new Date().toISOString()
    }).eq('id', u2Member.user_id);

    await supabase.from('household_members').update({
      income: settings.secondaryIncome,
      investment_pct: settings.secondaryInvestmentPct,
      investment_type: settings.secondaryInvestmentType,
      investment_fixed_amount: settings.secondaryInvestmentFixed
    }).eq('user_id', u2Member.user_id);
  }

  // 6. Update household usage mode
  const { error: householdError } = await supabase
    .from('households')
    .update({ usage_mode: settings.mode })
    .eq('id', member.household_id);

  if (householdError) {
    console.error('Error updating household mode:', householdError);
    // Continue even if mode update fails, but log it
  }

  revalidatePath('/', 'layout');
  
  return { success: true };
}

/**
 * Fetches the combined finance settings for the current user and their partner
 */
export async function getFinanceSettings(): Promise<FinanceSettings | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Get current member to find the household
  const { data: currentMember } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .single();

  if (!currentMember) return null;

  // 2. Fetch all required data in one go (Household, all Members, and current Profile)
  const [{ data: household }, { data: members }, { data: profile }] = await Promise.all([
    supabase.from('households').select('*').eq('id', currentMember.household_id).single(),
    supabase.from('household_members').select('*, profiles(full_name)').eq('household_id', currentMember.household_id),
    supabase.from('profiles').select('*').eq('id', user.id).single()
  ]);

  const u1 = members?.find(m => m.role === 'user1');
  const u2 = members?.find(m => m.role === 'user2');

  return {
    mode: (household?.usage_mode as any) || (u2 ? 'couple' : 'individual'),
    primaryUserName: u1?.profiles?.full_name || 'David',
    secondaryUserName: u2?.profiles?.full_name || 'Jenny',
    primaryIncome: Number(u1?.income || 0),
    secondaryIncome: Number(u2?.income || 0),
    primaryInvestmentPct: Number(u1?.investment_pct || 0),
    secondaryInvestmentPct: Number(u2?.investment_pct || 0),
    primaryInvestmentType: (u1?.investment_type as any) || 'percentage',
    secondaryInvestmentType: (u2?.investment_type as any) || 'percentage',
    primaryInvestmentFixed: Number(u1?.investment_fixed_amount || 0),
    secondaryInvestmentFixed: Number(u2?.investment_fixed_amount || 0),
    language: (profile?.preferred_locale as any) || 'es',
    currency: profile?.currency || 'USD'
  };
}
