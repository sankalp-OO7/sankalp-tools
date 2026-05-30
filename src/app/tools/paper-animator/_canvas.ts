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

const FILLER_SENTENCES = [
  "The local council yesterday approved the new infrastructure development plan after hours of debate.",
  "Market analysts predict a sharp rise in technological investments over the coming fiscal quarter.",
  "Local galleries are hosting a retrospective exhibition showcasing post-war industrial design prints.",
  "A sudden downpour caused minor disruptions in the morning transit, delaying several early trains.",
  "Recent archeological findings in the valley suggest a thriving mercantile community existed here.",
  "A new study reveals significant shifts in public transit usage across major metropolitan areas.",
  "State treasury representatives announced surplus revenues, hinting at possible tax reliefs next year.",
  "The annual floral exhibition opened this morning, drawing hundreds of vintage horticulture enthusiasts.",
  "Industrial output rose by four percent, exceeding early forecasts and signaling economic recovery.",
  "Public library usage reached record highs this winter, showing renewed interest in physical newspapers.",
  "The international treaty on environmental conservation was signed by forty nations in Geneva.",
  "A newly developed digital mapping software is revolutionizing municipal zoning strategies.",
  "Several traditional baking houses are hosting workshops to preserve century-old culinary arts.",
  "Astronomers reported unusual cosmic solar flares visible through standard high-power amateur telescopes.",
  "The municipal archives published rare black and white photographic prints documenting early transit."
];

function getDeterministicFillers(count: number, seed: number): string {
  const res: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.abs(Math.round(Math.sin(seed + i) * 100)) % FILLER_SENTENCES.length;
    res.push(FILLER_SENTENCES[idx]);
  }
  return res.join(' ');
}

// Pack text tightly character-by-character, protecting the keyword from being split across lines
export function wrapTextCharLevel(ctx: CanvasRenderingContext2D, text: string, maxW: number, keyword: string): string[] {
  const lines: string[] = [];
  let currentLine = '';
  const kwLower = keyword.toLowerCase();
  
  // Clean consecutive whitespaces
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  let i = 0;
  while (i < cleanText.length) {
    const remaining = cleanText.substring(i);
    if (keyword && remaining.toLowerCase().startsWith(kwLower)) {
      // Consume keyword as a single unbreakable token
      const token = cleanText.substring(i, i + keyword.length);
      const testLine = currentLine + token;
      if (ctx.measureText(testLine).width > maxW) {
        lines.push(currentLine.trim());
        currentLine = token;
      } else {
        currentLine = testLine;
      }
      i += keyword.length;
    } else {
      // Consume regular single character token
      const token = cleanText[i];
      const testLine = currentLine + token;
      if (ctx.measureText(testLine).width > maxW) {
        lines.push(currentLine.trim());
        currentLine = token;
      } else {
        currentLine = testLine;
      }
      i++;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine.trim());
  }
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
  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    const x = 60 + Math.random() * (cw - 120);
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x - 30 + Math.random() * 60, ch * 0.33, x - 30 + Math.random() * 60, ch * 0.66, x + Math.random() * 40 - 20, ch);
    ctx.stroke();
  }
}

