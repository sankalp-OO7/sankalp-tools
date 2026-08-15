'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';

import { 
  LOGO_PATH, BRAND, RATIOS, RatioKey, ThemeDef, BUILTIN_THEMES, rTheme, LS, Tab, 
  SlideData, CarouselData, ImgAdj, defAdj, ExtraImg, ExtraShape, ExtraPos, HistoryItem, defAlign 
} from './types';

import SlideEl from './components/SlideEl';
import PromptBuilder from './components/PromptBuilder';
import BuilderTab from './components/BuilderTab';
import ThemeEditor from './components/ThemeEditor';
import HistoryPanel from './components/HistoryPanel';
import AdjPanel from './components/AdjPanel';

// ── LocalStorage Hook ─────────────────────────────────────────────────────────
function useLocalStorage<T>(key:string, initialValue:T): [T, (v:T|((val:T)=>T))=>void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if(typeof window==='undefined') return initialValue;
    try { const item=window.localStorage.getItem(key); return item?JSON.parse(item):initialValue; }
    catch(error) { return initialValue; }
  });
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if(typeof window!=='undefined') window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) { console.error(error); }
  };
  return [storedValue, setValue];
}

// ── Extract JSON and Caption Helper ──────────────────────────────────────────
function extractJsonAndCaption(text: string): { jsonPart: string; captionPart: string; error?: string } {
  const trimmed = text.trim();
  const firstBrace = trimmed.indexOf('{');
  
  const cleanCaption = (str: string) => {
    return str
      .replace(/```[a-zA-Z0-9]*/g, '')
      .replace(/^(Instagram\s+)?Caption:\s*/i, '')
      .replace(/^(Instagram\s+)?Caption\s*$/im, '')
      .trim();
  };

  if (firstBrace === -1) {
    return { jsonPart: '', captionPart: cleanCaption(trimmed), error: 'No JSON object found (missing {)' };
  }
  
  let balance = 0;
  let inString = false;
  let escape = false;
  let endBrace = -1;
  
  for (let i = firstBrace; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') {
        balance++;
      } else if (char === '}') {
        balance--;
        if (balance === 0) {
          endBrace = i;
          break;
        }
      }
    }
  }
  
  if (endBrace === -1) {
    const lastBrace = trimmed.lastIndexOf('}');
    if (lastBrace > firstBrace) {
      const jsonPart = trimmed.slice(firstBrace, lastBrace + 1);
      const textBefore = trimmed.slice(0, firstBrace);
      const textAfter = trimmed.slice(lastBrace + 1);
      const captionPart = cleanCaption([textBefore, textAfter].filter(Boolean).join('\n\n'));
      return { jsonPart, captionPart };
    }
    return { jsonPart: '', captionPart: cleanCaption(trimmed), error: 'Unbalanced braces in JSON' };
  }
  
  const jsonPart = trimmed.slice(firstBrace, endBrace + 1);
  const textBefore = trimmed.slice(0, firstBrace);
  const textAfter = trimmed.slice(endBrace + 1);
  const captionPart = cleanCaption([textBefore, textAfter].filter(Boolean).join('\n\n'));
  return { jsonPart, captionPart };
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function CarouselCreator() {
  const [tab,setTab]=useLocalStorage<Tab>(LS.TAB,'creator');
  const [jsonText,setJsonText]=useState('');
  const [data,setData]=useState<CarouselData|null>(null);
  const [theme,setTheme]=useState<string>('news');
  const [ratio,setRatio]=useState<RatioKey>('4:5');
  const [screenshots,setScreenshots]=useState<Record<number,string>>({});
  const [imgAdjs,setImgAdjs]=useState<Record<number,ImgAdj>>({});
  const [extraImgs,setExtraImgs]=useState<Record<number,ExtraImg[]>>({});
  const [status,setStatus]=useState({msg:'Paste JSON and click Render',type:''});
  const [dlIdx,setDlIdx]=useState<Record<number,boolean>>({});
  const [dlAll,setDlAll]=useState(false);
  const [align,setAlign]=useState({...defAlign});
  const [instagramCaption, setInstagramCaption] = useState<string>('');
  
  const alignLabels:Record<keyof typeof align, string> = {
    tag: "Top Tag (MARKETS)", bullet: "Bullet Dots", footer: "Footer Text",
    statNum: "Big Stat (80%)", heading: "Main Headlines", subHead: "Body & Subheads",
    secLabel: "Golden Over-titles", listNum: "List Numbers (01, 02)", listText: "List Item Text", quote: "Quote Text", ctaBtn: "CTA Button Text", coverFade: "Cover Fade Height"
  };

  const previewRefs=useRef<Record<number,HTMLDivElement|null>>({});
  const downloadRefs=useRef<Record<number,HTMLDivElement|null>>({});
  const coverSsInputRef=useRef<HTMLInputElement|null>(null);
  const [logoSrc,setLogoSrc]=useState(LOGO_PATH);
  const [dirHandle, setDirHandle] = useState<any>(null);

  // LocalStorage state
  const [customThemes, setCustomThemes] = useLocalStorage<Record<string,ThemeDef>>(LS.THEMES, {});
  const [folderPrefix, setFolderPrefix] = useLocalStorage<string>('cc_folder_prefix', '1');
  const [history, setHistory] = useLocalStorage<HistoryItem[]>(LS.HISTORY, []);
  
  // Backup state (excluding screenshots for size)
  const [savedState, setSavedState] = useLocalStorage<any>(LS.STATE, null);

  // Load backup on mount
  useEffect(()=>{
    if(savedState && !data) {
      setJsonText(savedState.jsonText||'');
      setData(savedState.data||null);
      setTheme(savedState.theme||'news');
      setRatio(savedState.ratio||'4:5');
      setImgAdjs(savedState.imgAdjs||{});
      setExtraImgs(savedState.extraImgs||{});
      setAlign(savedState.align||defAlign);
      if(savedState.data) msg('Session restored from auto-save','ok');
      if (savedState.jsonText) {
        const { captionPart } = extractJsonAndCaption(savedState.jsonText);
        setInstagramCaption(captionPart);
      }
    }
  },[]);

  // Auto-save backup
  useEffect(()=>{
    const t = setTimeout(()=>{
      setSavedState({jsonText,data,theme,ratio,imgAdjs,extraImgs,align});
    },800);
    return ()=>clearTimeout(t);
  },[jsonText,data,theme,ratio,imgAdjs,extraImgs,align]);

  useEffect(()=>{
    const img=new window.Image();
    img.crossOrigin='anonymous';
    img.onload=()=>{
      const c=document.createElement('canvas');
      c.width=img.naturalWidth; c.height=img.naturalHeight;
      c.getContext('2d')?.drawImage(img,0,0);
      try{ setLogoSrc(c.toDataURL('image/jpeg')); }catch{ /* tainted */ }
    };
    img.src=LOGO_PATH+'?t='+Date.now();
  },[]);

  const th=rTheme(theme, customThemes);
  const rW = RATIOS[ratio].w;
  const rH = RATIOS[ratio].h;
  const msg=(m:string,t='')=>setStatus({msg:m,type:t});

  const render=()=>{
    const { jsonPart, captionPart, error } = extractJsonAndCaption(jsonText);
    if (error) {
      msg('Format Error: ' + error, 'error');
      return;
    }
    try{
      const d=JSON.parse(jsonPart) as CarouselData;
      if(!d.slides?.length){msg('No slides found','error');return;}
      setData(d); setScreenshots({}); setImgAdjs({}); setExtraImgs({});
      setInstagramCaption(captionPart);
      msg(`✓ ${d.slides.length} slides rendered`,'ok');
      const item: HistoryItem = {
        id: `h_${Date.now()}`, title: d.title || 'Untitled Carousel', savedAt: new Date().toISOString(),
        jsonText, theme, ratio, align, imgAdjs: {},
        instagramCaption: captionPart
      };
      setHistory(prev => [item, ...prev].slice(0, 60));
    }catch(e){ msg('Invalid JSON: '+(e as Error).message,'error'); }
  };

  const handleSS=(idx:number,file:File)=>{
    const r=new FileReader();
    r.onload=e=>setScreenshots(p=>({...p,[idx]:e.target!.result as string}));
    r.readAsDataURL(file);
  };
  
  const handleExtraSS=(idx:number,file:File)=>{
    const r=new FileReader();
    r.onload=e=>{
      const src = e.target!.result as string;
      setExtraImgs(p=>({...p, [idx]: [...(p[idx]||[]), {src, shape:'circle', pos:'cr', size:240, adj:{...defAdj}}]}));
    };
    r.readAsDataURL(file);
  };

  const dlSlide=useCallback(async(idx:number,d:CarouselData)=>{
    setDlIdx(p=>({...p,[idx]:true}));
    try{
      const el=downloadRefs.current[idx];
      if(!el) throw new Error('Render element not ready');
      await document.fonts.ready;
      await new Promise(r=>setTimeout(r,300));
      const hiResCanvas:HTMLCanvasElement=await html2canvas(el,{
        width:rW, height:rH, scale:2,
        useCORS:true, allowTaint:true, backgroundColor:null, logging:false,
        windowWidth:rW, windowHeight:rH,
        x:0, y:0, scrollX:0, scrollY:0,
        imageTimeout:8000,
      });
      const out=document.createElement('canvas');
      out.width=rW; out.height=rH;
      const ctx=out.getContext('2d')!;
      ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
      ctx.drawImage(hiResCanvas,0,0,rW,rH);
      const a=document.createElement('a');
      const name=(d.title||'carousel').replace(/[^a-z0-9]/gi,'-').toLowerCase();
      a.download=`shamsgs-${name}-slide${idx+1}-${ratio.replace(':','x')}.png`;
      a.href=out.toDataURL('image/png');
      a.click();
    }catch(e: any){ 
      console.error('html2canvas error:',e);
      msg('Download error: '+(e?.message||String(e)),'error'); 
    }
    finally{ setDlIdx(p=>({...p,[idx]:false})); }
  },[rW, rH, ratio]);

  const dlAllSlides=useCallback(async()=>{
    if(!data) return;
    setDlAll(true);
    for(let i=data.slides.length-1;i>=0;i--){
      msg(`⏳ Downloading slide ${i+1}/${data.slides.length}...`);
      await dlSlide(i,data);
      await new Promise(r=>setTimeout(r,800));
    }
    setDlAll(false);
    msg(`✓ All ${data.slides.length} slides saved as PNG`,'ok');
  },[data,dlSlide]);

  const dlFolderSlides = useCallback(async () => {
    if (!data) return;
    setDlAll(true);
    let activeDir = dirHandle;
    try {
      if (!activeDir) {
        if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
          msg('📂 Please select/confirm target folder...');
          activeDir = await (window as any).showDirectoryPicker({
            mode: 'readwrite'
          });
          setDirHandle(activeDir);
        } else {
          throw new Error('FileSystem Access API not supported in this browser. Use Chrome/Edge.');
        }
      }
      
      const permissionOpts = { mode: 'readwrite' };
      if ((await activeDir.queryPermission(permissionOpts)) !== 'granted') {
        if ((await activeDir.requestPermission(permissionOpts)) !== 'granted') {
          throw new Error('Write permission denied.');
        }
      }
      
      const subDir = await activeDir.getDirectoryHandle(folderPrefix, { create: true });
      
      for (let i = 0; i < data.slides.length; i++) {
        msg(`⏳ Saving slide ${i + 1}/${data.slides.length} to folder "${folderPrefix}"...`);
        setDlIdx(p => ({ ...p, [i]: true }));
        try {
          const el = downloadRefs.current[i];
          if (!el) throw new Error('Render element not ready');
          await document.fonts.ready;
          await new Promise(r => setTimeout(r, 200));
          const hiResCanvas: HTMLCanvasElement = await html2canvas(el, {
            width: rW, height: rH, scale: 2,
            useCORS: true, allowTaint: true, backgroundColor: null, logging: false,
            windowWidth: rW, windowHeight: rH,
            x: 0, y: 0, scrollX: 0, scrollY: 0,
            imageTimeout: 8000,
          });
          const out = document.createElement('canvas');
          out.width = rW; out.height = rH;
          const ctx = out.getContext('2d')!;
          ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(hiResCanvas, 0, 0, rW, rH);
          
          const blob = await new Promise<Blob | null>(resolve => out.toBlob(resolve, 'image/png'));
          if (!blob) throw new Error(`Failed to generate blob for slide ${i + 1}`);
          
          const fileHandle = await subDir.getFileHandle(`${i + 1}.png`, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        } catch (e: any) {
          console.error('html2canvas error:', e);
          msg('Download error: ' + (e?.message || String(e)), 'error');
        } finally {
          setDlIdx(p => ({ ...p, [i]: false }));
        }
        await new Promise(r => setTimeout(r, 600));
      }
      
      // Write caption.txt inside directory if present
      if (instagramCaption) {
        try {
          const captionFileHandle = await subDir.getFileHandle('caption.txt', { create: true });
          const captionWritable = await captionFileHandle.createWritable();
          await captionWritable.write(instagramCaption);
          await captionWritable.close();
        } catch (e) {
          console.error('Failed to write caption.txt inside directory:', e);
        }
      }

      setFolderPrefix(prev => {
        const match = prev.match(/^(.*?)(\d+)$/);
        if (match) {
          const prefix = match[1];
          const num = parseInt(match[2], 10);
          const length = match[2].length;
          const incrementedNum = String(num + 1).padStart(length, '0');
          return prefix + incrementedNum;
        }
        return prev + ' 2';
      });
      msg(`✓ Folder "${folderPrefix}" created and populated successfully`, 'ok');
    } catch (e: any) {
      console.error('Directory write error:', e);
      msg('Folder write error: ' + (e?.message || String(e)), 'error');
      setDirHandle(null);
    } finally {
      setDlAll(false);
    }
  }, [data, folderPrefix, rW, rH, setFolderPrefix, dirHandle, instagramCaption]);

  const dlCaptionFile = useCallback(() => {
    if (!instagramCaption) {
      msg('No caption available to download', 'error');
      return;
    }
    const a = document.createElement('a');
    const name = (data?.title || 'carousel').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    a.download = `shamsgs-${name}-caption.txt`;
    const blob = new Blob([instagramCaption], { type: 'text/plain;charset=utf-8' });
    a.href = URL.createObjectURL(blob);
    a.click();
    msg('✓ Caption downloaded', 'ok');
  }, [data, instagramCaption]);

  const getCoverImagePrompt = () => {
    if (!data) return '';
    const t = data.title || 'Forex Trading';
    const cat = data.category || 'MARKETS';
    const firstSlide = data.slides?.[0];
    const headline = firstSlide?.headline || t;
    const subheadline = firstSlide?.subheadline || '';
    
    let arStyle = '4:5 aspect ratio (portrait layout, 1080x1350px)';
    let mjAr = '--ar 4:5';
    if (ratio === '9:16') {
      arStyle = '9:16 aspect ratio (tall vertical story, 1080x1920px)';
      mjAr = '--ar 9:16';
    } else if (ratio === '1:1') {
      arStyle = '1:1 aspect ratio (square feed, 1080x1080px)';
      mjAr = '--ar 1:1';
    }

    return `Create a high-impact, attention-grabbing viral Instagram cover image. The visual must look premium, modern, and act as a powerful psychological hook to stop the user from scrolling.

THEME / DATA TO INCORPORATE:
- MAIN HOOK/TITLE: "${headline}"
- CONTEXT/SUBHEAD: "${subheadline}"
- CATEGORY: "${cat}"

IMAGE DISPLAY SPACE & SAFE ZONE COMPOSITION RULES:
1. SAFE ZONE: The bottom 45% of the image WILL be covered by a dark gradient overlay and bold text. Therefore, the main subject, people, objects, and primary action MUST be perfectly positioned in the upper 55% of the frame.
2. Keep the background in the bottom 45% clean, simple, or abstract, letting the white/accent overlay text remain highly readable.
3. No text should be generated inside the image itself.

VISUAL CONCEPT (DETAILED):
- SUBJECT: A premium and cinematic composition. Either:
  a) A professional trader/investor in a sleek, ultra-modern Dubai penthouse office looking focused or confidently analyzing live golden and blue neon candlestick charts on high-end glass screens.
  b) A metaphorical conceptual render: a transparent glass bull and bear charging through a glowing holographic terminal, surrounded by floating gold assets, dynamic energy lines, and fluid 3D shapes.
  c) Premium objects like a luxury smartphone displaying live trading signals with a background of glowing financial charts and a blurred, elegant Dubai skyline at dusk.
