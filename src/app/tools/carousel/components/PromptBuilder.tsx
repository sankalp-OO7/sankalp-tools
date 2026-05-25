import React, { useState, useEffect, useCallback } from 'react';

// ── Tiny Toast ────────────────────────────────────────────────────────────────
type ToastItem = { id: number; msg: string; type: 'ok' | 'err' | 'info' };
let _toastId = 0;
function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toast = useCallback((msg: string, type: ToastItem['type'] = 'info') => {
    const id = ++_toastId;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);
  return { toasts, toast };
}

function Toasts({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          padding: '10px 18px', borderRadius: 8, fontSize: 12, fontFamily: "'Space Mono',monospace",
          background: t.type === 'ok' ? 'rgba(78,203,130,0.15)' : t.type === 'err' ? 'rgba(224,92,92,0.15)' : 'rgba(201,168,76,0.15)',
          border: `1px solid ${t.type === 'ok' ? 'rgba(78,203,130,0.4)' : t.type === 'err' ? 'rgba(224,92,92,0.4)' : 'rgba(201,168,76,0.4)'}`,
          color: t.type === 'ok' ? '#4ecb82' : t.type === 'err' ? '#e05c5c' : '#E8C96A',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          animation: 'slideIn .2s ease',
          pointerEvents: 'none',
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

// ── LocalStorage helper ────────────────────────────────────────────────────────
function useLs<T>(key: string, init: T): [T, (v: T) => void] {
  const [val, setVal] = useState<T>(() => {
    if (typeof window === 'undefined') return init;
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; }
  });
  const set = (v: T) => { setVal(v); try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };
  return [val, set];
}

// ── Copy Button ───────────────────────────────────────────────────────────────
function CopyButton({ text, label = '⎘ COPY', size = 'sm' }: { text: string; label?: string; size?: 'sm' | 'lg' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); }); };
  const isLg = size === 'lg';
  return (
    <button onClick={copy} style={{
      padding: isLg ? '12px 0' : '6px 18px', width: isLg ? '100%' : undefined,
      background: copied ? 'rgba(78,203,130,0.18)' : isLg ? 'linear-gradient(135deg,#C9A84C,#E8C96A)' : 'rgba(201,168,76,0.15)',
      color: copied ? '#4ecb82' : isLg ? '#050E1C' : '#E8C96A',
      border: copied ? '1px solid rgba(78,203,130,0.4)' : isLg ? 'none' : '1px solid rgba(201,168,76,0.35)',
      borderRadius: isLg ? 8 : 6, cursor: 'pointer',
      fontFamily: "'Space Mono',monospace", fontSize: isLg ? 12 : 10, fontWeight: 700, letterSpacing: isLg ? 2 : 1,
      transition: 'all .2s', whiteSpace: 'nowrap',
    }}>
      {copied ? '✓ COPIED!' : label}
    </button>
  );
}
// ── Prompt builder (pure) ────────────────────────────────────────────────────
function buildCombinedPrompt(topic: string, type: string, cat: string, n: string, ss: string) {
  const t = topic || '[enter topic]';
  const c = cat || 'SHAMSGS';
  const carousel = `You are a social media content writer for ShamsGS (shamsgs.com), a UAE-based AI-powered forex trading platform.\n\nCreate a carousel JSON for the topic below. Follow the EXACT schema and ALL character limits.\n\nTOPIC: ${t}\nCARROUSEL TYPE: ${type}\nCATEGORY TAG: ${c} (max 20 chars, uppercase)\nNUMBER OF SLIDES: ${n} (always cover first, CTA last)\nSCREENSHOTS: ${ss || 'none'}\n\nSTRICT CHARACTER LIMITS:\n- cover headline: 55 | subheadline: 80 | tag: 25\n- section_label: 28 | content headline: 50 | body: 140\n- bullets: max 5 × 65 chars | stat_number: 12\n- stat_label: 45 | stat_context: 90 | quote_text: 130\n- quote_source: 55 | list items: max 5 × 70 chars\n- cta_headline: 40 | cta_body: 90\n\nSlide types: cover, content, stat, quote, list, cta\nRules: First=cover. Last=cta. has_screenshot:true only where needed. No emojis. Professional tone.\n\nReturn ONLY valid raw JSON:\n{\n  "type":"${type}","title":"...","category":"${c}",\n  "slides":[\n    {"slide_type":"cover","headline":"...","subheadline":"...","tag":"...","has_screenshot":true,"page":1},\n    {"slide_type":"content","section_label":"...","headline":"...","body":"...","bullets":["..."],"has_screenshot":false,"page":2},\n    {"slide_type":"stat","stat_number":"...","stat_label":"...","stat_context":"...","page":3},\n    {"slide_type":"quote","quote_text":"...","quote_source":"...","page":4},\n    {"slide_type":"list","section_label":"...","headline":"...","items":[{"number":"01","text":"..."}],"page":5},\n    {"slide_type":"cta","cta_headline":"...","cta_body":"...","page":${n}}\n  ]\n}`;
  const caption = `You are an Instagram content writer for ShamsGS (shamsgs.com), a UAE-based AI-powered forex trading platform.\n\nWrite a compelling Instagram caption for the carousel post below.\n\nTOPIC: ${t}\nCARROUSEL TYPE: ${type}\nCATEGORY: ${c}\nNUMBER OF SLIDES: ${n}\n\nCAPTION REQUIREMENTS:\n1. HOOK (1–2 lines): Grab attention immediately. Start with a bold statement, question, or surprising fact. No emojis in the hook.\n2. BODY (3–5 lines): Expand on the topic with key insights from the carousel. Use line breaks for readability. Keep it conversational yet authoritative.\n3. VALUE STATEMENT (1–2 lines): Explain what the reader gains by saving/sharing this post.\n4. CALL TO ACTION (1 line): Direct, specific CTA — e.g. "Follow @shamsgs for daily market insights" or "Link in bio to start trading smarter."\n5. HASHTAGS (1 block, 15–20 tags): Mix broad (#forex #trading #investing) and niche (#UAEforex #AItrading #shamsgs #forexUAE #tradinglife) hashtags. Place them at the very end after a line break.\n\nBRAND VOICE: Professional, confident, data-driven, and empowering. Targeted at UAE-based retail forex traders and investors.\n\nFORMAT:\n[HOOK]\n\n[BODY]\n\n[VALUE STATEMENT]\n\n[CALL TO ACTION]\n\n.\n.\n.\n[HASHTAGS]`;
  return `=========================================\nTASK 1: CAROUSEL JSON\n=========================================\n\n${carousel}\n\n\n\n=========================================\nTASK 2: INSTAGRAM CAPTION\n=========================================\n\n${caption}`;
}


