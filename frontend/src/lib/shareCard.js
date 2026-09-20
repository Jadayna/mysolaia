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

export async function buildShareCard({ lang = 'fr', streak = 0, routineTitle = '', userName = '', soins30 = '0', exfo30 = '0', badges = [] }) {
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
    { v: String(badges.length), l: lang === 'fr' ? 'victoires' : 'badges' },
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

  const MAXB = 8;
  let shown = badges.slice(0, MAXB);
  let extra = 0;
  if (badges.length > MAXB) { shown = badges.slice(0, MAXB - 1); extra = badges.length - (MAXB - 1); }

  if (shown.length === 0) {
    ctx.fillStyle = ink;
    ctx.globalAlpha = 0.7;
    ctx.font = 'italic 38px Georgia, serif';
    ctx.fillText(lang === 'fr' ? '« Chaque jour compte. ✨ »' : '"Every day counts. ✨"', W / 2, 1290);
    ctx.globalAlpha = 1;
  } else {
    const items = extra > 0 ? [...shown, { more: true, n: extra }] : shown;
    const R = 60, GAP = 22;
    const totalW = items.length * R * 2 + (items.length - 1) * GAP;
    let cx = (W - totalW) / 2 + R;
    const cy = 1290;
    ctx.textBaseline = 'middle';
    items.forEach((b) => {
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      if (b.more) {
        ctx.fillStyle = 'rgba(182,130,53,0.16)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(182,130,53,0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = gold;
        ctx.font = '700 44px Georgia, serif';
        ctx.fillText('+' + b.n, cx, cy + 2);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.78)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(182,130,53,0.55)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = '64px Georgia, serif';
        ctx.fillText(b.icon || '✨', cx, cy + 4);
      }
      cx += R * 2 + GAP;
    });
    ctx.textBaseline = 'alphabetic';
  }

  // Carte routine
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  roundRect(ctx, 120, 1400, W - 240, 250, 48);
  ctx.fill();
  ctx.strokeStyle = 'rgba(182,130,53,0.45)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.font = 'italic 44px Georgia, serif';
  const rt = routineTitle || (lang === 'fr' ? 'Ma routine ✨' : 'My routine ✨');
  // Coupe le titre s'il est trop long
  const short = rt.length > 34 ? rt.slice(0, 33) + '…' : rt;
  ctx.fillText(short, W / 2, 1495);
  ctx.globalAlpha = 0.6;
  ctx.font = '38px Georgia, serif';
  const dateStr = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.fillText(dateStr, W / 2, 1560);
  if (userName) {
    ctx.fillText(userName, W / 2, 1615);
  }
  ctx.globalAlpha = 1;

  // Pied de page
  ctx.fillStyle = gold;
  ctx.font = '600 40px Georgia, serif';
  ctx.fillText('✨ mysolaia.ca ✨', W / 2, H - 140);

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
