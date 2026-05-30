'use client';
import { useState } from 'react';
import { AppSettings } from './_storage';
import { RATIOS, FONTS } from './_canvas';

const TEXTURES = [
  { value: 'classic', label: '📰 Classic Newsprint' },
  { value: 'aged', label: '🟤 Aged / Yellowed' },
  { value: 'dark', label: '🖤 Dark Newspaper' },
  { value: 'grid', label: '📐 Graph / Grid' },
  { value: 'lined', label: '📝 Lined Paper' },
  { value: 'torn', label: '✂️ Torn Edge' },
];

const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#e8e8f0', fontSize: 13, outline: 'none', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b6b80', display: 'block', marginBottom: 5 };
const row: React.CSSProperties = { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 };
const field = (min = 160): React.CSSProperties => ({ flex: 1, minWidth: min, display: 'flex', flexDirection: 'column' });

function buildPrompt(s: AppSettings): string {
  const topic = s.topic ? ` (topic: ${s.topic})` : '';
  return `Generate content for a newspaper-style Paper Animator about "${s.keyword}"${topic}.

Return ONLY raw valid JSON — no markdown, no backticks:

{
  "breadcrumb": "${s.breadcrumb}",
  "frames": [
    {
      "headline": "Short headline that naturally includes ${s.keyword}",
      "body": "2-4 sentences. The keyword ${s.keyword} must appear at least once naturally."
    }
  ]
}

Rules:
- Generate exactly ${s.slideCount} frames
- Each frame must have a unique headline
- "${s.keyword}" must appear in at least one sentence per frame's body
- Keep text natural, informative, newspaper-style
- Return ONLY the JSON object, nothing else`;
}

interface Props {
  settings: AppSettings;
  onSettingsChange: (s: AppSettings) => void;
  onLoadFrames: (frames: { headline: string; body: string }[]) => void;
}

