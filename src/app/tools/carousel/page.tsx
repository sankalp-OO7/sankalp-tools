'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';

const LOGO_PATH = '/shamsgs-logo.jpg';
const BRAND = {
  website: 'shamsgs.com',
  cta: { buttonText: 'Visit shamsgs.com', linkInBio: 'Link in bio \u2197' },
  themes: {
    news: { name:'News', bg:'#050E1C', bg2:'#091628', bg3:'#0d1f38', accent:'#C9A84C', accent2:'#E8C96A', accentDim:'rgba(201,168,76,0.18)', text:'#FFFFFF', textSec:'#A3B8CC', tagBg:'rgba(201,168,76,0.18)', tagColor:'#E8C96A', border:'rgba(201,168,76,0.25)', card:'rgba(201,168,76,0.07)', footerBg:'rgba(5,14,28,0.97)', grid:'rgba(201,168,76,0.04)', coverGrad:'linear-gradient(150deg,#050E1C 0%,#0d1f38 55%,#091628 100%)' },
    tech: { name:'Tech', bg:'#050E1C', bg2:'#060820', bg3:'#080A2A', accent:'#00C8FF', accent2:'#7B61FF', accentDim:'rgba(0,200,255,0.15)', text:'#FFFFFF', textSec:'#8BA5C8', tagBg:'rgba(0,200,255,0.15)', tagColor:'#00C8FF', border:'rgba(0,200,255,0.2)', card:'rgba(0,200,255,0.06)', footerBg:'rgba(5,14,28,0.97)', grid:'rgba(0,200,255,0.04)', coverGrad:'linear-gradient(150deg,#050E1C 0%,#080A2A 55%,#060820 100%)' },
  },
};

type ThemeKey = 'news'|'tech';
type Tab = 'creator'|'builder'|'prompt';
interface SlideData { slide_type:string; page:number; headline?:string; subheadline?:string; tag?:string; has_screenshot?:boolean; section_label?:string; body?:string; bullets?:string[]; stat_number?:string; stat_label?:string; stat_context?:string; quote_text?:string; quote_source?:string; items?:{number:string;text:string}[]; cta_headline?:string; cta_body?:string; }
interface CarouselData { type:string; title:string; category:string; slides:SlideData[]; }
interface ImgAdj { panX:number; panY:number; scale:number; }
const defAdj:ImgAdj = { panX:0, panY:0, scale:1 };

const clamp = (s:string|undefined, n:number) => s ? String(s).slice(0,n) : '';

// ── Image zone — uses <canvas> drawn via 2D API for perfect html2canvas quality ──
// html2canvas reads <canvas> pixel data directly (no CSS sampling / no objectFit issues).
// Pan & zoom math mirrors the old CSS approach so slider values are identical.
function ImgZone({ src, adj, radius=0, w='100%', h='100%' }:{ src?:string; adj:ImgAdj; radius?:number; w?:string|number; h?:string|number }) {
  const containerRef=useRef<HTMLDivElement>(null);
  const canvasRef=useRef<HTMLCanvasElement>(null);

  useEffect(()=>{
    const canvas=canvasRef.current;
    const container=containerRef.current;
    if(!canvas||!container) return;
    // Prefer explicit numeric dimensions — offsetWidth can be 0 in off-screen fixed containers
    const cw=typeof w==='number' ? w : container.offsetWidth;
    const ch=typeof h==='number' ? h : container.offsetHeight;
    if(!cw||!ch) return;
    canvas.width=cw; canvas.height=ch;
    const ctx=canvas.getContext('2d')!;
    ctx.clearRect(0,0,cw,ch);
    if(!src) return;
    const img=new Image();
    img.onload=()=>{
      // "contain" fit: scale image to fit within container
      const containScale=Math.min(cw/img.naturalWidth, ch/img.naturalHeight);
      const fw=img.naturalWidth  * containScale * adj.scale;
      const fh=img.naturalHeight * containScale * adj.scale;
      // Center + apply pan offset (panX/Y are % of container, range -50 to +50)
      const ox=cw/2 + (adj.panX/100)*cw - fw/2;
      const oy=ch/2 + (adj.panY/100)*ch - fh/2;
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality='high';
      ctx.drawImage(img, ox, oy, fw, fh);
    };
    img.src=src;
  },[src, adj, w, h]);

  const containerStyle:React.CSSProperties={position:'relative',width:w,height:h,borderRadius:radius,overflow:'hidden',flexShrink:0};
  return (
    <div ref={containerRef} style={containerStyle}>
      {src
        ? <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>
        : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Space Mono',monospace",fontSize:22,letterSpacing:2,opacity:.25,color:'inherit'}}>[ Upload Image ]</div>
      }
    </div>
  );
}

