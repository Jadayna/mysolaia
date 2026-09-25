import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useT } from '../i18n';

const PrivacyScreen = ({ go }) => {
  const { lang } = useT();
  const [tab, setTab] = useState('privacy'); // 'privacy' | 'terms'

  const privacySections = lang === 'fr' ? [
    ["Responsable des données", "MySolaia, joignable à contact@mysolaia.ca — responsable de la protection des renseignements personnels : écris-nous pour toute question ou pour exercer tes droits."],
    ["Ce que nous recueillons", "Compte : ton courriel et ton mot de passe (chiffré, illisible pour nous). Profil de peau : type de peau, objectifs, photos de journal que tu choisis d'ajouter. Étagère : les produits que tu enregistres. Photos scannées : envoyées à Google (Gemini) uniquement pour identifier le produit — elles ne servent jamais à t'identifier et ne sont pas conservées après l'analyse. Statistiques de visite : nous mesurons la fréquentation avec Umami, un outil sans cookies qui ne te suit pas à travers le web."],
    ["Pourquoi nous les utilisons", "Faire fonctionner ton compte, générer ta routine matin/soir, les minuteurs, le journal et Mon Cercle. Nous ne vendons jamais tes données et ne les utilisons pas à des fins publicitaires."],
    ["Ton consentement", "En cochant la case à l'inscription, tu consens à cette collecte pour les fins décrites ici. Tu peux retirer ton consentement en tout temps en supprimant ton compte (Profil → Supprimer mon compte) : tout est alors effacé."],
    ["Où vont tes données", "Tes données sont hébergées aux États-Unis (serveurs Render, base MongoDB Atlas) et transitent par Stripe (paiements — nous ne voyons ni ne stockons ton numéro de carte), Google (analyse des photos scannées) et Resend (envoi des courriels transactionnels : réinitialisation du mot de passe, rappels de fin d'essai). En utilisant l'app, tu consens à ce transfert hors du Québec."],
    ["Combien de temps nous les gardons", "Tant que ton compte est actif. Compte supprimé = données effacées. Les photos scannées ne sont pas conservées après l'analyse."],
    ["Tes droits", "Au Québec, la Loi 25 te donne le droit d'accéder à tes renseignements, de les rectifier et de les faire supprimer ; la loi fédérale sur la protection des renseignements personnels (LPRPDE) accorde des droits semblables ailleurs au Canada. Écris à contact@mysolaia.ca — réponse sous 30 jours."],
    ["Sécurité", "Connexions chiffrées (HTTPS), mots de passe chiffrés, accès limité aux données. Aucun système n'est infaillible : en cas d'incident présentant un risque de préjudice sérieux, nous t'aviserons ainsi que la Commission d'accès à l'information et le Commissariat à la protection de la vie privée du Canada, comme l'exigent la Loi 25 et la loi fédérale."],
    ["Mineurs", "L'application s'adresse aux personnes de 14 ans et plus. En deçà de 14 ans, le consentement d'un parent ou tuteur est requis — la case correspondante doit être cochée à l'inscription."],
    ["Modifications", "Si cette politique change de façon importante, nous t'en informerons dans l'application. Dernière mise à jour : 25 septembre 2026."],
  ] : [
    ["Data officer", "MySolaia, reachable at contact@mysolaia.ca — responsible for protecting personal information: contact us with any question or to exercise your rights."],
    ["What we collect", "Account: your email and password (encrypted, unreadable to us). Skin profile: skin type, goals, journal photos you choose to add. Shelf: products you save. Scanned photos: sent to Google (Gemini) only to identify the product — never to identify you, and not kept after analysis. Visit statistics: we measure traffic with Umami, a cookie-free tool that does not track you across the web."],
    ["Why we use it", "To run your account, generate your morning/evening routine, timers, journal and My Circle. We never sell your data and never use it for advertising."],
    ["Your consent", "By checking the box at sign-up, you consent to this collection for the purposes described here. You may withdraw consent at any time by deleting your account (Profile → Delete my account): everything is then erased."],
    ["Where your data goes", "Your data is hosted in the United States (Render servers, MongoDB Atlas database) and goes through Stripe (payments — we never see or store your card number), Google (scanned-photo analysis) and Resend (transactional emails: password resets, trial-ending reminders). By using the app, you consent to this transfer outside Quebec."],
    ["How long we keep it", "As long as your account is active. Deleted account = erased data. Scanned photos are not kept after analysis."],
    ["Your rights", "In Quebec, Law 25 gives you the right to access, correct and delete your information; the federal Personal Information Protection Act (PIPEDA) grants similar rights elsewhere in Canada. Write to contact@mysolaia.ca — reply within 30 days."],
    ["Security", "Encrypted connections (HTTPS), encrypted passwords, limited data access. No system is infallible: if an incident poses a serious risk of harm, we will notify you, the Commission d'accès à l'information and the Office of the Privacy Commissioner of Canada, as required by Law 25 and federal law."],
    ["Minors", "The app is for users aged 14 and over. Under 14, a parent or guardian's consent is required — the matching box must be checked at sign-up."],
    ["Changes", "If this policy changes materially, we will inform you in the app. Last updated: September 25, 2026."],
  ];

  // CGU — brouillon rédigé pour le lancement ; relecture juridique prévue.
  const termsSections = lang === 'fr' ? [
    ["Le service", "MySolaia t'aide à organiser ta routine de soins : scan de produits, routine matin/soir, minuteurs, journal de peau. L'application ordonne et prévient — elle ne pose aucun diagnostic et ne remplace pas l'avis d'un professionnel de la santé."],
    ["Ton compte", "Tu es responsable de la confidentialité de tes identifiants. Un compte par personne. Si tu soupçonnes une utilisation non autorisée, écris-nous immédiatement à contact@mysolaia.ca."],
    ["Essai gratuit et abonnement", "7 jours d'essai gratuit, puis 4,99 $ par mois ou 39,99 $ par année selon la formule choisie (taxes en sus, s'il y a lieu). Le prélèvement est automatique à la fin de l'essai, sauf annulation avant. Un rappel par courriel est envoyé 3 jours avant la fin de l'essai. Tu peux annuler en 1 clic à tout moment depuis l'application (Profil → Abonnement) ; l'accès se poursuit jusqu'à la fin de la période déjà payée."],
    ["Remboursements", "Aucun remboursement partiel après un prélèvement. En cas de problème de facturation, écris à contact@mysolaia.ca : on examinera chaque situation équitablement."],
    ["Utilisation acceptable", "Pas d'abus : ne tente pas de contourner l'application, d'en copier le contenu à grande échelle, ni d'y téléverser du contenu illégal ou offensant."],
    ["Propriété intellectuelle", "Le contenu, le design et le code de MySolaia nous appartiennent. Tes données, tes photos et tes notes restent à toi."],
    ["Limitation de responsabilité", "Le service est fourni « tel quel ». Dans la mesure permise par la loi, notre responsabilité est limitée aux montants que tu as payés au cours des 12 derniers mois."],
    ["Résiliation", "Tu peux supprimer ton compte à tout moment (Profil → Supprimer mon compte) : tes données sont alors effacées. Nous pouvons suspendre un compte en cas d'abus ou de non-paiement."],
    ["Modifications des CGU", "En cas de changement important, nous t'en informerons dans l'application avant son entrée en vigueur."],
    ["Droit applicable et contact", "Les lois du Québec et du Canada s'appliquent. Pour toute question : contact@mysolaia.ca. Dernière mise à jour : 25 septembre 2026."],
  ] : [
    ["The service", "MySolaia helps you organize your skincare routine: product scanning, morning/evening routine, timers, skin journal. The app orders and warns — it does not diagnose and does not replace a health professional's advice."],
    ["Your account", "You are responsible for keeping your credentials confidential. One account per person. If you suspect unauthorized use, write to us immediately at contact@mysolaia.ca."],
    ["Free trial and subscription", "7-day free trial, then $4.99 per month or $39.99 per year depending on the plan you choose (plus applicable taxes). Billing is automatic at the end of the trial unless you cancel before. An email reminder is sent 3 days before the trial ends. You can cancel in 1 tap at any time from the app (Profile → Subscription); access continues until the end of the already-paid period."],
    ["Refunds", "No partial refunds after a charge. If you have a billing issue, write to contact@mysolaia.ca: we will review each situation fairly."],
    ["Acceptable use", "No abuse: do not attempt to circumvent the app, copy its content at scale, or upload illegal or offensive content."],
    ["Intellectual property", "MySolaia's content, design and code belong to us. Your data, photos and notes remain yours."],
    ["Limitation of liability", "The service is provided “as is”. To the extent permitted by law, our liability is limited to the amounts you paid in the last 12 months."],
    ["Termination", "You can delete your account at any time (Profile → Delete my account): your data is then erased. We may suspend an account in case of abuse or non-payment."],
    ["Changes to these terms", "If we make material changes, we will inform you in the app before they take effect."],
    ["Governing law and contact", "The laws of Quebec and Canada apply. For any question: contact@mysolaia.ca. Last updated: September 25, 2026."],
  ];

  const sections = tab === 'privacy' ? privacySections : termsSections;

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
            {tab === 'privacy'
              ? (lang === 'fr' ? 'Protection de tes données' : 'How your data is protected')
              : (lang === 'fr' ? "Conditions d'utilisation" : 'Terms of use')}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('privacy')}
          className="flex-1 py-2.5 rounded-[12px] font-body text-[11px] uppercase tracking-caps font-semibold transition-all"
          style={tab === 'privacy'
            ? { background: '#A37B68', color: '#FFF' }
            : { background: 'var(--cream-card)', color: 'var(--ink-soft)', border: '1px solid var(--line)' }}
        >
          {lang === 'fr' ? 'Confidentialité' : 'Privacy'}
        </button>
        <button
          type="button"
          onClick={() => setTab('terms')}
          className="flex-1 py-2.5 rounded-[12px] font-body text-[11px] uppercase tracking-caps font-semibold transition-all"
          style={tab === 'terms'
            ? { background: '#A37B68', color: '#FFF' }
            : { background: 'var(--cream-card)', color: 'var(--ink-soft)', border: '1px solid var(--line)' }}
        >
          CGU
        </button>
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
