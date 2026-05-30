import { PaperTheme } from './_theme';

export const RATIOS: Record<string, { w: number; h: number }> = {
  '9:16': { w: 720, h: 1280 },
  '16:9': { w: 1280, h: 720 },
  '4:5': { w: 720, h: 900 },
  '1:1': { w: 720, h: 720 },
};

export const FONTS = [
  { name: 'Playfair Display', css: '"Playfair Display",Georgia,serif' },
  { name: 'Merriweather', css: '"Merriweather",Georgia,serif' },
  { name: 'Lora', css: '"Lora",Georgia,serif' },
  { name: 'EB Garamond', css: '"EB Garamond",Georgia,serif' },
  { name: 'Cormorant', css: '"Cormorant Garamond",Georgia,serif' },
  { name: 'Baskerville', css: '"Libre Baskerville",Georgia,serif' },
  { name: 'Crimson Text', css: '"Crimson Text",Georgia,serif' },
  { name: 'PT Serif', css: '"PT Serif",Georgia,serif' },
];

export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

// ── Texture helpers ───────────────────────────────────────────────────────────
function noise(ctx: CanvasRenderingContext2D, cw: number, ch: number, count: number, op: number) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * cw, y = Math.random() * ch;
    const v = Math.random() > 0.5 ? 215 : 105;
    ctx.fillStyle = `rgba(${v},${v - 10},${v - 25},${op * Math.random()})`;
    ctx.fillRect(x, y, 1, 1);
  }
}

function crumple(ctx: CanvasRenderingContext2D, cw: number, ch: number, color: string, n: number) {
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    const x = 60 + Math.random() * (cw - 120);
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x - 30 + Math.random() * 60, ch * 0.33, x - 30 + Math.random() * 60, ch * 0.66, x + Math.random() * 40 - 20, ch);
    ctx.stroke();
  }
}

export function applyTexture(ctx: CanvasRenderingContext2D, cw: number, ch: number, texture: string, theme: PaperTheme) {
  if (theme.useGradient) {
    const g = ctx.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, theme.bgColor); g.addColorStop(1, theme.bgGradientEnd);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = theme.bgColor;
  }
  ctx.fillRect(0, 0, cw, ch);

  if (texture === 'aged') {
    const grad = ctx.createRadialGradient(cw * 0.5, ch * 0.5, cw * 0.1, cw * 0.5, ch * 0.5, cw * 0.85);
    grad.addColorStop(0, 'rgba(180,140,60,0.12)'); grad.addColorStop(1, 'rgba(100,60,10,0.28)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 40000; i++) {
      const x = Math.random() * cw, y = Math.random() * ch, a = Math.random() * 0.07;
      const v = Math.random() > 0.6 ? 180 : 80;
      ctx.fillStyle = `rgba(${v},${Math.round(v * 0.8)},${Math.round(v * 0.5)},${a})`;
      ctx.fillRect(x, y, 1 + Math.random(), 1 + Math.random());
    }
    crumple(ctx, cw, ch, 'rgba(100,70,30,0.18)', 10);
  } else if (texture === 'dark') {
    ctx.fillStyle = '#1a1a18'; ctx.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 35000; i++) {
      const x = Math.random() * cw, y = Math.random() * ch, v = Math.round(30 + Math.random() * 40);
      ctx.fillStyle = `rgba(${v},${v},${v - 5},${Math.random() * 0.06})`; ctx.fillRect(x, y, 1, 1);
    }
    crumple(ctx, cw, ch, 'rgba(255,255,255,0.06)', 6);
  } else if (texture === 'grid') {
    ctx.fillStyle = '#f7f9fc'; ctx.fillRect(0, 0, cw, ch);
    const cell = Math.round(cw / 18);
    ctx.strokeStyle = 'rgba(100,140,200,0.18)'; ctx.lineWidth = 0.7;
    for (let x = 0; x < cw; x += cell) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
    for (let y = 0; y < ch; y += cell) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(80,120,200,0.3)'; ctx.lineWidth = 1;
    for (let x = 0; x < cw; x += cell * 5) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ch); ctx.stroke(); }
    for (let y = 0; y < ch; y += cell * 5) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }
  } else if (texture === 'lined') {
    const mX = Math.round(cw * 0.12);
    ctx.strokeStyle = 'rgba(220,80,80,0.35)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(mX, 0); ctx.lineTo(mX, ch); ctx.stroke();
    const lG = Math.round(ch / 28);
    ctx.strokeStyle = 'rgba(100,140,210,0.28)'; ctx.lineWidth = 1;
    for (let y = lG; y < ch; y += lG) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cw, y); ctx.stroke(); }
    const hR = Math.round(cw * 0.018), hX = Math.round(cw * 0.035);
    [0.2, 0.5, 0.8].forEach(p => {
      const hy = Math.round(ch * p);
      ctx.beginPath(); ctx.arc(hX, hy, hR, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,195,185,0.6)'; ctx.fill();
      ctx.strokeStyle = 'rgba(160,155,145,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    });
  } else if (texture === 'torn') {
    noise(ctx, cw, ch, 28000, 0.055); crumple(ctx, cw, ch, 'rgba(120,110,90,0.14)', 8);
    const tornH = Math.round(ch * 0.04);
    ctx.beginPath(); ctx.moveTo(0, 0); let tx = 0;
    while (tx < cw) { tx += 4 + Math.random() * 12; ctx.lineTo(Math.min(tx, cw), Math.random() * tornH); }
    ctx.lineTo(cw, 0); ctx.closePath(); ctx.fillStyle = 'rgba(160,145,120,0.55)'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, ch); tx = 0;
    while (tx < cw) { tx += 4 + Math.random() * 12; ctx.lineTo(Math.min(tx, cw), ch - Math.random() * tornH); }
    ctx.lineTo(cw, ch); ctx.closePath(); ctx.fillStyle = 'rgba(160,145,120,0.55)'; ctx.fill();
  } else {
    noise(ctx, cw, ch, 30000, theme.noiseOpacity);
    crumple(ctx, cw, ch, 'rgba(120,110,90,0.15)', 8);
  }

  // vignette
  const vig = ctx.createRadialGradient(cw * 0.5, ch * 0.5, cw * 0.3, cw * 0.5, ch * 0.5, cw * 0.9);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  const vigRgb = theme.vignetteColor.startsWith('rgb(')
    ? theme.vignetteColor.replace('rgb(', 'rgba(').replace(')', `,${theme.vignetteOpacity})`)
    : `rgba(0,0,0,${theme.vignetteOpacity})`;
  vig.addColorStop(1, vigRgb);
  ctx.fillStyle = vig; ctx.fillRect(0, 0, cw, ch);
}

