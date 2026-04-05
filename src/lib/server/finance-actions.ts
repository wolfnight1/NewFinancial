'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { Expense, Category, CategoryGroup } from '@/lib/types';

/**
 * Adds a new expense to the household
 */
export async function addExpense(expense: Omit<Expense, 'id'>) {
  const supabase = await createClient();
  
  // 1. Get current user's household
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { error: 'No household found' };

  // 2. Insert expense
  const { error } = await supabase
    .from('expenses')
    .insert({
      household_id: member.household_id,
      category_id: expense.categoryId,
      amount: expense.amount,
      owner_type: expense.owner,
      date: expense.date,
      note: expense.note
    });

  if (error) {
    console.error('Error adding expense:', error);
    return { error: 'No se pudo guardar el gasto' };
  }

  revalidatePath('/[locale]/dashboard', 'page');
  revalidatePath('/[locale]/history', 'page');
  return { success: true };
}

/**
 * Deletes an expense
 */
export async function deleteExpense(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting expense:', error);
    return { error: 'No se pudo eliminar el gasto' };
  }

  revalidatePath('/[locale]/dashboard', 'page');
  revalidatePath('/[locale]/history', 'page');
  return { success: true };
}

/**
 * Fetches categories for the current household
 */
export async function getCategories() {
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return categories.map(c => ({
    id: c.id,
    name: c.name,
    color: c.color,
    groupId: c.group_id,
    isFixed: c.is_fixed,
    fixedAmount: c.fixed_amount,
    fixedDay: c.fixed_day
  }));
}

/**
 * Fetches category groups for the current household
 * Seeds defaults if none exist
 */
export async function getCategoryGroups() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return [];

  let { data: groups, error } = await supabase
    .from('category_groups')
    .select('*')
    .eq('household_id', member.household_id)
    .order('name');

  // AUTO-SEED: If no groups exist, create defaults
  if (!groups || groups.length === 0) {
    const defaults = [
      { household_id: member.household_id, name: 'Renta', color: '#673AB7', budget_limit: 3000 },
      { household_id: member.household_id, name: 'Mercado', color: '#4CAF50', budget_limit: 750 },
      { household_id: member.household_id, name: 'Salidas', color: '#E91E63', budget_limit: 600 },
      { household_id: member.household_id, name: 'Servicios / Utilities', color: '#2196F3', budget_limit: 450 },
      { household_id: member.household_id, name: 'Transporte', color: '#00BCD4', budget_limit: 400 },
      { household_id: member.household_id, name: 'Gasolina', color: '#FF9800', budget_limit: 150 },
      { household_id: member.household_id, name: 'Extras', color: '#9C27B0', budget_limit: 100 },
    ];
    
    await supabase.from('category_groups').insert(defaults);
    
    // Fetch again after insert
    const { data: newGroups } = await supabase
      .from('category_groups')
      .select('*')
      .eq('household_id', member.household_id)
      .order('name');
    groups = newGroups;
  }

  if (error) {
    console.error('Error fetching category groups:', error);
    return [];
  }

  return (groups || []).map(g => ({
    id: g.id,
    name: g.name,
    color: g.color,
    budgetLimit: g.budget_limit
  }));
}

/**
 * Fetches expenses for the current household
 */
export async function getExpenses() {
  const supabase = await createClient();
  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }

  return expenses.map(e => ({
    id: e.id,
    owner: e.owner_type,
    categoryId: e.category_id,
    amount: e.amount,
    date: e.date,
    note: e.note || ''
  }));
}

/**
 * Adds or Updates a category
 */
export async function upsertCategory(category: Partial<Category>) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { error: 'No household found' };

  const payload = {
    household_id: member.household_id,
    name: category.name,
    color: category.color,
    group_id: category.groupId,
    is_fixed: category.isFixed || false,
    fixed_amount: category.fixedAmount || 0,
    fixed_day: category.fixedDay || 1
  };

  const { error } = category.id
    ? await supabase.from('categories').update(payload).eq('id', category.id)
    : await supabase.from('categories').insert(payload);

  if (error) {
    console.error('Error upserting category:', error);
    return { error: `Error DB: ${error.message} (${error.code})` };
  }

  revalidatePath('/[locale]/settings', 'page');
  return { success: true };
}

/**
 * Adds or Updates a category group
 */
export async function upsertCategoryGroup(group: Partial<CategoryGroup>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { error: 'No household found' };

  const payload = {
    household_id: member.household_id,
    name: group.name,
    color: group.color,
    budget_limit: group.budgetLimit
  };

  const { error } = group.id 
    ? await supabase.from('category_groups').update(payload).eq('id', group.id)
    : await supabase.from('category_groups').insert(payload);

  if (error) {
    console.error('Error upserting group:', error);
    return { error: 'No se pudo guardar el grupo' };
  }

  revalidatePath('/[locale]/settings', 'page');
  return { success: true };
}

/**
 * Removes a category
 */
export async function removeCategory(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error removing category:', error);
    return { error: 'No se pudo eliminar la categoría' };
  }

  revalidatePath('/[locale]/settings', 'page');
  return { success: true };
}

/**
 * Removes a category group
 */
export async function removeCategoryGroup(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('category_groups').delete().eq('id', id);

  if (error) {
    console.error('Error removing group:', error);
    return { error: 'No se pudo eliminar el grupo' };
  }

  revalidatePath('/[locale]/settings', 'page');
  return { success: true };
}

/**
 * Checks and inserts fixed expenses for the current month
 */
export async function checkAndInsertFixedExpenses() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return;

  // 1. Get fixed categories
  const { data: fixedCategories } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', member.household_id)
    .eq('is_fixed', true);

  if (!fixedCategories || fixedCategories.length === 0) return;

  // 2. Get existing expenses for this month
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { data: existingExpenses } = await supabase
    .from('expenses')
    .select('category_id')
    .eq('household_id', member.household_id)
    .gte('date', firstDay)
    .lte('date', lastDay);

  const existingCategoryIds = new Set(existingExpenses?.map(e => e.category_id) || []);

  // 3. Insert missing ones
  for (const cat of fixedCategories) {
    if (!existingCategoryIds.has(cat.id)) {
      // Handle months with fewer days (e.g., Feb 30th -> Feb 28/29th)
      const lastDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const actualDay = Math.min(cat.fixed_day || 1, lastDayOfCurrentMonth);
      
      const expenseDate = new Date(now.getFullYear(), now.getMonth(), actualDay);
      
      await supabase.from('expenses').insert({
        household_id: member.household_id,
        category_id: cat.id,
        amount: cat.fixed_amount,
        owner_type: 'shared', // Default for fixed
        date: expenseDate.toISOString().split('T')[0],
        note: `Auto: ${cat.name}`
      });
    }
  }

  revalidatePath('/[locale]/dashboard', 'page');
}
