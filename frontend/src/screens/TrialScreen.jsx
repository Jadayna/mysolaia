import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { useT } from '../i18n';
import { useAuth } from '../context/AuthContext';

const TrialScreen = () => {
  const { t, lang } = useT();
  const { user, setUser } = useAuth();
  const [plan, setPlan] = useState('monthly');
  const [busy, setBusy] = useState(false);
  const [paid, setPaid] = useState(false);
  const [portalError, setPortalError] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelError, setCancelError] = useState(false);

  // Déjà abonnée ? → on n'affiche plus jamais l'essai (Étape : fix TrialScreen)
  const isSubscribed = user?.is_premium === true || user?.statut_abonnement === 'actif';
  // Après expiration (état positionné côté backend) → proposition de réactivation
  const isExpired = user?.statut_abonnement === 'expire';

  const inSevenDays = new Date();
  inSevenDays.setDate(inSevenDays.getDate() + 7);
  const endLabel = inSevenDays.toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', { day: 'numeric', month: 'long' });


  useEffect(() => {
    // Vérifie auprès de Stripe si l'abonnement est toujours actif ;
    // si annulé/expiré → le backend applique « 5 Actifs / Reste en Pause »
    api.post('/subscription/refresh')
      .then(() => api.get('/auth/me'))
      .then(({ data }) => { if (data?.user) setUser(data.user); })
      .catch(() => {});
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id');
    if (sid) {
      api.get(`/payments/status/${sid}`).then((r) => {
        // En essai gratuit, Stripe renvoie 'no_payment_required' ou status 'complete'
        const isSuccessful = r.data.payment_status === 'paid' || r.data.payment_status === 'no_payment_required' || r.data.status === 'complete';
        if (isSuccessful) {
          setPaid(true);
          // Rafraîchit le profil pour basculer sur « Abonnement Illimité Actif »
          api.get('/auth/me').then(({ data }) => { if (data?.user) setUser(data.user); }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, [setUser]);

  const startTrial = async () => {
    setBusy(true);
    try {
      const lookup = plan === 'yearly' ? 'ordre_yearly' : 'ordre_monthly';
      const { data } = await api.post('/payments/checkout', { lookup_key: lookup, origin_url: window.location.origin });
      window.location.href = data.checkout_url;
    } catch (e) { setBusy(false); }
  };

  const handleManageSubscription = async () => {
    setPortalError(false);
    try {
      const { data } = await api.post('/payments/portal', { origin_url: window.location.origin });
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPortalError(true);
      }
    } catch (e) {
      console.error("Erreur portail Stripe", e);
      setPortalError(true);
    }
  };

  const refreshUser = () => api.get('/auth/me')
    .then(({ data }) => { if (data?.user) setUser(data.user); })
    .catch(() => {});

  const handleCancel = async () => {
    setCancelBusy(true); setCancelError(false);
    try {
      await api.post('/subscription/cancel');
      setConfirmCancel(false);
      await refreshUser();
    } catch (e) { setCancelError(true); }
    setCancelBusy(false);
  };

  const handleReactivate = async () => {
    setCancelBusy(true); setCancelError(false);
    try {
      await api.post('/subscription/reactivate');
      await refreshUser();
    } catch (e) { setCancelError(true); }
    setCancelBusy(false);
  };

  const subEndDate = user?.current_period_end
    ? new Date(user.current_period_end).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const portalErrorMsg = portalError && (
    <p className="font-body italic text-[12px] mt-2 text-center" style={{ color: '#c0392b' }}>
      {lang === 'fr' ? "Le portail n'a pas pu s'ouvrir. Réessaie dans un moment." : 'The portal could not be opened. Please try again in a moment.'}
    </p>
  );

  const timeline = lang === 'fr' ? [
    ['J1', 'Accès complet immédiat — étagère illimitée, routines personnalisées, journal.'],
    ['J5', "Rappel par courriel 3 jours avant la fin de ton essai gratuit."],
    ['J7', `Premier prélèvement (${plan === 'yearly' ? '39,99 $' : '4,99 $'}) uniquement si tu décides de continuer. Annulation en 1 clic.`],
  ] : [
    ['D1', 'Instant full access — unlimited shelf, personalized routines, journal.'],
    ['D5', 'Email reminder 3 days before your free trial ends.'],
    ['D7', `First charge (${plan === 'yearly' ? '$39.99' : '$4.99'}) only if you decide to keep it. Cancel in 1 tap.`],
  ];

  // Vue « déjà abonnée » : on ne propose plus jamais l'essai
  if (isSubscribed) {
    const sinceDate = user?.date_inscription
      ? new Date(user.date_inscription).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', { day: 'numeric', month: 'long', year: 'numeric' })
      : null;
    const perks = lang === 'fr' ? [
      'Étagère illimitée — tous tes flacons, sans plafond',
      'Routines personnalisées matin & soir',
      'Journal & suivi de peau',
      'Minuteurs de soin intégrés',
      'Météo beauté intelligente',
    ] : [
      'Unlimited shelf — all your bottles, no cap',
      'Personalized AM & PM routines',
      'Skin journal & tracking',
      'Built-in ritual timers',
      'Smart beauty weather',
    ];
    return (
      <div className="px-6 pt-6 animate-fade-up">
        <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>{lang === 'fr' ? 'Abonnement' : 'Subscription'}</span>
        <h2 className="font-display text-[28px] mt-1">✨ {lang === 'fr' ? 'Abonnement Illimité Actif' : 'Unlimited Subscription Active'}</h2>
        <p className="font-body text-[13px] leading-relaxed mt-3" style={{ color: 'var(--ink-soft)' }}>
          {lang === 'fr'
            ? `Merci de rayonner avec nous ! Profite de MySolaia sans aucune limite.`
            : `Thanks for glowing with us! Enjoy MySolaia without limits.`}
        </p>
        {sinceDate && (
          <p className="font-body italic text-[12px] mt-2" style={{ color: 'var(--gold)' }}>
            {lang === 'fr' ? `Avec nous depuis le ${sinceDate} 🌙` : `Glowing with us since ${sinceDate} 🌙`}
          </p>
        )}

        <div className="rounded-[10px] p-4 mt-6" style={{ background: 'var(--cream-card)', border: '1px solid var(--gold)' }}>
          <p className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--gold)' }}>
            {lang === 'fr' ? 'Ton cocon illimité' : 'Your unlimited cocoon'}
          </p>
          <ul className="mt-3 space-y-2.5">
            {perks.map((perk, i) => (
              <li key={i} className="flex gap-2.5 items-start">
                <span className="text-[13px] leading-relaxed" style={{ color: 'var(--gold)' }}>✓</span>
                <span className="font-body text-[12.5px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        {user?.cancel_at_period_end ? (
          <div className="rounded-[10px] p-4 mt-6" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
            <p className="font-body text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
              {lang === 'fr'
                ? `Ton abonnement se termine ${subEndDate ? `le ${subEndDate}` : 'à la fin de ta période'}. Tu gardes l'accès illimité jusque-là.`
                : `Your subscription ends ${subEndDate ? `on ${subEndDate}` : 'at the end of your period'}. You keep unlimited access until then.`}
            </p>
            <button onClick={handleReactivate} disabled={cancelBusy} className="gold-btn w-full rounded-[8px] py-3 mt-4 font-body tracking-caps text-[11px] uppercase">
              {lang === 'fr' ? 'Réactiver mon abonnement' : 'Reactivate my subscription'}
            </button>
          </div>
        ) : (
          <>
            {!confirmCancel ? (
              <button onClick={() => setConfirmCancel(true)} className="w-full rounded-[8px] py-3 mt-6 font-body tracking-caps text-[11px] uppercase" style={{ background: 'transparent', border: '1px solid var(--line)', color: 'var(--ink-soft)' }}>
                {lang === 'fr' ? 'Résilier mon abonnement' : 'Cancel my subscription'}
              </button>
            ) : (
              <div className="rounded-[10px] p-4 mt-6" style={{ background: '#fff', border: '1px solid #c0392b' }}>
                <p className="font-body text-[13px] leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                  {lang === 'fr'
                    ? "Tu garderas l'accès illimité jusqu'à la fin de ta période payée. Confirmer la résiliation ?"
                    : 'You keep unlimited access until the end of your paid period. Confirm cancellation?'}
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setConfirmCancel(false)} className="flex-1 rounded-[8px] py-2.5 font-body tracking-caps text-[11px] uppercase" style={{ background: '#fff', border: '1px solid var(--line)', color: 'var(--ink-soft)' }}>
                    {lang === 'fr' ? 'Garder' : 'Keep'}
                  </button>
                  <button onClick={handleCancel} disabled={cancelBusy} className="flex-1 rounded-[8px] py-2.5 font-body tracking-caps text-[11px] uppercase" style={{ background: '#c0392b', color: '#fff' }}>
                    {cancelBusy ? '…' : (lang === 'fr' ? 'Confirmer' : 'Confirm')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
        {cancelError && (
          <p className="font-body italic text-[12px] mt-2 text-center" style={{ color: '#c0392b' }}>
            {lang === 'fr' ? "Ça n'a pas fonctionné. Réessaie dans un moment." : 'Something went wrong. Please try again in a moment.'}
          </p>
        )}

        <button onClick={handleManageSubscription} className="w-full font-body text-[11.5px] underline mt-4 hover:opacity-80 transition" style={{ color: 'var(--ink-soft)' }}>
          {lang === 'fr' ? 'Mettre à jour ma carte bancaire' : 'Update my payment method'}
        </button>
        {portalErrorMsg}

        <p className="font-body italic text-[11.5px] leading-relaxed mt-8 mb-4" style={{ color: 'var(--ink-faint)' }}>{t('legal')}</p>
      </div>
    );
  }

  return (
    <div className="px-6 pt-6 animate-fade-up">
      <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: 'var(--ink-faint)' }}>{t('trialTitle')}</span>
      <h2 className="font-display text-[28px] mt-1">{lang === 'fr' ? `7 jours d'essai gratuit` : `7-day free trial`}</h2>
      <p className="font-body text-[13px] leading-relaxed mt-3" style={{ color: 'var(--ink-soft)' }}>
        {lang === 'fr'
          ? `Rien n'est prélevé aujourd'hui. Profite de MySolaia sans aucune limite jusqu'au ${endLabel}. Tu peux annuler en 1 clic à tout moment.`
          : `Nothing is charged today. Enjoy MySolaia without limits until ${endLabel}. Cancel anytime in 1 tap.`}
      </p>

      {paid && <p className="font-body italic text-[13px] mt-3" style={{ color: 'var(--gold)' }}>{lang === 'fr' ? 'Ton essai est ouvert. Merci !' : 'Your trial is open. Thank you!'}</p>}

      <div className="grid grid-cols-2 gap-3 mt-6">
        <button onClick={() => setPlan('monthly')} className="rounded-[10px] p-4 text-left" style={plan === 'monthly' ? { background: 'var(--cream-card)', border: '1px solid var(--gold)' } : { border: '1px solid var(--line)' }}>
          <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: plan === 'monthly' ? 'var(--gold)' : 'var(--ink-faint)' }}>{t('monthly')}</span>
          <p className="font-body italic text-[11px] mt-1" style={{ color: 'var(--ink-faint)' }}>{t('cancelAnytime')}</p>
          <p className="font-display text-[26px] mt-3 tnum">4,99 $</p>
          <p className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>{t('perMonth')}</p>
        </button>
        <button onClick={() => setPlan('yearly')} className="rounded-[10px] p-4 text-left" style={plan === 'yearly' ? { background: 'var(--cream-card)', border: '1px solid var(--gold)' } : { border: '1px solid var(--line)' }}>
          <span className="font-body tracking-caps text-[10px] uppercase" style={{ color: plan === 'yearly' ? 'var(--gold)' : 'var(--ink-faint)' }}>{t('annual')}</span>
          <p className="font-body italic text-[11px] mt-1" style={{ color: 'var(--ink-faint)' }}>{t('twoMonthsFree')}</p>
          <p className="font-display text-[26px] mt-3 tnum">39,99 $</p>
          <p className="font-body text-[11px]" style={{ color: 'var(--ink-soft)' }}>{t('perYear')}</p>
        </button>
      </div>

      <button onClick={startTrial} disabled={busy} className="gold-btn w-full rounded-[8px] py-3 mt-6 font-body tracking-caps text-[11px] uppercase">
        {isExpired
          ? (lang === 'fr' ? 'Réactiver mon abonnement' : 'Reactivate my subscription')
          : t('startTrial')}
      </button>

      <div className="mt-4 text-center">
        <button onClick={handleManageSubscription} className="font-body text-[11.5px] underline hover:opacity-80 transition" style={{ color: 'var(--ink-soft)' }}>
          {lang === 'fr' ? 'Déjà abonné ? Gérer mon abonnement / Résilier' : 'Already subscribed? Manage subscription / Cancel'}
        </button>
        {portalErrorMsg}
      </div>

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