export default function PromptTab({ settings: s, onSettingsChange: upd, onLoadFrames }: Props) {
  const [jsonPaste, setJsonPaste] = useState('');
  const [jsonStatus, setJsonStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const prompt = buildPrompt(s);

  const copy = () => {
    navigator.clipboard.writeText(prompt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
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
          if (p.breadcrumb) upd({ ...s, breadcrumb: p.breadcrumb });
          onLoadFrames(p.frames.map((f: { headline?: string; body?: string }) => ({ headline: f.headline || '', body: f.body || '' })));
          setJsonPaste(text);
          return;
        }
      } catch { /* fall through */ }
      setJsonPaste(text);
    } catch { /* clipboard denied */ }
  };

  const loadJson = () => {
    try {
      const p = JSON.parse(jsonPaste.replace(/```json|```/g, '').trim());
      if (!p.frames) return;
      if (p.breadcrumb) upd({ ...s, breadcrumb: p.breadcrumb });
      onLoadFrames(p.frames.map((f: { headline?: string; body?: string }) => ({ headline: f.headline || '', body: f.body || '' })));
      setJsonPaste(''); setJsonStatus(null);
    } catch { /* noop */ }
  };

  const set = (k: keyof AppSettings, v: unknown) => upd({ ...s, [k]: v });

  return (
    <div>
      <div style={row}>
        <div style={field()}>
          <span style={lbl}>Keyword to Highlight</span>
          <input style={inp} value={s.keyword} onChange={e => set('keyword', e.target.value)} placeholder="e.g. Rajasthan Royals" />
        </div>
        <div style={field()}>
          <span style={lbl}>Breadcrumb Path</span>
          <input style={inp} value={s.breadcrumb} onChange={e => set('breadcrumb', e.target.value)} />
        </div>
      </div>
      <div style={row}>
        <div style={field()}>
          <span style={lbl}>Topic (optional)</span>
          <input style={inp} value={s.topic} onChange={e => set('topic', e.target.value)} placeholder="e.g. IPL 2025 highlights" />
        </div>
        <div style={{ ...field(120), maxWidth: 160 }}>
          <span style={lbl}>Slides ({s.slideCount})</span>
          <input type="range" min={3} max={10} value={s.slideCount} onChange={e => set('slideCount', +e.target.value)}
            style={{ accentColor: '#7c6af7', width: '100%', marginTop: 8 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#4b4b60', marginTop: 2 }}>
            <span>3</span><span>10</span>
          </div>
        </div>
      </div>
      <div style={row}>
        <div style={field()}>
          <span style={lbl}>Aspect Ratio</span>
          <select style={inp} value={s.ratio} onChange={e => set('ratio', e.target.value)}>
            {Object.keys(RATIOS).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div style={field()}>
          <span style={lbl}>Paper Texture</span>
          <select style={inp} value={s.texture} onChange={e => set('texture', e.target.value)}>
            {TEXTURES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div style={field()}>
          <span style={lbl}>Font (cycled per frame)</span>
          <select style={inp} value="cycle" onChange={() => {}}>
            <option value="cycle">Auto-cycle ({FONTS.length} serif fonts)</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#9ca3af', fontSize: 13 }}>
          <span style={{ position: 'relative', display: 'inline-block', width: 38, height: 20 }}>
            <input type="checkbox" checked={s.blurBody} onChange={e => set('blurBody', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
            <span onClick={() => set('blurBody', !s.blurBody)} style={{ position: 'absolute', inset: 0, borderRadius: 20, background: s.blurBody ? '#7c6af7' : '#2a2a40', cursor: 'pointer', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', top: 3, left: s.blurBody ? 20 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </span>
          </span>
          Blur body after highlight
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: '#9ca3af', fontSize: 13 }}>
          <span style={{ position: 'relative', display: 'inline-block', width: 38, height: 20 }}>
            <input type="checkbox" checked={s.matchCut} onChange={e => set('matchCut', e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
            <span onClick={() => set('matchCut', !s.matchCut)} style={{ position: 'absolute', inset: 0, borderRadius: 20, background: s.matchCut ? '#10b981' : '#2a2a40', cursor: 'pointer', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', top: 3, left: s.matchCut ? 20 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
            </span>
          </span>
          <span>Match-cut mode <span style={{ fontSize: 10, color: '#10b981' }}>(fixed highlight position across frames)</span></span>
        </label>
      </div>

      {/* Generated Prompt */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ ...lbl, marginBottom: 0 }}>Generated AI Prompt</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copy} style={{ background: copied ? '#10b981' : '#7c6af7', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {copied ? '✓ Copied!' : 'Copy Prompt'}
            </button>
            <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer"
              style={{ background: '#10a37f', color: '#fff', textDecoration: 'none', borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 700 }}>
              Open ChatGPT ↗
            </a>
          </div>
        </div>
        <div style={{ background: '#0a0a14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '1rem', fontFamily: 'monospace', fontSize: 12, color: '#b8c0cc', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 220, overflowY: 'auto' }}>
          {prompt}
        </div>
      </div>

      {/* JSON paste */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ ...lbl, marginBottom: 0 }}>Paste ChatGPT JSON Response</span>
          <button onClick={handlePaste}
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
            📋 Paste &amp; Render
          </button>
        </div>
        <textarea value={jsonPaste} onChange={e => validateJson(e.target.value)} rows={7}
          placeholder={'Paste JSON here...\n\n{\n  "breadcrumb": "...",\n  "frames": [...]\n}'}
          style={{ ...inp, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, border: `1px solid ${jsonStatus ? (jsonStatus.ok ? '#10b981' : '#e74c3c') : 'rgba(255,255,255,0.08)'}` }} />
        {jsonStatus && <div style={{ fontSize: 12, marginTop: 4, color: jsonStatus.ok ? '#10b981' : '#e74c3c' }}>{jsonStatus.msg}</div>}
        {jsonStatus?.ok && (
          <button onClick={loadJson} style={{ marginTop: 10, background: '#7c6af7', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Load Frames →
          </button>
        )}
      </div>
    </div>
  );
}
