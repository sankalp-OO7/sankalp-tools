'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import html2canvas from 'html2canvas';

const LOGO_PATH = '/shamsgs-logo.jpg';
const BRAND = { website:'shamsgs.com', cta:{ buttonText:'Visit shamsgs.com', linkInBio:'Link in bio \u2197' } };

// ── Aspect ratios ─────────────────────────────────────────────────────────────
const RATIOS = {
  '1:1':  {w:1080,h:1080, label:'Square',    icon:'⬛'},
  '4:5':  {w:1080,h:1350, label:'Portrait',   icon:'📱'},
  '9:16': {w:1080,h:1920, label:'Story',      icon:'📲'},
  '16:9': {w:1080,h:608,  label:'Landscape',  icon:'🖥'},
} as const;
type RatioKey = keyof typeof RATIOS;

// ── Themes ────────────────────────────────────────────────────────────────────
interface ThemeDef { name:string;bg:string;bg2:string;bg3:string;accent:string;accent2:string;accentDim:string;text:string;textSec:string;tagBg:string;tagColor:string;border:string;card:string;footerBg:string;grid:string;coverGrad:string; }
const BUILTIN_THEMES: Record<string,ThemeDef> = {
  news:   {name:'News',   bg:'#050E1C',bg2:'#091628',bg3:'#0d1f38',accent:'#C9A84C',accent2:'#E8C96A',accentDim:'rgba(201,168,76,0.18)', text:'#FFFFFF',textSec:'#A3B8CC',tagBg:'rgba(201,168,76,0.18)', tagColor:'#E8C96A',border:'rgba(201,168,76,0.25)', card:'rgba(201,168,76,0.07)', footerBg:'rgba(5,14,28,0.97)',  grid:'rgba(201,168,76,0.04)', coverGrad:'linear-gradient(150deg,#050E1C 0%,#0d1f38 55%,#091628 100%)'},
  tech:   {name:'Tech',   bg:'#050E1C',bg2:'#060820',bg3:'#080A2A',accent:'#00C8FF',accent2:'#7B61FF',accentDim:'rgba(0,200,255,0.15)', text:'#FFFFFF',textSec:'#8BA5C8',tagBg:'rgba(0,200,255,0.15)', tagColor:'#00C8FF',border:'rgba(0,200,255,0.2)',  card:'rgba(0,200,255,0.06)', footerBg:'rgba(5,14,28,0.97)',  grid:'rgba(0,200,255,0.04)', coverGrad:'linear-gradient(150deg,#050E1C 0%,#080A2A 55%,#060820 100%)'},
  viral:  {name:'Viral',  bg:'#0D0118',bg2:'#160225',bg3:'#1E0335',accent:'#FF3CAC',accent2:'#784BA0',accentDim:'rgba(255,60,172,0.22)', text:'#FFFFFF',textSec:'#D4A8E8',tagBg:'rgba(255,60,172,0.18)',tagColor:'#FF85E1',border:'rgba(255,60,172,0.3)', card:'rgba(255,60,172,0.08)',footerBg:'rgba(13,1,24,0.97)',  grid:'rgba(255,60,172,0.05)',coverGrad:'linear-gradient(150deg,#0D0118 0%,#1E0335 55%,#160225 100%)'},
  luxury: {name:'Luxury', bg:'#080710',bg2:'#0F0E1C',bg3:'#161428',accent:'#C0917A',accent2:'#E8C4A8',accentDim:'rgba(192,145,122,0.2)',text:'#F0EAE0',textSec:'#9C8E82',tagBg:'rgba(192,145,122,0.15)',tagColor:'#E8C4A8',border:'rgba(192,145,122,0.25)',card:'rgba(192,145,122,0.07)',footerBg:'rgba(8,7,16,0.97)',   grid:'rgba(192,145,122,0.04)',coverGrad:'linear-gradient(150deg,#080710 0%,#161428 55%,#0F0E1C 100%)'},
  mint:   {name:'Mint',   bg:'#021812',bg2:'#02261C',bg3:'#033326',accent:'#00E5A0',accent2:'#40FFB5',accentDim:'rgba(0,229,160,0.18)', text:'#FFFFFF',textSec:'#82C8AC',tagBg:'rgba(0,229,160,0.15)', tagColor:'#40FFB5',border:'rgba(0,229,160,0.25)', card:'rgba(0,229,160,0.07)', footerBg:'rgba(2,24,18,0.97)',   grid:'rgba(0,229,160,0.04)', coverGrad:'linear-gradient(150deg,#021812 0%,#033326 55%,#02261C 100%)'},
  hacker: {name:'Hacker', bg:'#0A0A0A',bg2:'#111111',bg3:'#181818',accent:'#00FF41',accent2:'#008F11',accentDim:'rgba(0,255,65,0.15)', text:'#FFFFFF',textSec:'#A0A0A0',tagBg:'rgba(0,255,65,0.15)', tagColor:'#00FF41',border:'rgba(0,255,65,0.2)', card:'rgba(0,255,65,0.05)', footerBg:'rgba(10,10,10,0.97)', grid:'rgba(0,255,65,0.03)', coverGrad:'linear-gradient(150deg,#0A0A0A 0%,#181818 55%,#111111 100%)'},
  ocean:  {name:'Ocean',  bg:'#001018',bg2:'#001828',bg3:'#002038',accent:'#00E5FF',accent2:'#00A2FF',accentDim:'rgba(0,229,255,0.15)', text:'#FFFFFF',textSec:'#B0D0E0',tagBg:'rgba(0,229,255,0.15)', tagColor:'#00E5FF',border:'rgba(0,229,255,0.2)', card:'rgba(0,229,255,0.05)', footerBg:'rgba(0,16,24,0.97)', grid:'rgba(0,229,255,0.03)', coverGrad:'linear-gradient(150deg,#001018 0%,#002038 55%,#001828 100%)'}
};
function rTheme(key:string, custom:Record<string,ThemeDef>): ThemeDef {
  return BUILTIN_THEMES[key] ?? custom[key] ?? BUILTIN_THEMES.news;
}

