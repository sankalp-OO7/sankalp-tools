import React, { useState, useCallback } from 'react';
import { ThemeDef, BUILTIN_THEMES } from '../types';

// ── Tiny Toast ──────────────────────────────────────────────────────────────
type ToastItem = { id: number; msg: string; type: 'ok' | 'err' | 'info' };
let _tid = 0;
function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toast = useCallback((msg: string, type: ToastItem['type'] = 'info') => {
    const id = ++_tid;
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
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', pointerEvents: 'none',
        }}>{t.msg}</div>
      ))}
    </div>
  );
}

function CopyButton({ text, label='⎘ COPY', size='sm' }:{ text:string; label?:string; size?:'sm'|'lg' }) {
  const [copied,setCopied]=useState(false);
  const copy=()=>{ navigator.clipboard.writeText(text).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2500); }); };
  const isLg=size==='lg';
  return (
    <button onClick={copy} style={{
      padding:isLg?'12px 0':'6px 18px',
      width:isLg?'100%':undefined,
      background:copied?'rgba(78,203,130,0.18)':isLg?'linear-gradient(135deg,#C9A84C,#E8C96A)':'rgba(201,168,76,0.15)',
      color:copied?'#4ecb82':isLg?'#050E1C':'#E8C96A',
      border:copied?'1px solid rgba(78,203,130,0.4)':isLg?'none':'1px solid rgba(201,168,76,0.35)',
      borderRadius:isLg?8:6,cursor:'pointer',
      fontFamily:"'Space Mono',monospace",fontSize:isLg?12:10,fontWeight:700,letterSpacing:isLg?2:1,
      transition:'all .2s',whiteSpace:'nowrap',
    }}>
      {copied?'✓ COPIED!':label}
    </button>
  );
}