// ── Body renderer — depth-of-field radial blur outward + center fixated highlight with ±4px pop ──
export function renderBodyLines(
  ctx: CanvasRenderingContext2D,
  allLines: string[],
  keyword: string,
  theme: PaperTheme,
  PAD: number,
  FS: number,
  LINE_H: number,
  BODY: string,
  BOLD_FONT_FAMILY: string,
  xBase: number,
  blurBody: boolean,
  ch: number,
  cw: number,
  frameIdx: number,
  blurStrength: number,
): void {
  const kwLower = keyword.toLowerCase();
  let kwLineIdx = -1;

  // Scan to find which line index contains the keyword
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i];
    if (line && line.toLowerCase().includes(kwLower)) {
      kwLineIdx = i;
      break;
    }
  }

  // Fallback if not found: center the middle line
  if (kwLineIdx === -1) {
    kwLineIdx = Math.floor(allLines.length / 2);
  }

  const centerY = ch * 0.5;
  const colCenterX = xBase > 0 ? xBase + (cw - xBase - PAD) * 0.5 : cw * 0.5;

  // Pass 1 — draw all other text lines blurred (lens depth-of-field effect from center outward!)
  ctx.save();
  ctx.textAlign = 'center';
  for (let i = 0; i < allLines.length; i++) {
    if (i === kwLineIdx) continue; // Skip keyword line in blurred pass
    const line = allLines[i];
    if (!line) continue;

    // Linear camera lens depth-of-field blur: strength increases further from keyword line
    const dist = Math.abs(i - kwLineIdx);
    const lineBlur = blurBody ? Math.min(24, dist * blurStrength) : 0;

    ctx.save();
    if (lineBlur > 0.4) {
      ctx.filter = `blur(${lineBlur.toFixed(1)}px)`;
    }
    const y = centerY + (i - kwLineIdx) * LINE_H;
    ctx.font = BODY;
    ctx.fillStyle = theme.bodyColor;
    ctx.fillText(line, colCenterX, y);
    ctx.restore();
  }
  ctx.restore();

  // Pass 2 — draw the keyword line completely crisp with highlighter marker behind the keyword
  const line = allLines[kwLineIdx];
  if (line) {
    const y = centerY;
    const kwIdx = line.toLowerCase().indexOf(kwLower);

    if (kwIdx !== -1) {
      const before = line.substring(0, kwIdx);
      const kw = line.substring(kwIdx, kwIdx + keyword.length);
      const after = line.substring(kwIdx + keyword.length);

      // Fluctuate bold keyword size by ±4px frame-by-frame for dynamic pop animation
      const sizeFluctuations = [2, -2, 4, -4, 1, -1];
      const fluctuation = sizeFluctuations[frameIdx % sizeFluctuations.length];
      const boldFS = FS + fluctuation;
      const kwFont = `bold ${boldFS}px ${BOLD_FONT_FAMILY}`;

      ctx.font = BODY; const bw = ctx.measureText(before).width;
      ctx.font = kwFont; const kwW = ctx.measureText(kw).width;

      // Mathematically position the highlighted keyword EXACTLY at the center of the X-axis (colCenterX)
      ctx.save();
      ctx.textAlign = 'left';
      const kwX = colCenterX - kwW * 0.5;
      const beforeX = kwX - bw;
      const afterX = kwX + kwW;

      // Draw beautiful hand-drawn wobbly highlighter stroke centered perfectly
      ctx.save();
      ctx.strokeStyle = theme.highlightColor;
      ctx.lineWidth = boldFS * 1.18;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(kwX - 4, y - boldFS * 0.35 + 0.8);
      ctx.lineTo(kwX + kwW + 4, y - boldFS * 0.35 - 0.8);
      ctx.stroke();
      ctx.restore();

      // Render crisp centered text parts
      ctx.font = BODY; ctx.fillStyle = theme.bodyColor;
      ctx.fillText(before, beforeX, y);
      ctx.font = kwFont; ctx.fillStyle = theme.highlightTextColor;
      ctx.fillText(kw, kwX, y);
      ctx.font = BODY; ctx.fillStyle = theme.bodyColor;
      ctx.fillText(after, afterX, y);
      ctx.restore();
    } else {
      // Crisp center fallback
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = BODY; ctx.fillStyle = theme.bodyColor;
      ctx.fillText(line, colCenterX, y);
      ctx.restore();
    }
  }
}

