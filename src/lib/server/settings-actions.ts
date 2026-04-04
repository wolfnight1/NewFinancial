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

  // 2. Update user profile (name, language, currency)
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: settings.primaryUserName,
      preferred_locale: settings.language,
      currency: settings.currency,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (profileError) {
    console.error('Error updating profile:', profileError);
    return { error: 'No se pudo actualizar el perfil' };
  }

  // 3. Update household member settings (income, investment %)
  const { data: member } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .single();

  if (!member) return { error: 'No household found' };

  const isUser1 = member.role === 'user1';

  // Update current user's financial data
  const { error: memberError } = await supabase
    .from('household_members')
    .update({
      income: isUser1 ? settings.primaryIncome : settings.secondaryIncome,
      investment_pct: isUser1 ? settings.primaryInvestmentPct : settings.secondaryInvestmentPct
    })
    .eq('user_id', user.id);

  if (memberError) {
    console.error('Error updating member financial data:', memberError);
    return { error: 'No se pudo actualizar la info financiera' };
  }

  revalidatePath('/[locale]/settings', 'page');
  revalidatePath('/[locale]/dashboard', 'page');
  
  return { success: true };
}

/**
 * Fetches the combined finance settings for the current user and their partner
 */
export async function getFinanceSettings(): Promise<FinanceSettings | null> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // 1. Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // 2. Get members of the household
  const { data: currentMember } = await supabase
    .from('household_members')
    .select('household_id, role')
    .eq('user_id', user.id)
    .single();

  if (!currentMember) return null;

  const { data: members } = await supabase
    .from('household_members')
    .select(`
      role, income, investment_pct,
      profiles (full_name)
    `)
    .eq('household_id', currentMember.household_id);

  const u1 = members?.find(m => m.role === 'user1');
  const u2 = members?.find(m => m.role === 'user2');

  return {
    mode: u2 ? 'couple' : 'individual',
    primaryUserName: u1?.profiles && (u1.profiles as any).full_name || 'User 1',
    secondaryUserName: u2?.profiles && (u2.profiles as any).full_name || 'User 2',
    primaryIncome: Number(u1?.income || 0),
    secondaryIncome: Number(u2?.income || 0),
    primaryInvestmentPct: Number(u1?.investment_pct || 0),
    secondaryInvestmentPct: Number(u2?.investment_pct || 0),
    language: (profile?.preferred_locale as any) || 'es',
    currency: profile?.currency || 'USD'
  };
}
