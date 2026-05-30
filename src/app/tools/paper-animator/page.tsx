'use client';

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_THEME, DEFAULT_FRAMES } from './_theme';
import {
  DEFAULT_SETTINGS, loadSettings, saveSettings,
  loadTheme, saveTheme, loadFrames, saveFrames,
  loadHistory, saveToHistory, HistoryEntry,
} from './_storage';
import { FONTS, drawFrame, preloadFonts, RATIOS } from './_canvas';
import FramesTab, { Frame } from './_FramesTab';
import ThemeTab from './_ThemeTab';
import HistoryTab from './_HistoryTab';

type Tab = 'frames' | 'theme' | 'history';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'frames', label: 'Slides Content', icon: '🖼' },
  { id: 'theme', label: 'Custom Theme', icon: '🎨' },
  { id: 'history', label: 'History', icon: '🕓' },
];

const TEXTURES = [
  { value: 'classic', label: '📰 Classic Newsprint' },
  { value: 'aged', label: '🟤 Aged / Yellowed' },
  { value: 'dark', label: '🖤 Dark Newspaper' },
  { value: 'grid', label: '📐 Graph / Grid' },
  { value: 'lined', label: '📝 Lined Paper' },
  { value: 'torn', label: '✂️ Torn Edge' },
];

const inp: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
  color: '#e8e8f0', fontSize: 13, outline: 'none', fontFamily: 'inherit'
};
const lbl: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.5px', color: '#6b6b80', display: 'block', marginBottom: 4
};
const card: React.CSSProperties = {
  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
};
const btnOut: React.CSSProperties = {
  background: 'transparent', color: '#a78bfa', border: '1px solid #3d3580',
  borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s'
};

