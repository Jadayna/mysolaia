import React, { useState } from 'react';
import { X, Smartphone } from 'lucide-react';
import { useT } from '../i18n';

const DISMISS_KEY = 'mysolaia_install_dismissed';

const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  // iPadOS 13+ se fait passer pour un Mac
  return /macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
};

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
};

const isSafari = () => {
  const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '';
  return /safari/i.test(ua) && !/chrome|crios|fxios|edgios|instagram|fbav|fban|fbios/i.test(ua);
};

// Bannière iPhone : guide l'installation sur l'écran d'accueil.
// iOS réserve « Sur l'écran d'accueil » à Safari — d'où les instructions adaptées.
const InstallBanner = () => {
  const { lang } = useT();
  const fr = lang !== 'en';
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch (e) { return true; }
  });

  if (dismissed || !isIOS() || isStandalone()) return null;

  const safari = isSafari();
  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
    setDismissed(true);
  };

  return (
    <div
      className="px-4 py-3 flex items-start gap-3"
      style={{ background: '#F3E9DC', borderBottom: '1px solid var(--line)' }}
    >
      <span
        className="mt-0.5 w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
        style={{ background: '#A37B68' }}
      >
        <Smartphone size={18} className="text-white" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-display text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>
          {fr ? 'Installe MySolaia sur ton iPhone' : 'Install MySolaia on your iPhone'}
        </p>
        {safari ? (
          <p className="font-body text-[12px] mt-0.5 leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            {fr
              ? 'Touche Partager puis « Sur l\u2019\u00e9cran d\u2019accueil » : l\u2019app s\u2019ouvrira en plein \u00e9cran, comme une vraie app.'
              : 'Tap Share then \u201cAdd to Home Screen\u201d: the app will open full-screen, like a native app.'}
          </p>
        ) : (
          <p className="font-body text-[12px] mt-0.5 leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            {fr
              ? 'Apple r\u00e9serve l\u2019installation \u00e0 Safari : ouvre mysolaia.ca dans Safari, puis Partager \u2192 \u00ab Sur l\u2019\u00e9cran d\u2019accueil \u00bb. Le site fonctionne aussi tr\u00e8s bien ici.'
              : 'Apple only allows installing from Safari: open mysolaia.ca in Safari, then Share \u2192 \u201cAdd to Home Screen\u201d. The site also works great right here.'}
          </p>
        )}
      </div>
      <button
        onClick={dismiss}
        aria-label={fr ? 'Fermer' : 'Dismiss'}
        className="p-1.5 -mr-1 rounded-full shrink-0 active:scale-95"
        style={{ color: 'var(--ink-faint)' }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default InstallBanner;
