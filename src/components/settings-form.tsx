'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useFinance } from '@/components/finance-provider';
import type { AppLocale, FinanceSettings } from '@/lib/types';
import { HouseholdSection } from '@/components/household-section';
import { importOldData, exportDataToExcel } from '@/lib/server/import-actions';

export function SettingsForm() {
  const t = useTranslations('settings');
  const commonT = useTranslations('common');
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const { state, hydrated, updateSettings, addCategory, removeCategory, upsertCategoryGroup, removeCategoryGroup } = useFinance();
  const [categoryName, setCategoryName] = useState('');
  const [categoryGroupId, setCategoryGroupId] = useState('');
  const [isFixed, setIsFixed] = useState(false);
  const [fixedAmount, setFixedAmount] = useState(0);
  const [fixedDay, setFixedDay] = useState(1);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  
  const [groupName, setGroupName] = useState('');
  const [groupLimit, setGroupLimit] = useState(0);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleSync = async (dryRun: boolean) => {
    if (!selectedFile) {
      alert('Por favor selecciona un archivo primero');
      return;
    }

    try {
      setSyncLoading(true);
      
      const reader = new FileReader();
      const fileData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const res = await importOldData(fileData, dryRun);
      setSyncResult(res);
    } catch (err: any) {
      alert('Error en la sincronización: ' + err.message);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const res = await exportDataToExcel();
      if (res.error) throw new Error(res.error);
      if (res.success && res.content) {
        const byteCharacters = atob(res.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.fileName || 'Export.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err: any) {
      alert('Error exportando: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [form, setForm] = useState<FinanceSettings>(state.settings);

  // Update form when state.settings changes (after hydration)
  useEffect(() => {
    if (hydrated) {
      setForm(state.settings);
    }
  }, [hydrated, state.settings]);

  if (!hydrated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <form
        className="grid gap-6 rounded-[28px] border border-white/10 bg-slate-950/35 p-5"
        onSubmit={async (event) => {
          event.preventDefault();
          setLoading(true);
          await updateSettings(form);
          setLoading(false);

          if (form.language !== locale) {
            router.replace('/settings', { locale: form.language });
          }
        }}
      >
        <section className="grid gap-5">
          <div>
            <h2 className="text-lg font-semibold">{t('profile')}</h2>
            <p className="text-sm text-slate-400">{t('profileHint')}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label={t('displayName')}
              value={form.primaryUserName}
              onChange={(value) =>
                setForm((current) => ({ ...current, primaryUserName: value }))
              }
            />
            <Field
              label={t('partnerName')}
              value={form.secondaryUserName}
              onChange={(value) =>
                setForm((current) => ({ ...current, secondaryUserName: value }))
              }
              disabled={form.mode === 'individual'}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-300">{t('mode')}</label>
            <select
              value={form.mode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  mode: event.target.value as FinanceSettings['mode'],
                }))
              }
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
            >
              <option value="individual">{t('individual')}</option>
              <option value="couple">{t('couple')}</option>
            </select>
          </div>
        </section>

        <section className="grid gap-5">
          <div>
            <h2 className="text-lg font-semibold">{t('financial')}</h2>
            <p className="text-sm text-slate-400">{t('financialHint')}</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <NumberField
              label={t('income')}
              value={form.primaryIncome}
              onChange={(value) =>
                setForm((current) => ({ ...current, primaryIncome: value }))
              }
            />
            <NumberField
              label={t('partnerIncome')}
              value={form.secondaryIncome}
              onChange={(value) =>
                setForm((current) => ({ ...current, secondaryIncome: value }))
              }
              disabled={form.mode === 'individual'}
            />
            {/* User 1 Investment */}
            <div className="grid gap-3">
              <label className="text-sm text-slate-300">{t('investmentType')} (U1)</label>
              <select
                value={form.primaryInvestmentType}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    primaryInvestmentType: e.target.value as 'percentage' | 'fixed',
                  }))
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
              >
                <option value="percentage">{t('percentage')}</option>
                <option value="fixed">{t('fixed')}</option>
              </select>
              {form.primaryInvestmentType === 'percentage' ? (
                <NumberField
                  label={t('investmentPct')}
                  value={form.primaryInvestmentPct}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, primaryInvestmentPct: value }))
                  }
                />
              ) : (
                <NumberField
                  label={t('investmentFixed')}
                  value={form.primaryInvestmentFixed}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, primaryInvestmentFixed: value }))
                  }
                />
              )}
            </div>

            {/* User 2 Investment */}
            <div className="grid gap-3">
              <label className="text-sm text-slate-300">{t('investmentType')} (U2)</label>
              <select
                disabled={form.mode === 'individual'}
                value={form.secondaryInvestmentType}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    secondaryInvestmentType: e.target.value as 'percentage' | 'fixed',
                  }))
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300 disabled:opacity-50"
              >
                <option value="percentage">{t('percentage')}</option>
                <option value="fixed">{t('fixed')}</option>
              </select>
              {form.secondaryInvestmentType === 'percentage' ? (
                <NumberField
                  label={t('partnerInvestmentPct')}
                  disabled={form.mode === 'individual'}
                  value={form.secondaryInvestmentPct}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, secondaryInvestmentPct: value }))
                  }
                />
              ) : (
                <NumberField
                  label={t('investmentFixed')}
                  disabled={form.mode === 'individual'}
                  value={form.secondaryInvestmentFixed}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, secondaryInvestmentFixed: value }))
                  }
                />
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm text-slate-300">{t('language')}</label>
            <select
              value={form.language}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  language: event.target.value as AppLocale,
                }))
              }
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
            >
              <option value="es">{t('spanish')}</option>
              <option value="en">{t('english')}</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-slate-300">{t('currency')}</label>
            <select
              value={form.currency}
              onChange={(event) =>
                setForm((current) => ({ ...current, currency: event.target.value }))
              }
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
            >
              <option value="USD">USD</option>
              <option value="CAD">CAD</option>
              <option value="COP">COP</option>
            </select>
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="rounded-2xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:opacity-50"
        >
          {loading ? '...' : t('save')}
        </button>
      </form>

      <HouseholdSection />

      {/* Macro Categories Section */}
      <section className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">{t('macroCategories')}</h2>
          <p className="text-sm text-slate-400">{t('macroCategoriesHint')}</p>
        </div>

        <form
          className="grid gap-3 sm:grid-cols-4 items-end"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!groupName.trim() || groupLoading) return;

            setGroupLoading(true);
            await upsertCategoryGroup({
              id: editingGroupId || undefined,
              name: groupName.trim(),
              color: '#607D8B',
              budgetLimit: groupLimit,
            });
            setGroupName('');
            setGroupLimit(0);
            setEditingGroupId(null);
            setGroupLoading(false);
          }}
        >
          <div className="grid gap-2">
            <label className="text-xs text-slate-400 px-1">{t('groupName')}</label>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={t('groupName')}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-xs text-slate-400 px-1">{t('budgetLimit')}</label>
            <input
              type="number"
              value={groupLimit}
              onChange={(e) => setGroupLimit(Number(e.target.value))}
              placeholder={t('budgetLimit')}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
            />
          </div>
          <button
            type="submit"
            disabled={groupLoading}
            className="rounded-2xl bg-sky-300 text-slate-950 px-4 py-3 text-sm font-semibold transition hover:bg-sky-200 disabled:opacity-50"
          >
            {groupLoading ? '...' : (editingGroupId ? commonT('save') : t('addMacroCategory'))}
          </button>
          {editingGroupId && (
            <button
              type="button"
              onClick={() => {
                setEditingGroupId(null);
                setGroupName('');
                setGroupLimit(0);
              }}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
            >
              Cancelar
            </button>
          )}
        </form>

        <div className="mt-5 grid gap-3">
          {state.categoryGroups.map((group) => (
            <div
              key={group.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{group.name}</span>
                <span className="text-xs text-slate-400">
                  ({t('budgetLimit')}: {state.settings.currency} {group.budgetLimit})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingGroupId(group.id);
                    setGroupName(group.name);
                    setGroupLimit(group.budgetLimit);
                  }}
                  className="text-xs text-sky-300 hover:text-sky-200"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Seguro que quieres eliminar este grupo? Los establecimientos vinculados perderán su grupo pero no se borrarán.')) {
                      removeCategoryGroup(group.id);
                    }
                  }}
                  className="text-xs text-rose-300 transition hover:text-rose-200"
                >
                  {commonT('delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Establishments Section */}
      <section className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">{t('establishments')}</h2>
          <p className="text-sm text-slate-400">{t('establishmentsHint')}</p>
        </div>

        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!categoryName.trim() || categoryLoading) return;

            setCategoryLoading(true);
            await addCategory({
              id: editingCategoryId || undefined,
              name: categoryName.trim(),
              color: '#38bdf8',
              groupId: categoryGroupId || undefined,
              isFixed,
              fixedAmount,
              fixedDay,
            });
            setCategoryName('');
            setCategoryGroupId('');
            setIsFixed(false);
            setFixedAmount(0);
            setFixedDay(1);
            setEditingCategoryId(null);
            setCategoryLoading(false);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-xs text-slate-400 px-1">{t('categoryName')}</label>
              <input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={t('categoryName')}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs text-slate-400 px-1">{t('macroCategories')}</label>
              <select
                value={categoryGroupId}
                onChange={(e) => setCategoryGroupId(e.target.value)}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
              >
                <option value="">{t('selectGroup')}</option>
                {state.categoryGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-end">
            <label className="flex flex-1 items-center gap-3 text-sm cursor-pointer mb-2 sm:mb-0">
              <input
                type="checkbox"
                checked={isFixed}
                onChange={(e) => setIsFixed(e.target.checked)}
                className="size-4 accent-sky-400"
              />
              {t('isFixed')}
            </label>
            {isFixed && (
              <div className="flex gap-3">
                <div className="grid gap-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-bold px-1">{t('fixedAmount')}</label>
                  <input
                    type="number"
                    step="any"
                    placeholder={t('fixedAmount')}
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(Number(e.target.value))}
                    className="w-28 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-bold px-1">{t('fixedDay')}</label>
                  <input
                    type="number"
                    placeholder="Day"
                    min="1"
                    max="31"
                    value={fixedDay}
                    onChange={(e) => setFixedDay(Number(e.target.value))}
                    className="w-20 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={categoryLoading}
              className="flex-1 rounded-2xl bg-sky-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200 disabled:opacity-50"
            >
              {categoryLoading ? '...' : (editingCategoryId ? commonT('save') : t('addCategory'))}
            </button>
            {editingCategoryId && (
              <button
                type="button"
                onClick={() => {
                  setEditingCategoryId(null);
                  setCategoryName('');
                  setCategoryGroupId('');
                  setIsFixed(false);
                  setFixedAmount(0);
                }}
                className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium transition hover:bg-white/10"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="mt-5 grid gap-3">
          {state.categories.map((category) => {
            const group = state.categoryGroups.find((g) => g.id === category.groupId);
            return (
              <div
                key={category.id}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                      {group?.name || 'No Group'}
                    </span>
                  </div>
                  {category.isFixed && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                      Fixed: {state.settings.currency} {category.fixedAmount} ({t('fixedDay')} {category.fixedDay})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(category.id);
                      setCategoryName(category.name);
                      setCategoryGroupId(category.groupId || '');
                      setIsFixed(!!category.isFixed);
                      setFixedAmount(category.fixedAmount || 0);
                      setFixedDay(category.fixedDay || 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' }); // Optional: Scroll up to focus on form
                    }}
                    className="text-xs text-sky-300 hover:text-sky-200"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('¿Seguro que quieres eliminar este establecimiento? Los gastos asociados se moverán a la categoría "General" para no perder el historial.')) {
                        removeCategory(category.id);
                      }
                    }}
                    className="text-xs text-rose-300 transition hover:text-rose-200"
                  >
                    {commonT('delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Migration / Import Section */}
      <section className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Sincronización de Historial (.xlsx)</h2>
          <p className="text-sm text-slate-400">
            Carga un archivo Excel para sincronizar gastos pasados.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            <label className="text-xs text-slate-400 px-1">Seleccionar archivo Excel</label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-300/10 file:text-sky-300 hover:file:bg-sky-300/20"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={syncLoading || !selectedFile}
              onClick={() => {
                if (!confirm('¿Realizar prueba de importación (Dry Run)?')) return;
                handleSync(true);
              }}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium transition hover:bg-white/10 disabled:opacity-30"
            >
              Prueba (Dry Run)
            </button>
            <button
              type="button"
              disabled={syncLoading || !selectedFile}
              onClick={() => {
                if (!confirm('ESTO INSERTARÁ DATOS REALES. ¿Confirmar importación?')) return;
                handleSync(false);
              }}
              className="rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 px-4 py-2 text-xs font-medium transition hover:bg-amber-500/20 disabled:opacity-30"
            >
              Importar Real
            </button>
            <button
              type="button"
              disabled={exportLoading}
              onClick={handleExport}
              className="rounded-xl border border-sky-300/30 text-sky-300 px-4 py-2 text-xs font-medium transition hover:bg-sky-300/10 disabled:opacity-50"
            >
              {exportLoading ? 'Exportando...' : 'Exportar Datos (.xlsx)'}
            </button>
          </div>

          {syncResult && (
            <div className="rounded-2xl bg-white/5 p-4 text-xs font-mono space-y-1">
              {syncResult.error ? (
                <p className="text-rose-400">Error: {syncResult.error}</p>
              ) : (
                <>
                  <p className="text-emerald-400 font-bold">Resumen de {syncResult.results.dryRun ? 'Prueba' : 'Importación'}:</p>
                  <p>Filas procesadas (Excel): {syncResult.results.totalRows}</p>
                  <p>Gastos detectados en BD: {syncResult.results.totalExistingInDB}</p>
                  <p>Sincronizados (Nuevos): {syncResult.results.imported}</p>
                  <p>Omitidos (Ya existen): {syncResult.results.duplicates}</p>
                  
                  {syncResult.results.sampleDuplicates && syncResult.results.sampleDuplicates.length > 0 && (
                    <div className="mt-2 bg-black/30 p-2 rounded-lg">
                      <p className="text-amber-400 mb-1">Ejemplos de duplicados:</p>
                      {syncResult.results.sampleDuplicates.map((s: string, i: number) => (
                        <div key={i} className="text-[10px] text-slate-400 truncate">
                          {s}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="mt-2">Nuevas Categorías: {syncResult.results.newCategories}</p>
                  <p>Nuevos Grupos: {syncResult.results.newGroups}</p>
                  {syncResult.results.log.length > 0 && (
                    <div className="mt-2 text-slate-500 max-h-32 overflow-y-auto border-t border-white/5 pt-2">
                       {syncResult.results.log.map((l: string, i: number) => (
                         <div key={i}>{l}</div>
                       ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm text-slate-300">{label}</label>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300 disabled:opacity-50"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-sm text-slate-300">{label}</label>
      <input
        min="0"
        step="0.01"
        type="number"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition focus:border-sky-300 disabled:opacity-50"
      />
    </div>
  );
}
