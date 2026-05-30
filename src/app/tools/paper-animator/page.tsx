'use client';

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_THEME, DEFAULT_FRAMES } from './_theme';
import {
  DEFAULT_SETTINGS, loadSettings, saveSettings,
  loadTheme, saveTheme, loadFrames, saveFrames,
  loadHistory, saveToHistory, HistoryEntry,
} from './_storage';
import { FONTS, drawFrame, preloadFonts } from './_canvas';
import PromptTab from './_PromptTab';
import FramesTab, { Frame } from './_FramesTab';
import ThemeTab from './_ThemeTab';
import HistoryTab from './_HistoryTab';

type Tab = 'prompt' | 'frames' | 'theme' | 'history';
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'prompt', label: 'Prompt', icon: '✍️' },
  { id: 'frames', label: 'Frames', icon: '🖼' },
  { id: 'theme', label: 'Theme', icon: '🎨' },
  { id: 'history', label: 'History', icon: '🕓' },
];

export default function PaperAnimatorPage() {
  const [tab, setTab] = useState<Tab>('prompt');
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
    const s = loadSettings();
    const t = loadTheme();
    const saved = loadFrames();
    const f = saved.length > 0 ? saved : DEFAULT_FRAMES;
    setSettings(s); setTheme(t); setFrames(f); setHistory(loadHistory());
    setHydrated(true);
    generate(s, f, t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (hydrated) saveSettings(settings); }, [settings, hydrated]);
  useEffect(() => { if (hydrated) saveTheme(theme); }, [theme, hydrated]);
  useEffect(() => { if (hydrated) saveFrames(frames); }, [frames, hydrated]);

  const handleGenerate = () => {
    if (!settings.keyword.trim()) { setErr('Enter a keyword to highlight.'); return; }
    const valid = frames.filter(f => f.headline.trim() || f.body.trim());
    if (!valid.length) { setErr('Add at least one frame with content.'); return; }
    setErr('');
    generate(settings, frames, theme);
  };

  const downloadAll = () => {
    generated.forEach(({ url, idx }) => {
      const a = document.createElement('a');
      a.download = `${settings.keyword.replace(/\s+/g, '_')}_frame_${idx}.png`;
      a.href = url; a.click();
    });
  };

  const restoreHistory = (e: HistoryEntry) => {
    setSettings(prev => ({ ...prev, keyword: e.keyword, ratio: e.ratio, texture: e.texture }));
    setGenerated(e.frameUrls.map((url, i) => ({ url, idx: i + 1 })));
    setTab('prompt');
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden',
  };
  const btnPrimary: React.CSSProperties = {
    background: 'linear-gradient(135deg,#7c6af7,#a78bfa)', color: '#fff', border: 'none',
    borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 800,
    cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
    letterSpacing: '-0.01em', boxShadow: loading ? 'none' : '0 0 24px rgba(124,106,247,0.35)',
    transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
  };
  const btnOut: React.CSSProperties = {
    background: 'transparent', color: '#a78bfa', border: '1px solid #3d3580',
    borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
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
            <p style={{ color: '#6b6b80', fontSize: 12 }}>Newspaper-style keyword highlight frames · click Generate to update preview</p>
          </div>

          {/* Tab panel */}
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
              {tab === 'prompt' && <PromptTab settings={settings} onSettingsChange={setSettings} onLoadFrames={fs => { setFrames(fs); setTab('frames'); }} />}
              {tab === 'frames' && <FramesTab frames={frames} onChange={setFrames} />}
              {tab === 'theme' && <ThemeTab theme={theme} onChange={setTheme} />}
              {tab === 'history' && <HistoryTab history={history} onChange={setHistory} onRestore={restoreHistory} />}
            </div>
          </div>

          {/* Generate bar */}
          <div style={{ ...card, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <button onClick={handleGenerate} disabled={loading} style={btnPrimary}>
              {loading ? '⏳ Generating…' : '🖼  Generate Frames'}
            </button>
            {settings.matchCut && !loading && (
              <span style={{ fontSize: 11, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '4px 10px' }}>
                ✓ Match-cut · fixed highlight position
              </span>
            )}
            {err && <span style={{ color: '#e74c3c', fontSize: 12 }}>{err}</span>}
          </div>
        </div>

        {/* ── RIGHT: Live Preview (sticky) ── */}
        <div style={{ flex: 1, position: 'sticky', top: '80px', minWidth: 0 }}>
          <div style={{ ...card, overflow: 'hidden' }}>
            {/* Preview header */}
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#e8e8f0' }}>
                {generated.length > 0 ? `✅ ${generated.length} Frame${generated.length !== 1 ? 's' : ''}` : '📰 Preview'}
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
                    <span style={{ fontSize: 11, color: '#4b4b60', textAlign: 'center' }}>Hit Generate to<br />render frames here</span>
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
