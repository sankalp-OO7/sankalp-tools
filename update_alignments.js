const fs = require('fs');
const file = '/home/sankalp/Videos/sankalps-tools/nextapp/src/app/tools/carousel/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update SlideEl type
content = content.replace(
  `align: {tag:number; bullet:number; footer:number};`,
  `align: {tag:number; bullet:number; footer:number; statNum:number; heading:number; subHead:number; secLabel:number; listNum:number; listText:number; quote:number;};`
);

// 2. Cover Slide
content = content.replace(
  `color:t.accent,marginBottom:18}}>`,
  `color:t.accent,marginBottom:18,transform:\`translateY(\${align.secLabel}px)\`}}>`
);
content = content.replace(
  `marginBottom:16}}>{clamp(slide.headline,55)}</div>`,
  `marginBottom:16,transform:\`translateY(\${align.heading}px)\`}}>{clamp(slide.headline,55)}</div>`
);
content = content.replace(
  `opacity:.75}}>{clamp(slide.subheadline,80)}</div>`,
  `opacity:.75,transform:\`translateY(\${align.subHead}px)\`}}>{clamp(slide.subheadline,80)}</div>`
);

// 3. Content Slide
content = content.replace(
  `marginBottom:24}}>{clamp(slide.section_label,28)}`,
  `marginBottom:24,transform:\`translateY(\${align.secLabel}px)\`}}>{clamp(slide.section_label,28)}`
);
content = content.replace(
  `marginBottom:24}}>{clamp(slide.headline,50)}</div>`,
  `marginBottom:24,transform:\`translateY(\${align.heading}px)\`}}>{clamp(slide.headline,50)}</div>`
);
content = content.replace(
  `marginBottom:28}}>{clamp(slide.body,140)}</div>`,
  `marginBottom:28,transform:\`translateY(\${align.subHead}px)\`}}>{clamp(slide.body,140)}</div>`
);
content = content.replace(
  `<span>{clamp(b,65)}</span>`,
  `<span style={{transform:\`translateY(\${align.listText}px)\`, display:'inline-block'}}>{clamp(b,65)}</span>`
);

// 4. Stat Slide
content = content.replace(
  `backgroundClip:'text'}}>{clamp(slide.stat_number,12)}</div>`,
  `backgroundClip:'text',transform:\`translateY(\${align.statNum}px)\`}}>{clamp(slide.stat_number,12)}</div>`
);
content = content.replace(
  `maxWidth:800}}>{clamp(slide.stat_label,45)}</div>`,
  `maxWidth:800,transform:\`translateY(\${align.secLabel}px)\`}}>{clamp(slide.stat_label,45)}</div>`
);
content = content.replace(
  `maxWidth:700}}>{clamp(slide.stat_context,90)}</div>`,
  `maxWidth:700,transform:\`translateY(\${align.subHead}px)\`}}>{clamp(slide.stat_context,90)}</div>`
);

// 5. Quote Slide
content = content.replace(
  `color:t.accent}}>&ldquo;</div>`,
  `color:t.accent,transform:\`translateY(\${align.quote}px)\`}}>&ldquo;</div>`
);
content = content.replace(
  `marginBottom:36}}>{clamp(slide.quote_text,130)}</div>`,
  `marginBottom:36,transform:\`translateY(\${align.quote}px)\`}}>{clamp(slide.quote_text,130)}</div>`
);
content = content.replace(
  `opacity:.65}}>{clamp(slide.quote_source,55)}</div>`,
  `opacity:.65,transform:\`translateY(\${align.secLabel}px)\`}}>{clamp(slide.quote_source,55)}</div>`
);

// 6. List Slide
content = content.replace(
  `marginBottom:32}}>{clamp(slide.headline,50)}</div>`,
  `marginBottom:32,transform:\`translateY(\${align.heading}px)\`}}>{clamp(slide.headline,50)}</div>`
);
content = content.replace(
  `textAlign:'right'}}>{clamp(item.number,4)}</div>`,
  `textAlign:'right',transform:\`translateY(\${align.listNum}px)\`}}>{clamp(item.number,4)}</div>`
);
content = content.replace(
  `color:t.textSec}}>{clamp(item.text,70)}</div>`,
  `color:t.textSec,transform:\`translateY(\${align.listText}px)\`}}>{clamp(item.text,70)}</div>`
);

// 7. CTA Slide
content = content.replace(
  `maxWidth:800}}>{clamp(slide.cta_headline,40)}</div>`,
  `maxWidth:800,transform:\`translateY(\${align.heading}px)\`}}>{clamp(slide.cta_headline,40)}</div>`
);

// 8. Update initial state and UI
const stateRegex = /const \[align,setAlign\]=useState\(\{tag:-2,bullet:-2,footer:1\}\);/;
content = content.replace(
  stateRegex,
  `const [align,setAlign]=useState({tag:-9,bullet:9,footer:-9,statNum:-9,heading:-9,subHead:-9,secLabel:-9,listNum:-9,listText:-9,quote:-9});
  const alignLabels:Record<keyof typeof align, string> = {
    tag: "Top Tag (MARKETS)", bullet: "Bullet Dots", footer: "Footer Text",
    statNum: "Big Stat (80%)", heading: "Main Headlines", subHead: "Body & Subheads",
    secLabel: "Golden Over-titles", listNum: "List Numbers (01, 02)", listText: "List Item Text", quote: "Quote Text"
  };`
);

// Note: I will use a regex to replace the Fine-Tuning UI block
const uiRegex = /<div style={{padding:16,borderRadius:12,background:'var\(--card\)',border:'1px solid var\(--border\)',marginTop:14}}>[\s\S]*?(?=<\/div>\n            \)\}\n          <\/div>)/;
const newUI = `<div style={{padding:16,borderRadius:12,background:'var(--card)',border:'1px solid var(--border)',marginTop:14}}>
                <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:2,color:'#C9A84C',textTransform:'uppercase',marginBottom:12}}>4 — Vertical Fine-Tuning</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',columnGap:16,rowGap:12}}>
                  {(Object.keys(alignLabels) as Array<keyof typeof align>).map(k => (
                    <div key={k}>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'#A3B8CC',marginBottom:3,display:'flex',justifyContent:'space-between'}}>
                        <span>{alignLabels[k]}</span><span>{align[k] > 0 ? '+'+align[k] : align[k]}px</span>
                      </div>
                      <input type="range" min="-30" max="30" step="1" value={align[k]} onChange={e=>setAlign(p=>({...p,[k]:+e.target.value}))} style={{width:'100%',accentColor:'#C9A84C',cursor:'pointer'}}/>
                    </div>
                  ))}
                </div>
              </div>`;
content = content.replace(uiRegex, newUI);

fs.writeFileSync(file, content);
console.log("Updated Alignments!");
