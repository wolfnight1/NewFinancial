'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import * as xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

/**
 * Converts Excel serial date to ISO string (YYYY-MM-DD)
 */
function excelDateToISO(serial: number): string {
  if (typeof serial !== 'number') return String(serial);
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
}

export async function importOldData(dryRun: boolean = true) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  // 1. Get current household
  const { data: member } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single();

  if (!member) return { error: 'No se encontró el hogar' };
  const hId = member.household_id;

  // 2. Read file
  const filePath = path.join(process.cwd(), 'OLD_Data.xlsx');
  if (!fs.existsSync(filePath)) {
    return { error: 'El archivo OLD_Data.xlsx no se encuentra en el servidor.' };
  }

  const fileBuffer = fs.readFileSync(filePath);
  const workbook = xlsx.read(fileBuffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  // 3. Fetch existing meta-data for mapping
  const [{ data: groups }, { data: categories }, { data: existingExpenses }] = await Promise.all([
    supabase.from('category_groups').select('*').eq('household_id', hId),
    supabase.from('categories').select('*').eq('household_id', hId),
    supabase.from('expenses').select('date, amount, note').eq('household_id', hId)
  ]);

  const groupMap = new Map((groups || []).map(g => [g.name.toLowerCase().trim(), g.id]));
  const catMap = new Map((categories || []).map(c => [`${c.name.toLowerCase().trim()}_${c.group_id}`, c.id]));
  
  // Quick duplicate check set
  const expenseExists = new Set((existingExpenses || []).map(e => `${e.date}_${e.amount}_${e.note?.trim()?.toLowerCase() || ''}`));

  const results = {
    totalRows: 0,
    imported: 0,
    duplicates: 0,
    totalExistingInDB: (existingExpenses || []).length,
    errors: 0,
    newCategories: 0,
    newGroups: 0,
    dryRun: dryRun,
    sampleDuplicates: [] as string[],
    log: [] as string[]
  };

  // 4. Process rows
  for (const row of rows) {
    if (!row || row.length < 4 || !row[2] || !row[3]) continue;
    results.totalRows++;

    const rawNote = String(row[1] || 'Sin nota').trim();
    const rawDate = excelDateToISO(row[2]);
    const amount = Number(row[3]);
    const rawOwner = String(row[6] || 'Pareja').trim();
    const rawGroupName = String(row[8] || 'Extras').trim();

    // Map owner
    let ownerType: 'user1' | 'user2' | 'shared' = 'shared';
    if (rawOwner.toLowerCase() === 'david') ownerType = 'user1';
    else if (rawOwner.toLowerCase() === 'pame') ownerType = 'user2';

    // Duplicate check
    const dupKey = `${rawDate}_${amount}_${rawNote.toLowerCase()}`;
    if (expenseExists.has(dupKey)) {
      results.duplicates++;
      if (results.sampleDuplicates.length < 5) {
        results.sampleDuplicates.push(`${rawDate} | ${amount} | ${rawNote}`);
      }
      continue;
    }

    if (dryRun) {
      results.imported++;
      continue;
    }

    // --- REAL PERSISTENCE ---
    
    // Check/Create Group
    let gId = groupMap.get(rawGroupName.toLowerCase());
    if (!gId) {
      const { data: newG, error: gErr } = await supabase
        .from('category_groups')
        .insert({ household_id: hId, name: rawGroupName, color: '#94a3b8' })
        .select()
        .single();
      
      if (gErr) {
        results.errors++;
        results.log.push(`Error creando grupo ${rawGroupName}: ${gErr.message}`);
        continue;
      }
      gId = newG.id;
      groupMap.set(rawGroupName.toLowerCase(), gId);
      results.newGroups++;
    }

    // Check/Create Category (Using the Row[1] value as subcategory name)
    const catName = rawNote; // For this import, specific notes are treated as categories
    const catKey = `${catName.toLowerCase()}_${gId}`;
    let cId = catMap.get(catKey);
    
    if (!cId) {
      const { data: newC, error: cErr } = await supabase
        .from('categories')
        .insert({ 
          household_id: hId, 
          name: catName, 
          group_id: gId, 
          color: '#38bdf8' 
        })
        .select()
        .single();

      if (cErr) {
        results.errors++;
        results.log.push(`Error creando categoría ${catName}: ${cErr.message}`);
        continue;
      }
      cId = newC.id;
      catMap.set(catKey, cId);
      results.newCategories++;
    }

    // Insert Expense
    const { error: eErr } = await supabase
      .from('expenses')
      .insert({
        household_id: hId,
        category_id: cId,
        amount: amount,
        date: rawDate,
        note: rawNote,
        owner_type: ownerType
      });

    if (eErr) {
      results.errors++;
      results.log.push(`Error insertando gasto ${rawNote}: ${eErr.message}`);
    } else {
      results.imported++;
    }
  }

  if (!dryRun) revalidatePath('/', 'layout');

  return { success: true, results };
}
