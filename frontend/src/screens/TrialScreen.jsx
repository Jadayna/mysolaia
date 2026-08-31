import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useT } from '../i18n';
import { useAuth } from '../context/AuthContext';

const TrialScreen = () => {
  const { t, lang } = useT();
  const { user } = useAuth();
  const [plan, setPlan] = useState('yearly');
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);

  const trialEnd = user?.fin_essai ? new Date(user.fin_essai) : null;
  const endLabel = trialEnd ? trialEnd.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', { day: 'numeric', month: 'long' }) : '';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    if (sid) {
      api.get(`/payments/status/${sid}`).then((r) => { if (r.data.payment_status === 'paid') setPaid(true); }).catch(() => {});
    }
  }, []);

  const startTrial = async () => {
    setBusy(true);
    try {
      const lookup = plan === 'yearly' ? 'ordre_yearly' : 'ordre_monthly';
      const { data } = await api.post('/payments/checkout', { lookup_key: lookup, origin_url: window.location.origin });
      window.location.href = data.checkout_url;
    } catch (e) { setBusy(false); }
  };

  const timeline = lang === 'fr' ? [
    ['J1', 'Accès complet — produits illimités, ordre calculé, journal.'],
    ['J5', "Un rappel t'avertit deux jours avant la fin."],
    ['J7', 'Premier prélèvement, sauf si tu as annulé. Une touche pour annuler.'],
  ] : [
    ['D1', 'Full access — unlimited products, calculated order, journal.'],
    ['D5', 'A reminder warns you two days before the end.'],
    ['D7', 'First charge, unless you cancelled. One tap to cancel.'],
  ];

  return (
    <div className="px-6 pt-6 animate-fade-up">
      <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>{t('trialTitle')}</span>
      <h2 className="font-display text-[28px] mt-1">{lang === 'fr' ? `Gratuit jusqu'au ${endLabel}` : `Free until ${endLabel}`}</h2>
      <p className="font-body text-[13px] leading-relaxed mt-3" style={{ color: 'var(--ink-soft)' }}>
        {lang === 'fr'
          ? `Rien n'est prélevé aujourd'hui. Ta carte sert seulement à ouvrir l'essai — l'abonnement démarre le ${endLabel} si tu ne l'annules pas.`
          : `Nothing is charged today. Your card only opens the trial — the subscription starts on ${endLabel} unless you cancel.`}
      </p>

      {paid && <p className="font-body italic text-[13px] mt-3" style={{ color: 'var(--gold)' }}>{lang === 'fr' ? 'Ton essai est ouvert. Merci !' : 'Your trial is open. Thank you!'}</p>}

      <div className="grid grid-cols-2 gap-3 mt-6">
        <button onClick={() => setPlan('yearly')} className="rounded-[10px] p-4 text-left" style={plan === 'yearly' ? { background: 'var(--cream-card)', border: '1px solid var(--gold)' } : { border: '1px solid var(--line)' }}>
          <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: plan === 'yearly' ? 'var(--gold)' : 'var(--ink-faint)' }}>{t('annual')}</span>
          <p className="font-body italic text-[11px] mt-1" style={{ color: 'var(--ink-faint)' }}>{t('twoMonthsFree')}</p>
          <p className="font-display text-[26px] mt-3 tnum">39,99 $</p>
          <p className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>{t('perYear')}</p>
        </button>
        <button onClick={() => setPlan('monthly')} className="rounded-[10px] p-4 text-left" style={plan === 'monthly' ? { background: 'var(--cream-card)', border: '1px solid var(--gold)' } : { border: '1px solid var(--line)' }}>
          <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: plan === 'monthly' ? 'var(--gold)' : 'var(--ink-faint)' }}>{t('monthly')}</span>
          <p className="font-body italic text-[11px] mt-1" style={{ color: 'var(--ink-faint)' }}>{t('cancelAnytime')}</p>
          <p className="font-display text-[26px] mt-3 tnum">4,99 $</p>
          <p className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>{t('perMonth')}</p>
        </button>
      </div>

      <button onClick={startTrial} disabled={busy} className="gold-btn w-full rounded-[8px] py-3 mt-6 font-body tracking-caps text-[11px] uppercase">{t('startTrial')}</button>

      <div className="mt-8">
        {timeline.map(([d, txt], i) => (
          <div key={i} className="flex gap-4 py-3.5 hairline">
            <span className="font-display text-[18px] tnum shrink-0" style={{ color: 'var(--gold)', width: 28 }}>{d}</span>
            <p className="font-body text-[12.5px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{txt}</p>
          </div>
        ))}
      </div>

      <p className="font-body italic text-[11.5px] leading-relaxed mt-8 mb-4" style={{ color: 'var(--ink-faint)' }}>{t('legal')}</p>
    </div>
  );
};

export default TrialScreen;
