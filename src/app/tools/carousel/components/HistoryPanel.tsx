import React, { useState } from 'react';
import { HistoryItem, RATIOS, RatioKey } from '../types';

interface HistoryPanelProps {
  history: HistoryItem[];
  loadHistory: (h: HistoryItem) => void;
  delHistory: (id: string) => void;
  updateHistoryItem: (id: string, updated: Partial<HistoryItem>) => void;
}

export default function HistoryPanel({ history, loadHistory, delHistory, updateHistoryItem }: HistoryPanelProps) {
  const [editingItem, setEditingItem] = useState<HistoryItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTheme, setEditTheme] = useState('');
  const [editRatio, setEditRatio] = useState<RatioKey>('4:5');
  const [editCaption, setEditCaption] = useState('');
  const [editJson, setEditJson] = useState('');
  const [editError, setEditError] = useState('');

  const openEdit = (h: HistoryItem) => {
    setEditingItem(h);
    setEditTitle(h.title || '');
    setEditTheme(h.theme || 'news');
    setEditRatio(h.ratio || '4:5');
    setEditCaption(h.instagramCaption || '');
    setEditJson(h.jsonText || '');
    setEditError('');
  };

  const saveEdit = () => {
    if (!editingItem) return;
    try {
      // Validate JSON
      const parsed = JSON.parse(editJson);
      if (!parsed.slides) {
        setEditError('JSON must be a valid carousel containing a "slides" array.');
        return;
      }
      
      // Update item
      updateHistoryItem(editingItem.id, {
        title: editTitle,
        theme: editTheme,
        ratio: editRatio,
        instagramCaption: editCaption,
        jsonText: editJson
      });
      setEditingItem(null);
    } catch (e: any) {
      setEditError('Invalid JSON structure: ' + e.message);
    }
  };

  return (
    <div style={{ paddingBottom: 60, width: '100%' }}>
      {/* Header Count */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24,
        padding: '12px 18px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        fontFamily: "'Space Mono', monospace",
        width: '100%'
      }}>
        <span style={{ fontSize: 13, color: '#A3B8CC' }}>
          📂 Saved Carousels
        </span>
        <span style={{ fontSize: 13, color: '#C9A84C', fontWeight: 'bold' }}>
          {history.length} / 60 slot(s) used
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, width: '100%' }}>
        {history.length === 0 && (
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '100px 0', 
            color: '#6b6b80', 
            fontFamily: "'Space Mono', monospace", 
            fontSize: 14 
          }}>
            No history saved yet. Use "💾 Save" or "▶ RENDER SLIDES" in the Creator tab.
          </div>
        )}
        
        {history.map((h, index) => {
          const itemNum = history.length - index;
          return (
            <HistoryCard 
              key={h.id} 
              h={h} 
              itemNum={itemNum} 
              loadHistory={loadHistory} 
              delHistory={delHistory} 
              openEdit={openEdit} 
            />
          );
        })}
      </div>

      {/* Edit Modal Overlay */}
      {editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 10, 18, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: '#09101d',
            border: '1px solid rgba(201, 168, 76, 0.3)',
            borderRadius: 16,
            width: '100%',
            maxWidth: 680,
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: '1px solid rgba(255,255,255,0.08)', 
              paddingBottom: 12,
              marginBottom: 20 
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#E8C96A', margin: 0, fontFamily: "'Syne', sans-serif" }}>
                Edit Carousel History Item
              </h2>
              <button 
                onClick={() => setEditingItem(null)} 
                style={{ background: 'none', border: 'none', color: '#6b6b80', fontSize: 20, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {editError && (
              <div style={{ 
                background: 'rgba(224,92,92,0.1)', 
                border: '1px solid rgba(224,92,92,0.3)', 
                color: '#e05c5c', 
                padding: 12, 
                borderRadius: 8, 
                fontSize: 12, 
                marginBottom: 16,
                fontFamily: "'Space Mono', monospace" 
              }}>
                ⚠️ {editError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: "'Space Mono', monospace", color: '#C9A84C', marginBottom: 6 }}>
                  TITLE
                </label>
                <input 
                  type="text" 
                  value={editTitle} 
                  onChange={e => setEditTitle(e.target.value)} 
                  style={{
                    width: '100%',
                    background: '#03070e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#FFF',
                    padding: 10,
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontFamily: "'Space Mono', monospace", color: '#C9A84C', marginBottom: 6 }}>
                    THEME KEY
                  </label>
                  <select 
                    value={editTheme} 
                    onChange={e => setEditTheme(e.target.value)} 
                    style={{
                      width: '100%',
                      background: '#03070e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      color: '#FFF',
                      padding: 10,
                      fontSize: 13,
                      outline: 'none'
                    }}
                  >
                    <option value="news">News</option>
                    <option value="apple">Apple Glass Luxe</option>
                    <option value="markets">Markets</option>
                    <option value="netflix">Netflix</option>
                    <option value="spotify">Spotify</option>
                    <option value="stripe">Stripe</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontFamily: "'Space Mono', monospace", color: '#C9A84C', marginBottom: 6 }}>
                    RATIO
                  </label>
                  <select 
                    value={editRatio} 
                    onChange={e => setEditRatio(e.target.value as RatioKey)} 
                    style={{
                      width: '100%',
                      background: '#03070e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8,
                      color: '#FFF',
                      padding: 10,
                      fontSize: 13,
                      outline: 'none'
                    }}
                  >
                    {Object.keys(RATIOS).map(r => (
                      <option key={r} value={r}>{r} ({RATIOS[r as RatioKey].label})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: "'Space Mono', monospace", color: '#C9A84C', marginBottom: 6 }}>
                  INSTAGRAM CAPTION
                </label>
                <textarea 
                  value={editCaption} 
                  onChange={e => setEditCaption(e.target.value)} 
                  rows={6}
                  style={{
                    width: '100%',
                    background: '#03070e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#A3B8CC',
                    padding: 12,
                    fontSize: 12,
                    lineHeight: 1.5,
                    fontFamily: 'sans-serif',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: "'Space Mono', monospace", color: '#C9A84C', marginBottom: 6 }}>
                  CAROUSEL JSON DATA
                </label>
                <textarea 
                  value={editJson} 
                  onChange={e => setEditJson(e.target.value)} 
                  rows={8}
                  style={{
                    width: '100%',
                    background: '#03070e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#A3B8CC',
                    padding: 12,
                    fontSize: 11,
                    lineHeight: 1.5,
                    fontFamily: "'Space Mono', monospace",
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
              <button 
                onClick={saveEdit} 
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg,#C9A84C,#E8C96A)',
                  color: '#050E1C',
                  border: 'none',
                  padding: '12px 0',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: 1
                }}
              >
                💾 SAVE CHANGES
              </button>
              <button 
                onClick={() => setEditingItem(null)} 
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#A3B8CC',
                  padding: '12px 24px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 12
                }}
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Individual History Card Component ─────────────────────────────────────────
function HistoryCard({ 
  h, 
  itemNum, 
  loadHistory, 
  delHistory, 
  openEdit 
}: { 
  h: HistoryItem; 
  itemNum: number; 
  loadHistory: (h: HistoryItem) => void; 
  delHistory: (id: string) => void;
  openEdit: (h: HistoryItem) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!h.instagramCaption) return;
    navigator.clipboard.writeText(h.instagramCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      padding: 20,
      borderRadius: 12,
      background: 'rgba(255,255,255,.03)',
      border: '1px solid rgba(255,255,255,.08)',
      position: 'relative',
      transition: 'transform 0.2s, box-shadow 0.2s',
      justifyContent: 'space-between',
      minHeight: 320
    }}>
      {/* Number Badge & Metadata */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div style={{ 
            fontFamily: "'Cormorant Garamond',serif", 
            fontSize: 22, 
            color: '#fff', 
            fontWeight: 600, 
            paddingRight: 60,
            lineHeight: 1.2
          }}>
            {h.title}
          </div>
          <span style={{
            position: 'absolute',
            top: 15,
            right: 15,
            background: 'rgba(201,168,76,0.1)',
            border: '1px solid rgba(201,168,76,0.25)',
            color: '#E8C96A',
            fontFamily: "'Space Mono', monospace",
            fontSize: 12,
            padding: '3px 8px',
            borderRadius: 6,
            fontWeight: 'bold'
          }}>
            #{itemNum}
          </span>
        </div>
        
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: '#6b6b80', marginBottom: 12 }}>
          {new Date(h.savedAt).toLocaleString()}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <span style={{ 
            background: 'rgba(201,168,76,0.15)', 
            color: '#E8C96A', 
            border: '1px solid rgba(201,168,76,0.3)', 
            padding: '3px 8px', 
            borderRadius: 4, 
            fontSize: 9, 
            fontFamily: "'Space Mono',monospace" 
          }}>
            {h.theme}
          </span>
          <span style={{ 
            background: 'rgba(255,255,255,0.05)', 
            color: '#A3B8CC', 
            border: '1px solid rgba(255,255,255,0.1)', 
            padding: '3px 8px', 
            borderRadius: 4, 
            fontSize: 9, 
            fontFamily: "'Space Mono',monospace" 
          }}>
            {RATIOS[h.ratio]?.label || h.ratio}
          </span>
        </div>

        {/* Instagram Caption Block - ALWAYS OPEN BY DEFAULT */}
        {h.instagramCaption && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 6 
            }}>
              <span style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: '#C9A84C', letterSpacing: 0.5 }}>
                INSTAGRAM CAPTION
              </span>
              <button 
                onClick={handleCopy} 
                style={{
                  background: copied ? 'rgba(78,203,130,0.15)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${copied ? 'rgba(78,203,130,0.3)' : 'rgba(255,255,255,0.1)'}`,
                  color: copied ? '#4ecb82' : '#A3B8CC',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9,
                  padding: '3px 8px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {copied ? '✓ COPIED!' : '📋 COPY'}
              </button>
            </div>
            
            <div 
              onClick={handleCopy}
              title="Click to copy caption"
              style={{
                background: copied ? 'rgba(78,203,130,0.05)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${copied ? 'rgba(78,203,130,0.3)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: 6,
                padding: 10,
                maxHeight: 180,
                overflowY: 'auto',
                fontSize: 11,
                lineHeight: 1.5,
                color: copied ? '#4ecb82' : '#A3B8CC',
                whiteSpace: 'pre-wrap',
                fontFamily: 'sans-serif',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {h.instagramCaption}
            </div>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button 
          onClick={() => loadHistory(h)} 
          style={{
            flex: 2,
            background: 'linear-gradient(135deg,#1a6fa8,#2a8fd4)',
            color: '#fff',
            border: 'none',
            padding: '8px 0',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: "'Space Mono',monospace",
            fontSize: 11,
            fontWeight: 700
          }}
        >
          ▶ LOAD
        </button>
        <button 
          onClick={() => openEdit(h)} 
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#A3B8CC',
            padding: '8px 0',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: "'Space Mono',monospace",
            fontSize: 11
          }}
        >
          ✏️ EDIT
        </button>
        <button 
          onClick={() => delHistory(h.id)} 
          style={{
            background: 'rgba(224,92,92,.1)',
            border: '1px solid rgba(224,92,92,.3)',
            color: '#e05c5c',
            padding: '8px 14px',
            borderRadius: 6,
            cursor: 'pointer',
            fontFamily: "'Space Mono',monospace",
            fontSize: 11
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
