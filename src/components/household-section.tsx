'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Plus, Users } from 'lucide-react';
import { createInvitation, getHouseholdInfo, joinHousehold } from '@/lib/server/household';

export function HouseholdSection() {
  const t = useTranslations('settings');
  const commonT = useTranslations('common');
  
  const [loading, setLoading] = useState(true);
  const [household, setHousehold] = useState<any>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHousehold();
  }, []);

  async function fetchHousehold() {
    setLoading(true);
    const info = await getHouseholdInfo();
    setHousehold(info);
    setLoading(false);
  }

  async function handleInvite() {
    setError(null);
    const res = await createInvitation();
    if (res.error) {
      setError(res.error);
    } else if (res.code) {
      setInviteCode(res.code);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setError(null);
    const res = await joinHousehold(joinCode.trim());
    if (res.error) {
      setError(res.error);
    } else {
      await fetchHousehold();
      setJoinCode('');
    }
  }

  if (loading) return <div className="text-sm text-slate-400">{commonT('loading')}</div>;

  const isCouple = household?.members?.length > 1;

  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/35 p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-2xl bg-sky-400/15 p-2 text-sky-400">
          <Users className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t('household')}</h2>
          <p className="text-sm text-slate-400">{t('householdHint')}</p>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Current Members */}
        <div className="flex flex-wrap gap-3">
          {household?.members?.map((member: any, i: number) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/5 px-4 py-3">
              <div className="size-8 rounded-full bg-sky-300/20 flex items-center justify-center text-xs font-bold text-sky-200">
                {member.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="text-sm">
                <p className="font-medium text-slate-200">{member.name || 'Usuario'}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{member.role}</p>
              </div>
            </div>
          ))}
        </div>

        {!isCouple && (
          <div className="grid gap-6 mt-4 border-t border-white/5 pt-6 sm:grid-cols-2">
            {/* Generate Invite */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300">{t('inviteCode')}</h3>
              {!inviteCode ? (
                <button
                  onClick={handleInvite}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
                >
                  <Plus className="size-4" />
                  {t('invite')}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-sky-400/10 border border-sky-400/20 p-4">
                    <span className="text-xl font-mono font-bold tracking-widest text-sky-300">{inviteCode}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(inviteCode)}
                      className="p-2 hover:bg-sky-400/20 rounded-lg text-sky-300 transition"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">{t('inviteCodeHint')}</p>
                </div>
              )}
            </div>

            {/* Join by Code */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300">{t('joinHousehold')}</h3>
              <div className="flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CODE123"
                  maxLength={6}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-mono outline-none transition focus:border-sky-300"
                />
                <button
                  onClick={handleJoin}
                  className="rounded-2xl bg-sky-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-200"
                >
                  {t('join')}
                </button>
              </div>
              <p className="text-xs text-slate-400">{t('joinHouseholdHint')}</p>
            </div>
          </div>
        )}

        {isCouple && (
          <p className="mt-4 text-sm text-sky-200 bg-sky-400/10 border border-sky-400/20 rounded-2xl p-4">
            {t('alreadyInHousehold')}
          </p>
        )}

        {error && (
          <p className="mt-2 text-sm text-rose-400">{error}</p>
        )}
      </div>
    </section>
  );
}
