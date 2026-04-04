'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { Expense, Category } from '@/lib/types';

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
    color: c.color
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
 * Adds a new category to the household
 */
export async function addCategory(category: { name: string; color: string }) {
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
    .from('categories')
    .insert({
      household_id: member.household_id,
      name: category.name,
      color: category.color
    });

  if (error) {
    console.error('Error adding category:', error);
    return { error: 'No se pudo guardar la categoría' };
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
