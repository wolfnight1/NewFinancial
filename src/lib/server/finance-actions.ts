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

  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Deletes an expense
 */
export async function deleteExpense(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { error: 'No household found' };

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('household_id', member.household_id);

  if (error) {
    console.error('Error deleting expense:', error);
    return { error: 'No se pudo eliminar el gasto' };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Fetches categories for the current household
 */
export async function getCategories() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return [];

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('household_id', member.household_id)
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return [];

  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('household_id', member.household_id)
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
  
  // DUPLICATE CHECK: Prevent creating/renaming to an existing establishment name
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('household_id', member.household_id)
    .ilike('name', category.name?.trim() || '')
    .maybeSingle();

  if (existing && existing.id !== category.id) {
    return { error: `Ya existe un establecimiento llamado "${category.name}". Por favor usa un nombre diferente.` };
  }

  const { error } = category.id
    ? await supabase.from('categories').update(payload).eq('id', category.id)
    : await supabase.from('categories').insert(payload);

  if (error) {
    console.error('Error upserting category:', error);
    return { error: `Error DB: ${error.message} (${error.code})` };
  }

  revalidatePath('/', 'layout');
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

  // DUPLICATE CHECK: Prevent creating/renaming to an existing group name
  const { data: existing } = await supabase
    .from('category_groups')
    .select('id')
    .eq('household_id', member.household_id)
    .ilike('name', group.name?.trim() || '')
    .maybeSingle();

  if (existing && existing.id !== group.id) {
    return { error: `Ya existe un grupo llamado "${group.name}". Por favor usa un nombre diferente.` };
  }

  const { error } = group.id 
    ? await supabase.from('category_groups').update(payload).eq('id', group.id)
    : await supabase.from('category_groups').insert(payload);

  if (error) {
    console.error('Error upserting group:', error);
    return { error: `Error DB: ${error.message} (${error.code})` };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Removes a category
 * Moves associated expenses to a "General" category first to prevent data loss.
 */
export async function removeCategory(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { error: 'No household found' };

  // 1. Ensure "General" category exists
  let { data: generalCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('household_id', member.household_id)
    .eq('name', 'General')
    .maybeSingle();

  if (!generalCategory) {
    // Attempt to find "Otros no Contemplados" as a secondary fallback if user preferred it before
    const { data: fallbackCat } = await supabase
      .from('categories')
      .select('id')
      .eq('household_id', member.household_id)
      .eq('name', 'Otros no Contemplados')
      .maybeSingle();
    
    if (fallbackCat) {
      generalCategory = fallbackCat;
    } else {
      // Create it from scratch
      const { data: newCat, error: createError } = await supabase
        .from('categories')
        .insert({
          household_id: member.household_id,
          name: 'General',
          color: '#9E9E9E',
          is_default: true
        })
        .select('id')
        .single();
      
      if (createError) {
        console.error('Error creating General category:', createError);
        return { error: 'No se pudo crear la categoría General para el respaldo' };
      }
      generalCategory = newCat;
    }
  }

  // Prevent deleting the General category itself if it is the only one left or system critical
  if (id === generalCategory?.id) {
    return { error: 'No puedes eliminar la categoría General de respaldo' };
  }

  // 2. Move expenses to the General category
  const { error: moveError } = await supabase
    .from('expenses')
    .update({ category_id: generalCategory.id })
    .eq('category_id', id)
    .eq('household_id', member.household_id);

  if (moveError) {
    console.error('Error moving expenses before deletion:', moveError);
    return { error: 'No se pudieron mover los gastos a la categoría General' };
  }

  // 3. Finally, delete the category
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('household_id', member.household_id);

  if (error) {
    console.error('Error removing category:', error);
    return { error: 'No se pudo eliminar la categoría' };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

/**
 * Removes a category group
 * Ungroups associated categories before deleting the group.
 */
export async function removeCategoryGroup(id: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { error: 'No household found' };

  // 1. Ungroup categories belonging to this group
  const { error: ungroupError } = await supabase
    .from('categories')
    .update({ group_id: null })
    .eq('group_id', id)
    .eq('household_id', member.household_id);

  if (ungroupError) {
    console.error('Error ungrouping categories before deleting group:', ungroupError);
    return { error: 'No se pudieron desvincular los establecimientos del grupo' };
  }

  // 2. Delete the group
  const { error } = await supabase
    .from('category_groups')
    .delete()
    .eq('id', id)
    .eq('household_id', member.household_id);

  if (error) {
    console.error('Error removing group:', error);
    return { error: 'No se pudo eliminar el grupo' };
  }

  revalidatePath('/', 'layout');
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

  revalidatePath('/', 'layout');
}