// ── SlideEl ─────────────────────────────────────────────────────────────────
function SlideEl({ slide, idx, total, theme:t, screenshots, logoSrc, imgAdjs, align }:{
  slide:SlideData; idx:number; total:number; theme:typeof BRAND.themes.news;
  screenshots:Record<number,string>; logoSrc:string; imgAdjs:Record<number,ImgAdj>;
  align: {tag:number; bullet:number; footer:number; statNum:number; heading:number; subHead:number; secLabel:number; listNum:number; listText:number; quote:number; ctaBtn:number;};
}) {
  const ss = screenshots[idx];
  const adj = imgAdjs[idx] ?? defAdj;
  const type = slide.slide_type;

  const Wrap = ({ children }:{children:React.ReactNode}) => (
    <div style={{width:1080,height:1080,position:'relative',overflow:'hidden',background:t.bg,color:t.text,fontFamily:"'Syne',sans-serif",flexShrink:0}}>
      {/* grid */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:`linear-gradient(${t.grid} 1px,transparent 1px),linear-gradient(90deg,${t.grid} 1px,transparent 1px)`,backgroundSize:'54px 54px'}}/>
      {/* glow */}
      <div style={{position:'absolute',width:500,height:500,top:-150,right:-150,borderRadius:'50%',background:`radial-gradient(circle,${t.accentDim} 0%,transparent 70%)`,pointerEvents:'none'}}/>
      {/* header */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:72,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 52px',zIndex:10,borderBottom:`1px solid ${t.border}`,background:t.footerBg}}>
        <img src={logoSrc} alt="ShamsGS" style={{width:44,height:44,borderRadius:8,objectFit:'cover'}} crossOrigin="anonymous"/>
        <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',height:34,padding:'0 18px',fontFamily:"'Space Mono',monospace",fontSize:18,letterSpacing:3,textTransform:'uppercase',borderRadius:20,background:t.tagBg,color:t.tagColor,border:`1px solid ${t.border}`,fontWeight:700}}>
          <span style={{transform:`translateY(${align.tag}px)`}}>{clamp(slide.tag||'SHAMSGS',20)}</span>
        </span>
        <span style={{width:44}} />{/* placeholder to keep center alignment */}
      </div>
      {/* footer */}
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:58,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 52px',zIndex:10,background:t.footerBg,borderTop:`1px solid ${t.border}`}}>
        <span style={{fontFamily:"'Space Mono',monospace",fontSize:20,color:t.accent,letterSpacing:1,transform:`translateY(${align.footer}px)`}}>{BRAND.website}</span>
        <span style={{fontFamily:"'Space Mono',monospace",fontSize:20,color:t.textSec,letterSpacing:1,display:'flex',alignItems:'center',gap:8}}>
          {idx === total - 1 ? <span style={{transform:`translateY(${align.footer}px)`}}>{BRAND.cta.linkInBio}</span> : (
            <>
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              <span style={{transform:`translateY(${align.footer}px)`}}>Slide {idx+1} / {total}</span>
            </>
          )}
        </span>
      </div>
      {children}
    </div>
  );

  const bodyBase:React.CSSProperties = {position:'absolute',top:72,bottom:58,left:0,right:0,padding:'52px 64px',overflow:'hidden'};

  if (type==='cover') return (
    <Wrap>
      {/* image zone 380px */}
      <div style={{position:'absolute',top:72,left:0,right:0,height:380,overflow:'hidden',background:t.coverGrad}}>
        <ImgZone src={ss} adj={adj} w={1080} h={380}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:180,background:`linear-gradient(transparent,${t.bg})`}}/>
      </div>
      {/* text zone */}
      <div style={{position:'absolute',left:0,right:0,bottom:58,padding:'0 64px 44px',overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',gap:14,fontFamily:"'Space Mono',monospace",fontSize:22,letterSpacing:5,textTransform:'uppercase',color:t.accent,marginBottom:18,transform:`translateY(${align.secLabel}px)`}}>
          <span style={{width:36,height:2,background:t.accent,display:'inline-block',flexShrink:0}}/>
          {clamp(slide.tag||'SHAMSGS',25)}
        </div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:88,fontWeight:700,lineHeight:1.05,letterSpacing:-1,marginBottom:16,transform:`translateY(${align.heading}px)`}}>{clamp(slide.headline,55)}</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:30,lineHeight:1.5,opacity:.75,transform:`translateY(${align.subHead}px)`}}>{clamp(slide.subheadline,80)}</div>
      </div>
    </Wrap>
  );

  if (type==='content') {
    const hasSS = slide.has_screenshot && ss;
    return (
      <Wrap>
        <div style={{...bodyBase,display:'flex',gap:hasSS?52:0}}>
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {slide.section_label && <div style={{fontFamily:"'Space Mono',monospace",fontSize:20,letterSpacing:4,textTransform:'uppercase',color:t.accent,display:'flex',alignItems:'center',gap:16,marginBottom:24,transform:`translateY(${align.secLabel}px)`}}>{clamp(slide.section_label,28)}<span style={{flex:1,height:1,background:t.accent,opacity:.3}}/></div>}
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:68,fontWeight:700,lineHeight:1.1,letterSpacing:-.5,marginBottom:24,transform:`translateY(${align.heading}px)`}}>{clamp(slide.headline,50)}</div>
            {slide.body && <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,lineHeight:1.65,color:t.textSec,marginBottom:28,transform:`translateY(${align.subHead}px)`}}>{clamp(slide.body,140)}</div>}
            {(slide.bullets||[]).slice(0,5).map((b,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:16,fontFamily:"'Syne',sans-serif",fontSize:27,lineHeight:1.4,color:t.textSec,marginBottom:14}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:t.accent,flexShrink:0,transform:`translateY(${align.bullet}px)`}}/>
                <span style={{transform:`translateY(${align.listText}px)`, display:'inline-block'}}>{clamp(b,65)}</span>
              </div>
            ))}
          </div>
          {hasSS && <div style={{width:380,flexShrink:0,display:'flex',alignItems:'center'}}><ImgZone src={ss} adj={adj} radius={16} w={380} h={380}/></div>}
        </div>
      </Wrap>
    );
  }

  if (type==='stat') return (
    <Wrap>
      <div style={{...bodyBase,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',gap:20}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:220,fontWeight:700,lineHeight:1,letterSpacing:-4,color:t.accent,transform:`translateY(${align.statNum}px)`}}>{clamp(slide.stat_number,12)}</div>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:28,letterSpacing:5,textTransform:'uppercase',color:t.textSec,maxWidth:800,transform:`translateY(${align.secLabel}px)`}}>{clamp(slide.stat_label,45)}</div>
        {slide.stat_context && <div style={{fontFamily:"'Syne',sans-serif",fontSize:30,lineHeight:1.5,color:t.textSec,maxWidth:700,}}>{clamp(slide.stat_context,90)}</div>}
      </div>
    </Wrap>
  );

  if (type==='quote') return (
    <Wrap>
      <div style={{...bodyBase,display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:200,lineHeight:.6,marginBottom:20,opacity:.35,color:t.accent,transform:`translateY(${align.quote}px)`}}>&ldquo;</div>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:56,fontStyle:'italic',fontWeight:400,lineHeight:1.4,marginBottom:36,}}>{clamp(slide.quote_text,130)}</div>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:22,letterSpacing:3,textTransform:'uppercase',paddingTop:24,borderTop:`1px solid ${t.accent}`,color:t.accent,opacity:.65,}}>{clamp(slide.quote_source,55)}</div>
      </div>
    </Wrap>
  );

  if (type==='list') return (
    <Wrap>
      <div style={bodyBase}>
        {slide.section_label && <div style={{fontFamily:"'Space Mono',monospace",fontSize:20,letterSpacing:4,textTransform:'uppercase',color:t.accent,display:'flex',alignItems:'center',gap:16,marginBottom:24}}>{clamp(slide.section_label,28)}<span style={{flex:1,height:1,background:t.accent,opacity:.3}}/></div>}
        {slide.headline && <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:64,fontWeight:700,lineHeight:1.1,marginBottom:32,transform:`translateY(${align.heading}px)`}}>{clamp(slide.headline,50)}</div>}
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          {(slide.items||[]).slice(0,5).map((item,i)=>(
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:24,padding:'18px 22px',borderRadius:12,background:t.card,border:`1px solid ${t.border}`,overflow:'hidden'}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:52,fontWeight:700,lineHeight:1,color:t.accent,flexShrink:0,width:64,textAlign:'right',transform:`translateY(${align.listNum}px)`}}>{clamp(item.number,4)}</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,lineHeight:1.4,paddingTop:10,color:t.textSec,}}>{clamp(item.text,70)}</div>
            </div>
          ))}
        </div>
      </div>
    </Wrap>
  );

  if (type==='cta') return (
    <Wrap>
      <div style={{position:'absolute',width:600,height:600,top:'50%',left:'50%',transform:'translate(-50%,-50%)',borderRadius:'50%',background:`radial-gradient(circle,${t.accentDim} 0%,transparent 70%)`,pointerEvents:'none'}}/>
      <div style={{...bodyBase,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',gap:28}}>
        <img src={logoSrc} alt="ShamsGS" crossOrigin="anonymous" style={{width:180,height:180,borderRadius:24,objectFit:'cover',boxShadow:`0 0 60px ${t.accentDim}`}}/>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:72,fontWeight:700,lineHeight:1.1,color:t.accent,maxWidth:800,transform:`translateY(${align.heading}px)`}}>{clamp(slide.cta_headline,40)}</div>
        {slide.cta_body && <div style={{fontFamily:"'Syne',sans-serif",fontSize:30,lineHeight:1.5,color:t.textSec,maxWidth:700}}>{clamp(slide.cta_body,90)}</div>}
        <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',height:76,padding:'0 60px',borderRadius:50,fontFamily:"'Space Mono',monospace",fontSize:26,fontWeight:700,letterSpacing:2,background:`linear-gradient(135deg,${t.accent},${t.accent2})`,color:'#050E1C'}}><span style={{transform:`translateY(${align.ctaBtn}px)`}}>{BRAND.cta.buttonText}</span></div>
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:22,letterSpacing:2,color:t.textSec}}>{BRAND.cta.linkInBio}</div>
      </div>
    </Wrap>
  );

  return <SlideEl slide={{...slide,slide_type:'content'}} idx={idx} total={total} theme={t} screenshots={screenshots} logoSrc={logoSrc} imgAdjs={imgAdjs} align={align}/>;
}

