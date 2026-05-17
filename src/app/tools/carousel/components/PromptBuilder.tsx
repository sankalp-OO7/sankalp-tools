import React, { useState } from 'react';

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

export default function PromptBuilder() {
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
