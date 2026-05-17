import React from 'react';
import { SlideData, ThemeDef, ExtraImg, ImgAdj, defAdj, clamp, extraPos, BRAND } from '../types';
import ImgZone from './ImgZone';

export default function SlideEl({ slide, idx, total, theme:t, screenshots, extraImgs, logoSrc, imgAdjs, align, slideW, slideH }:{
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

  const fHead = t.fontHeadline || "'Cormorant Garamond',serif";
  const fBody = t.fontBody || "'Syne',sans-serif";
  const fMono = t.fontMono || "'Space Mono',monospace";
  const rCard = t.radius ?? 12;
  const rImg = t.radius ?? 16;
  const rBtn = t.radius !== undefined ? Math.max(t.radius, 4) : 50;

  const Wrap = ({ children }:{children:React.ReactNode}) => (
    <div style={{width:slideW,height:slideH,position:'relative',overflow:'hidden',background:t.bgGrad||t.bg,color:t.text,fontFamily:fBody,flexShrink:0}}>
      <div style={{position:'absolute',inset:0,pointerEvents:'none',backgroundImage:`linear-gradient(${t.grid} 1px,transparent 1px),linear-gradient(90deg,${t.grid} 1px,transparent 1px)`,backgroundSize:'54px 54px'}}/>
      <div style={{position:'absolute',width:500,height:500,top:-150,right:-150,borderRadius:'50%',background:`radial-gradient(circle,${t.accentDim} 0%,transparent 70%)`,pointerEvents:'none'}}/>
      <div style={{position:'absolute',top:0,left:0,right:0,height:72,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 52px',zIndex:10,borderBottom:`1px solid ${t.border}`,background:t.footerBg}}>
        <img src={logoSrc} alt="ShamsGS" style={{width:44,height:44,borderRadius:rCard?8:0,objectFit:'cover'}} crossOrigin="anonymous"/>
        <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',height:34,padding:'0 18px',fontFamily:fMono,fontSize:18,letterSpacing:3,textTransform:'uppercase',borderRadius:rBtn,background:t.tagBg,color:t.tagColor,border:`1px solid ${t.border}`,fontWeight:700}}>
          <span style={{transform:`translateY(${align.tag}px)`}}>{clamp(slide.tag||'SHAMSGS',20)}</span>
        </span>
        <span style={{width:44}}/>
      </div>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:58,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 52px',zIndex:10,background:t.footerBg,borderTop:`1px solid ${t.border}`}}>
        <span style={{fontFamily:fMono,fontSize:20,color:t.accent,letterSpacing:1,transform:`translateY(${align.footer}px)`}}>{BRAND.website}</span>
        <span style={{fontFamily:fMono,fontSize:20,color:t.textSec,letterSpacing:1,display:'flex',alignItems:'center',gap:8}}>
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
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:align.coverFade??240,background:`linear-gradient(transparent,${t.bg})`}}/>
      </div>
      {/* text zone */}
      <div style={{position:'absolute',left:0,right:0,bottom:58,padding:'0 110px 44px',overflow:'hidden'}}>
        <div style={{display:'flex',alignItems:'center',gap:14,fontFamily:fMono,fontSize:22,letterSpacing:5,textTransform:'uppercase',color:t.accent,marginBottom:18,transform:`translateY(${align.secLabel}px)`}}>
          <span style={{width:36,height:2,background:t.accent,display:'inline-block',flexShrink:0}}/>
          {clamp(slide.tag||'SHAMSGS',25)}
        </div>
        <div style={{fontFamily:fHead,fontSize:88,fontWeight:700,lineHeight:1.05,letterSpacing:-1,marginBottom:16,transform:`translateY(${align.heading}px)`}}>{clamp(slide.headline,55)}</div>
        <div style={{fontFamily:fBody,fontSize:30,lineHeight:1.5,opacity:.75,transform:`translateY(${align.subHead}px)`}}>{clamp(slide.subheadline,80)}</div>
      </div>
    </Wrap>
  );

  if (type==='content') {
    const hasSS = false;
    return (
      <Wrap>
        <div style={{...bodyBase,display:'flex',gap:hasSS?52:0}}>
          <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
            {slide.section_label && <div style={{fontFamily:fMono,fontSize:20,letterSpacing:4,textTransform:'uppercase',color:t.accent,display:'flex',alignItems:'center',gap:16,marginBottom:24,transform:`translateY(${align.secLabel}px)`}}>{clamp(slide.section_label,28)}<span style={{flex:1,height:1,background:t.accent,opacity:.3}}/></div>}
            <div style={{fontFamily:fHead,fontSize:68,fontWeight:700,lineHeight:1.1,letterSpacing:-.5,marginBottom:24,transform:`translateY(${align.heading}px)`}}>{clamp(slide.headline,50)}</div>
            {slide.body && <div style={{fontFamily:fBody,fontSize:28,lineHeight:1.65,color:t.textSec,marginBottom:28,transform:`translateY(${align.subHead}px)`}}>{clamp(slide.body,140)}</div>}
            {(slide.bullets||[]).slice(0,5).map((b,i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:16,fontFamily:fBody,fontSize:27,lineHeight:1.4,color:t.textSec,marginBottom:14}}>
                <span style={{width:8,height:8,borderRadius:'50%',background:t.accent,flexShrink:0,transform:`translateY(${align.bullet}px)`}}/>
                <span style={{transform:`translateY(${align.listText}px)`, display:'inline-block'}}>{clamp(b,65)}</span>
              </div>
            ))}
          </div>
          {hasSS && <div style={{width:380,flexShrink:0,display:'flex',alignItems:'center'}}><ImgZone src={ss} adj={adj} radius={rImg} w={380} h={380}/></div>}
        </div>
      </Wrap>
    );
  }

  if (type==='stat') return (
    <Wrap>
      <div style={{...bodyBase,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',gap:20}}>
        <div style={{fontFamily:fHead,fontSize:220,fontWeight:700,lineHeight:1,letterSpacing:-4,color:t.accent,transform:`translateY(${align.statNum}px)`}}>{clamp(slide.stat_number,12)}</div>
        <div style={{fontFamily:fMono,fontSize:28,letterSpacing:5,textTransform:'uppercase',color:t.textSec,maxWidth:800,transform:`translateY(${align.secLabel}px)`}}>{clamp(slide.stat_label,45)}</div>
        {slide.stat_context && <div style={{fontFamily:fBody,fontSize:30,lineHeight:1.5,color:t.textSec,maxWidth:700,}}>{clamp(slide.stat_context,90)}</div>}
      </div>
    </Wrap>
  );

  if (type==='quote') return (
    <Wrap>
      <div style={{...bodyBase,display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <div style={{fontFamily:fHead,fontSize:200,lineHeight:.6,marginBottom:20,opacity:.35,color:t.accent,transform:`translateY(${align.quote}px)`}}>&ldquo;</div>
        <div style={{fontFamily:fHead,fontSize:56,fontStyle:'italic',fontWeight:400,lineHeight:1.4,marginBottom:36,}}>{clamp(slide.quote_text,130)}</div>
        <div style={{fontFamily:fMono,fontSize:22,letterSpacing:3,textTransform:'uppercase',paddingTop:24,borderTop:`1px solid ${t.accent}`,color:t.accent,opacity:.65,}}>{clamp(slide.quote_source,55)}</div>
      </div>
    </Wrap>
  );

  if (type==='list') return (
    <Wrap>
      <div style={bodyBase}>
        {slide.section_label && <div style={{fontFamily:fMono,fontSize:20,letterSpacing:4,textTransform:'uppercase',color:t.accent,display:'flex',alignItems:'center',gap:16,marginBottom:24}}>{clamp(slide.section_label,28)}<span style={{flex:1,height:1,background:t.accent,opacity:.3}}/></div>}
        {slide.headline && <div style={{fontFamily:fHead,fontSize:64,fontWeight:700,lineHeight:1.1,marginBottom:32,transform:`translateY(${align.heading}px)`}}>{clamp(slide.headline,50)}</div>}
        <div style={{display:'flex',flexDirection:'column',gap:18}}>
          {(slide.items||[]).slice(0,5).map((item,i)=>(
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:24,padding:'18px 22px',borderRadius:rCard,background:t.card,border:`1px solid ${t.border}`,overflow:'hidden'}}>
              <div style={{fontFamily:fHead,fontSize:52,fontWeight:700,lineHeight:1,color:t.accent,flexShrink:0,width:64,textAlign:'right',transform:`translateY(${align.listNum}px)`}}>{clamp(item.number,4)}</div>
              <div style={{fontFamily:fBody,fontSize:28,lineHeight:1.4,paddingTop:10,color:t.textSec,}}>{clamp(item.text,70)}</div>
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
        <img src={logoSrc} alt="ShamsGS" crossOrigin="anonymous" style={{width:180,height:180,borderRadius:rImg,objectFit:'cover',boxShadow:`0 0 60px ${t.accentDim}`}}/>
        <div style={{fontFamily:fHead,fontSize:72,fontWeight:700,lineHeight:1.1,color:t.accent,maxWidth:800,transform:`translateY(${align.heading}px)`}}>{clamp(slide.cta_headline,40)}</div>
        {slide.cta_body && <div style={{fontFamily:fBody,fontSize:30,lineHeight:1.5,color:t.textSec,maxWidth:700}}>{clamp(slide.cta_body,90)}</div>}
        <div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',height:76,padding:'0 60px',borderRadius:rBtn,fontFamily:fMono,fontSize:26,fontWeight:700,letterSpacing:2,background:`linear-gradient(135deg,${t.accent},${t.accent2})`,color:'#050E1C'}}><span style={{transform:`translateY(${align.ctaBtn}px)`}}>{BRAND.cta.buttonText}</span></div>
        <div style={{fontFamily:fMono,fontSize:22,letterSpacing:2,color:t.textSec}}>{BRAND.cta.linkInBio}</div>
      </div>
    </Wrap>
  );

  return <SlideEl slide={{...slide,slide_type:'content'}} idx={idx} total={total} theme={t} screenshots={screenshots} extraImgs={{}} logoSrc={logoSrc} imgAdjs={imgAdjs} align={align} slideW={1080} slideH={1080}/>;
}
