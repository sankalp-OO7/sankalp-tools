'use client';
import { useState } from 'react';
import { PaperTheme, DEFAULT_THEME } from './_theme';
import { saveNamedTheme, loadSavedThemes, deleteSavedTheme, SavedTheme } from './_storage';

const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#e8e8f0', fontSize: 13, outline: 'none', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b6b80', display: 'block', marginBottom: 5 };

interface ColorField { key: keyof PaperTheme; label: string }
const COLOR_FIELDS: ColorField[] = [
  { key: 'bgColor', label: 'Background' },
  { key: 'bgGradientEnd', label: 'Gradient End' },
  { key: 'headlineColor', label: 'Headline' },
  { key: 'highlightColor', label: 'Highlight BG' },
  { key: 'highlightTextColor', label: 'Highlight Text' },
  { key: 'breadcrumbColor', label: 'Breadcrumb' },
  { key: 'dividerColor', label: 'Divider' },
  { key: 'fontNameColor', label: 'Font Tag' },
];

function toHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function analyzeImageColors(img: HTMLImageElement): Partial<PaperTheme> {
  const c = document.createElement('canvas');
  const size = 120; c.width = size; c.height = size;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  // Sample a grid of pixels
  const samples: [number, number, number][] = [];
  for (let i = 0; i < data.length; i += 16) {
    samples.push([data[i], data[i + 1], data[i + 2]]);
  }
  // Sort by luminance
  const lum = ([r, g, b]: [number, number, number]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const sat = ([r, g, b]: [number, number, number]) => {
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mx === 0 ? 0 : (mx - mn) / mx;
  };
  samples.sort((a, b) => lum(a) - lum(b));
  const dark = samples[Math.floor(samples.length * 0.1)];
  const light = samples[Math.floor(samples.length * 0.9)];
  const mid = samples[Math.floor(samples.length * 0.5)];
  // Find most saturated (accent/highlight)
  const accent = [...samples].sort((a, b) => sat(b) - sat(a))[0];
  const accentL = lum(accent);
  // Build theme
  const bg = toHex(...light);
  const headline = toHex(...dark);
  const highlight = toHex(
    Math.min(255, accent[0] + 40),
    Math.min(255, accent[1] + 20),
    Math.min(255, accent[2])
  );
  const highlightText = lum(dark) < 80 ? toHex(...dark) : '#1a1610';
  const breadcrumb = `rgba(${mid[0]},${mid[1]},${mid[2]},0.55)`;
  const divider = `rgba(${dark[0]},${dark[1]},${dark[2]},0.2)`;
  return { bgColor: bg, bgGradientEnd: toHex(...mid), headlineColor: headline, highlightColor: highlight, highlightTextColor: highlightText, breadcrumbColor: breadcrumb, dividerColor: divider, noiseOpacity: 0.04 };
}


interface Props { theme: PaperTheme; onChange: (t: PaperTheme) => void; }

export default function ThemeTab({ theme, onChange }: Props) {
  const [json, setJson] = useState(JSON.stringify(theme, null, 2));
  const [jsonErr, setJsonErr] = useState('');
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>(loadSavedThemes);
  const [saveName, setSaveName] = useState('');
  const [imgThumb, setImgThumb] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const [analysisMsg, setAnalysisMsg] = useState('');

  const set = (k: keyof PaperTheme, v: unknown) => {
    const t = { ...theme, [k]: v };
    onChange(t); setJson(JSON.stringify(t, null, 2));
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(json);
      onChange({ ...DEFAULT_THEME, ...parsed });
      setJsonErr('');
    } catch (e: unknown) { setJsonErr(e instanceof Error ? e.message : 'Invalid JSON'); }
  };

  const resetTheme = () => {
    onChange(DEFAULT_THEME); setJson(JSON.stringify(DEFAULT_THEME, null, 2)); setJsonErr('');
  };

  const doSave = () => {
    if (!saveName.trim()) return;
    const updated = saveNamedTheme(saveName.trim(), theme);
    setSavedThemes(updated); setSaveName('');
  };

  const doDelete = (id: string) => setSavedThemes(deleteSavedTheme(id));
  const loadSaved = (t: PaperTheme) => { onChange(t); setJson(JSON.stringify(t, null, 2)); };

  const isHexOrRgb = (v: unknown) => typeof v === 'string' && (v.startsWith('#') || v.startsWith('rgb'));

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const src = e.target?.result as string;
      setImgThumb(src);
      setAnalysing(true);
      setAnalysisMsg('');
      const img = new Image();
      img.onload = () => {
        const extracted = analyzeImageColors(img);
        const newTheme = { ...theme, ...extracted };
        onChange(newTheme);
        setJson(JSON.stringify(newTheme, null, 2));
        setAnalysing(false);
        setAnalysisMsg('✓ Theme extracted from image!');
        setTimeout(() => setAnalysisMsg(''), 3000);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };


  return (
    <div>
      {/* ── Image → Theme Extractor ── */}
      <div style={{ border: '1px solid rgba(181,147,90,0.25)', borderRadius: 12, padding: '1rem', marginBottom: 16, background: 'rgba(181,147,90,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#b5935a' }}>🖼 Extract Theme from Image</span>
          {analysisMsg && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>{analysisMsg}</span>}
          {analysing && <span style={{ fontSize: 11, color: '#b5935a' }}>Analysing…</span>}
        </div>
        <p style={{ fontSize: 12, color: '#6b6b80', marginBottom: 10, lineHeight: 1.5 }}>
          Upload any image — dominant &amp; accent colours are extracted and mapped to background, headline, and highlight automatically.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <label style={{ flex: 1, border: '2px dashed rgba(181,147,90,0.3)', borderRadius: 10, padding: '1rem', textAlign: 'center', cursor: 'pointer', background: 'rgba(181,147,90,0.04)', transition: 'all 0.15s' }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleImageUpload(f); }}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
            <div style={{ fontSize: 24, marginBottom: 4 }}>🎨</div>
            <div style={{ fontSize: 12, color: '#b5935a', fontWeight: 600 }}>Click or drag image here</div>
            <div style={{ fontSize: 11, color: '#4b4b60', marginTop: 2 }}>PNG · JPG · WEBP</div>
          </label>
          {imgThumb && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgThumb} alt="analysed" style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', gap: 4 }}>
                {[theme.bgColor, theme.headlineColor, theme.highlightColor].map((c, i) => (
                  <div key={i} title={c} style={{ width: 22, height: 22, borderRadius: 5, background: c, border: '1px solid rgba(255,255,255,0.1)', flex: 1 }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick colour pickers */}
      <div style={{ marginBottom: 16 }}>
        <span style={lbl}>Quick Colour Pickers</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {COLOR_FIELDS.map(({ key, label }) => (
            isHexOrRgb(theme[key]) && (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <input type="color"
                  value={typeof theme[key] === 'string' && (theme[key] as string).startsWith('#') ? theme[key] as string : '#ffffff'}
                  onChange={e => set(key, e.target.value)}
                  style={{ width: 44, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', padding: 2, background: 'transparent' }}
                />
                <span style={{ fontSize: 9, color: '#6b6b80', textAlign: 'center', maxWidth: 52 }}>{label}</span>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Toggles + sliders */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#9ca3af', fontSize: 13 }}>
          <span onClick={() => set('useGradient', !theme.useGradient)} style={{ display: 'inline-block', width: 38, height: 20, borderRadius: 20, background: theme.useGradient ? '#7c6af7' : '#2a2a40', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }}>
            <span style={{ position: 'absolute', top: 3, left: theme.useGradient ? 20 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </span>
          Use Gradient Background
        </label>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 160 }}>
          <span style={lbl}>Vignette Opacity ({theme.vignetteOpacity.toFixed(2)})</span>
          <input type="range" min={0} max={0.6} step={0.01} value={theme.vignetteOpacity} onChange={e => set('vignetteOpacity', +e.target.value)} style={{ width: '100%', accentColor: '#7c6af7' }} />
        </div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <span style={lbl}>Grain Noise ({theme.noiseOpacity.toFixed(3)})</span>
          <input type="range" min={0} max={0.15} step={0.005} value={theme.noiseOpacity} onChange={e => set('noiseOpacity', +e.target.value)} style={{ width: '100%', accentColor: '#7c6af7' }} />
        </div>
      </div>

      {/* JSON editor */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={lbl}>Raw Theme JSON</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={resetTheme} style={{ background: 'transparent', color: '#6b6b80', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Reset</button>
            <button onClick={applyJson} style={{ background: '#7c6af7', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Apply JSON</button>
          </div>
        </div>
        <textarea value={json} onChange={e => setJson(e.target.value)} rows={12}
          style={{ ...inp, fontFamily: 'monospace', fontSize: 11, resize: 'vertical', border: `1px solid ${jsonErr ? '#e74c3c' : 'rgba(255,255,255,0.08)'}`, background: '#080812', lineHeight: 1.6 }} />
        {jsonErr && <div style={{ color: '#e74c3c', fontSize: 11, marginTop: 4 }}>{jsonErr}</div>}
      </div>

      {/* Save theme */}
      <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '1rem', marginBottom: 14 }}>
        <span style={{ ...lbl, marginBottom: 8 }}>Save Current Theme</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ ...inp, flex: 1 }} value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Theme name…" onKeyDown={e => e.key === 'Enter' && doSave()} />
          <button onClick={doSave} style={{ background: '#7c6af7', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>Save</button>
        </div>
      </div>

      {/* Saved themes */}
      {savedThemes.length > 0 && (
        <div>
          <span style={lbl}>Saved Themes ({savedThemes.length}/6)</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {savedThemes.map(st => (
              <div key={st.id} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e8e8f0' }}>{st.name}</span>
                  <button onClick={() => doDelete(st.id)} style={{ background: 'none', border: 'none', color: '#6b6b80', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[st.theme.bgColor, st.theme.headlineColor, st.theme.highlightColor].map((c, i) => (
                    <div key={i} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
                <button onClick={() => loadSaved(st.theme)} style={{ background: 'rgba(124,106,247,0.15)', color: '#a78bfa', border: '1px solid #3d3580', borderRadius: 6, padding: '4px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Load Theme
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
