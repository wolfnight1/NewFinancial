'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

/**
 * Generates a 6-character random code for invitation
 */
function generateRandomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, 0, I, 1 for clarity
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Creates a new invitation code for the user's household
 */
export async function createInvitation() {
  const supabase = await createClient();
  
  // 1. Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 2. Get user's household
  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();

  if (!member) throw new Error('No household found for user');

  // 3. Generate unique code
  const code = generateRandomCode();

  // 4. Insert into DB
  const { data, error } = await supabase
    .from('invitations')
    .insert({
      household_id: member.household_id,
      code,
      created_by: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating invitation:', error);
    return { error: 'No se pudo crear la invitación' };
  }

  revalidatePath('/[locale]/settings', 'page');
  return { success: true, code: data.code };
}

/**
 * Joins a household using an invite code
 */
export async function joinHousehold(code: string) {
  const supabase = await createClient();
  
  // Calling the RPC function defined in SQL
  const { data, error } = await supabase.rpc('join_household_params', {
    invite_code: code.toUpperCase()
  });

  if (error) {
    console.error('Error joining household:', error);
    return { error: 'Error interno al unirse' };
  }

  if (data.error) {
    return { error: data.error };
  }

  revalidatePath('/[locale]', 'layout');
  return { success: true };
}

/**
 * Gets names of members in current household
 */
export async function getHouseholdInfo() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return null;

  const { data: members } = await supabase
    .from('household_members')
    .select(`
      role,
      profiles (full_name, avatar_url)
    `)
    .eq('household_id', member.household_id);

  return {
    householdId: member.household_id,
    members: members?.map(m => ({
      role: m.role,
      name: (m.profiles as any)?.full_name,
      avatar: (m.profiles as any)?.avatar_url
    })) || []
  };
}
