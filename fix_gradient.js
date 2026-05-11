const fs = require('fs');
const file = '/home/sankalp/Videos/sankalps-tools/nextapp/src/app/tools/carousel/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /background:`linear-gradient\(135deg,\$\{t\.accent\},\$\{t\.accent2\}\)`,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',/g;

content = content.replace(regex, `color:t.accent,`);

fs.writeFileSync(file, content);
console.log("Fixed gradient text bug!");
