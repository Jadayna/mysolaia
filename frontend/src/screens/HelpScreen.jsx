import React from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { useT } from '../i18n';

const HelpScreen = ({ go }) => {
  const { lang } = useT();

  // ← Remplace par ta vraie adresse de support
  const SUPPORT_EMAIL = 'support@mysolaia.app';

  const faq = lang === 'fr' ? [
    ["Comment scanner un produit ?", "Va dans l'onglet Scan, prends une photo de la face avant de l'étiquette, et l'IA identifie la marque et le nom. Le produit s'ajoute à ton étagère."],
    ["Le scan ne reconnaît pas mon produit", "Assure-toi que l'étiquette est bien éclairée et lisible. Si le service est momentanément occupé, réessaie après quelques secondes."],
    ["Comment fonctionne l'essai gratuit ?", "Tu as 7 jours d'accès complet. Rien n'est prélevé avant la fin de l'essai, et tu peux annuler en tout temps depuis Mon Abonnement."],
    ["Comment annuler mon abonnement ?", "Va dans Mon Abonnement, puis « Gérer mon abonnement / Résilier ». Tout se gère depuis le portail sécurisé."],
    ["Mes données sont-elles protégées ?", "Oui. Consulte la section Confidentialité & CGU pour le détail sur la protection de tes données."],
  ] : [
    ["How do I scan a product?", "Go to the Scan tab, take a photo of the front of the label, and the AI identifies the brand and name. The product is added to your shelf."],
    ["The scan doesn't recognize my product", "Make sure the label is well lit and readable. If the service is momentarily busy, try again after a few seconds."],
    ["How does the free trial work?", "You get 7 days of full access. Nothing is charged before the trial ends, and you can cancel anytime from My Subscription."],
    ["How do I cancel my subscription?", "Go to My Subscription, then « Manage subscription / Cancel ». Everything is handled from the secure portal."],
    ["Is my data protected?", "Yes. See the Privacy & Terms section for details on how your data is protected."],
  ];

  return (
    <div className="px-6 pt-6 pb-28 space-y-6 animate-fade-up">
      <div className="flex items-center gap-3">
        <button onClick={() => go('accueil')} className="p-2 rounded-full border" style={{ borderColor: 'var(--line)', background: 'var(--cream-card)' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-[24px]" style={{ color: 'var(--ink)' }}>
            {lang === 'fr' ? 'Aide & Support' : 'Help & Support'}
          </h1>
          <p className="font-body text-[12px]" style={{ color: 'var(--ink-faint)' }}>
            {lang === 'fr' ? 'Questions fréquentes et contact' : 'FAQ and contact'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {faq.map(([q, a], i) => (
          <div key={i} className="p-4 rounded-[16px]" style={{ background: 'var(--cream-card)', border: '1px solid var(--line)' }}>
            <p className="font-display text-[14px] font-medium" style={{ color: 'var(--ink)' }}>{q}</p>
            <p className="font-body text-[12.5px] leading-relaxed mt-1.5" style={{ color: 'var(--ink-soft)' }}>{a}</p>
          </div>
        ))}
      </div>

      <a href={`mailto:${SUPPORT_EMAIL}`} className="gold-btn w-full rounded-[8px] py-3 font-body tracking-caps text-[11px] uppercase flex items-center justify-center gap-2">
        <Mail size={16} />
        {lang === 'fr' ? 'Nous écrire' : 'Contact us'}
      </a>
    </div>
  );
};

export default HelpScreen;