// ── Main draw function ────────────────────────────────────────────────────────
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
  blurStrength?: number;
}): string {
  const {
    keyword, breadcrumb, headline, bodyText, fontObj, ratio, texture, theme,
    blurBody, matchCut, frameIdx = 0, blurStrength = 1.8
  } = opts;
  const { w: cw, h: ch } = RATIOS[ratio] || RATIOS['9:16'];
  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d')!;

  // 1. Draw base color gradient
  if (theme.useGradient) {
    const g = ctx.createLinearGradient(0, 0, 0, ch);
    g.addColorStop(0, theme.bgColor); g.addColorStop(1, theme.bgGradientEnd);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = theme.bgColor;
  }
  ctx.fillRect(0, 0, cw, ch);

  const f = fontObj.css;

  if (ratio === '9:16') {
    const s = cw / 720;
    
    // Deterministic randomizations per frame for authentic vintage print camera shake/wobble!
    const padRand = Math.sin(frameIdx * 7.7) * Math.round(5 * s);
    const fsRand = Math.sin(frameIdx * 3.3) > 0 ? 1 : -1;
    const lhRand = Math.sin(frameIdx * 11.2) * Math.round(2 * s);

    const FS = Math.round(38 * s) + fsRand;
    const LINE_H = Math.round(FS * 1.55) + lhRand;
    const HL_FS = Math.round(50 * s);
    const BC_FS = Math.round(24 * s);
    const PAD = Math.round(52 * s) + padRand;
    const MAXW = cw - PAD * 2;
    
    const BODY = `${FS}px ${f}`;

    // Draw breadcrumb and rule (slightly blurred if blurBody) - Centered!
    ctx.save();
    if (blurBody) ctx.filter = 'blur(4px)'; // Less default base blur
    ctx.textAlign = 'center';
    const Y_BC = Math.round(110 * s);
    ctx.font = `${BC_FS}px ${f}`; ctx.fillStyle = theme.breadcrumbColor;
    ctx.fillText(breadcrumb, cw * 0.5, Y_BC);
    const Y_RULE1 = Y_BC + Math.round(42 * s);
    ctx.strokeStyle = theme.dividerColor; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(PAD, Y_RULE1); ctx.lineTo(cw - PAD, Y_RULE1); ctx.stroke();
    ctx.restore();

    // Draw headline (motion-blurred, centered, no clamp) - Centered and overflow!
    ctx.save();
    if (blurBody) ctx.filter = 'blur(4px)'; // Less default base blur
    ctx.textAlign = 'center';
    const Y_HL_START = Y_RULE1 + Math.round(60 * s);
    const HL_LINE_H = Math.round(HL_FS * 1.22);
    ctx.font = `bold ${HL_FS}px ${f}`; ctx.fillStyle = theme.headlineColor;
    const hlLines = wrapTextCharLevel(ctx, headline, MAXW, keyword); // Character-level wrap!
    hlLines.forEach((ln, i) => ctx.fillText(ln, cw * 0.5, Y_HL_START + i * HL_LINE_H));
    const Y_RULE2 = Y_HL_START + hlLines.length * HL_LINE_H + Math.round(8 * s);
    ctx.strokeStyle = theme.dividerColor; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(PAD, Y_RULE2); ctx.lineTo(cw - PAD, Y_RULE2); ctx.stroke();
    ctx.restore();

    // Generate deterministic filler sentences to prepend/append for chaotic newspaper paragraph overflow!
    const prependCount = 8 + (Math.abs(Math.round(Math.sin(frameIdx * 3.3) * 100)) % 7);
    const appendCount = 8 + (Math.abs(Math.round(Math.sin(frameIdx * 7.7) * 100)) % 7);
    const prependedText = getDeterministicFillers(prependCount, frameIdx * 5);
    const appendedText = getDeterministicFillers(appendCount, frameIdx * 13);
    const fullBodyText = `${prependedText} ${bodyText} ${appendedText}`;

    // Draw body lines tightly packed as a solid continuous overflowing paragraph column
    ctx.font = BODY;
    const allLines = wrapTextCharLevel(ctx, fullBodyText, MAXW, keyword);

    renderBodyLines(ctx, allLines, keyword, theme, PAD, FS, LINE_H, BODY, f, 0, blurBody, ch, cw, frameIdx, blurStrength);

    // Font name bottom tag
    ctx.save();
    if (blurBody) ctx.filter = 'blur(4px)';
    ctx.font = `italic ${Math.round(18 * s)}px ${f}`; ctx.fillStyle = theme.fontNameColor;
    if (!matchCut) {
      ctx.fillText(fontObj.name, cw * 0.5, ch - Math.round(36 * s));
    }
    ctx.restore();

  } else if (ratio === '16:9') {
    const s = ch / 720;
    const FS = Math.round(28 * s), LINE_H = Math.round(FS * 1.5);
    const HL_FS = Math.round(54 * s), BC_FS = Math.round(20 * s);
    const PAD = Math.round(56 * s);
    const BODY = `${FS}px ${f}`;
    const leftW = Math.round(cw * 0.43), colGap = Math.round(cw * 0.04);
    const rightX = leftW + colGap, rightW = cw - rightX - PAD;

    // Draw left column (blurred)
    ctx.save();
    if (blurBody) ctx.filter = 'blur(4px)';
    const Y_BC = PAD + BC_FS;
    ctx.font = `${BC_FS}px ${f}`; ctx.fillStyle = theme.breadcrumbColor; ctx.fillText(breadcrumb, leftW * 0.5, Y_BC);
    ctx.strokeStyle = theme.dividerColor; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(leftW, PAD); ctx.lineTo(leftW, ch - PAD); ctx.stroke();
    const Y_RULE = Y_BC + Math.round(18 * s);
    ctx.beginPath(); ctx.moveTo(PAD, Y_RULE); ctx.lineTo(leftW - PAD, Y_RULE); ctx.stroke();
    ctx.font = `bold ${HL_FS}px ${f}`; ctx.fillStyle = theme.headlineColor;
    const HL_H = Math.round(HL_FS * 1.18);
    wrapTextCharLevel(ctx, headline, leftW - PAD * 2, keyword).forEach((ln, i) => ctx.fillText(ln, leftW * 0.5, Y_RULE + Math.round(26 * s) + i * HL_H));
    ctx.font = `italic ${Math.round(16 * s)}px ${f}`; ctx.fillStyle = theme.fontNameColor;
    if (!matchCut) ctx.fillText(fontObj.name, leftW * 0.5, ch - Math.round(28 * s));
    ctx.restore();

    // Deterministic random paragraph overflow
    const prependCount = 4 + (Math.abs(Math.round(Math.sin(frameIdx * 3.3) * 100)) % 4);
    const appendCount = 4 + (Math.abs(Math.round(Math.sin(frameIdx * 7.7) * 100)) % 4);
    const prependedText = getDeterministicFillers(prependCount, frameIdx * 5);
    const appendedText = getDeterministicFillers(appendCount, frameIdx * 13);
    const fullBodyText = `${prependedText} ${bodyText} ${appendedText}`;

    // Draw right column body lines with perfect vertical centering on keyword line
    ctx.font = BODY;
    const allLines = wrapTextCharLevel(ctx, fullBodyText, rightW, keyword);

    renderBodyLines(ctx, allLines, keyword, theme, PAD, FS, LINE_H, BODY, f, rightX, blurBody, ch, cw, frameIdx, blurStrength);

  } else {
    // 4:5 and 1:1 ratios
    const s = cw / 720;
    const is45 = ratio === '4:5';
    const FS = Math.round((is45 ? 32 : 30) * s), LINE_H = Math.round(FS * 1.5);
    const HL_FS = Math.round((is45 ? 54 : 50) * s), BC_FS = Math.round(22 * s);
    const PAD = Math.round(52 * s), MAXW = cw - PAD * 2;
    const BODY = `${FS}px ${f}`;

    ctx.save();
    if (blurBody) ctx.filter = 'blur(4px)';
    if (is45) { ctx.fillStyle = 'rgba(26,22,16,0.07)'; ctx.fillRect(0, 0, cw, Math.round(7 * s)); }
    const Y_BC = Math.round(76 * s);
    ctx.font = `${BC_FS}px ${f}`; ctx.fillStyle = theme.breadcrumbColor; ctx.fillText(breadcrumb, cw * 0.5, Y_BC);
    const Y_RULE = Y_BC + Math.round(32 * s);
    ctx.strokeStyle = theme.dividerColor; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(PAD, Y_RULE); ctx.lineTo(cw - PAD, Y_RULE); ctx.stroke();
    ctx.font = `bold ${HL_FS}px ${f}`; ctx.fillStyle = theme.headlineColor;
    const HL_H = Math.round(HL_FS * 1.15);
    wrapTextCharLevel(ctx, headline, MAXW, keyword).forEach((ln, i) => ctx.fillText(ln, cw * 0.5, Y_RULE + Math.round(40 * s) + i * HL_H));
    ctx.restore();

    // Deterministic random paragraph overflow
    const prependCount = 6 + (Math.abs(Math.round(Math.sin(frameIdx * 3.3) * 100)) % 5);
    const appendCount = 6 + (Math.abs(Math.round(Math.sin(frameIdx * 7.7) * 100)) % 5);
    const prependedText = getDeterministicFillers(prependCount, frameIdx * 5);
    const appendedText = getDeterministicFillers(appendCount, frameIdx * 13);
    const fullBodyText = `${prependedText} ${bodyText} ${appendedText}`;

    ctx.font = BODY;
    const allLines = wrapTextCharLevel(ctx, fullBodyText, MAXW, keyword);

    renderBodyLines(ctx, allLines, keyword, theme, PAD, FS, LINE_H, BODY, f, 0, blurBody, ch, cw, frameIdx, blurStrength);
  }

  // 3. Draw newspaper crumple lines ON TOP using multiply blending to layer naturally over text
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  if (texture === 'aged') {
    crumple(ctx, cw, ch, 'rgba(95,65,25,0.22)', 14);
  } else if (texture === 'classic' || texture === 'torn') {
    crumple(ctx, cw, ch, 'rgba(100,90,75,0.18)', 10);
  }
  ctx.restore();

  // 4. Apply grain noise & vignette ON TOP
  if (texture === 'aged') {
    const vigGrad = ctx.createRadialGradient(cw * 0.5, ch * 0.5, cw * 0.25, cw * 0.5, ch * 0.5, cw * 0.9);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vigGrad.addColorStop(1, `rgba(40,25,8,${theme.vignetteOpacity * 1.25})`);
    ctx.fillStyle = vigGrad; ctx.fillRect(0, 0, cw, ch);
  } else {
    const vigGrad = ctx.createRadialGradient(cw * 0.5, ch * 0.5, cw * 0.3, cw * 0.5, ch * 0.5, cw * 0.9);
    vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
    const vigRgb = theme.vignetteColor.startsWith('rgb(')
      ? theme.vignetteColor.replace('rgb(', 'rgba(').replace(')', `,${theme.vignetteOpacity})`)
      : `rgba(0,0,0,${theme.vignetteOpacity})`;
    vigGrad.addColorStop(1, vigRgb);
    ctx.fillStyle = vigGrad; ctx.fillRect(0, 0, cw, ch);
  }

  // Draw noise grain on top
  noise(ctx, cw, ch, 35000, theme.noiseOpacity * 1.2);

  return canvas.toDataURL('image/png');
}

export async function preloadFonts() {
  const c = document.createElement('canvas'), ctx = c.getContext('2d')!;
  FONTS.forEach(f => { ctx.font = `16px ${f.css}`; ctx.fillText('a', 0, 0); });
  await new Promise(r => setTimeout(r, 600));
}
