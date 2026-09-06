import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// UI chrome translations. Product names & AI-generated copy stay in their source
// language (French) as required by the brief — names are never translated.
const DICT = {
  fr: {
    appName: 'MySolaia',
    nav: { accueil: 'Accueil', scan: 'Scan', routine: 'Routine', journal: 'Journal', essai: 'Essai' },
    greetingMorning: 'Bonjour', greetingEvening: 'Bonsoir',
    shelf: 'Ton étagère', products: 'produits', addPhoto: 'Ajouter par photo',
    start: 'Commencer', steps: 'étapes', tonight: 'Ce soir', thisMorning: 'Ce matin',
    frameProduct: 'Cadre le devant du produit', frameHint: 'Je reconnais la marque, puis tu confirmes.',
    analyzing: 'Je regarde…', retake: 'Reprendre', addToRoutine: 'Ajouter à ma routine',
    toConfirm: 'à confirmer', recognized: 'Reconnu', category: 'Catégorie', keyActive: 'Actif clé',
    texture: 'Texture', placement: 'Placement', chooseFromLibrary: 'Choisir dans la bibliothèque',
    morning: 'Matin', evening: 'Soir', doneOf: 'sur', doneLabel: 'faites', checkAlong: 'Coche à mesure',
    routineDone: 'Routine terminée', suggestedPause: 'Pause conseillée', startTimer: 'Démarrer', pause: 'Pause',
    holdRhythm: 'Tu tiens le rythme', daysStreak: 'Jours de suite', careThirty: 'Soins / 30 j',
    exfoThirty: 'Exfoliations / 30 j', whatINotice: 'Ce que je remarque', lastEntries: 'Dernières entrées',
    manageSub: 'Gérer mon abonnement', trialTitle: 'Essai de 7 jours', annual: 'Annuel', monthly: 'Mensuel',
    twoMonthsFree: 'Deux mois offerts', cancelAnytime: 'Annulable en tout temps', perYear: 'par année',
    perMonth: 'par mois', startTrial: 'Commencer les 7 jours', paymentMethod: 'Mode de paiement',
    signIn: 'Se connecter', signUp: 'Créer un compte', email: 'Courriel', password: 'Mot de passe',
    noAccount: "Pas encore de compte ?", haveAccount: 'Déjà un compte ?', logout: 'Se déconnecter',
    onbTitle: 'Parle-moi de ta peau', skinType: 'Type de peau', sensitivity: 'Sensibilité', goals: 'Objectifs',
    continue: 'Continuer', legal: "Aucun conseil médical : l'app ordonne et prévient, elle ne diagnostique pas.",
    emptyShelfCta: 'Ajoute ton premier produit', settings: 'Réglages', language: 'Langue',
    addProduct: 'Ajouter un produit', search: 'Rechercher', add: 'Ajouter', cancel: 'Annuler',
    demoNote: "Exemple de routine — ajoute tes produits pour la tienne.",
        thisWeek: 'Cette semaine', weeksAgo: 'Il y a (sem.)', entriesLabel: 'entrée(s)',
  },
  en: {
    appName: 'MySolaia',
    nav: { accueil: 'Home', scan: 'Scan', routine: 'Routine', journal: 'Journal', essai: 'Trial' },
    greetingMorning: 'Good morning', greetingEvening: 'Good evening',
    shelf: 'Your shelf', products: 'products', addPhoto: 'Add by photo',
    start: 'Start', steps: 'steps', tonight: 'Tonight', thisMorning: 'This morning',
    frameProduct: 'Frame the front of the product', frameHint: 'I recognise the brand, then you confirm.',
    analyzing: 'Looking…', retake: 'Retake', addToRoutine: 'Add to my routine',
    toConfirm: 'to confirm', recognized: 'Recognised', category: 'Category', keyActive: 'Key active',
    texture: 'Texture', placement: 'Placement', chooseFromLibrary: 'Choose from the library',
    morning: 'Morning', evening: 'Evening', doneOf: 'of', doneLabel: 'done', checkAlong: 'Check as you go',
    routineDone: 'Routine complete', suggestedPause: 'Suggested pause', startTimer: 'Start', pause: 'Pause',
    holdRhythm: "You're keeping the rhythm", daysStreak: 'Day streak', careThirty: 'Sessions / 30 d',
    exfoThirty: 'Exfoliations / 30 d', whatINotice: 'What I notice', lastEntries: 'Recent entries',
    manageSub: 'Manage subscription', trialTitle: '7-day trial', annual: 'Annual', monthly: 'Monthly',
    twoMonthsFree: 'Two months free', cancelAnytime: 'Cancel anytime', perYear: 'per year',
    perMonth: 'per month', startTrial: 'Start the 7 days', paymentMethod: 'Payment method',
    signIn: 'Sign in', signUp: 'Create account', email: 'Email', password: 'Password',
    noAccount: 'No account yet?', haveAccount: 'Already have an account?', logout: 'Sign out',
    onbTitle: 'Tell me about your skin', skinType: 'Skin type', sensitivity: 'Sensitivity', goals: 'Goals',
    continue: 'Continue', legal: 'No medical advice: the app orders and warns, it does not diagnose.',
    emptyShelfCta: 'Add your first product', settings: 'Settings', language: 'Language',
    addProduct: 'Add a product', search: 'Search', add: 'Add', cancel: 'Cancel',
    demoNote: 'Sample routine — add your products to make it yours.',
  },
};

const LangContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem('ordre_lang');
    if (saved) return saved;
    
    // Détection sécurisée de la langue
    const rawNav = typeof navigator !== 'undefined' && navigator.language ? String(navigator.language) : 'fr';
    const nav = rawNav.slice(0, 2);
    return nav === 'en' ? 'en' : 'fr';
  });

  useEffect(() => { 
    localStorage.setItem('ordre_lang', lang); 
  }, [lang]);

  const t = useCallback((key) => {
    if (!key) return '';
    const parts = key.split('.');
    let v = DICT[lang];
    for (const p of parts) v = v?.[p];
    return v ?? key;
  }, [lang]);

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
};

export const useT = () => useContext(LangContext);