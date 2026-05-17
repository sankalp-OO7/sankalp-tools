import React, { useState } from 'react';

type SBSlide={id:number;type:string;fields:Record<string,string>;bullets:string[];items:{num:string;text:string}[];hasSS:boolean};
let _sid=0; const mkS=(type:string):SBSlide=>({id:++_sid,type,fields:{},bullets:[],items:[],hasSS:type==='cover'});

export default function BuilderTab({onLoad}:{onLoad:(j:string)=>void}) {
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
