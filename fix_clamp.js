const fs = require('fs');
const file = '/home/sankalp/Videos/sankalps-tools/nextapp/src/app/tools/carousel/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /display:'-webkit-box',WebkitLineClamp:\d+,WebkitBoxOrient:'vertical' as const,overflow:'hidden',?/g;
content = content.replace(regex, '');

fs.writeFileSync(file, content);
console.log("Fixed WebkitLineClamp issues");