// ── Body renderer — everything blurred except the keyword highlight ───────────
export function renderBodyLines(
  ctx: CanvasRenderingContext2D,
  allLines: (string | null)[],
  keyword: string,
  theme: PaperTheme,
  PAD: number,
  FS: number,
  LINE_H: number,
  BODY: string,
  BOLD: string,
  startY: number,
  maxY: number,
  xBase: number,
  blurBody: boolean,
): void {
  const kwLower = keyword.toLowerCase();
  let kwFound = false;
  let y = startY;

  // Pass 1 — draw all text blurred (if blurBody) or faded
  ctx.save();
  if (blurBody) ctx.filter = 'blur(7px)';
  for (let i = 0; i < allLines.length; i++) {
    if (y > maxY) break;
    const line = allLines[i];
    if (line === null) { y += Math.round(LINE_H * 0.5); continue; }
    const alpha = 0.55;
    ctx.font = BODY;
    ctx.fillStyle = `rgba(26,22,16,${alpha})`;
    ctx.fillText(line, xBase + PAD, y);
    y += LINE_H;
  }
  ctx.restore();

  // Pass 2 — redraw keyword line crisp on top with highlight
  y = startY;
  for (let i = 0; i < allLines.length; i++) {
    if (y > maxY) break;
    const line = allLines[i];
    if (line === null) { y += Math.round(LINE_H * 0.5); continue; }
    if (!kwFound) {
      const kwIdx = line.toLowerCase().indexOf(kwLower);
      if (kwIdx !== -1) {
        kwFound = true;
        const before = line.substring(0, kwIdx);
        const kw = line.substring(kwIdx, kwIdx + keyword.length);
        const after = line.substring(kwIdx + keyword.length);
        ctx.font = BODY; const bw = ctx.measureText(before).width;
        ctx.font = BOLD; const kwW = ctx.measureText(kw).width;
        const hPad = 12, vPad = 8;

        // Clear the blur behind the highlight line with a solid bg strip
        ctx.fillStyle = theme.bgColor.startsWith('#') ? theme.bgColor : '#ede8df';
        ctx.fillRect(xBase + PAD - 2, y - FS - 2, (xBase === 0 ? ctx.canvas.width - PAD * 2 + 4 : kwW + bw + 100), LINE_H + 4);

        // Highlight rect — slightly rounded feel via shadow
        ctx.save();
        ctx.shadowColor = theme.highlightColor;
        ctx.shadowBlur = 4;
        ctx.fillStyle = theme.highlightColor;
        ctx.fillRect(xBase + PAD + bw - hPad, y - FS + vPad / 2, kwW + hPad * 2, FS + vPad);
        ctx.restore();

        // Redraw the full line crisp
        ctx.font = BODY; ctx.fillStyle = theme.bodyColor;
        ctx.fillText(before, xBase + PAD, y);
        ctx.font = BOLD; ctx.fillStyle = theme.highlightTextColor;
        ctx.fillText(kw, xBase + PAD + bw, y);
        ctx.font = BODY; ctx.fillStyle = theme.bodyColor;
        ctx.fillText(after, xBase + PAD + bw + kwW, y);
      }
    }
    y += LINE_H;
  }
}