// ── Main ─────────────────────────────────────────────────────────────────────
export default function PromptBuilder() {
  const [topic, setTopic] = useState('');
  const [type, setType] = useState('news');
  const [cat, setCat] = useState('MARKETS');
  const [n, setNRaw] = useLs<string>('pb_slides', '6');
  const [ss, setSs] = useState('Slide 1 (cover)');
  const { toasts, toast } = useToast();

  const setN = (v: string) => setNRaw(v);

  const combinedPrompt = buildCombinedPrompt(topic, type, cat, n, ss);

  // Paste topic → replace topic, build fresh prompt, copy it, show toast
  const pasteTopicAndCopy = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) { toast('Clipboard is empty', 'err'); return; }
      const newTopic = text.trim();
      setTopic(newTopic);
      // Build prompt fresh with newTopic — no stale state issue
      const fresh = buildCombinedPrompt(newTopic, type, cat, n, ss);
      await navigator.clipboard.writeText(fresh);
      toast('✓ Topic pasted & prompt copied!', 'ok');
    } catch {
      toast('Could not read clipboard', 'err');
    }
  };

  const inpSt: React.CSSProperties = { width: '100%', background: '#030810', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, color: '#fff', fontFamily: "'Space Mono',monospace", fontSize: 12, padding: '10px 14px', outline: 'none' };

  const inp = (label: string, val: string, set: (v: string) => void, ph: string, max?: number, el: 'input' | 'textarea' | 'select' = 'input', opts?: string[]) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2, color: '#C9A84C', textTransform: 'uppercase', marginBottom: 7 }}>{label}</div>
      {el === 'select' ? <select value={val} onChange={e => set(e.target.value)} style={inpSt}>{opts?.map(o => <option key={o} value={o}>{o}</option>)}</select>
        : el === 'textarea' ? <textarea value={val} onChange={e => set(e.target.value)} placeholder={ph} maxLength={max} rows={2} style={{ ...inpSt, resize: 'vertical' }} />
          : <input value={val} onChange={e => set(e.target.value)} placeholder={ph} maxLength={max} style={inpSt} />}
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 160px)' }}>
      <Toasts toasts={toasts} />

      {/* Left: inputs */}
      <div style={{ width: 340, flexShrink: 0, overflowY: 'auto', paddingRight: 8 }}>
        <div style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 10, background: 'rgba(0,200,255,0.06)', border: '1px solid rgba(0,200,255,0.2)', fontSize: 12, color: '#8BA5C8', lineHeight: 1.6 }}>
          Fill in fields → copy the full prompt → paste into ChatGPT/Claude → use outputs.
        </div>

        {/* Topic with Paste button */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2, color: '#C9A84C', textTransform: 'uppercase' }}>Topic / Subject</div>
            <button onClick={pasteTopicAndCopy} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#A3B8CC', fontFamily: "'Space Mono',monospace", fontSize: 9, padding: '3px 10px', borderRadius: 5, cursor: 'pointer', letterSpacing: 1 }}>⎘ PASTE</button>
          </div>
          <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="UAE AI trading trends in 2025" maxLength={200} rows={2} style={{ ...inpSt, resize: 'vertical' }} />
        </div>

        {inp('Carousel Type', type, setType, '', undefined, 'select', ['news', 'tech'])}
        {inp('Category Tag', cat, setCat, 'MARKETS', 20)}

        {/* Number of Slides — 3 to 10 buttons, persisted */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: 2, color: '#C9A84C', textTransform: 'uppercase', marginBottom: 7 }}>Number of Slides</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <button key={num} onClick={() => setN(String(num))} style={{ flex: '1 0 calc(25% - 6px)', padding: '8px 0', borderRadius: 7, cursor: 'pointer', fontFamily: "'Space Mono',monospace", fontSize: 12, fontWeight: 700, background: n === String(num) ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,.04)', border: `1px solid ${n === String(num) ? '#C9A84C' : 'rgba(255,255,255,.1)'}`, color: n === String(num) ? '#E8C96A' : '#6b6b80', transition: 'all .15s' }}>{num}</button>
            ))}
          </div>
        </div>

        {inp('Screenshots Needed', ss, setSs, 'Slide 1 (cover), Slide 3', 120)}

        {/* Combined prompt copy */}
        <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', marginBottom: 12 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: 2, color: '#C9A84C', textTransform: 'uppercase', marginBottom: 10 }}>📝 Combined Prompt</div>
          <div style={{ fontSize: 11, color: '#8BA5C8', lineHeight: 1.5, marginBottom: 12 }}>Paste into ChatGPT/Claude to generate both the Carousel JSON and Instagram Caption at once.</div>
          <CopyButton text={combinedPrompt} label='⎘ COPY FULL PROMPT' size='lg' />
        </div>
      </div>

      {/* Right: preview panel */}
      <div style={{ flex: 1, background: '#030810', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 18px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#A3B8CC' }}>Prompt Preview</div>
          <CopyButton text={combinedPrompt} label='⎘ COPY PROMPT' size='sm' />
        </div>
        <pre style={{ flex: 1, overflowY: 'auto', padding: 20, fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#A3B8CC', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>{combinedPrompt}</pre>
      </div>
    </div>
  );
}
