const fs = require('fs');
const file = '/home/sankalp/Videos/sankalps-tools/nextapp/src/app/tools/carousel/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update align state and labels
content = content.replace(
  `const [align,setAlign]=useState({tag:-9,bullet:9,footer:-9,statNum:-9,heading:-9,subHead:-9,secLabel:-9,listNum:-9,listText:-9,quote:-9});`,
  `const [align,setAlign]=useState({tag:-9,bullet:9,footer:-9,statNum:-9,heading:-9,subHead:-9,secLabel:-9,listNum:-9,listText:-9,quote:-9,ctaBtn:-9});`
);

content = content.replace(
  `secLabel: "Golden Over-titles", listNum: "List Numbers (01, 02)", listText: "List Item Text", quote: "Quote Text"`,
  `secLabel: "Golden Over-titles", listNum: "List Numbers (01, 02)", listText: "List Item Text", quote: "Quote Text", ctaBtn: "CTA Button Text"`
);

// Update SlideEl type
content = content.replace(
  `listText:number; quote:number;};`,
  `listText:number; quote:number; ctaBtn:number;};`
);

// Update CTA button text
content = content.replace(
  `<div style={{padding:'22px 60px',borderRadius:50,fontFamily:"'Space Mono',monospace",fontSize:26,fontWeight:700,letterSpacing:2,background:\`linear-gradient(135deg,\$\{t.accent\},\$\{t.accent2\})\`,color:'#050E1C'}}>{BRAND.cta.buttonText}</div>`,
  `<div style={{display:'inline-flex',alignItems:'center',justifyContent:'center',height:76,padding:'0 60px',borderRadius:50,fontFamily:"'Space Mono',monospace",fontSize:26,fontWeight:700,letterSpacing:2,background:\`linear-gradient(135deg,\$\{t.accent\},\$\{t.accent2\})\`,color:'#050E1C'}}><span style={{transform:\`translateY(\${align.ctaBtn}px)\`}}>{BRAND.cta.buttonText}</span></div>`
);

fs.writeFileSync(file, content);
console.log("Fixed CTA button alignment!");
