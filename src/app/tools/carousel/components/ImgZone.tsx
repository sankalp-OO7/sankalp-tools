import React, { useRef, useEffect } from 'react';
import { ImgAdj, ExtraShape } from '../types';

export default function ImgZone({ src, adj, radius=0, w='100%', h='100%', shape }:{ src?:string; adj:ImgAdj; radius?:number; w?:string|number; h?:string|number; shape?:ExtraShape }) {
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
