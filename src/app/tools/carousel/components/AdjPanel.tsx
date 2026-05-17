import React from 'react';
import { ImgAdj, defAdj } from '../types';

export default function AdjPanel({idx,src,adj,onChange}:{idx:number;src:string;adj:ImgAdj;onChange:(a:ImgAdj)=>void}) {
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
