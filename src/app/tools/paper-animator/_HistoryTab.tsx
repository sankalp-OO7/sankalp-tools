'use client';
import { HistoryEntry, deleteHistory, clearHistory } from './_storage';

interface Props {
  history: HistoryEntry[];
  onChange: (h: HistoryEntry[]) => void;
  onRestore: (e: HistoryEntry) => void;
}

export default function HistoryTab({ history, onChange, onRestore }: Props) {
  const del = (id: string) => onChange(deleteHistory(id));
  const clear = () => { clearHistory(); onChange([]); };

  if (history.length === 0) return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#4b4b60', fontSize: 13, border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 12 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📰</div>
      No history yet. Generate some frames and they will appear here.
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <span style={{ fontSize: 12, color: '#6b6b80' }}>{history.length} saved generation{history.length !== 1 ? 's' : ''} (last 10 kept)</span>
        <button onClick={clear} style={{ background: 'transparent', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 7, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Clear All
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {history.map(e => (
          <div key={e.id} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
            {e.thumbUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={e.thumbUrl} alt="thumb" style={{ width: '100%', display: 'block', maxHeight: 140, objectFit: 'cover' }} />
            )}
            <div style={{ padding: '0.75rem' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e8e8f0', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {e.keyword}
              </div>
              <div style={{ fontSize: 10, color: '#6b6b80', marginBottom: 8 }}>
                {e.ratio} · {e.texture} · {e.frameCount} frames · {new Date(e.ts).toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => onRestore(e)}
                  style={{ flex: 1, background: 'rgba(124,106,247,0.15)', color: '#a78bfa', border: '1px solid #3d3580', borderRadius: 6, padding: '5px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Restore
                </button>
                <button onClick={() => del(e.id)}
                  style={{ background: 'none', color: '#6b6b80', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                  ×
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