export default function ThemeEditor({ customThemes, setCustomThemes }:{ customThemes:Record<string,ThemeDef>; setCustomThemes:(t:Record<string,ThemeDef>)=>void }) {
  const [editKey, setEditKey] = useState<string|null>(null);
  const [editDef, setEditDef] = useState<ThemeDef|null>(null);
  const [aiInput, setAiInput] = useState('');
  const [pendingDel, setPendingDel] = useState<string|null>(null);
  const { toasts, toast } = useToast();
  
  const allThemes = { ...BUILTIN_THEMES, ...customThemes };
  
  const startEdit = (key:string, def:ThemeDef, isCopy=false) => {
    const newKey = isCopy ? `${key}_copy_${Date.now()}` : key;
    const newDef = isCopy ? { ...def, name:`${def.name} (Copy)` } : { ...def };
    setEditKey(newKey); setEditDef(newDef);
  };
  
  const startNew = () => {
    const k = `custom_${Date.now()}`;
    setEditKey(k);
    setEditDef({name:'New Theme',bg:'#000000',bg2:'#111111',bg3:'#222222',accent:'#ffffff',accent2:'#dddddd',accentDim:'rgba(255,255,255,0.2)',text:'#ffffff',textSec:'#aaaaaa',tagBg:'rgba(255,255,255,0.2)',tagColor:'#ffffff',border:'rgba(255,255,255,0.3)',card:'rgba(255,255,255,0.1)',footerBg:'rgba(0,0,0,0.9)',grid:'rgba(255,255,255,0.1)',coverGrad:'linear-gradient(150deg,#000000 0%,#222222 55%,#111111 100%)',radius:12,fontHeadline:"'Playfair Display',serif",fontBody:"'Inter',sans-serif",fontMono:"'JetBrains Mono',monospace"});
  };

  const saveEdit = () => {
    if(!editKey||!editDef) return;
    setCustomThemes({ ...customThemes, [editKey]: editDef });
    setEditKey(null); setEditDef(null);
    toast('✓ Theme saved', 'ok');
  };

  const delTheme = (k:string) => {
    if (pendingDel === k) {
      const t = {...customThemes}; delete t[k]; setCustomThemes(t);
      setPendingDel(null);
      toast('Theme deleted', 'info');
    } else {
      setPendingDel(k);
      setTimeout(() => setPendingDel(null), 3000);
    }
  };

  const aiPrompt = `You are an expert UI designer creating viral Instagram carousel themes. Create a JSON theme for a Carousel Creator based on this description: "${aiInput}"\n\nEnsure colors pop, gradients hook viewers, and fonts pair beautifully. Use standard Google fonts (e.g. 'Inter', 'Playfair Display', 'Syne', 'Space Mono').\n\nReturn ONLY raw JSON matching this interface:\n{\n  "name": "string (Theme Name)",\n  "bg": "string (hex solid)",\n  "bgGrad": "string (optional linear-gradient CSS for the main background)",\n  "bg2": "string (hex)",\n  "bg3": "string (hex)",\n  "accent": "string (hex)",\n  "accent2": "string (hex)",\n  "accentDim": "string (rgba)",\n  "text": "string (hex)",\n  "textSec": "string (hex)",\n  "tagBg": "string (rgba)",\n  "tagColor": "string (hex)",\n  "border": "string (rgba)",\n  "card": "string (rgba)",\n  "footerBg": "string (rgba)",\n  "grid": "string (rgba)",\n  "coverGrad": "string (linear-gradient CSS fade for cover)",\n  "fontHeadline": "string (e.g. \\"'Playfair Display', serif\\")",\n  "fontBody": "string (e.g. \\"'Inter', sans-serif\\")",\n  "fontMono": "string (e.g. \\"'JetBrains Mono', monospace\\")",\n  "radius": number (0 for sharp, 16 for round)\n}`;

  const [aiJson, setAiJson] = useState('');
  const importAi = () => {
    try { const t=JSON.parse(aiJson); setEditDef(t); setAiJson(''); toast('Theme imported — review and click Save', 'ok'); }
    catch(e){ toast('Invalid JSON', 'err'); }
  };

  return (
    <div style={{display:'flex',gap:24,height:'calc(100vh - 160px)'}}>
      <Toasts toasts={toasts} />
      {/* Left: list of themes */}
      <div style={{width:340,flexShrink:0,overflowY:'auto',paddingRight:8,display:'flex',flexDirection:'column',gap:12}}>
        <button onClick={startNew} style={{width:'100%',padding:12,background:'rgba(255,255,255,0.05)',border:'1px dashed rgba(255,255,255,0.2)',color:'#A3B8CC',borderRadius:8,cursor:'pointer',fontFamily:"'Space Mono',monospace"}}>+ NEW THEME</button>
        {Object.entries(allThemes).map(([k,t])=>{
          const isBuiltIn = !!BUILTIN_THEMES[k];
          return (
            <div key={k} style={{padding:16,borderRadius:10,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)'}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:t.accent,fontWeight:700}}>{t.name} {isBuiltIn&&<span style={{fontSize:9,color:'#6b6b80',marginLeft:6}}>(Built-in)</span>}</div>
                <div style={{display:'flex',gap:6}}>
                  {!isBuiltIn && <button onClick={()=>startEdit(k,t)} style={{background:'none',border:'1px solid rgba(255,255,255,.1)',color:'#A3B8CC',fontSize:10,padding:'4px 8px',borderRadius:4,cursor:'pointer',fontFamily:"'Space Mono',monospace"}}>Edit</button>}
                  <button onClick={()=>startEdit(k,t,true)} style={{background:'none',border:'1px solid rgba(255,255,255,.1)',color:'#A3B8CC',fontSize:10,padding:'4px 8px',borderRadius:4,cursor:'pointer',fontFamily:"'Space Mono',monospace"}}>Copy</button>
                  {!isBuiltIn && <button onClick={()=>delTheme(k)} style={{background: pendingDel===k ? 'rgba(224,92,92,.3)' : 'rgba(224,92,92,.1)',border:'1px solid rgba(224,92,92,.3)',color:'#e05c5c',fontSize:10,padding:'4px 8px',borderRadius:4,cursor:'pointer',fontFamily:"'Space Mono',monospace"}}>{pendingDel===k?'Confirm?':'✕'}</button>}
                </div>
              </div>
              <div style={{display:'flex',height:24,borderRadius:4,overflow:'hidden'}}>
                <div style={{flex:2,background:t.bg}}/>
                <div style={{flex:1,background:t.bg2}}/>
                <div style={{flex:1,background:t.accent}}/>
                <div style={{flex:1,background:t.accent2}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* Right: Editor or AI Prompt */}
      <div style={{flex:1,background:'#030810',borderRadius:12,border:'1px solid rgba(255,255,255,.08)',overflowY:'auto',padding:24}}>
        {!editDef ? (
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',color:'#6b6b80'}}>
            <div style={{fontSize:48,marginBottom:16,opacity:.4}}>🎨</div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:14,color:'#A3B8CC'}}>Select a theme to edit, duplicate a built-in theme, or create a new one.</div>
          </div>
        ) : (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:16,color:'#E8C96A',textTransform:'uppercase'}}>{editKey?.startsWith('custom_')?'Create Theme':'Edit Theme'}</div>
              <div style={{display:'flex',gap:12}}>
                <button onClick={()=>{setEditKey(null);setEditDef(null);}} style={{background:'none',border:'1px solid rgba(255,255,255,.1)',color:'#A3B8CC',padding:'8px 16px',borderRadius:6,cursor:'pointer',fontFamily:"'Space Mono',monospace",fontSize:12}}>Cancel</button>
                <button onClick={saveEdit} style={{background:'linear-gradient(135deg,#C9A84C,#E8C96A)',color:'#050E1C',border:'none',padding:'8px 16px',borderRadius:6,cursor:'pointer',fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700}}>Save Theme</button>
              </div>
            </div>

            <div style={{padding:16,borderRadius:10,background:'rgba(0,200,255,0.06)',border:'1px solid rgba(0,200,255,0.2)',marginBottom:24}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:'#00C8FF',marginBottom:12,textTransform:'uppercase'}}>✨ Generate with AI</div>
              <div style={{display:'flex',gap:12,marginBottom:12}}>
                <input value={aiInput} onChange={e=>setAiInput(e.target.value)} placeholder="Vibe description (e.g. Cyberpunk neon on dark gray)" style={{flex:1,background:'#030810',border:'1px solid rgba(0,200,255,0.3)',borderRadius:6,color:'#fff',padding:'8px 12px',fontFamily:"'Space Mono',monospace",fontSize:11,outline:'none'}}/>
                <CopyButton text={aiPrompt} label="⎘ COPY AI PROMPT"/>
              </div>
              <div style={{display:'flex',gap:12}}>
                <input value={aiJson} onChange={e=>setAiJson(e.target.value)} placeholder="Paste AI JSON output here" style={{flex:1,background:'#030810',border:'1px solid rgba(255,255,255,.1)',borderRadius:6,color:'#fff',padding:'8px 12px',fontFamily:"'Space Mono',monospace",fontSize:11,outline:'none'}}/>
                <button onClick={importAi} style={{background:'rgba(0,200,255,0.1)',border:'1px solid rgba(0,200,255,0.4)',color:'#00C8FF',padding:'8px 16px',borderRadius:6,cursor:'pointer',fontFamily:"'Space Mono',monospace",fontSize:11}}>⬇ Import</button>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
              {Object.keys(editDef).map(k=>(
                <div key={k}>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#A3B8CC',marginBottom:6}}>{k}</div>
                  <input value={(editDef as any)[k]} onChange={e=>setEditDef({...editDef,[k]:e.target.value})} style={{width:'100%',background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.1)',borderRadius:6,color:'#fff',padding:'8px 12px',fontFamily:"'Space Mono',monospace",fontSize:12,outline:'none'}}/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