// ── LocalStorage keys ─────────────────────────────────────────────────────────
const LS = { STATE:'cc_state', HISTORY:'cc_history', THEMES:'cc_custom_themes' };

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = 'creator'|'builder'|'prompt'|'themes'|'history';
interface SlideData { slide_type:string;page:number;headline?:string;subheadline?:string;tag?:string;has_screenshot?:boolean;section_label?:string;body?:string;bullets?:string[];stat_number?:string;stat_label?:string;stat_context?:string;quote_text?:string;quote_source?:string;items?:{number:string;text:string}[];cta_headline?:string;cta_body?:string; }
interface CarouselData { type:string;title:string;category:string;slides:SlideData[]; }
interface ImgAdj { panX:number;panY:number;scale:number; }
const defAdj:ImgAdj = {panX:0,panY:0,scale:1};
type ExtraShape = 'circle'|'rounded'|'square';
type ExtraPos   = 'tr'|'br'|'bl'|'tl'|'cr';
interface ExtraImg { src:string;shape:ExtraShape;pos:ExtraPos;size:number;adj:ImgAdj; }
interface HistoryItem { id:string;title:string;savedAt:string;jsonText:string;theme:string;ratio:RatioKey;align:{tag:number;bullet:number;footer:number;statNum:number;heading:number;subHead:number;secLabel:number;listNum:number;listText:number;quote:number;ctaBtn:number;coverFade?:number};imgAdjs:Record<number,ImgAdj>; }
const defAlign = {tag:-9,bullet:9,footer:-9,statNum:-120,heading:-30,subHead:-9,secLabel:-9,listNum:-9,listText:-9,quote:-9,ctaBtn:-9,coverFade:80};
function extraPos(p:ExtraPos,sz:number):React.CSSProperties{const m=50,hH=72,fH=58,b:React.CSSProperties={position:'absolute',width:sz,height:sz,zIndex:5};switch(p){case'tr':return{...b,top:hH+m,right:m};case'br':return{...b,bottom:fH+m,right:m};case'bl':return{...b,bottom:fH+m,left:m};case'tl':return{...b,top:hH+m,left:m};case'cr':return{...b,top:'50%',right:m,transform:'translateY(-50%)'};}}


const clamp = (s:string|undefined, n:number) => s ? String(s).slice(0,n) : '';

