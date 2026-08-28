const fs = require('fs');
const file = 'src/Components/Nav.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /className="lg:hidden p-2.5 rounded-xl transition-all duration-300 menu-toggle text-slate-500 hover:bg-slate-100"/,
  'className={`lg:hidden p-2.5 rounded-xl transition-all duration-300 menu-toggle ${location.pathname === "/" && !isScrolled ? "text-white/90 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"}`}'
);

fs.writeFileSync(file, content);