- LIGHTING & STYLE: Cinematic moody lighting with vibrant accents of gold, electric blue, and teal. Sleek glassmorphism textures, depth of field with a beautifully blurred background, photorealistic, 8k, Octane Render style finish, premium financial editorial photography.

MIDJOURNEY PARAMETERS:
Professional financial editorial, cinematic lighting, dramatic contrast, depth of field, photorealistic, premium visual hook, 8k resolution, volumetric lighting ${mjAr} --v 6.0`;
  };

  const loadHistoryItem = (h: HistoryItem) => {
    setJsonText(h.jsonText);
    setTheme(h.theme);
    setRatio(h.ratio);
    setAlign({ ...defAlign, ...h.align });
    setImgAdjs(h.imgAdjs || {});
    setScreenshots(h.screenshots || {});
    setExtraImgs(h.extraImgs || {});
    setInstagramCaption(h.instagramCaption || '');

    try {
      const { jsonPart } = extractJsonAndCaption(h.jsonText);
      const d = JSON.parse(jsonPart) as CarouselData;
      setData(d);
      msg('✓ History loaded and rendered successfully', 'ok');
    } catch (err) {
      msg('Warning: Loaded JSON is invalid/unparseable', 'error');
    }
  };

  const pasteAndRender=async()=>{
    try{
      const text=await navigator.clipboard.readText();
      setJsonText(text);
      const { jsonPart, captionPart, error } = extractJsonAndCaption(text);
      if (error) {
        msg('Format Error: ' + error, 'error');
        return;
      }
      const d=JSON.parse(jsonPart) as CarouselData;
      if(!d.slides?.length){msg('No slides found','error');return;}
      setData(d); setScreenshots({}); setImgAdjs({}); setExtraImgs({});
      setInstagramCaption(captionPart);
      msg(`✓ ${d.slides.length} slides rendered`,'ok');
      const item:HistoryItem={
        id:`h_${Date.now()}`,
        title:d.title||'Untitled Carousel',
        savedAt:new Date().toISOString(),
        jsonText:text,
        theme,
        ratio,
        align,
        imgAdjs:{},
        instagramCaption:captionPart
      };
      setHistory(prev=>[item,...prev].slice(0, 60));
      setTimeout(()=>{ coverSsInputRef.current?.click(); },400);
    }catch(e:any){ msg('Paste/render error: '+(e?.message||String(e)),'error'); }
  };

  const saveToHistory = () => {
    if(!data) return;
    const { jsonPart, captionPart } = extractJsonAndCaption(jsonText);
    const item: HistoryItem = {
      id: `h_${Date.now()}`, title: data.title || 'Untitled Carousel', savedAt: new Date().toISOString(),
      jsonText, theme, ratio, align, imgAdjs,
      instagramCaption: captionPart,
      screenshots,
      extraImgs
    };
    setHistory(prev => [item, ...prev].slice(0, 60)); // Keep last 60
    msg('✓ Saved to History','ok');
  };

  const updateHistoryItem = (id: string, updated: Partial<HistoryItem>) => {
    setHistory(prev => prev.map(h => h.id === id ? { ...h, ...updated } : h));
  };

  const slidesNeedingSS=data?.slides.map((s,i)=>({s,i})).filter(({s})=>s.slide_type==='cover'||s.has_screenshot)||[];
  const allSlides=data?.slides.map((s,i)=>({s,i}))||[];

  const tabSt=(t:Tab):React.CSSProperties=>({
    padding:'8px 20px',borderRadius:8,fontFamily:"'Space Mono',monospace",fontSize:11,letterSpacing:1,cursor:'pointer',border:'none',transition:'all .2s',
    background:tab===t?'rgba(201,168,76,0.15)':'transparent',
    color:tab===t?'#E8C96A':'#6b6b80',
    borderBottom:tab===t?'2px solid #C9A84C':'2px solid transparent',
  });

  const slideProps=(idx:number)=>({
    slide:{...data!.slides[idx],tag:data!.slides[idx].tag||data!.category},
    idx,total:data!.slides.length,theme:th,screenshots,extraImgs,logoSrc,imgAdjs,align,slideW:rW,slideH:rH
  });

  const allThemeKeys = [...Object.keys(BUILTIN_THEMES), ...Object.keys(customThemes)];

  return (
    <div style={{fontFamily:"'Syne',sans-serif",maxWidth:'100%'}}>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
          <div style={{width:48,height:48,borderRadius:12,background:'linear-gradient(135deg,#C9A84C,#E8C96A)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🎨</div>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:'#e8e8f0',margin:0}}>Carousel Creator</h1>
            <p style={{fontSize:12,color:'#6b6b80',margin:0,fontFamily:"'Space Mono',monospace"}}>Generate high-res branded carousels for shamsgs.com</p>
          </div>
        </div>
        <div style={{display:'flex',gap:0,borderBottom:'1px solid rgba(255,255,255,.07)',marginTop:12,overflowX:'auto'}}>
          {(['creator','builder','prompt','themes','history'] as Tab[]).map(t=><button key={t} style={tabSt(t)} onClick={()=>setTab(t)}>{t==='creator'?'▶ Creator':t==='builder'?'📋 Builder':t==='prompt'?'📄 Prompt':t==='themes'?'🎨 Themes':'💾 History'}</button>)}
        </div>
      </div>

      {tab==='prompt'&&<PromptBuilder/>}
      {tab==='builder'&&<BuilderTab onLoad={j=>{setJsonText(j);setTab('creator');msg('JSON loaded — click Render','ok');}}/>}
      {tab==='themes'&&<ThemeEditor customThemes={customThemes} setCustomThemes={setCustomThemes}/>}
      {tab==='history'&&<HistoryPanel history={history} loadHistory={h=>{loadHistoryItem(h);setTab('creator');}} delHistory={id=>setHistory(prev=>prev.filter(x=>x.id!==id))} updateHistoryItem={updateHistoryItem}/>}
      
      {tab==='creator'&&(
        <div style={{display:'flex',gap:24,height:'calc(100vh - 200px)'}}>
          {/* Left panel */}
          <div style={{width:340,flexShrink:0,overflowY:'auto',paddingRight:8}}>
            <div style={{marginBottom:14,padding:18,borderRadius:12,background:'var(--card)',border:'1px solid var(--border)'}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase',marginBottom:10,display:'flex',alignItems:'center',justifyContent:'space-between',gap:6}}>
                <span>1 — Paste JSON</span>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <button onClick={pasteAndRender} style={{background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',color:'#A3B8CC',fontFamily:"'Space Mono',monospace",fontSize:9,padding:'3px 10px',borderRadius:5,cursor:'pointer',letterSpacing:1}}>⎘ PASTE</button>
                  <select onChange={e=>{
                    const h=history.find(x=>x.id===e.target.value);
                    if(h){
                      loadHistoryItem(h);
                    }
                    e.target.value='';
                  }} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',color:'#A3B8CC',fontSize:9,fontFamily:"'Space Mono',monospace",borderRadius:4,outline:'none',maxWidth:110}}>
                    <option value="">History...</option>
                    {history.map(h=><option key={h.id} value={h.id}>{h.title}</option>)}
                  </select>
                </div>
              </div>

              <textarea value={jsonText} onChange={e=>setJsonText(e.target.value)} placeholder={'{\n  "type":"news",\n  "slides":[...]\n}'} style={{width:'100%',height:180,background:'#030810',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,color:'#A3B8CC',fontFamily:"'Space Mono',monospace",fontSize:11,padding:12,resize:'vertical',outline:'none',lineHeight:1.5}}/>
              
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase',margin:'12px 0 8px'}}>2 — Theme</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {allThemeKeys.map(k=>(
                  <button key={k} onClick={()=>setTheme(k)} style={{flex:'1 1 30%',padding:'8px 4px',borderRadius:6,cursor:'pointer',fontFamily:"'Space Mono',monospace",fontSize:10,background:theme===k?'rgba(201,168,76,0.15)':'rgba(255,255,255,.04)',border:`1px solid ${theme===k?'#C9A84C':'rgba(255,255,255,.1)'}`,color:theme===k?'#E8C96A':'#6b6b80',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                    {rTheme(k, customThemes).name} {customThemes[k]?'*':''}
                  </button>
                ))}
              </div>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase',margin:'12px 0 8px'}}>3 — Ratio</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {(Object.keys(RATIOS) as RatioKey[]).map(k=>(
                  <button key={k} onClick={()=>setRatio(k)} style={{flex:1,padding:'8px 0',borderRadius:6,cursor:'pointer',fontFamily:"'Space Mono',monospace",fontSize:10,background:ratio===k?'rgba(201,168,76,0.15)':'rgba(255,255,255,.04)',border:`1px solid ${ratio===k?'#C9A84C':'rgba(255,255,255,.1)'}`,color:ratio===k?'#E8C96A':'#6b6b80',whiteSpace:'nowrap'}}>
                    {RATIOS[k].icon} {k}
                  </button>
                ))}
              </div>

              <button onClick={render} style={{width:'100%',padding:12,marginTop:16,background:'linear-gradient(135deg,#C9A84C,#E8C96A)',color:'#050E1C',fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,letterSpacing:2,border:'none',borderRadius:8,cursor:'pointer'}}>▶ RENDER SLIDES</button>
              
               {data&&<div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={dlAllSlides} disabled={dlAll} style={{flex:1,padding:11,background:dlAll?'rgba(26,111,168,0.5)':'linear-gradient(135deg,#1a6fa8,#2a8fd4)',color:'#fff',fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:1.5,border:'none',borderRadius:8,cursor:dlAll?'not-allowed':'pointer'}}>{dlAll?status.msg:'⬇ ALL PNG'}</button>
                  {instagramCaption && (
                    <button onClick={() => {
                      navigator.clipboard.writeText(instagramCaption);
                      msg('✓ Caption copied to clipboard!', 'ok');
                    }} style={{flex:1,padding:11,background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.3)',color:'#E8C96A',fontFamily:"'Space Mono',monospace",fontSize:10,borderRadius:8,cursor:'pointer'}}>📝 COPY CAPTION</button>
                  )}
                  <button onClick={saveToHistory} style={{flex:1,padding:11,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#A3B8CC',fontFamily:"'Space Mono',monospace",fontSize:10,borderRadius:8,cursor:'pointer'}}>💾 Save</button>
                </div>
                <button onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(data.title || '')}`, '_blank')} style={{width:'100%',padding:10,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.1)',color:'#A3B8CC',fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:1,borderRadius:8,cursor:'pointer'}}>🔍 Search Images for Cover</button>
                
                <div style={{marginTop:8,borderTop:'1px dashed rgba(255,255,255,0.08)',paddingTop:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                    <label style={{fontSize:10,fontFamily:"'Space Mono',monospace",color:'#C9A84C'}}>Folder / Starting Index</label>
                    {dirHandle && (
                      <span onClick={() => setDirHandle(null)} style={{fontSize:9,fontFamily:"'Space Mono',monospace",color:'#6b6b80',cursor:'pointer',textDecoration:'underline'}}>
                        Change Folder Target
                      </span>
                    )}
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <input type="text" value={folderPrefix} onChange={e=>setFolderPrefix(e.target.value)} style={{width:100,background:'#030810',border:'1px solid rgba(255,255,255,.1)',borderRadius:6,color:'#FFF',padding:'6px 10px',fontSize:12,fontFamily:"'Space Mono',monospace",outline:'none'}}/>
                    <button onClick={dlFolderSlides} disabled={dlAll} style={{flex:1,padding:'6px 10px',background:dlAll?'rgba(201,168,76,0.5)':'linear-gradient(135deg,#C9A84C,#E8C96A)',color:'#050E1C',fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:1,border:'none',borderRadius:8,cursor:dlAll?'not-allowed':'pointer'}}>{dlAll?'Saving...':'⬇ DL FOLDER'}</button>
                  </div>
                </div>
              </div>}
              
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:status.type==='error'?'#e05c5c':status.type==='ok'?'#4ecb82':'#A3B8CC',padding:'8px 0',textAlign:'center'}}>{status.msg}</div>
            </div>

            {/* Screenshots & Extras */}
            {data && (
              <div style={{padding:16,borderRadius:12,background:'var(--card)',border:'1px solid var(--border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase'}}>4 — Images & Overlays</span>
                  <button onClick={() => window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(data.title || '')}`, '_blank')} style={{background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.3)',color:'#E8C96A',fontFamily:"'Space Mono',monospace",fontSize:9,padding:'3px 8px',borderRadius:5,cursor:'pointer'}}>🔍 SEARCH IMAGES</button>
                </div>
                {allSlides.map(({s,i})=>{
                  const isPrimary = s.slide_type==='cover'||s.has_screenshot;
                  const exs = extraImgs[i]||[];
                  if(!isPrimary && exs.length===0) return (
                    <div key={i} style={{marginBottom:10,padding:'10px 12px',borderRadius:8,background:'rgba(255,255,255,.02)',border:'1px dashed rgba(255,255,255,.05)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#6b6b80'}}>Slide {i+1}</span>
                        <label style={{cursor:'pointer',color:'#A3B8CC',fontSize:10,fontFamily:"'Space Mono',monospace",background:'rgba(255,255,255,.05)',padding:'4px 8px',borderRadius:4}}>+ Extra Img<input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0])handleExtraSS(i,e.target.files[0]);}}/></label>
                      </div>
                    </div>
                  );
                  return (
                    <div key={i} style={{marginBottom:16,padding:'10px 12px',borderRadius:8,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)'}}>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#A3B8CC',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span>Slide {i+1}</span>
                        <label style={{cursor:'pointer',color:'#A3B8CC',fontSize:9,background:'rgba(255,255,255,.05)',padding:'3px 6px',borderRadius:4}}>+ Extra<input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0])handleExtraSS(i,e.target.files[0]);}}/></label>
                      </div>
                      
                      {isPrimary && (
                        <div style={{marginBottom:12}}>
                          <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
                            <div style={{flex:1,fontFamily:"'Space Mono',monospace",fontSize:9,color:screenshots[i]?'#4ecb82':'#6b6b80'}}>Primary {s.slide_type==='cover'?'(Req)':'(Opt)'}</div>
                            <span style={{background:screenshots[i]?'rgba(78,203,130,0.12)':'rgba(201,168,76,0.12)',border:`1px solid ${screenshots[i]?'rgba(78,203,130,0.3)':'rgba(201,168,76,0.3)'}`,color:screenshots[i]?'#4ecb82':'#E8C96A',fontSize:9,padding:'4px 8px',borderRadius:4,fontFamily:"'Space Mono',monospace",flexShrink:0}}>{screenshots[i]?'Change':'Upload'}</span>
                            <input type="file" accept="image/*" style={{display:'none'}} ref={i===0?coverSsInputRef:undefined} onChange={e=>{if(e.target.files?.[0])handleSS(i,e.target.files[0]);}}/>
                          </label>
                          {screenshots[i] && <AdjPanel idx={i} src={screenshots[i]} adj={imgAdjs[i]??defAdj} onChange={a=>setImgAdjs(p=>({...p,[i]:a}))}/>}
                          {i === 0 && (
                            <div style={{marginTop:8,padding:10,background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.2)',borderRadius:8}}>
                              <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'#E8C96A',marginBottom:6,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                <span>🎨 COVER IMAGE PROMPT</span>
                                <button onClick={() => {
                                  navigator.clipboard.writeText(getCoverImagePrompt());
                                  msg('✓ Cover image prompt copied!', 'ok');
                                }} style={{background:'rgba(201,168,76,0.15)',border:'1px solid rgba(201,168,76,0.3)',color:'#E8C96A',fontSize:8,padding:'2px 6px',borderRadius:4,cursor:'pointer'}}>⎘ COPY</button>
                              </div>
                              <div style={{fontSize:9,color:'#8BA5C8',lineHeight:1.4,maxHeight:60,overflowY:'auto',whiteSpace:'pre-wrap',fontFamily:"'Space Mono',monospace"}}>
                                {getCoverImagePrompt()}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {exs.map((e, ei)=>(
                        <div key={ei} style={{marginTop:8,paddingTop:8,borderTop:'1px dashed rgba(255,255,255,.05)'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                            <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'#E8C96A'}}>Extra Img {ei+1}</span>
                            <button onClick={()=>setExtraImgs(p=>({...p,[i]:p[i].filter((_,x)=>x!==ei)}))} style={{background:'none',border:'none',color:'#e05c5c',cursor:'pointer',fontSize:10}}>✕</button>
                          </div>
                          
                          <div style={{display:'flex',gap:4,marginBottom:6}}>
                            {(['circle','rounded','square'] as ExtraShape[]).map(sh=>(
                              <button key={sh} onClick={()=>setExtraImgs(p=>({...p,[i]:p[i].map((x,idx)=>idx===ei?{...x,shape:sh}:x)}))} style={{flex:1,padding:'4px 0',fontSize:9,fontFamily:"'Space Mono',monospace",background:e.shape===sh?'rgba(201,168,76,0.15)':'rgba(255,255,255,.04)',color:e.shape===sh?'#E8C96A':'#6b6b80',border:`1px solid ${e.shape===sh?'#C9A84C':'transparent'}`,borderRadius:4}}>{sh}</button>
                            ))}
                          </div>

                          <div style={{display:'flex',gap:4,marginBottom:6}}>
                            {(['tl','tr','cr','bl','br'] as ExtraPos[]).map(pos=>(
                              <button key={pos} onClick={()=>setExtraImgs(p=>({...p,[i]:p[i].map((x,idx)=>idx===ei?{...x,pos}:x)}))} style={{flex:1,padding:'4px 0',fontSize:9,fontFamily:"'Space Mono',monospace",background:e.pos===pos?'rgba(201,168,76,0.15)':'rgba(255,255,255,.04)',color:e.pos===pos?'#E8C96A':'#6b6b80',border:`1px solid ${e.pos===pos?'#C9A84C':'transparent'}`,borderRadius:4,textTransform:'uppercase'}}>{pos}</button>
                            ))}
                          </div>

                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                            <span style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'#6b6b80'}}>Size</span>
                            <input type="range" min="100" max="600" value={e.size} onChange={ev=>setExtraImgs(p=>({...p,[i]:p[i].map((x,idx)=>idx===ei?{...x,size:+ev.target.value}:x)}))} style={{flex:1,accentColor:'#C9A84C'}}/>
                          </div>

                          <AdjPanel idx={i} src={e.src} adj={e.adj} onChange={a=>setExtraImgs(p=>({...p,[i]:p[i].map((x,idx)=>idx===ei?{...x,adj:a}:x)}))}/>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vertical Fine-Tuning */}
            {data && (
              <div style={{padding:16,borderRadius:12,background:'var(--card)',border:'1px solid var(--border)',marginTop:14}}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase',marginBottom:12}}>5 — Fine-Tuning</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',columnGap:16,rowGap:12}}>
                  {(Object.keys(alignLabels) as Array<keyof typeof align>).map(k => (
                    <div key={k}>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'#A3B8CC',marginBottom:3,display:'flex',justifyContent:'space-between'}}>
                        <span>{alignLabels[k]}</span><span>{align[k] > 0 ? '+'+align[k] : align[k]}px</span>
                      </div>
                      <input type="range" min="-150" max="150" step="1" value={align[k]} onChange={e=>setAlign(p=>({...p,[k]:+e.target.value}))} style={{width:'100%',accentColor:'#C9A84C',cursor:'pointer'}}/>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: slide previews */}
          <div style={{flex:1,overflowY:'auto',paddingRight:4}}>
            {!data?(
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',textAlign:'center',color:'#6b6b80'}}>
                <div style={{fontSize:48,marginBottom:16,opacity:.4}}>🎨</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,color:'#E8C96A',marginBottom:10}}>Ready to Create</div>
                <div style={{fontSize:13,maxWidth:380,lineHeight:1.7}}>Use the <strong style={{color:'#A3B8CC'}}>Builder</strong> or <strong style={{color:'#A3B8CC'}}>Prompt</strong> tab to get JSON, then paste here and hit Render.</div>
              </div>
            ):(
              <div style={{display:'flex',flexWrap:'wrap',gap:24,justifyContent:'flex-start'}}>
                {data.slides.map((_,idx)=>(
                  <div key={idx} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
                    {/* Preview: scaled wrapper so we can see the full height */}
                    <div style={{width:rW*0.4,height:rH*0.4,overflow:'hidden',borderRadius:12,boxShadow:'0 8px 40px rgba(0,0,0,.6)',position:'relative',flexShrink:0}}>
                      <div ref={el=>{previewRefs.current[idx]=el;}} style={{transform:'scale(0.4)',transformOrigin:'top left',position:'absolute',top:0,left:0}}>
                        <SlideEl {...slideProps(idx)}/>
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:'#6b6b80'}}>Slide {idx+1}/{data.slides.length}</span>
                      <button onClick={()=>dlSlide(idx,data)} disabled={!!dlIdx[idx]} style={{background:'rgba(201,168,76,0.12)',border:'1px solid rgba(201,168,76,0.3)',color:dlIdx[idx]?'#6b6b80':'#E8C96A',fontFamily:"'Space Mono',monospace",fontSize:10,padding:'6px 16px',borderRadius:6,cursor:dlIdx[idx]?'not-allowed':'pointer'}}>
                        {dlIdx[idx]?'⏳':'⬇ PNG'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── HIDDEN DOWNLOAD CONTAINER — off-screen ── */}
      {data&&(
        <div style={{position:'fixed',top:0,left:'-9999px',width:rW,pointerEvents:'none',zIndex:-1}}>
          {data.slides.map((_,idx)=>(
            <div key={`dl-${idx}`} ref={el=>{downloadRefs.current[idx]=el;}} style={{width:rW,height:rH,overflow:'hidden'}}>
              <SlideEl {...slideProps(idx)}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