// ── Prompt Builder ───────────────────────────────────────────────────────────
function PromptBuilder() {
  const [topic,setTopic]=useState(''); const [type,setType]=useState('news'); const [cat,setCat]=useState('MARKETS'); const [n,setN]=useState('6'); const [ss,setSs]=useState('Slide 1 (cover)'); const [copied,setCopied]=useState(false);
  const prompt=`You are a social media content writer for ShamsGS (shamsgs.com), a UAE-based AI-powered forex trading platform.\n\nCreate a carousel JSON for the topic below. Follow the EXACT schema and ALL character limits.\n\nTOPIC: ${topic||'[enter topic]'}\nCARROUSEL TYPE: ${type}\nCATEGORY TAG: ${cat||'SHAMSGS'} (max 20 chars, uppercase)\nNUMBER OF SLIDES: ${n} (always cover first, CTA last)\nSCREENSHOTS: ${ss||'none'}\n\nSTRICT CHARACTER LIMITS:\n- cover headline: 55 | subheadline: 80 | tag: 25\n- section_label: 28 | content headline: 50 | body: 140\n- bullets: max 5 × 65 chars | stat_number: 12\n- stat_label: 45 | stat_context: 90 | quote_text: 130\n- quote_source: 55 | list items: max 5 × 70 chars\n- cta_headline: 40 | cta_body: 90\n\nSlide types: cover, content, stat, quote, list, cta\nRules: First=cover. Last=cta. has_screenshot:true only where needed. No emojis. Professional tone.\n\nReturn ONLY valid raw JSON:\n{\n  "type":"${type}","title":"...","category":"${cat||'SHAMSGS'}",\n  "slides":[\n    {"slide_type":"cover","headline":"...","subheadline":"...","tag":"...","has_screenshot":true,"page":1},\n    {"slide_type":"content","section_label":"...","headline":"...","body":"...","bullets":["..."],"has_screenshot":false,"page":2},\n    {"slide_type":"stat","stat_number":"...","stat_label":"...","stat_context":"...","page":3},\n    {"slide_type":"quote","quote_text":"...","quote_source":"...","page":4},\n    {"slide_type":"list","section_label":"...","headline":"...","items":[{"number":"01","text":"..."}],"page":5},\n    {"slide_type":"cta","cta_headline":"...","cta_body":"...","page":${n}}\n  ]\n}`;
  const copy=()=>{ navigator.clipboard.writeText(prompt).then(()=>{ setCopied(true); setTimeout(()=>setCopied(false),2500); }); };
  const inp=(label:string,val:string,set:(v:string)=>void,ph:string,max?:number,el:'input'|'textarea'|'select'='input',opts?:string[])=>(
    <div style={{marginBottom:16}}>
      <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase',marginBottom:7}}>{label}</div>
      {el==='select'?<select value={val} onChange={e=>set(e.target.value)} style={{width:'100%',background:'#030810',border:'1px solid rgba(255,255,255,.12)',borderRadius:8,color:'#fff',fontFamily:"'Space Mono',monospace",fontSize:12,padding:'10px 14px',outline:'none'}}>{opts?.map(o=><option key={o} value={o}>{o}</option>)}</select>
      :el==='textarea'?<textarea value={val} onChange={e=>set(e.target.value)} placeholder={ph} maxLength={max} rows={2} style={{width:'100%',background:'#030810',border:'1px solid rgba(255,255,255,.12)',borderRadius:8,color:'#fff',fontFamily:"'Space Mono',monospace",fontSize:12,padding:'10px 14px',outline:'none',resize:'vertical'}}/>
      :<input value={val} onChange={e=>set(e.target.value)} placeholder={ph} maxLength={max} style={{width:'100%',background:'#030810',border:'1px solid rgba(255,255,255,.12)',borderRadius:8,color:'#fff',fontFamily:"'Space Mono',monospace",fontSize:12,padding:'10px 14px',outline:'none'}}/>}
    </div>
  );
  return (
    <div style={{display:'flex',gap:24,height:'calc(100vh - 160px)'}}>
      <div style={{width:360,flexShrink:0,overflowY:'auto',paddingRight:8}}>
        <div style={{marginBottom:16,padding:'14px 16px',borderRadius:10,background:'rgba(0,200,255,0.06)',border:'1px solid rgba(0,200,255,0.2)',fontSize:12,color:'#8BA5C8',lineHeight:1.6}}>Fill in fields → copy prompt → paste into ChatGPT/Claude → get JSON → paste in Creator tab.</div>
        {inp('Topic / Subject',topic,setTopic,'UAE AI trading trends in 2025',200,'textarea')}
        {inp('Carousel Type',type,setType,'',undefined,'select',['news','tech'])}
        {inp('Category Tag',cat,setCat,'MARKETS',20)}
        {inp('Number of Slides',n,setN,'6',2)}
        {inp('Screenshots Needed',ss,setSs,'Slide 1 (cover), Slide 3',120)}
        <button onClick={copy} style={{width:'100%',padding:13,background:copied?'rgba(78,203,130,0.2)':'linear-gradient(135deg,#C9A84C,#E8C96A)',color:copied?'#4ecb82':'#050E1C',fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,letterSpacing:2,border:copied?'1px solid #4ecb82':'none',borderRadius:8,cursor:'pointer'}}>
          {copied?'✓ COPIED!':'⎘ COPY PROMPT FOR AI'}
        </button>
      </div>
      <div style={{flex:1,background:'#030810',borderRadius:12,border:'1px solid rgba(255,255,255,.08)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'12px 18px',borderBottom:'1px solid rgba(255,255,255,.07)',fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase'}}>Prompt Preview</div>
        <pre style={{flex:1,overflowY:'auto',padding:20,fontFamily:"'Space Mono',monospace",fontSize:11,color:'#A3B8CC',lineHeight:1.7,whiteSpace:'pre-wrap',margin:0}}>{prompt}</pre>
      </div>
    </div>
  );
}

