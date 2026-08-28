const fs = require('fs');
const file = 'src/Pages/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /\{\/\* ── RIGHT COLUMN ── \*\/\}[\s\n]*<div className="lg:col-span-7 xl:col-span-8 space-y-6">/g,
  '{/* ── STATS COLUMN (Left on Desktop, Bottom on Mobile) ── */}\n                <div className="lg:col-span-7 xl:col-span-8 space-y-6 lg:order-first">'
);

fs.writeFileSync(file, content);
console.log('Swapped stats column!');
