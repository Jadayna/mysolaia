// Carte de partage "Ma victoire" — génère une image verticale (format Story
// 1080x1920) dessinée sur canvas, partageable via Web Share API ou téléchargée.

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Coupe un texte pour qu'il tienne dans maxW px (avec …)
function fitText(ctx, text, maxW, font) {
  const full = String(text || '');
  ctx.font = font;
  if (ctx.measureText(full).width <= maxW) return full;
  let t = full;
  while (t.length > 4 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

// Charge une image (logo) pour le dessin canvas
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function buildShareCard({ lang = 'fr', streak = 0, routineTitle = '', userName = '', soins30 = '0', exfo30 = '0', badges = [], badgesTotal = null }) {
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Fond crème -> doré subtil
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#FBF7F1');
  bg.addColorStop(0.55, '#F6EEE2');
  bg.addColorStop(1, '#EFE0C8');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Halo doré
  const halo = ctx.createRadialGradient(W / 2, H * 0.32, 60, W / 2, H * 0.32, 520);
  halo.addColorStop(0, 'rgba(182,130,53,0.22)');
  halo.addColorStop(1, 'rgba(182,130,53,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  const ink = '#2B2118';
  const gold = '#B68235';
  ctx.textAlign = 'center';

  // Marque
  ctx.fillStyle = gold;
  ctx.font = '600 44px Georgia, serif';
  ctx.fillText('M Y S O L A I A', W / 2, 210);
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.55;
  ctx.font = 'italic 34px Georgia, serif';
  ctx.fillText(lang === 'fr' ? 'La routine qui se construit toute seule' : 'The routine that builds itself', W / 2, 268);
  ctx.globalAlpha = 1;

  // Anneaux décoratifs autour du streak
  ctx.strokeStyle = 'rgba(182,130,53,0.26)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(W / 2, 690, 280, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(182,130,53,0.13)';
  ctx.beginPath(); ctx.arc(W / 2, 690, 314, 0, Math.PI * 2); ctx.stroke();

  // Streak géant
  ctx.font = '110px Georgia, serif';
  ctx.fillText('🔥', W / 2, 600);
  ctx.fillStyle = ink;
  ctx.font = '700 180px Georgia, serif';
  ctx.fillText(String(streak), W / 2, 800);
  ctx.fillStyle = gold;
  ctx.font = '600 50px Georgia, serif';
  ctx.fillText(lang === 'fr' ? (streak > 1 ? 'jours de suite' : 'jour de suite') : 'day streak', W / 2, 880);

  // Mini-statistiques : 30 derniers jours + victoires
  const statsDefs = [
    { v: String(soins30), l: lang === 'fr' ? 'soins · 30 j' : 'treatments · 30 d' },
    { v: String(exfo30), l: lang === 'fr' ? 'exfoliations · 30 j' : 'exfoliations · 30 d' },
    { v: String(badgesTotal !== null ? badgesTotal : badges.length), l: lang === 'fr' ? 'victoires' : 'badges' },
  ];
  statsDefs.forEach((s, i) => {
    const x = W * (1 / 6 + i / 3);
    ctx.fillStyle = ink;
    ctx.font = '700 66px Georgia, serif';
    ctx.fillText(s.v, x, 1000);
    ctx.fillStyle = gold;
    ctx.font = '400 28px Georgia, serif';
    ctx.fillText(s.l, x, 1050);
  });

  // Séparateur fin
  ctx.strokeStyle = 'rgba(182,130,53,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(180, 1110); ctx.lineTo(W - 180, 1110); ctx.stroke();

  // Victoires débloquées (ou citation si aucune)
  ctx.fillStyle = gold;
  ctx.font = '600 34px Georgia, serif';
  ctx.fillText(lang === 'fr' ? 'M E S   V I C T O I R E S' : 'M Y   V I C T O R I E S', W / 2, 1180);

  // Top 3 des victoires les plus prestigieuses, avec explications
  const top3 = [...badges]
    .filter((b) => b && (b.title || b.icon))
    .sort((a, b) => (b.rank || 0) - (a.rank || 0))
    .slice(0, 3);

  if (top3.length === 0) {
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.7;
    ctx.font = 'italic 38px Georgia, serif';
    ctx.fillText(lang === 'fr' ? '« Chaque jour compte. ✨ »' : '"Every day counts. ✨"', W / 2, 1290);
    ctx.globalAlpha = 1;
  } else {
    const rowsY = [1265, 1395, 1525];
    top3.forEach((b, i) => {
      const cy = rowsY[i];
      // Pastille
      ctx.beginPath(); ctx.arc(205, cy, 52, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.78)'; ctx.fill();
      ctx.strokeStyle = 'rgba(182,130,53,0.55)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '58px Georgia, serif';
      ctx.fillText(b.icon || '✨', 205, cy + 3);
      // Titre + description
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = ink;
      ctx.fillText(fitText(ctx, b.title, 700, '700 40px Georgia, serif'), 285, cy - 8);
      ctx.globalAlpha = 0.62;
      ctx.fillText(fitText(ctx, b.desc, 700, '400 30px Georgia, serif'), 285, cy + 38);
      ctx.globalAlpha = 1;
    });
    ctx.textAlign = 'center';
  }

  // Carte routine
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  roundRect(ctx, 120, 1600, W - 240, 175, 40);
  ctx.fill();
  ctx.strokeStyle = 'rgba(182,130,53,0.45)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = ink;
  const rt = routineTitle || (lang === 'fr' ? 'Ma routine ✨' : 'My routine ✨');
  ctx.fillText(fitText(ctx, rt, 760, 'italic 44px Georgia, serif'), W / 2, 1668);
  ctx.globalAlpha = 0.6;
  const dateStr = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const sub = userName ? `${dateStr} · ${userName}` : dateStr;
  ctx.fillText(fitText(ctx, sub, 760, '38px Georgia, serif'), W / 2, 1722);
  ctx.globalAlpha = 1;

  // Pied de page : le vrai logo
  try {
    const logoImg = await loadImage('/icon-512.png');
    const LS = 64;
    ctx.drawImage(logoImg, W / 2 - LS / 2, 1792, LS, LS);
  } catch (e) { /* texte seulement */ }
  ctx.fillStyle = gold;
  ctx.font = '600 30px Georgia, serif';
  ctx.fillText('mysolaia.ca', W / 2, 1894);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('canvas'));
    }, 'image/png');
  });
}

// Partage natif si dispo, sinon téléchargement du PNG.
export async function shareVictory(opts) {
  const blob = await buildShareCard(opts);
  const file = new File([blob], 'mysolaia-victoire.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: 'MySolaia',
      text: opts.lang === 'fr' ? `🔥 ${opts.streak} jours de suite avec MySolaia !` : `🔥 ${opts.streak}-day streak with MySolaia!`,
    });
    return 'shared';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mysolaia-victoire.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}
