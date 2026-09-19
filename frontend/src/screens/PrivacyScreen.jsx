import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useT } from '../i18n';

const PrivacyScreen = ({ go }) => {
  const { lang } = useT();

  const sections = lang === 'fr' ? [
    ["Responsable des données", "MySolaia — [Ton nom], joignable à [ton courriel]. C'est la personne responsable de la protection des renseignements personnels : écris-lui pour toute question ou pour exercer tes droits."],
    ["Ce que nous recueillons", "Compte : ton courriel et ton mot de passe (chiffré, illisible pour nous). Profil de peau : type de peau, objectifs, photos de journal que tu choisis d'ajouter. Étagère : les produits que tu enregistres. Photos scannées : envoyées à Google (Gemini) uniquement pour identifier le produit — elles ne servent jamais à t'identifier et ne sont pas conservées après l'analyse."],
    ["Pourquoi nous les utilisons", "Faire fonctionner ton compte, générer ta routine matin/soir, les minuteurs, le journal et Mon Cercle. Nous ne vendons jamais tes données et ne les utilisons pas à des fins publicitaires."],
    ["Ton consentement", "En créant ton compte, tu consens à cette collecte. Tu peux retirer ton consentement en tout temps en supprimant ton compte (Profil → Supprimer mon compte) : tout est alors effacé."],
    ["Où vont tes données", "Tes données sont hébergées aux États-Unis (serveurs Render, base MongoDB Atlas) et transitent par Stripe (paiements — nous ne voyons ni ne stockons ton numéro de carte) et Google (analyse des photos scannées). En utilisant l'app, tu consens à ce transfert hors du Québec."],
    ["Combien de temps nous les gardons", "Tant que ton compte est actif. Compte supprimé = données effacées. Les photos scannées ne sont pas conservées après l'analyse."],
    ["Tes droits (Loi 25)", "Tu as le droit d'accéder à tes renseignements, de les rectifier et de les faire supprimer. Écris à [ton courriel] — réponse sous 30 jours."],
    ["Sécurité", "Connexions chiffrées (HTTPS), mots de passe chiffrés, accès limité aux données. Aucun système n'est infaillible : en cas d'incident présentant un risque de préjudice sérieux, nous t'aviserons ainsi que la Commission d'accès à l'information, comme l'exige la Loi 25."],
    ["Mineurs", "L'application s'adresse aux personnes de 14 ans et plus. En deçà de 14 ans, le consentement d'un parent ou tuteur est requis."],
    ["Modifications", "Si cette politique change de façon importante, nous t'en informerons dans l'application. Dernière mise à jour : 19 septembre 2026."],
  ] : [
    ["Data officer", "MySolaia — [Your name], reachable at [your email]. This is the person responsible for protecting personal information: contact them with any question or to exercise your rights."],
    ["What we collect", "Account: your email and password (encrypted, unreadable to us). Skin profile: skin type, goals, journal photos you choose to add. Shelf: products you save. Scanned photos: sent to Google (Gemini) only to identify the product — never to identify you, and not kept after analysis."],
    ["Why we use it", "To run your account, generate your morning/evening routine, timers, journal and My Circle. We never sell your data and never use it for advertising."],
    ["Your consent", "By creating your account, you consent to this collection. You may withdraw consent at any time by deleting your account (Profile → Delete my account): everything is then erased."],
    ["Where your data goes", "Your data is hosted in the United States (Render servers, MongoDB Atlas database) and goes through Stripe (payments — we never see or store your card number) and Google (scanned-photo analysis). By using the app, you consent to this transfer outside Quebec."],
    ["How long we keep it", "As long as your account is active. Deleted account = erased data. Scanned photos are not kept after analysis."],
    ["Your rights (Law 25)", "You have the right to access, correct and delete your information. Write to [your email] — reply within 30 days."],
    ["Security", "Encrypted connections (HTTPS), encrypted passwords, limited data access. No system is infallible: if an incident poses a serious risk of harm, we will notify you and the Commission d'accès à l'information, as required by Law 25."],
    ["Minors", "The app is for users aged 14 and over. Under 14, a parent or guardian's consent is required."],
    ["Changes", "If this policy changes materially, we will inform you in the app. Last updated: September 19, 2026."],
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
            ? "⚠️ Brouillon conforme à la Loi 25 — remplace [Ton nom] et [ton courriel], puis fais réviser par un juriste avant le lancement."
            : "⚠️ Draft aligned with Law 25 — replace [Your name] and [your email], then have it reviewed by a lawyer before launch."}
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