// ── Builder Tab ──────────────────────────────────────────────────────────────
type SBSlide={id:number;type:string;fields:Record<string,string>;bullets:string[];items:{num:string;text:string}[];hasSS:boolean};
let _sid=0; const mkS=(type:string):SBSlide=>({id:++_sid,type,fields:{},bullets:[],items:[],hasSS:type==='cover'});

function BuilderTab({onLoad}:{onLoad:(j:string)=>void}) {
  const [title,setTitle]=useState(''); const [cat,setCat]=useState(''); const [ctype,setCtype]=useState('news');
  const [slides,setSlides]=useState<SBSlide[]>(()=>[mkS('cover'),mkS('content'),mkS('cta')]);
  const [copied,setCopied]=useState(false);
  const upd=(id:number,k:string,v:string)=>setSlides(p=>p.map(s=>s.id===id?{...s,fields:{...s.fields,[k]:v}}:s));
  const togSS=(id:number)=>setSlides(p=>p.map(s=>s.id===id?{...s,hasSS:!s.hasSS}:s));
  const addB=(id:number)=>setSlides(p=>p.map(s=>s.id===id&&s.bullets.length<5?{...s,bullets:[...s.bullets,'']}:s));
  const updB=(id:number,i:number,v:string)=>setSlides(p=>p.map(s=>s.id===id?{...s,bullets:s.bullets.map((b,j)=>j===i?v:b)}:s));
  const rmB=(id:number,i:number)=>setSlides(p=>p.map(s=>s.id===id?{...s,bullets:s.bullets.filter((_,j)=>j!==i)}:s));
  const addI=(id:number)=>setSlides(p=>p.map(s=>s.id===id&&s.items.length<5?{...s,items:[...s.items,{num:`0${s.items.length+1}`,text:''}]}:s));
  const updI=(id:number,i:number,k:'num'|'text',v:string)=>setSlides(p=>p.map(s=>s.id===id?{...s,items:s.items.map((it,j)=>j===i?{...it,[k]:v}:it)}:s));
  const rmI=(id:number,i:number)=>setSlides(p=>p.map(s=>s.id===id?{...s,items:s.items.filter((_,j)=>j!==i)}:s));
  const addSl=(t:string)=>setSlides(p=>[...p,mkS(t)]);
  const rmSl=(id:number)=>setSlides(p=>p.filter(s=>s.id!==id));
  const gv=(id:number,k:string)=>slides.find(s=>s.id===id)?.fields[k]||'';
  const gc=(id:number)=>slides.find(s=>s.id===id)?.hasSS||false;

  const json=JSON.stringify({type:ctype,title:title||'Untitled',category:cat||'SHAMSGS',slides:slides.map((s,i)=>{const f=s.fields,b={slide_type:s.type,page:i+1};if(s.type==='cover')return{...b,headline:f.headline||'',subheadline:f.subheadline||'',tag:f.tag||'',has_screenshot:s.hasSS};if(s.type==='content')return{...b,section_label:f.section_label||'',headline:f.headline||'',body:f.body||'',bullets:s.bullets,has_screenshot:s.hasSS};if(s.type==='stat')return{...b,stat_number:f.stat_number||'',stat_label:f.stat_label||'',stat_context:f.stat_context||''};if(s.type==='quote')return{...b,quote_text:f.quote_text||'',quote_source:f.quote_source||''};if(s.type==='list')return{...b,section_label:f.section_label||'',headline:f.headline||'',items:s.items.map(it=>({number:it.num,text:it.text}))};if(s.type==='cta')return{...b,cta_headline:f.cta_headline||'',cta_body:f.cta_body||''};return b;})},null,2);
  const copy=()=>{navigator.clipboard.writeText(json).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});};

  const inpSt:React.CSSProperties={width:'100%',background:'#030810',border:'1px solid rgba(255,255,255,.08)',borderRadius:6,color:'#A3B8CC',fontFamily:"'Space Mono',monospace",fontSize:11,padding:'8px 10px',outline:'none'};
  const lbl=(t:string,mx:number)=><div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:1.5,color:'#C9A84C',textTransform:'uppercase',marginBottom:5}}>{t} <span style={{color:'#4b4b60',fontSize:8}}>max {mx}</span></div>;
  const fld=(label:string,id:number,k:string,ph:string,mx:number,area=false)=>(
    <div style={{marginBottom:8}}>
      {lbl(label,mx)}
      {area?<textarea value={gv(id,k)} onChange={e=>upd(id,k,e.target.value)} placeholder={ph} maxLength={mx} rows={2} style={{...inpSt,resize:'vertical'}}/>
      :<input value={gv(id,k)} onChange={e=>upd(id,k,e.target.value)} placeholder={ph} maxLength={mx} style={inpSt}/>}
    </div>
  );

  return (
    <div style={{display:'flex',gap:24,height:'calc(100vh - 160px)'}}>
      <div style={{width:'50%',overflowY:'auto',paddingRight:8}}>
        <div style={{marginBottom:12,padding:14,borderRadius:10,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)'}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase',marginBottom:10}}>Carousel Info</div>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title (internal)" style={{...inpSt,marginBottom:8}}/>
          <div style={{display:'flex',gap:8}}>
            <input value={cat} onChange={e=>setCat(e.target.value)} placeholder="Category" maxLength={20} style={{...inpSt,flex:1}}/>
            <select value={ctype} onChange={e=>setCtype(e.target.value)} style={{...inpSt,width:110}}><option value="news">News</option><option value="tech">Tech</option></select>
          </div>
        </div>
        {slides.map(s=>(
          <div key={s.id} style={{marginBottom:10,padding:14,borderRadius:10,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,padding:'4px 12px',borderRadius:20,background:'rgba(201,168,76,.15)',color:'#E8C96A',border:'1px solid rgba(201,168,76,.3)'}}>{s.type.toUpperCase()}</span>
              <button onClick={()=>rmSl(s.id)} style={{background:'rgba(224,92,92,.1)',border:'1px solid rgba(224,92,92,.3)',color:'#e05c5c',fontSize:10,padding:'4px 10px',borderRadius:5,cursor:'pointer',fontFamily:"'Space Mono',monospace"}}>✕</button>
            </div>
            {s.type==='cover'&&<>{fld('Headline',s.id,'headline','Big headline',55)}{fld('Subheadline',s.id,'subheadline','Supporting text',80)}{fld('Tag',s.id,'tag','BREAKING NEWS',25)}<label style={{display:'flex',alignItems:'center',gap:8,fontSize:11,color:'#A3B8CC',cursor:'pointer'}}><input type="checkbox" checked={gc(s.id)} onChange={()=>togSS(s.id)}/>Requires cover screenshot</label></>}
            {s.type==='content'&&<>{fld('Section Label',s.id,'section_label','MARKET ANALYSIS',28)}{fld('Headline',s.id,'headline','Key takeaway',50)}{fld('Body Text',s.id,'body','2-3 punchy sentences',140,true)}<div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:1,color:'#C9A84C',textTransform:'uppercase',marginBottom:4}}>Bullets (max 5)</div>{s.bullets.map((b,bi)=><div key={bi} style={{display:'flex',gap:5,marginBottom:4}}><input value={b} onChange={e=>updB(s.id,bi,e.target.value)} maxLength={65} style={{...inpSt,flex:1}}/><button onClick={()=>rmB(s.id,bi)} style={{background:'none',border:'1px solid rgba(224,92,92,.3)',color:'#e05c5c',width:26,borderRadius:4,cursor:'pointer'}}>✕</button></div>)}{s.bullets.length<5&&<button onClick={()=>addB(s.id)} style={{background:'rgba(201,168,76,.07)',border:'1px solid rgba(201,168,76,.25)',color:'#C9A84C',fontSize:9,padding:'4px 10px',borderRadius:5,cursor:'pointer',fontFamily:"'Space Mono',monospace",marginBottom:8}}>+ Bullet</button>}<label style={{display:'flex',alignItems:'center',gap:8,fontSize:11,color:'#A3B8CC',cursor:'pointer',marginTop:4}}><input type="checkbox" checked={gc(s.id)} onChange={()=>togSS(s.id)}/>Add screenshot column</label></>}
            {s.type==='stat'&&<>{fld('Stat Number',s.id,'stat_number','40%',12)}{fld('Label',s.id,'stat_label','OF ALL UAE FOREX TRADES',45)}{fld('Context',s.id,'stat_context','Short explanation',90)}</>}
            {s.type==='quote'&&<>{fld('Quote Text',s.id,'quote_text','Impactful quote…',130,true)}{fld('Source',s.id,'quote_source','— Source, 2025',55)}</>}
            {s.type==='list'&&<>{fld('Section Label',s.id,'section_label','KEY POINTS',28)}{fld('Headline',s.id,'headline','List headline',50)}<div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:1,color:'#C9A84C',textTransform:'uppercase',marginBottom:4}}>Items (max 5)</div>{s.items.map((it,ii)=><div key={ii} style={{display:'flex',gap:5,marginBottom:4}}><input value={it.num} onChange={e=>updI(s.id,ii,'num',e.target.value)} maxLength={4} style={{...inpSt,width:46,textAlign:'center'}}/><input value={it.text} onChange={e=>updI(s.id,ii,'text',e.target.value)} maxLength={70} style={{...inpSt,flex:1}}/><button onClick={()=>rmI(s.id,ii)} style={{background:'none',border:'1px solid rgba(224,92,92,.3)',color:'#e05c5c',width:26,borderRadius:4,cursor:'pointer'}}>✕</button></div>)}{s.items.length<5&&<button onClick={()=>addI(s.id)} style={{background:'rgba(201,168,76,.07)',border:'1px solid rgba(201,168,76,.25)',color:'#C9A84C',fontSize:9,padding:'4px 10px',borderRadius:5,cursor:'pointer',fontFamily:"'Space Mono',monospace"}}>+ Item</button>}</>}
            {s.type==='cta'&&<>{fld('CTA Headline',s.id,'cta_headline','Start Trading Smarter',40)}{fld('CTA Body',s.id,'cta_body','Join 1,200+ traders…',90)}<div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#4ecb82',marginTop:8}}>✓ Auto: &quot;Visit shamsgs.com&quot; + Link in bio</div></>}
          </div>
        ))}
        <div style={{display:'flex',flexWrap:'wrap',gap:7,marginTop:8}}>
          {['cover','content','stat','quote','list','cta'].map(t=><button key={t} onClick={()=>addSl(t)} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',color:'#A3B8CC',fontFamily:"'Space Mono',monospace",fontSize:10,padding:'7px 14px',borderRadius:7,cursor:'pointer'}}>+ {t}</button>)}
        </div>
      </div>
      <div style={{flex:1,background:'#030810',borderRadius:12,border:'1px solid rgba(255,255,255,.08)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'12px 18px',borderBottom:'1px solid rgba(255,255,255,.07)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase'}}>JSON Output</span>
          <div style={{display:'flex',gap:8}}>
            <button onClick={copy} style={{background:copied?'rgba(78,203,130,.15)':'rgba(201,168,76,.15)',border:`1px solid ${copied?'rgba(78,203,130,.3)':'rgba(201,168,76,.3)'}`,color:copied?'#4ecb82':'#E8C96A',fontFamily:"'Space Mono',monospace",fontSize:10,padding:'6px 14px',borderRadius:6,cursor:'pointer'}}>{copied?'✓ Copied':'⎘ Copy'}</button>
            <button onClick={()=>onLoad(json)} style={{background:'linear-gradient(135deg,#1a6fa8,#2a8fd4)',border:'none',color:'#fff',fontFamily:"'Space Mono',monospace",fontSize:10,padding:'6px 14px',borderRadius:6,cursor:'pointer'}}>▶ Load in Creator</button>
          </div>
        </div>
        <pre style={{flex:1,overflowY:'auto',padding:18,fontFamily:"'Space Mono',monospace",fontSize:11,color:'#A3B8CC',lineHeight:1.7,whiteSpace:'pre-wrap',margin:0}}>{json}</pre>
      </div>
    </div>
  );
}

// ── Image Adjustment UI (sliders) ────────────────────────────────────────────
function AdjPanel({idx,src,adj,onChange}:{idx:number;src:string;adj:ImgAdj;onChange:(a:ImgAdj)=>void}) {
  const sliderSt:React.CSSProperties={width:'100%',accentColor:'#C9A84C',cursor:'pointer'};
  return (
    <div style={{background:'rgba(255,255,255,.03)',border:'1px solid rgba(201,168,76,.15)',borderRadius:10,padding:'12px',marginTop:8}}>
      <div style={{display:'flex',gap:10,marginBottom:10,alignItems:'center'}}>
        <div style={{width:60,height:60,borderRadius:6,overflow:'hidden',flexShrink:0}}>
          <img src={src} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        </div>
        <div style={{flex:1,fontFamily:"'Space Mono',monospace",fontSize:10,color:'#A3B8CC'}}>
          <div style={{color:'#C9A84C',marginBottom:4}}>Slide {idx+1} — Image Position</div>
          <div style={{fontSize:9,color:'#4b4b60'}}>Drag sliders to reposition & zoom</div>
        </div>
        <button onClick={()=>onChange(defAdj)} style={{background:'none',border:'1px solid rgba(255,255,255,.1)',color:'#6b6b80',fontSize:9,padding:'3px 8px',borderRadius:4,cursor:'pointer',fontFamily:"'Space Mono',monospace",whiteSpace:'nowrap'}}>Reset</button>
      </div>
      <div style={{display:'grid',gap:6}}>
        <div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'#C9A84C',marginBottom:3}}>X POSITION <span style={{color:'#4b4b60'}}>{adj.panX>0?'+':''}{adj.panX.toFixed(0)}%</span></div>
          <input type="range" min="-50" max="50" step="1" value={adj.panX} style={sliderSt} onChange={e=>onChange({...adj,panX:+e.target.value})}/>
        </div>
        <div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'#C9A84C',marginBottom:3}}>Y POSITION <span style={{color:'#4b4b60'}}>{adj.panY>0?'+':''}{adj.panY.toFixed(0)}%</span></div>
          <input type="range" min="-50" max="50" step="1" value={adj.panY} style={sliderSt} onChange={e=>onChange({...adj,panY:+e.target.value})}/>
        </div>
        <div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'#C9A84C',marginBottom:3}}>ZOOM <span style={{color:'#4b4b60'}}>{(adj.scale*100).toFixed(0)}%</span></div>
          <input type="range" min="100" max="300" step="5" value={adj.scale*100} style={sliderSt} onChange={e=>onChange({...adj,scale:+e.target.value/100})}/>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function CarouselCreator() {
  const [tab,setTab]=useState<Tab>('creator');
  const [jsonText,setJsonText]=useState('');
  const [data,setData]=useState<CarouselData|null>(null);
  const [theme,setTheme]=useState<ThemeKey>('news');
  const [screenshots,setScreenshots]=useState<Record<number,string>>({});
  const [imgAdjs,setImgAdjs]=useState<Record<number,ImgAdj>>({});
  const [status,setStatus]=useState({msg:'Paste JSON and click Render',type:''});
  const [dlIdx,setDlIdx]=useState<Record<number,boolean>>({});
  const [dlAll,setDlAll]=useState(false);
  const [align,setAlign]=useState({tag:-9,bullet:9,footer:-9,statNum:-120,heading:-30,subHead:-9,secLabel:-9,listNum:-9,listText:-9,quote:-9,ctaBtn:-9});
  const alignLabels:Record<keyof typeof align, string> = {
    tag: "Top Tag (MARKETS)", bullet: "Bullet Dots", footer: "Footer Text",
    statNum: "Big Stat (80%)", heading: "Main Headlines", subHead: "Body & Subheads",
    secLabel: "Golden Over-titles", listNum: "List Numbers (01, 02)", listText: "List Item Text", quote: "Quote Text", ctaBtn: "CTA Button Text"
  };
  // Two separate ref maps: preview (scaled) and download (full-size off-screen)
  const previewRefs=useRef<Record<number,HTMLDivElement|null>>({});
  const downloadRefs=useRef<Record<number,HTMLDivElement|null>>({});
  // Logo as data URL (avoids CORS issues in html2canvas)
  const [logoSrc,setLogoSrc]=useState(LOGO_PATH);
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

  const th=BRAND.themes[theme];
  const msg=(m:string,t='')=>setStatus({msg:m,type:t});

  const render=()=>{
    try{
      const d=JSON.parse(jsonText) as CarouselData;
      if(!d.slides?.length){msg('No slides found','error');return;}
      setData(d); setScreenshots({}); setImgAdjs({});
      msg(`✓ ${d.slides.length} slides rendered`,'ok');
    }catch(e){ msg('Invalid JSON: '+(e as Error).message,'error'); }
  };

  const handleSS=(idx:number,file:File)=>{
    const r=new FileReader();
    r.onload=e=>setScreenshots(p=>({...p,[idx]:e.target!.result as string}));
    r.readAsDataURL(file);
  };

  // ── DOWNLOAD — captures at 2x scale then downsamples to 1080×1080 for sharp output ──
  const dlSlide=useCallback(async(idx:number,d:CarouselData)=>{
    setDlIdx(p=>({...p,[idx]:true}));
    try{
      const el=downloadRefs.current[idx];
      if(!el) throw new Error('Render element not ready');
      await document.fonts.ready;
      // Small delay to ensure all canvas img.onload callbacks have fired
      await new Promise(r=>setTimeout(r,300));
      // Capture at 2x resolution for high quality (produces 2160×2160 canvas)
      const hiResCanvas:HTMLCanvasElement=await html2canvas(el,{
        width:1080, height:1080, scale:2,
        useCORS:true, allowTaint:true, backgroundColor:null, logging:false,
        windowWidth:1080, windowHeight:1080,
        x:0, y:0, scrollX:0, scrollY:0,
        imageTimeout:8000,
      });
      // Downsample to exactly 1080×1080 with high-quality smoothing
      const out=document.createElement('canvas');
      out.width=1080; out.height=1080;
      const ctx=out.getContext('2d')!;
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality='high';
      ctx.drawImage(hiResCanvas,0,0,1080,1080);
      const a=document.createElement('a');
      const name=(d.title||'carousel').replace(/[^a-z0-9]/gi,'-').toLowerCase();
      a.download=`shamsgs-${name}-slide${idx+1}.png`;
      a.href=out.toDataURL('image/png');
      a.click();
    }catch(e: any){ 
      console.error('html2canvas error:',e);
      msg('Download error: '+(e?.message||String(e)),'error'); 
    }
    finally{ setDlIdx(p=>({...p,[idx]:false})); }
  },[]);

  const dlAllSlides=useCallback(async()=>{
    if(!data) return;
    setDlAll(true);
    for(let i=0;i<data.slides.length;i++){
      msg(`⏳ Downloading slide ${i+1}/${data.slides.length}...`);
      await dlSlide(i,data);
      await new Promise(r=>setTimeout(r,800));
    }
    setDlAll(false);
    msg(`✓ All ${data.slides.length} slides saved as PNG`,'ok');
  },[data,dlSlide]);

  const slidesNeedingSS=data?.slides.map((s,i)=>({s,i})).filter(({s})=>s.slide_type==='cover'||s.has_screenshot)||[];

  const tabSt=(t:Tab):React.CSSProperties=>({
    padding:'8px 20px',borderRadius:8,fontFamily:"'Space Mono',monospace",fontSize:11,letterSpacing:1,cursor:'pointer',border:'none',transition:'all .2s',
    background:tab===t?'rgba(201,168,76,0.15)':'transparent',
    color:tab===t?'#E8C96A':'#6b6b80',
    borderBottom:tab===t?'2px solid #C9A84C':'2px solid transparent',
  });

  const slideProps=(idx:number)=>({
    slide:{...data!.slides[idx],tag:data!.slides[idx].tag||data!.category},
    idx,total:data!.slides.length,theme:th,screenshots,logoSrc,imgAdjs,align,
  });

  return (
    <div style={{fontFamily:"'Syne',sans-serif",maxWidth:'100%'}}>
      {/* Header */}
      <div style={{marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
          <div style={{width:48,height:48,borderRadius:12,background:'linear-gradient(135deg,#C9A84C,#E8C96A)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🎨</div>
          <div>
            <h1 style={{fontSize:22,fontWeight:800,color:'#e8e8f0',margin:0}}>Carousel Creator</h1>
            <p style={{fontSize:12,color:'#6b6b80',margin:0,fontFamily:"'Space Mono',monospace"}}>Generate 1080×1080 branded carousels for shamsgs.com</p>
          </div>
        </div>
        <div style={{display:'flex',gap:0,borderBottom:'1px solid rgba(255,255,255,.07)',marginTop:12}}>
          {(['creator','builder','prompt'] as Tab[]).map(t=><button key={t} style={tabSt(t)} onClick={()=>setTab(t)}>{t==='creator'?'▶ Creator':t==='builder'?'📋 Builder':'📄 Prompt'}</button>)}
        </div>
      </div>

      {tab==='prompt'&&<PromptBuilder/>}
      {tab==='builder'&&<BuilderTab onLoad={j=>{setJsonText(j);setTab('creator');msg('JSON loaded — click Render','ok');}}/>}
      {tab==='creator'&&(
        <div style={{display:'flex',gap:24,height:'calc(100vh - 200px)'}}>
          {/* Left panel */}
          <div style={{width:320,flexShrink:0,overflowY:'auto'}}>
            <div style={{marginBottom:14,padding:18,borderRadius:12,background:'var(--card)',border:'1px solid var(--border)'}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase',marginBottom:10}}>1 — Paste JSON</div>
              <textarea value={jsonText} onChange={e=>setJsonText(e.target.value)} placeholder={'{\n  "type":"news",\n  "slides":[...]\n}'} style={{width:'100%',height:180,background:'#030810',border:'1px solid rgba(255,255,255,.1)',borderRadius:8,color:'#A3B8CC',fontFamily:"'Space Mono',monospace",fontSize:11,padding:12,resize:'vertical',outline:'none',lineHeight:1.5}}/>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase',margin:'12px 0 8px'}}>2 — Theme</div>
              <div style={{display:'flex',gap:8}}>
                {(['news','tech'] as ThemeKey[]).map(t=>(
                  <button key={t} onClick={()=>setTheme(t)} style={{flex:1,padding:'10px 0',borderRadius:8,cursor:'pointer',fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:1,transition:'all .2s',background:theme===t?(t==='news'?'rgba(201,168,76,0.15)':'rgba(0,200,255,0.1)'):'rgba(255,255,255,.04)',border:`1px solid ${theme===t?(t==='news'?'#C9A84C':'#00C8FF'):'rgba(255,255,255,.1)'}`,color:theme===t?(t==='news'?'#E8C96A':'#00C8FF'):'#6b6b80'}}>
                    {t==='news'?'⬡ NEWS':'◈ TECH'}
                  </button>
                ))}
              </div>
              <button onClick={render} style={{width:'100%',padding:12,marginTop:12,background:'linear-gradient(135deg,#C9A84C,#E8C96A)',color:'#050E1C',fontFamily:"'Space Mono',monospace",fontSize:12,fontWeight:700,letterSpacing:2,border:'none',borderRadius:8,cursor:'pointer'}}>▶ RENDER SLIDES</button>
              {data&&<button onClick={dlAllSlides} disabled={dlAll} style={{width:'100%',padding:11,marginTop:8,background:dlAll?'rgba(26,111,168,0.5)':'linear-gradient(135deg,#1a6fa8,#2a8fd4)',color:'#fff',fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700,letterSpacing:1.5,border:'none',borderRadius:8,cursor:dlAll?'not-allowed':'pointer'}}>{dlAll?status.msg:'⬇ DOWNLOAD ALL AS PNG'}</button>}
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:status.type==='error'?'#e05c5c':status.type==='ok'?'#4ecb82':'#A3B8CC',padding:'8px 0',textAlign:'center'}}>{status.msg}</div>
            </div>

            {/* Screenshot uploads + adjustment panels */}
            {slidesNeedingSS.length>0&&(
              <div style={{padding:16,borderRadius:12,background:'var(--card)',border:'1px solid var(--border)'}}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase',marginBottom:12}}>3 — Screenshots & Position</div>
                {slidesNeedingSS.map(({s,i})=>(
                  <div key={i} style={{marginBottom:10}}>
                    <label style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.07)',cursor:'pointer'}}>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:screenshots[i]?'#4ecb82':'#A3B8CC'}}>Slide {i+1} — {s.slide_type.toUpperCase()}</div>
                        <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'#4b4b60',marginTop:2}}>{s.slide_type==='cover'?'Required':'Optional'}{screenshots[i]?' · ✓ Uploaded':''}</div>
                      </div>
                      <span style={{background:screenshots[i]?'rgba(78,203,130,0.12)':'rgba(201,168,76,0.12)',border:`1px solid ${screenshots[i]?'rgba(78,203,130,0.3)':'rgba(201,168,76,0.3)'}`,color:screenshots[i]?'#4ecb82':'#E8C96A',fontSize:10,padding:'5px 10px',borderRadius:5,fontFamily:"'Space Mono',monospace",flexShrink:0}}>{screenshots[i]?'✓ Change':'Upload'}</span>
                      <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0])handleSS(i,e.target.files[0]);}}/>
                    </label>
                    {screenshots[i]&&(
                      <AdjPanel idx={i} src={screenshots[i]} adj={imgAdjs[i]??defAdj} onChange={a=>setImgAdjs(p=>({...p,[i]:a}))}/>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Vertical Fine-Tuning */}
            {data && (
              <div style={{padding:16,borderRadius:12,background:'var(--card)',border:'1px solid var(--border)',marginTop:14}}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase',marginBottom:12}}>4 — Vertical Fine-Tuning</div>
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
                    {/* Preview: 486×486 wrapper, slide scaled to 0.45 */}
                    <div style={{width:486,height:486,overflow:'hidden',borderRadius:12,boxShadow:'0 8px 40px rgba(0,0,0,.6)',position:'relative',flexShrink:0}}>
                      <div ref={el=>{previewRefs.current[idx]=el;}} style={{transform:'scale(0.45)',transformOrigin:'top left',position:'absolute',top:0,left:0}}>
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

      {/* ── HIDDEN DOWNLOAD CONTAINER — full 1080×1080, fixed off-screen, no scroll offset ── */}
      {data&&(
        <div style={{position:'fixed',top:0,left:'-9999px',width:1080,pointerEvents:'none',zIndex:-1}}>
          {data.slides.map((_,idx)=>(
            <div key={`dl-${idx}`} ref={el=>{downloadRefs.current[idx]=el;}} style={{width:1080,height:1080,overflow:'hidden'}}>
              <SlideEl {...slideProps(idx)}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