// ── Main draw function ────────────────────────────────────────────────────────
// matchCut = true: same font for all frames + keyword at deterministic Y position
export function drawFrame(opts: {
  keyword: string;
  breadcrumb: string;
  headline: string;
  bodyText: string;
  fontObj: typeof FONTS[0];
  ratio: string;
  texture: string;
  theme: PaperTheme;
  blurBody: boolean;
  matchCut: boolean;
  frameIdx?: number;
}): string {
  const { keyword, breadcrumb, headline, bodyText, fontObj, ratio, texture, theme, blurBody, matchCut } = opts;
  const { w: cw, h: ch } = RATIOS[ratio] || RATIOS['9:16'];
  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  applyTexture(ctx, cw, ch, texture, theme);
  const f = fontObj.css;

  const sentences = (t: string) =>
    t.trim().split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);

  if (ratio === '9:16') {
    const s = cw / 720;
    const FS = Math.round(36 * s), LINE_H = Math.round(FS * 1.5);
    const HL_FS = Math.round(50 * s), BC_FS = Math.round(24 * s);
    const PAD = Math.round(52 * s), MAXW = cw - PAD * 2;
    const BODY = `${FS}px ${f}`, BOLD = `bold ${FS}px ${f}`;

    // ── Fixed layout positions (match-cut safe) ───────────────────────────
    const Y_BC = Math.round(110 * s);         // breadcrumb baseline
    const Y_RULE1 = Y_BC + Math.round(42 * s);  // rule after breadcrumb
    const Y_HL_START = Y_RULE1 + Math.round(60 * s); // headline start
    // headline max 2 lines, each HL_FS*1.22 tall
    const MAX_HL_LINES = 2;
    const HL_LINE_H = Math.round(HL_FS * 1.22);
    const Y_BODY_START = Y_HL_START + MAX_HL_LINES * HL_LINE_H + Math.round(30 * s);

    // breadcrumb
    ctx.font = `${BC_FS}px ${f}`; ctx.fillStyle = theme.breadcrumbColor;
    ctx.fillText(breadcrumb, PAD, Y_BC);
    // rule
    ctx.strokeStyle = theme.dividerColor; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, Y_RULE1); ctx.lineTo(cw - PAD, Y_RULE1); ctx.stroke();
    // headline (clamped to MAX_HL_LINES)
    ctx.font = `bold ${HL_FS}px ${f}`; ctx.fillStyle = theme.headlineColor;
    const hlLines = wrapText(ctx, headline, MAXW).slice(0, MAX_HL_LINES);
    hlLines.forEach((ln, i) => ctx.fillText(ln, PAD, Y_HL_START + i * HL_LINE_H));
    // second rule
    const Y_RULE2 = Y_HL_START + MAX_HL_LINES * HL_LINE_H + Math.round(8 * s);
    ctx.strokeStyle = theme.dividerColor; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(PAD, Y_RULE2); ctx.lineTo(cw - PAD, Y_RULE2); ctx.stroke();
    // body
    const allLines: (string | null)[] = []; ctx.font = BODY;
    for (const st of sentences(bodyText)) { wrapText(ctx, st, MAXW).forEach(l => allLines.push(l)); allLines.push(null); }
    renderBodyLines(ctx, allLines, keyword, theme, PAD, FS, LINE_H, BODY, BOLD, Y_BODY_START, ch - Math.round(70 * s), 0, blurBody);
    // font tag bottom right
    ctx.font = `italic ${Math.round(18 * s)}px ${f}`; ctx.fillStyle = theme.fontNameColor;
    if (!matchCut) {
      const fw = ctx.measureText(fontObj.name).width;
      ctx.fillText(fontObj.name, cw - PAD - fw, ch - Math.round(36 * s));
    }

  } else if (ratio === '16:9') {
    const s = ch / 720;
    const FS = Math.round(28 * s), LINE_H = Math.round(FS * 1.5);
    const HL_FS = Math.round(54 * s), BC_FS = Math.round(20 * s);
    const PAD = Math.round(56 * s);
    const BODY = `${FS}px ${f}`, BOLD = `bold ${FS}px ${f}`;
    const leftW = Math.round(cw * 0.43), colGap = Math.round(cw * 0.04);
    const rightX = leftW + colGap, rightW = cw - rightX - PAD;

    const Y_BC = PAD + BC_FS;
    const Y_RULE = Y_BC + Math.round(18 * s);
    const Y_HL = Y_RULE + Math.round(26 * s);
    const MAX_HL = 3, HL_H = Math.round(HL_FS * 1.18);
    const Y_BODY = PAD + FS;

    ctx.font = `${BC_FS}px ${f}`; ctx.fillStyle = theme.breadcrumbColor; ctx.fillText(breadcrumb, PAD, Y_BC);
    ctx.strokeStyle = theme.dividerColor; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(leftW, PAD); ctx.lineTo(leftW, ch - PAD); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAD, Y_RULE); ctx.lineTo(leftW - PAD, Y_RULE); ctx.stroke();
    ctx.font = `bold ${HL_FS}px ${f}`; ctx.fillStyle = theme.headlineColor;
    wrapText(ctx, headline, leftW - PAD * 2).slice(0, MAX_HL).forEach((ln, i) => ctx.fillText(ln, PAD, Y_HL + i * HL_H));
    ctx.font = `italic ${Math.round(16 * s)}px ${f}`; ctx.fillStyle = theme.fontNameColor;
    if (!matchCut) ctx.fillText(fontObj.name, PAD, ch - Math.round(28 * s));
    const allLines: (string | null)[] = []; ctx.font = BODY;
    for (const st of sentences(bodyText)) { wrapText(ctx, st, rightW).forEach(l => allLines.push(l)); allLines.push(null); }
    renderBodyLines(ctx, allLines, keyword, theme, 0, FS, LINE_H, BODY, BOLD, Y_BODY, ch - PAD, rightX, blurBody);

  } else {
    // 4:5 and 1:1
    const s = cw / 720;
    const is45 = ratio === '4:5';
    const FS = Math.round((is45 ? 32 : 30) * s), LINE_H = Math.round(FS * 1.5);
    const HL_FS = Math.round((is45 ? 54 : 50) * s), BC_FS = Math.round(22 * s);
    const PAD = Math.round(52 * s), MAXW = cw - PAD * 2;
    const BODY = `${FS}px ${f}`, BOLD = `bold ${FS}px ${f}`;
    if (is45) { ctx.fillStyle = 'rgba(26,22,16,0.07)'; ctx.fillRect(0, 0, cw, Math.round(7 * s)); }
    const Y_BC = Math.round(76 * s);
    const Y_RULE = Y_BC + Math.round(32 * s);
    const Y_HL = Y_RULE + Math.round(40 * s);
    const MAX_HL = 2, HL_H = Math.round(HL_FS * 1.15);
    const Y_BODY = Y_HL + MAX_HL * HL_H + Math.round(22 * s);

    ctx.font = `${BC_FS}px ${f}`; ctx.fillStyle = theme.breadcrumbColor; ctx.fillText(breadcrumb, PAD, Y_BC);
    ctx.strokeStyle = theme.dividerColor; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, Y_RULE); ctx.lineTo(cw - PAD, Y_RULE); ctx.stroke();
    ctx.font = `bold ${HL_FS}px ${f}`; ctx.fillStyle = theme.headlineColor;
    wrapText(ctx, headline, MAXW).slice(0, MAX_HL).forEach((ln, i) => ctx.fillText(ln, PAD, Y_HL + i * HL_H));
    if (!is45) {
      ctx.strokeStyle = theme.dividerColor; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(PAD, Y_BODY - Math.round(14 * s)); ctx.lineTo(cw - PAD, Y_BODY - Math.round(14 * s)); ctx.stroke();
    }
    const allLines: (string | null)[] = []; ctx.font = BODY;
    for (const st of sentences(bodyText)) { wrapText(ctx, st, MAXW).forEach(l => allLines.push(l)); allLines.push(null); }
    renderBodyLines(ctx, allLines, keyword, theme, PAD, FS, LINE_H, BODY, BOLD, Y_BODY, ch - Math.round(55 * s), 0, blurBody);
    ctx.font = `italic ${Math.round(17 * s)}px ${f}`; ctx.fillStyle = theme.fontNameColor;
    if (!matchCut) { const fw = ctx.measureText(fontObj.name).width; ctx.fillText(fontObj.name, cw - PAD - fw, ch - Math.round(30 * s)); }
  }

  return canvas.toDataURL('image/png');
}

export async function preloadFonts() {
  const c = document.createElement('canvas'), ctx = c.getContext('2d')!;
  FONTS.forEach(f => { ctx.font = `16px ${f.css}`; ctx.fillText('a', 0, 0); });
  await new Promise(r => setTimeout(r, 600));
}