// ── Image zone ────────────────────────────────────────────────────────────────
function ImgZone({ src, adj, radius=0, w='100%', h='100%', shape }:{ src?:string; adj:ImgAdj; radius?:number; w?:string|number; h?:string|number; shape?:ExtraShape }) {
  const cRef=useRef<HTMLDivElement>(null);
  const cvRef=useRef<HTMLCanvasElement>(null);
  const br = shape==='circle'?'50%' : shape==='rounded'?'20px' : radius;
  useEffect(()=>{
    const cv=cvRef.current,c=cRef.current;
    if(!cv||!c) return;
    const cw=typeof w==='number'?w:c.offsetWidth, ch=typeof h==='number'?h:c.offsetHeight;
    if(!cw||!ch) return;
    cv.width=cw; cv.height=ch;
    const ctx=cv.getContext('2d')!;
    ctx.clearRect(0,0,cw,ch);
    if(!src) return;
    const img=new Image();
    img.onload=()=>{
      const cs=Math.min(cw/img.naturalWidth,ch/img.naturalHeight);
      const fw=img.naturalWidth*cs*adj.scale, fh=img.naturalHeight*cs*adj.scale;
      const ox=cw/2+(adj.panX/100)*cw-fw/2, oy=ch/2+(adj.panY/100)*ch-fh/2;
      ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high';
      ctx.drawImage(img,ox,oy,fw,fh);
    };
    img.src=src;
  },[src,adj,w,h]);
  return (
    <div ref={cRef} style={{position:'relative',width:w,height:h,borderRadius:br,overflow:'hidden',flexShrink:0}}>
      {src
        ?<canvas ref={cvRef} style={{width:'100%',height:'100%',display:'block'}}/>
        :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Space Mono',monospace",fontSize:22,letterSpacing:2,opacity:.25,color:'inherit'}}>[ Upload Image ]</div>
      }
    </div>
  );
}


// ── SlideEl ─────────────────────────────────────────────────────────────────
function SlideEl({ slide, idx, total, theme:t, screenshots, extraImgs, logoSrc, imgAdjs, align, slideW, slideH }:{
  slide:SlideData; idx:number; total:number; theme:ThemeDef;
  screenshots:Record<number,string>; extraImgs:Record<number,ExtraImg[]>;
  logoSrc:string; imgAdjs:Record<number,ImgAdj>;
  align:{tag:number;bullet:number;footer:number;statNum:number;heading:number;subHead:number;secLabel:number;listNum:number;listText:number;quote:number;ctaBtn:number;coverFade?:number};
  slideW:number; slideH:number;
}) {
  const ss=screenshots[idx], adj=imgAdjs[idx]??defAdj, type=slide.slide_type;
  const exs=(extraImgs[idx]??[]);
  const ExtrasOverlay=()=><>{exs.map((e,i)=>(
    <div key={i} style={extraPos(e.pos,e.size)}><ImgZone src={e.src} adj={e.adj} shape={e.shape} w={e.size} h={e.size}/></div>
  ))}</>;

  const Wrap = ({ children }:{children:React.ReactNode}) => (
    <div style={{width:slideW,height:slideH,position:'relative',overflow:'hidden',background:t.bg,color:t.text,fontFamily:"'Syne',sans-serif",flexShrink:0}}>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:`linear-gradient(${t.grid} 1px,transparent 1px),linear-gradient(90deg,${t.grid} 1px,transparent 1px)`,backgroundSize:'54px 54px'}}/>
      <div style={{position:'absolute',width:500,height:500,top:-150,right:-150,borderRadius:'50%',background:`radial-gradient(circle,${t.accentDim} 0%,transparent 70%)`,pointerEvents:'none'}}/>
      <div style={{position:'absolute',top:0,left:0,right:0,height:72,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 52px',zIndex:10,borderBottom:`1px solid ${t.border}`,background:t.footerBg}}>
        <img src={logoSrc} alt="ShamsGS" style={{width:44,height:44,borderRadius:8,objectFit:'cover'}} crossOrigin="anonymous"/>
        <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',height:34,padding:'0 18px',fontFamily:"'Space Mono',monospace",fontSize:18,letterSpacing:3,textTransform:'uppercase',borderRadius:20,background:t.tagBg,color:t.tagColor,border:`1px solid ${t.border}`,fontWeight:700}}>
          <span style={{transform:`translateY(${align.tag}px)`}}>{clamp(slide.tag||'SHAMSGS',20)}</span>
        </span>
        <span style={{width:44}}/>
      </div>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:58,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 52px',zIndex:10,background:t.footerBg,borderTop:`1px solid ${t.border}`}}>
        <span style={{fontFamily:"'Space Mono',monospace",fontSize:20,color:t.accent,letterSpacing:1,transform:`translateY(${align.footer}px)`}}>{BRAND.website}</span>
        <span style={{fontFamily:"'Space Mono',monospace",fontSize:20,color:t.textSec,letterSpacing:1,display:'flex',alignItems:'center',gap:8}}>
          {idx===total-1?<span style={{transform:`translateY(${align.footer}px)`}}>{BRAND.cta.linkInBio}</span>:(
            <><svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg><span style={{transform:`translateY(${align.footer}px)`}}>Slide {idx+1} / {total}</span></>
          )}
        </span>
      </div>
      <ExtrasOverlay/>
      {children}
    </div>
  );

  const bodyBase:React.CSSProperties = {position:'absolute',top:72,bottom:58,left:0,right:0,padding:'52px 64px',overflow:'hidden'};

  if (type==='cover') return (
    <Wrap>
      {/* image zone 380px */}
      <div style={{position:'absolute',top:72,left:0,right:0,height:380,overflow:'hidden',background:t.coverGrad}}>
        <ImgZone src={ss} adj={adj} w={1080} h={380}/>
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:align.coverFade??80,background:`linear-gradient(transparent,${t.bg})`}}/>
      </div>
      {/* text zone */}
      <div style={{position:'absolute',left:0,right:0,bottom:58,padding:'0 110px 44px',overflow:'hidden'}}>
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
    const hasSS = false;
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

  return <SlideEl slide={{...slide,slide_type:'content'}} idx={idx} total={total} theme={t} screenshots={screenshots} extraImgs={{}} logoSrc={logoSrc} imgAdjs={imgAdjs} align={align} slideW={1080} slideH={1080}/>;
}

