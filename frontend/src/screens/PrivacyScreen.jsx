import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useT } from '../i18n';

const PrivacyScreen = ({ go }) => {
  const { lang } = useT();

  const sections = lang === 'fr' ? [
    ["Données que nous recueillons", "Compte (courriel), produits que tu enregistres, entrées de journal et informations de profil de peau que tu fournis."],
    ["Utilisation des données", "Tes données servent uniquement à faire fonctionner ton compte, calculer ta routine et afficher ton journal. Nous ne vendons pas tes données."],
    ["Analyse par IA", "Les photos que tu scannes sont envoyées à un service d'IA pour identifier le produit. Elles ne servent pas à t'identifier."],
    ["Paiements", "Les paiements sont traités par Stripe. Nous ne stockons pas ton numéro de carte."],
    ["Tes droits", "Tu peux consulter, modifier ou supprimer ton compte et tes données en tout temps."],
  ] : [
    ["Data we collect", "Account (email), products you save, journal entries and skin-profile information you provide."],
    ["How we use data", "Your data is only used to run your account, calculate your routine and show your journal. We do not sell your data."],
    ["AI analysis", "Photos you scan are sent to an AI service to identify the product. They are not used to identify you."],
    ["Payments", "Payments are handled by Stripe. We do not store your card number."],
    ["Your rights", "You can view, edit or delete your account and data at any time."],
  ];

  return (
    <div className="px-6 pt-6 pb-28 space-y-6 animate-fade-up">
      <div className="flex items-center gap-3">
        <button onClick={() => go('accueil')} className="p-2 rounded-full border" style={{ borderColor: 'var(--line)', background: 'var(--cream-card)' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-[24px]" style={{ color: 'var(--ink)' }}>
            {lang === 'fr' ? 'Confidentialité & CGU' : 'Privacy & Terms'}
          </h1>
          <p className="font-body text-[12px]" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? 'Protection de tes données' : 'How your data is protected'}
          </p>
        </div>
      </div>

      <div className="p-3 rounded-[12px]" style={{ background: 'rgba(163,123,104,0.08)', border: '1px dashed var(--line)' }}>
        <p className="font-body text-[11.5px] leading-relaxed" style={{ color: 'var(--ink-faint)' }}>
          {lang === 'fr'
            ? "⚠️ Texte provisoire à faire réviser avant le lancement public. Remplace-le par ta politique officielle."
            : "⚠️ Placeholder text — have it reviewed before public launch. Replace with your official policy."}
        </p>
      </div>

      <div className="space-y-3">
        {sections.map(([title, body], i) => (
          <div key={i} className="p-4 rounded-[16px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
            <p className="font-display text-[14px] font-medium" style={{ color: 'var(--ink)' }}>{title}</p>
            <p className="font-body text-[12.5px] leading-relaxed mt-1.5" style={{ color: 'var(--ink-soft)' }}>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrivacyScreen;
