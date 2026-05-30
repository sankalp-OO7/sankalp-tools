'use client';
import { FONTS } from './_canvas';
import { DEFAULT_FRAMES } from './_theme';

const inp: React.CSSProperties = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#e8e8f0', fontSize: 13, outline: 'none', fontFamily: 'inherit' };
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b6b80', display: 'block', marginBottom: 5 };

export type Frame = { headline: string; body: string };

interface Props {
  frames: Frame[];
  onChange: (frames: Frame[]) => void;
}

export default function FramesTab({ frames, onChange }: Props) {
  const upd = (i: number, k: keyof Frame, v: string) =>
    onChange(frames.map((f, idx) => idx === i ? { ...f, [k]: v } : f));
  const remove = (i: number) => onChange(frames.filter((_, idx) => idx !== i));
  const add = () => onChange([...frames, { headline: '', body: '' }]);
  const reset = () => onChange([...DEFAULT_FRAMES]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: 12, color: '#6b6b80' }}>{frames.length} frame{frames.length !== 1 ? 's' : ''} — keyword will be highlighted in body text</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={reset} style={{ background: 'transparent', color: '#a78bfa', border: '1px solid #3d3580', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Reset Defaults
          </button>
          <button onClick={add} style={{ background: '#7c6af7', color: '#fff', border: 'none', borderRadius: 7, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add Frame
          </button>
        </div>
      </div>

      {frames.map((f, i) => (
        <div key={i} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem', marginBottom: 10, background: 'rgba(124,106,247,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: '#a78bfa' }}>Frame {i + 1}</span>
              <span style={{ fontSize: 10, background: 'rgba(124,106,247,0.15)', color: '#a78bfa', border: '1px solid #3d3580', borderRadius: 10, padding: '1px 8px', fontWeight: 600 }}>
                {FONTS[i % FONTS.length].name}
              </span>
            </div>
            <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', color: '#6b6b80', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <span style={lbl}>Headline</span>
              <input style={inp} value={f.headline} onChange={e => upd(i, 'headline', e.target.value)} placeholder="Write headline here…" />
            </div>
            <div>
              <span style={lbl}>Body Text <span style={{ textTransform: 'none', fontWeight: 400, color: '#4b4b60' }}>— include your keyword naturally</span></span>
              <textarea style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} rows={3} value={f.body} onChange={e => upd(i, 'body', e.target.value)} placeholder="Write article body text. The keyword will be highlighted when found." />
            </div>
          </div>
        </div>
      ))}

      {frames.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#4b4b60', fontSize: 13, border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12 }}>
          No frames yet. Click "+ Add Frame" or load from JSON in the Prompt tab.
        </div>
      )}
    </div>
  );
}