// ── Prompt Builder ───────────────────────────────────────────────────────────
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

function PromptBuilder() {
  const [topic,setTopic]=useState('');
  const [type,setType]=useState('news');
  const [cat,setCat]=useState('MARKETS');
  const [n,setN]=useState('6');
  const [ss,setSs]=useState('Slide 1 (cover)');

  const carouselPrompt=`You are a social media content writer for ShamsGS (shamsgs.com), a UAE-based AI-powered forex trading platform.\n\nCreate a carousel JSON for the topic below. Follow the EXACT schema and ALL character limits.\n\nTOPIC: ${topic||'[enter topic]'}\nCARROUSEL TYPE: ${type}\nCATEGORY TAG: ${cat||'SHAMSGS'} (max 20 chars, uppercase)\nNUMBER OF SLIDES: ${n} (always cover first, CTA last)\nSCREENSHOTS: ${ss||'none'}\n\nSTRICT CHARACTER LIMITS:\n- cover headline: 55 | subheadline: 80 | tag: 25\n- section_label: 28 | content headline: 50 | body: 140\n- bullets: max 5 × 65 chars | stat_number: 12\n- stat_label: 45 | stat_context: 90 | quote_text: 130\n- quote_source: 55 | list items: max 5 × 70 chars\n- cta_headline: 40 | cta_body: 90\n\nSlide types: cover, content, stat, quote, list, cta\nRules: First=cover. Last=cta. has_screenshot:true only where needed. No emojis. Professional tone.\n\nReturn ONLY valid raw JSON:\n{\n  "type":"${type}","title":"...","category":"${cat||'SHAMSGS'}",\n  "slides":[\n    {"slide_type":"cover","headline":"...","subheadline":"...","tag":"...","has_screenshot":true,"page":1},\n    {"slide_type":"content","section_label":"...","headline":"...","body":"...","bullets":["..."],"has_screenshot":false,"page":2},\n    {"slide_type":"stat","stat_number":"...","stat_label":"...","stat_context":"...","page":3},\n    {"slide_type":"quote","quote_text":"...","quote_source":"...","page":4},\n    {"slide_type":"list","section_label":"...","headline":"...","items":[{"number":"01","text":"..."}],"page":5},\n    {"slide_type":"cta","cta_headline":"...","cta_body":"...","page":${n}}\n  ]\n}`;

  const captionPrompt=`You are an Instagram content writer for ShamsGS (shamsgs.com), a UAE-based AI-powered forex trading platform.\n\nWrite a compelling Instagram caption for the carousel post below.\n\nTOPIC: ${topic||'[enter topic]'}\nCARROUSEL TYPE: ${type}\nCATEGORY: ${cat||'SHAMSGS'}\nNUMBER OF SLIDES: ${n}\n\nCAPTION REQUIREMENTS:\n1. HOOK (1–2 lines): Grab attention immediately. Start with a bold statement, question, or surprising fact. No emojis in the hook.\n2. BODY (3–5 lines): Expand on the topic with key insights from the carousel. Use line breaks for readability. Keep it conversational yet authoritative.\n3. VALUE STATEMENT (1–2 lines): Explain what the reader gains by saving/sharing this post.\n4. CALL TO ACTION (1 line): Direct, specific CTA — e.g. "Follow @shamsgs for daily market insights" or "Link in bio to start trading smarter."\n5. HASHTAGS (1 block, 15–20 tags): Mix broad (#forex #trading #investing) and niche (#UAEforex #AItrading #shamsgs #forexUAE #tradinglife) hashtags. Place them at the very end after a line break.\n\nBRAND VOICE: Professional, confident, data-driven, and empowering. Targeted at UAE-based retail forex traders and investors.\n\nFORMAT:\n[HOOK]\n\n[BODY]\n\n[VALUE STATEMENT]\n\n[CALL TO ACTION]\n\n.\n.\n.\n[HASHTAGS]`;

  const combinedPrompt = `=========================================\nTASK 1: CAROUSEL JSON\n=========================================\n\n${carouselPrompt}\n\n\n\n=========================================\nTASK 2: INSTAGRAM CAPTION\n=========================================\n\n${captionPrompt}`;

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
      {/* Left: inputs */}
      <div style={{width:340,flexShrink:0,overflowY:'auto',paddingRight:8}}>
        <div style={{marginBottom:16,padding:'14px 16px',borderRadius:10,background:'rgba(0,200,255,0.06)',border:'1px solid rgba(0,200,255,0.2)',fontSize:12,color:'#8BA5C8',lineHeight:1.6}}>
          Fill in fields → copy the full prompt → paste into ChatGPT/Claude → use outputs.
        </div>
        {inp('Topic / Subject',topic,setTopic,'UAE AI trading trends in 2025',200,'textarea')}
        {inp('Carousel Type',type,setType,'',undefined,'select',['news','tech'])}
        {inp('Category Tag',cat,setCat,'MARKETS',20)}
        {inp('Number of Slides',n,setN,'6',2)}
        {inp('Screenshots Needed',ss,setSs,'Slide 1 (cover), Slide 3',120)}

        {/* Combined prompt copy */}
        <div style={{padding:'14px 16px',borderRadius:10,background:'rgba(201,168,76,0.06)',border:'1px solid rgba(201,168,76,0.2)',marginBottom:12}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase',marginBottom:10}}>📝 Combined Prompt</div>
          <div style={{fontSize:11,color:'#8BA5C8',lineHeight:1.5,marginBottom:12}}>Paste into ChatGPT/Claude to generate both the Carousel JSON and Instagram Caption at once.</div>
          <CopyButton text={combinedPrompt} label='⎘ COPY FULL PROMPT' size='lg'/>
        </div>
      </div>

      {/* Right: preview panel */}
      <div style={{flex:1,background:'#030810',borderRadius:12,border:'1px solid rgba(255,255,255,.08)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'10px 18px',borderBottom:'1px solid rgba(255,255,255,.07)',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:'#A3B8CC'}}>Prompt Preview</div>
          <CopyButton text={combinedPrompt} label='⎘ COPY PROMPT' size='sm'/>
        </div>
        <pre style={{flex:1,overflowY:'auto',padding:20,fontFamily:"'Space Mono',monospace",fontSize:11,color:'#A3B8CC',lineHeight:1.7,whiteSpace:'pre-wrap',margin:0}}>{combinedPrompt}</pre>
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

// ── Theme Editor Tab ──────────────────────────────────────────────────────────
function ThemeEditor({ customThemes, setCustomThemes }:{ customThemes:Record<string,ThemeDef>; setCustomThemes:(t:Record<string,ThemeDef>)=>void }) {
  const [editKey, setEditKey] = useState<string|null>(null);
  const [editDef, setEditDef] = useState<ThemeDef|null>(null);
  const [aiInput, setAiInput] = useState('');
  
  const allThemes = { ...BUILTIN_THEMES, ...customThemes };
  
  const startEdit = (key:string, def:ThemeDef, isCopy=false) => {
    const newKey = isCopy ? `${key}_copy_${Date.now()}` : key;
    const newDef = isCopy ? { ...def, name:`${def.name} (Copy)` } : { ...def };
    setEditKey(newKey); setEditDef(newDef);
  };
  
  const startNew = () => {
    const k = `custom_${Date.now()}`;
    setEditKey(k);
    setEditDef({name:'New Theme',bg:'#000000',bg2:'#111111',bg3:'#222222',accent:'#ffffff',accent2:'#dddddd',accentDim:'rgba(255,255,255,0.2)',text:'#ffffff',textSec:'#aaaaaa',tagBg:'rgba(255,255,255,0.2)',tagColor:'#ffffff',border:'rgba(255,255,255,0.3)',card:'rgba(255,255,255,0.1)',footerBg:'rgba(0,0,0,0.9)',grid:'rgba(255,255,255,0.1)',coverGrad:'linear-gradient(150deg,#000000 0%,#222222 55%,#111111 100%)'});
  };

  const saveEdit = () => {
    if(!editKey||!editDef) return;
    setCustomThemes({ ...customThemes, [editKey]: editDef });
    setEditKey(null); setEditDef(null);
  };

  const delTheme = (k:string) => {
    if(!confirm('Delete this theme?')) return;
    const t = {...customThemes}; delete t[k]; setCustomThemes(t);
  };

  const aiPrompt = `You are a UI designer. Create a JSON theme for a Next.js Carousel Creator based on this description: "${aiInput}"\n\nReturn ONLY raw JSON matching this interface:\n{\n  "name": "string (Theme Name)",\n  "bg": "string (hex)",\n  "bg2": "string (hex)",\n  "bg3": "string (hex)",\n  "accent": "string (hex)",\n  "accent2": "string (hex)",\n  "accentDim": "string (rgba)",\n  "text": "string (hex)",\n  "textSec": "string (hex)",\n  "tagBg": "string (rgba)",\n  "tagColor": "string (hex)",\n  "border": "string (rgba)",\n  "card": "string (rgba)",\n  "footerBg": "string (rgba)",\n  "grid": "string (rgba)",\n  "coverGrad": "string (linear-gradient CSS)"\n}`;

  const [aiJson, setAiJson] = useState('');
  const importAi = () => {
    try { const t=JSON.parse(aiJson); setEditDef(t); setAiJson(''); alert('Theme imported! Review and click Save.'); }
    catch(e){ alert('Invalid JSON'); }
  };

  return (
    <div style={{display:'flex',gap:24,height:'calc(100vh - 160px)'}}>
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
                  {!isBuiltIn && <button onClick={()=>delTheme(k)} style={{background:'rgba(224,92,92,.1)',border:'1px solid rgba(224,92,92,.3)',color:'#e05c5c',fontSize:10,padding:'4px 8px',borderRadius:4,cursor:'pointer',fontFamily:"'Space Mono',monospace"}}>✕</button>}
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

// ── History Panel ─────────────────────────────────────────────────────────────
function HistoryPanel({ history, loadHistory, delHistory }:{ history:HistoryItem[]; loadHistory:(h:HistoryItem)=>void; delHistory:(id:string)=>void; }) {
  return (
    <div style={{display:'flex',gap:24,height:'calc(100vh - 160px)',flexWrap:'wrap',alignContent:'flex-start'}}>
      {history.length===0 && <div style={{width:'100%',textAlign:'center',paddingTop:100,color:'#6b6b80',fontFamily:"'Space Mono',monospace",fontSize:14}}>No history saved yet. Use "💾 Save to History" in the Creator tab.</div>}
      {history.map(h=>(
        <div key={h.id} style={{width:340,padding:20,borderRadius:12,background:'rgba(255,255,255,.03)',border:'1px solid rgba(255,255,255,.08)'}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:24,color:'#fff',marginBottom:8}}>{h.title}</div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#6b6b80',marginBottom:16}}>{new Date(h.savedAt).toLocaleString()}</div>
          <div style={{display:'flex',gap:8,marginBottom:20}}>
            <span style={{background:'rgba(201,168,76,0.15)',color:'#E8C96A',border:'1px solid rgba(201,168,76,0.3)',padding:'4px 10px',borderRadius:20,fontSize:10,fontFamily:"'Space Mono',monospace"}}>{h.theme}</span>
            <span style={{background:'rgba(255,255,255,0.05)',color:'#A3B8CC',border:'1px solid rgba(255,255,255,0.1)',padding:'4px 10px',borderRadius:20,fontSize:10,fontFamily:"'Space Mono',monospace"}}>{RATIOS[h.ratio].label}</span>
          </div>
          <div style={{display:'flex',gap:12}}>
            <button onClick={()=>loadHistory(h)} style={{flex:1,background:'linear-gradient(135deg,#1a6fa8,#2a8fd4)',color:'#fff',border:'none',padding:'8px 0',borderRadius:6,cursor:'pointer',fontFamily:"'Space Mono',monospace",fontSize:11,fontWeight:700}}>▶ LOAD</button>
            <button onClick={()=>delHistory(h.id)} style={{background:'rgba(224,92,92,.1)',border:'1px solid rgba(224,92,92,.3)',color:'#e05c5c',padding:'8px 16px',borderRadius:6,cursor:'pointer',fontFamily:"'Space Mono',monospace",fontSize:11}}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function CarouselCreator() {
  const [tab,setTab]=useState<Tab>('creator');
  const [jsonText,setJsonText]=useState('');
  const [data,setData]=useState<CarouselData|null>(null);
  const [theme,setTheme]=useState<string>('news');
  const [ratio,setRatio]=useState<RatioKey>('1:1');
  const [screenshots,setScreenshots]=useState<Record<number,string>>({});
  const [imgAdjs,setImgAdjs]=useState<Record<number,ImgAdj>>({});
  const [extraImgs,setExtraImgs]=useState<Record<number,ExtraImg[]>>({});
  const [status,setStatus]=useState({msg:'Paste JSON and click Render',type:''});
  const [dlIdx,setDlIdx]=useState<Record<number,boolean>>({});
  const [dlAll,setDlAll]=useState(false);
  const [align,setAlign]=useState({...defAlign});
  
  const alignLabels:Record<keyof typeof align, string> = {
    tag: "Top Tag (MARKETS)", bullet: "Bullet Dots", footer: "Footer Text",
    statNum: "Big Stat (80%)", heading: "Main Headlines", subHead: "Body & Subheads",
    secLabel: "Golden Over-titles", listNum: "List Numbers (01, 02)", listText: "List Item Text", quote: "Quote Text", ctaBtn: "CTA Button Text", coverFade: "Cover Fade Height"
  };

  const previewRefs=useRef<Record<number,HTMLDivElement|null>>({});
  const downloadRefs=useRef<Record<number,HTMLDivElement|null>>({});
  const [logoSrc,setLogoSrc]=useState(LOGO_PATH);

  // LocalStorage state
  const [customThemes, setCustomThemes] = useLocalStorage<Record<string,ThemeDef>>(LS.THEMES, {});
  const [history, setHistory] = useLocalStorage<HistoryItem[]>(LS.HISTORY, []);
  
  // Backup state (excluding screenshots for size)
  const [savedState, setSavedState] = useLocalStorage<any>(LS.STATE, null);

  // Load backup on mount
  useEffect(()=>{
    if(savedState && !data) {
      setJsonText(savedState.jsonText||'');
      setData(savedState.data||null);
      setTheme(savedState.theme||'news');
      setRatio(savedState.ratio||'1:1');
      setImgAdjs(savedState.imgAdjs||{});
      setExtraImgs(savedState.extraImgs||{});
      setAlign(savedState.align||defAlign);
      if(savedState.data) msg('Session restored from auto-save','ok');
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
    try{
      const d=JSON.parse(jsonText) as CarouselData;
      if(!d.slides?.length){msg('No slides found','error');return;}
      setData(d); setScreenshots({}); setImgAdjs({}); setExtraImgs({});
      msg(`✓ ${d.slides.length} slides rendered`,'ok');
      const item: HistoryItem = {
        id: `h_${Date.now()}`, title: d.title || 'Untitled Carousel', savedAt: new Date().toISOString(),
        jsonText, theme, ratio, align, imgAdjs: {}
      };
      setHistory(prev => [item, ...prev].slice(0, 10));
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
    for(let i=0;i<data.slides.length;i++){
      msg(`⏳ Downloading slide ${i+1}/${data.slides.length}...`);
      await dlSlide(i,data);
      await new Promise(r=>setTimeout(r,800));
    }
    setDlAll(false);
    msg(`✓ All ${data.slides.length} slides saved as PNG`,'ok');
  },[data,dlSlide]);

  const saveToHistory = () => {
    if(!data) return;
    const item: HistoryItem = {
      id: `h_${Date.now()}`, title: data.title || 'Untitled Carousel', savedAt: new Date().toISOString(),
      jsonText, theme, ratio, align, imgAdjs
    };
    setHistory(prev => [item, ...prev].slice(0, 10)); // Keep last 10
    msg('✓ Saved to History','ok');
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
      {tab==='history'&&<HistoryPanel history={history} loadHistory={h=>{setJsonText(h.jsonText);setTheme(h.theme);setRatio(h.ratio);setAlign({...defAlign, ...h.align});setImgAdjs(h.imgAdjs);setTab('creator');msg('History loaded — click Render','ok');}} delHistory={id=>setHistory(prev=>prev.filter(x=>x.id!==id))}/>}
      
      {tab==='creator'&&(
        <div style={{display:'flex',gap:24,height:'calc(100vh - 200px)'}}>
          {/* Left panel */}
          <div style={{width:340,flexShrink:0,overflowY:'auto',paddingRight:8}}>
            <div style={{marginBottom:14,padding:18,borderRadius:12,background:'var(--card)',border:'1px solid var(--border)'}}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase',marginBottom:10,display:'flex',justifyContent:'space-between'}}>
                <span>1 — Paste JSON</span>
                <select onChange={e=>{
                  const h=history.find(x=>x.id===e.target.value);
                  if(h){
                    setJsonText(h.jsonText);setTheme(h.theme);setRatio(h.ratio);setAlign({...defAlign, ...h.align});setImgAdjs(h.imgAdjs);
                    msg('History loaded — click Render','ok');
                  }
                  e.target.value='';
                }} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',color:'#A3B8CC',fontSize:9,fontFamily:"'Space Mono',monospace",borderRadius:4,outline:'none',maxWidth:120}}>
                  <option value="">Load History...</option>
                  {history.map(h=><option key={h.id} value={h.id}>{h.title}</option>)}
                </select>
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
              
              {data&&<div style={{display:'flex',gap:8,marginTop:8}}>
                <button onClick={dlAllSlides} disabled={dlAll} style={{flex:2,padding:11,background:dlAll?'rgba(26,111,168,0.5)':'linear-gradient(135deg,#1a6fa8,#2a8fd4)',color:'#fff',fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:1.5,border:'none',borderRadius:8,cursor:dlAll?'not-allowed':'pointer'}}>{dlAll?status.msg:'⬇ ALL PNG'}</button>
                <button onClick={saveToHistory} style={{flex:1,padding:11,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'#A3B8CC',fontFamily:"'Space Mono',monospace",fontSize:10,borderRadius:8,cursor:'pointer'}}>💾 Save</button>
              </div>}
              
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:status.type==='error'?'#e05c5c':status.type==='ok'?'#4ecb82':'#A3B8CC',padding:'8px 0',textAlign:'center'}}>{status.msg}</div>
            </div>

            {/* Screenshots & Extras */}
            {data && (
              <div style={{padding:16,borderRadius:12,background:'var(--card)',border:'1px solid var(--border)'}}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase',marginBottom:12}}>4 — Images & Overlays</div>
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
                            <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0])handleSS(i,e.target.files[0]);}}/>
                          </label>
                          {screenshots[i] && <AdjPanel idx={i} src={screenshots[i]} adj={imgAdjs[i]??defAdj} onChange={a=>setImgAdjs(p=>({...p,[i]:a}))}/>}
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
