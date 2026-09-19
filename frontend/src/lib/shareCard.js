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

export async function buildShareCard({ lang = 'fr', streak = 0, routineTitle = '', userName = '' }) {
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

  // Streak géant
  ctx.font = '120px Georgia, serif';
  ctx.fillText('🔥', W / 2, 620);
  ctx.fillStyle = ink;
  ctx.font = '700 190px Georgia, serif';
  ctx.fillText(String(streak), W / 2, 830);
  ctx.fillStyle = gold;
  ctx.font = '600 52px Georgia, serif';
  const daysLabel = lang === 'fr' ? (streak > 1 ? 'jours de suite' : 'jour de suite') : (streak > 1 ? 'day streak' : 'day streak');
  ctx.fillText(daysLabel, W / 2, 910);

  // Carte routine
  ctx.fillStyle = 'rgba(255,255,255,0.72)';
  roundRect(ctx, 120, 1020, W - 240, 330, 48);
  ctx.fill();
  ctx.strokeStyle = 'rgba(182,130,53,0.45)';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = ink;
  ctx.font = 'italic 44px Georgia, serif';
  const rt = routineTitle || (lang === 'fr' ? 'Ma routine ✨' : 'My routine ✨');
  // Coupe le titre s'il est trop long
  const short = rt.length > 34 ? rt.slice(0, 33) + '…' : rt;
  ctx.fillText(short, W / 2, 1140);
  ctx.globalAlpha = 0.6;
  ctx.font = '38px Georgia, serif';
  const dateStr = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.fillText(dateStr, W / 2, 1215);
  if (userName) {
    ctx.fillText(userName, W / 2, 1290);
  }
  ctx.globalAlpha = 1;

  // Pied de page
  ctx.fillStyle = gold;
  ctx.font = '600 40px Georgia, serif';
  ctx.fillText('✨ mysolaia ✨', W / 2, H - 180);

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