export default function PaperAnimatorPage() {
  const [tab, setTab] = useState<Tab>('frames');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [frames, setFrames] = useState<Frame[]>(DEFAULT_FRAMES);
  const [generated, setGenerated] = useState<{ url: string; idx: number }[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [preview, setPreview] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [activePreviewIdx, setActivePreviewIdx] = useState(0);
  const [showPromptBuilder, setShowPromptBuilder] = useState(false);

  // ChatGPT prompt generation states
  const [jsonPaste, setJsonPaste] = useState('');
  const [jsonStatus, setJsonStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = useCallback(async (
    _settings = settings, _frames = frames, _theme = theme
  ) => {
    const valid = _frames.filter(f => f.headline.trim() || f.body.trim());
    if (!_settings.keyword.trim() || !valid.length) return;
    setErr(''); setLoading(true);
    await preloadFonts();
    const results: { url: string; idx: number }[] = [];
    valid.forEach((f, i) => {
      const font = _settings.matchCut ? FONTS[0] : FONTS[i % FONTS.length];
      const url = drawFrame({
        keyword: _settings.keyword,
        breadcrumb: _settings.breadcrumb,
        headline: f.headline || _settings.keyword,
        bodyText: f.body || f.headline,
        fontObj: font,
        ratio: _settings.ratio,
        texture: _settings.texture,
        theme: _theme,
        blurBody: _settings.blurBody,
        matchCut: _settings.matchCut,
        frameIdx: i,
        blurStrength: _settings.blurStrength,
      });
      results.push({ url, idx: i + 1 });
    });
    setGenerated(results);
    setActivePreviewIdx(0);
    setLoading(false);
    const updated = saveToHistory({
      keyword: _settings.keyword, ratio: _settings.ratio,
      texture: _settings.texture, frameCount: results.length,
      thumbUrl: results[0]?.url || '', frameUrls: results.map(r => r.url),
    });
    setHistory(updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load from localStorage then auto-generate with loaded or default data
  useEffect(() => {
    let s = loadSettings();
    let t = loadTheme();
    let saved = loadFrames();
    let f = saved.length > 0 ? saved : DEFAULT_FRAMES;

    // Auto-migration to Qualifier 2 if using old default values
    if (s.keyword === 'World' || s.keyword === 'Breaking News' || f[0]?.body.includes('Global markets surged to record highs') || !s.hasOwnProperty('blurStrength') || f.length < 6) {
      s = {
        ...s,
        keyword: 'Qualifier 2',
        breadcrumb: 'Home / Education / Frameworks',
        texture: 'aged',
        blurBody: true,
        slideCount: 6,
        blurStrength: 1.8,
      };
      t = DEFAULT_THEME;
      f = DEFAULT_FRAMES;
      saveSettings(s);
      saveTheme(t);
      saveFrames(f);
    }

    setSettings(s); setTheme(t); setFrames(f); setHistory(loadHistory());
    setHydrated(true);
    generate(s, f, t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live updates trigger generate instantly
  const updateSettings = (s: typeof settings) => {
    setSettings(s);
    if (hydrated) saveSettings(s);
    generate(s, frames, theme);
  };

  const updateTheme = (t: typeof theme) => {
    setTheme(t);
    if (hydrated) saveTheme(t);
    generate(settings, frames, t);
  };

  const updateFrames = (fs: typeof frames) => {
    setFrames(fs);
    if (hydrated) saveFrames(fs);
    generate(settings, fs, theme);
  };

  const resetToRef = () => {
    saveSettings(DEFAULT_SETTINGS);
    saveTheme(DEFAULT_THEME);
    saveFrames(DEFAULT_FRAMES);
    setSettings(DEFAULT_SETTINGS);
    setTheme(DEFAULT_THEME);
    setFrames(DEFAULT_FRAMES);
    generate(DEFAULT_SETTINGS, DEFAULT_FRAMES, DEFAULT_THEME);
  };

  const downloadAll = () => {
    generated.forEach(({ url, idx }) => {
      const a = document.createElement('a');
      a.download = `${settings.keyword.replace(/\s+/g, '_')}_frame_${idx}.png`;
      a.href = url; a.click();
    });
  };

  const restoreHistory = (e: HistoryEntry) => {
    const s = { ...settings, keyword: e.keyword, ratio: e.ratio, texture: e.texture };
    setSettings(s);
    saveSettings(s);
    setGenerated(e.frameUrls.map((url, i) => ({ url, idx: i + 1 })));
    setTab('frames');
  };

  // AI Prompt builder logic
  const prompt = `Generate content for a newspaper-style Paper Animator about "${settings.keyword}"${settings.topic ? ` (topic: ${settings.topic})` : ''}.

Return ONLY raw valid JSON — no markdown, no backticks:

{
  "breadcrumb": "${settings.breadcrumb}",
  "frames": [
    {
      "headline": "Short headline that naturally includes ${settings.keyword}",
      "body": "2-4 sentences. The keyword ${settings.keyword} must appear at least once naturally."
    }
  ]
}

Rules:
- Generate exactly ${settings.slideCount} frames
- Each frame must have a unique headline
- "${settings.keyword}" must appear in at least one sentence per frame's body
- Keep text natural, informative, newspaper-style
- Return ONLY the JSON object, nothing else`;

  const copyPrompt = () => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const validateJson = (val: string) => {
    setJsonPaste(val);
    if (!val.trim()) { setJsonStatus(null); return; }
    try {
      const p = JSON.parse(val.replace(/```json|```/g, '').trim());
      if (p.frames && Array.isArray(p.frames)) setJsonStatus({ ok: true, msg: `✓ Valid — ${p.frames.length} frames` });
      else setJsonStatus({ ok: false, msg: '⚠ Missing "frames" array' });
    } catch (e: unknown) { setJsonStatus({ ok: false, msg: `⚠ ${e instanceof Error ? e.message : 'Invalid JSON'}` }); }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      validateJson(text);
      try {
        const p = JSON.parse(text.replace(/```json|```/g, '').trim());
        if (p.frames && Array.isArray(p.frames)) {
          if (p.breadcrumb) updateSettings({ ...settings, breadcrumb: p.breadcrumb });
          updateFrames(p.frames.map((f: { headline?: string; body?: string }) => ({ headline: f.headline || '', body: f.body || '' })));
          setJsonPaste(text);
          return;
        }
      } catch { /* fall through */ }
      setJsonPaste(text);
    } catch { /* denied */ }
  };

  const loadJson = () => {
    try {
      const p = JSON.parse(jsonPaste.replace(/```json|```/g, '').trim());
      if (!p.frames) return;
      if (p.breadcrumb) updateSettings({ ...settings, breadcrumb: p.breadcrumb });
      updateFrames(p.frames.map((f: { headline?: string; body?: string }) => ({ headline: f.headline || '', body: f.body || '' })));
      setJsonPaste(''); setJsonStatus(null);
    } catch { /* noop */ }
  };

  const currentFrame = generated[activePreviewIdx];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Lora:wght@400;700&family=EB+Garamond:wght@400;700&family=Cormorant+Garamond:wght@400;700&family=Libre+Baskerville:wght@400;700&family=Crimson+Text:wght@400;700&family=PT+Serif:wght@400;700&display=swap');`}</style>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', maxWidth: 1400, margin: '0 auto' }}>

        {/* ── LEFT: Controls ── */}
        <div style={{ flex: '0 0 52%', maxWidth: '52%', minWidth: 0 }}>
          {/* Header */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '3px 12px', borderRadius: 20, background: 'rgba(181,147,90,0.12)', border: '1px solid rgba(181,147,90,0.3)', marginBottom: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b5935a', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 11, color: '#b5935a', fontFamily: 'monospace' }}>Tool 3 · Paper Animator · Match-cut ready</span>
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#e8e8f0', marginBottom: 4, letterSpacing: '-0.02em', fontFamily: 'Syne, sans-serif' }}>
              📰 Paper Animator
            </h1>
            <p style={{ color: '#6b6b80', fontSize: 12 }}>Newspaper-style visual engine. Adjust sliders to see live preview update instantly.</p>
          </div>

          {/* ⚡ Core Settings & Sliders Panel (Persistent & Always Visible) */}
          <div style={{ ...card, padding: '1.25rem', marginBottom: '1rem', background: 'rgba(124,106,247,0.02)', border: '1px solid rgba(124,106,247,0.15)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#a78bfa', display: 'block', marginBottom: 12 }}>
              ⚙️ Visual Layout &amp; Match-Cut Settings
            </span>

            {/* Keyword + Breadcrumb */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <span style={lbl}>Keyword to Highlight</span>
                <input style={inp} value={settings.keyword} onChange={e => {
                  updateSettings({ ...settings, keyword: e.target.value });
                }} placeholder="e.g. Qualifier 2" />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <span style={lbl}>Breadcrumb Path</span>
                <input style={inp} value={settings.breadcrumb} onChange={e => {
                  updateSettings({ ...settings, breadcrumb: e.target.value });
                }} />
              </div>
            </div>

            {/* Aspect Ratio + Paper Texture */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <span style={lbl}>Aspect Ratio</span>
                <select style={inp} value={settings.ratio} onChange={e => {
                  updateSettings({ ...settings, ratio: e.target.value });
                }}>
                  {Object.keys(RATIOS).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <span style={lbl}>Paper Texture</span>
                <select style={inp} value={settings.texture} onChange={e => {
                  updateSettings({ ...settings, texture: e.target.value });
                }}>
                  {TEXTURES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {/* Slides count slider + Lens blur strength slider */}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 140 }}>
                <span style={lbl}>Slides Count ({settings.slideCount})</span>
                <input type="range" min={3} max={10} value={settings.slideCount} onChange={e => {
                  const count = +e.target.value;
                  let newFrames = [...frames];
                  if (newFrames.length < count) {
                    while (newFrames.length < count) newFrames.push({ headline: '', body: '' });
                  } else if (newFrames.length > count) {
                    newFrames = newFrames.slice(0, count);
                  }
                  updateFrames(newFrames);
                  updateSettings({ ...settings, slideCount: count });
                }} style={{ accentColor: '#7c6af7', width: '100%', marginTop: 4 }} />
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                <span style={lbl}>Lens Blur Strength ({settings.blurStrength.toFixed(1)}px)</span>
                <input type="range" min={0} max={5} step={0.1} value={settings.blurStrength} onChange={e => {
                  updateSettings({ ...settings, blurStrength: +e.target.value });
                }} style={{ accentColor: '#7c6af7', width: '100%', marginTop: 4 }} />
              </div>
            </div>

            {/* Switch Toggles */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#9ca3af', fontSize: 12 }}>
                <input type="checkbox" checked={settings.blurBody} onChange={e => {
                  updateSettings({ ...settings, blurBody: e.target.checked });
                }} style={{ accentColor: '#7c6af7' }} />
                Blur out-of-focus text
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#9ca3af', fontSize: 12 }}>
                <input type="checkbox" checked={settings.matchCut} onChange={e => {
                  updateSettings({ ...settings, matchCut: e.target.checked });
                }} style={{ accentColor: '#7c6af7' }} />
                <span>Match-cut mode <span style={{ fontSize: 9, color: '#10b981' }}>(fixed highlight)</span></span>
              </label>
            </div>
          </div>

          {/* Tab content panel */}
          <div style={{ ...card, marginBottom: '1rem' }}>
            {/* Tab bar */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{
                    flex: 1, padding: '12px 6px', background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 11, fontWeight: 700, letterSpacing: '0.2px',
                    color: tab === t.id ? '#a78bfa' : '#4b4b60',
                    borderBottom: `2px solid ${tab === t.id ? '#7c6af7' : 'transparent'}`,
                    transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  }}>
                  {t.icon} {t.label}
                  {t.id === 'frames' && (
                    <span style={{ fontSize: 9, background: 'rgba(124,106,247,0.2)', color: '#a78bfa', borderRadius: 10, padding: '1px 5px' }}>{frames.length}</span>
                  )}
                  {t.id === 'history' && history.length > 0 && (
                    <span style={{ fontSize: 9, background: 'rgba(16,185,129,0.2)', color: '#10b981', borderRadius: 10, padding: '1px 5px' }}>{history.length}</span>
                  )}
                </button>
              ))}
            </div>
            <div style={{ padding: '1.25rem', maxHeight: '55vh', overflowY: 'auto' }}>
              {tab === 'frames' && (
                <>
                  {/* Collapsible ChatGPT Prompt Generator */}
                  <div style={{ border: '1px solid rgba(124,106,247,0.2)', borderRadius: 10, overflow: 'hidden', marginBottom: 14, background: 'rgba(124,106,247,0.02)' }}>
                    <button onClick={() => setShowPromptBuilder(!showPromptBuilder)}
                      style={{ width: '100%', padding: '10px 14px', background: 'rgba(124,106,247,0.06)', border: 'none', color: '#a78bfa', fontSize: 11, fontWeight: 700, textAlign: 'left', cursor: 'pointer', outline: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🤖 AI PROMPT BUILDER &amp; JSON PASTE</span>
                      <span>{showPromptBuilder ? '▲ Hide' : '▼ Expand'}</span>
                    </button>
                    {showPromptBuilder && (
                      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <span style={lbl}>Topic (optional)</span>
                          <input style={inp} value={settings.topic} onChange={e => {
                            updateSettings({ ...settings, topic: e.target.value });
                          }} placeholder="e.g. IPL 2025 highlights" />
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={lbl}>Generated AI Prompt</span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={copyPrompt} style={{ background: copied ? '#10b981' : '#7c6af7', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                {copied ? '✓ Copied!' : 'Copy Prompt'}
                              </button>
                              <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" style={{ background: '#10a37f', color: '#fff', textDecoration: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 700 }}>Open ChatGPT ↗</a>
                            </div>
                          </div>
                          <div style={{ background: '#0a0a14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px', fontFamily: 'monospace', fontSize: 11, color: '#b8c0cc', lineHeight: 1.6, maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                            {prompt}
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={lbl}>Paste ChatGPT JSON Response</span>
                            <button onClick={handlePaste} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>📋 Paste &amp; Render</button>
                          </div>
                          <textarea value={jsonPaste} onChange={e => validateJson(e.target.value)} rows={4} placeholder={'Paste JSON here...\n{\n  "breadcrumb": "...",\n  "frames": [...]\n}'} style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }} />
                          {jsonStatus && <div style={{ fontSize: 11, marginTop: 4, color: jsonStatus.ok ? '#10b981' : '#e74c3c' }}>{jsonStatus.msg}</div>}
                          {jsonStatus?.ok && (
                            <button onClick={loadJson} style={{ marginTop: 8, background: '#7c6af7', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Load Frames →</button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <FramesTab frames={frames} onChange={updateFrames} />
                </>
              )}
              {tab === 'theme' && <ThemeTab theme={theme} onChange={updateTheme} />}
              {tab === 'history' && <HistoryTab history={history} onChange={setHistory} onRestore={restoreHistory} />}
            </div>
          </div>

          {/* Reset Deck bar */}
          <div style={{ ...card, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button onClick={resetToRef} disabled={loading} style={{ ...btnOut, borderColor: 'rgba(181,147,90,0.3)', color: '#b5935a', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, width: '100%', justifyContent: 'center' }}>
              🔄 Reset Reference template (Warm Newspaper Cream)
            </button>
            {err && <span style={{ color: '#e74c3c', fontSize: 12 }}>{err}</span>}
          </div>

        </div>

        {/* ── RIGHT: Live Preview (sticky) ── */}
        <div style={{ flex: 1, position: 'sticky', top: '80px', minWidth: 0 }}>
          <div style={{ ...card, overflow: 'hidden' }}>
            {/* Preview header */}
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e8e8f0' }}>
                {generated.length > 0 ? `✅ ${generated.length} Frame${generated.length !== 1 ? 's' : ''} Rendered` : '📰 Preview'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {generated.length > 0 && <button style={btnOut} onClick={downloadAll}>↓ All PNGs</button>}
              </div>
            </div>

            {/* Main frame preview */}
            <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.1)' }}>
              {currentFrame ? (
                <>
                  {/* Big preview */}
                  <div style={{ marginBottom: 10, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', cursor: 'zoom-in' }}
                    onClick={() => setPreview(currentFrame.url)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={currentFrame.url} alt={`Frame ${currentFrame.idx}`}
                      style={{ width: '100%', display: 'block', maxHeight: '50vh', objectFit: 'contain', background: '#0a0a14' }} />
                  </div>
                  {/* Frame selector strip */}
                  {generated.length > 1 && (
                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                      {generated.map(({ url, idx }, i) => (
                        <div key={idx} onClick={() => setActivePreviewIdx(i)}
                          style={{ flexShrink: 0, width: 56, cursor: 'pointer', borderRadius: 6, overflow: 'hidden', border: `2px solid ${i === activePreviewIdx ? '#7c6af7' : 'rgba(255,255,255,0.06)'}`, transition: 'border-color 0.15s' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Frame ${idx}`} style={{ width: '100%', display: 'block', height: 72, objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Per-frame download */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button style={{ ...btnOut, flex: 1, textAlign: 'center', fontSize: 11 }} onClick={() => {
                      const a = document.createElement('a');
                      a.download = `${settings.keyword.replace(/\s+/g, '_')}_frame_${currentFrame.idx}.png`;
                      a.href = currentFrame.url; a.click();
                    }}>↓ Frame {currentFrame.idx}</button>
                    <button style={{ ...btnOut, fontSize: 11 }} onClick={() => setPreview(currentFrame.url)}>⛶ Full</button>
                  </div>
                </>
              ) : (
                /* Placeholder skeleton */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', gap: 12 }}>
                  <div style={{ width: '100%', maxWidth: 220, aspectRatio: '9/16', borderRadius: 12, background: 'linear-gradient(180deg, rgba(217,201,163,0.1) 0%, rgba(168,144,92,0.05) 100%)', border: '2px dashed rgba(181,147,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 32 }}>📰</span>
                    <span style={{ fontSize: 11, color: '#4b4b60', textAlign: 'center' }}>Generating preview...</span>
                  </div>
                  {loading && (
                    <div style={{ fontSize: 12, color: '#b5935a', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Generating…
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Frame info footer */}
            {currentFrame && (
              <div style={{ padding: '0.6rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[settings.keyword, settings.ratio, settings.texture, settings.blurBody ? 'blur on' : 'blur off', settings.matchCut ? 'match-cut' : ''].filter(Boolean).map((tag, i) => (
                  <span key={i} style={{ fontSize: 10, background: 'rgba(255,255,255,0.04)', color: '#4b4b60', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '2px 8px', fontFamily: 'monospace' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {preview && (
        <div onClick={() => setPreview('')}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, cursor: 'zoom-out' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" style={{ maxWidth: '92vw', maxHeight: '92vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }} />
          <button style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', padding: '8px 24px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>✕ Close</button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </>
  );
}
