const fs = require('fs');

function cleanFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Remove the unsplash image block completely
  content = content.replace(/\{\/\* Unsplash Background Image with Overlay \*\/\}\s*<div className=\"fixed inset-0 z-0 pointer-events-none\">[\s\S]*?<\/div>\s*<\/div>/g, '');
  
  // Remove decorative elements
  content = content.replace(/\{\/\* Decorative Background Elements \*\/\}\s*<div className=\"absolute[^\"]+\"><\/div>\s*<div className=\"absolute[^\"]+\"><\/div>/g, '');
  content = content.replace(/<div className=\"absolute top-\[-10%\].*?<\/div>/g, '');
  content = content.replace(/<div className=\"absolute bottom-\[-10%\].*?<\/div>/g, '');

  // Remove glassmorphism everywhere
  content = content.replace(/bg-white\/[0-9]+\s+backdrop-blur-(md|sm|lg|xl)/g, 'bg-white');
  content = content.replace(/bg-white\/[0-9]+/g, 'bg-white');
  content = content.replace(/backdrop-blur-(md|sm|lg|xl)/g, '');
  content = content.replace(/border-transparent/g, 'border-slate-200');
  content = content.replace(/border-white\/[0-9]+/g, 'border-slate-200');
  content = content.replace(/shadow-\[0_8px_30px_rgb\(0,0,0,0\.06\)\]/g, 'shadow-sm');
  
  // Clean up backgrounds
  content = content.replace(/bg-\[\#F0F5F2\]/g, 'bg-slate-50');
  content = content.replace(/bg-gradient-to-br from-[a-z]+-[0-9]+ via-[a-z]+-[0-9]+ to-[a-z]+-[0-9]+/g, 'bg-slate-50');
  
  // Clean up multiple spaces that might result from removal
  content = content.replace(/className=\"\s+/g, 'className=\"');
  content = content.replace(/\s+\"/g, '\"');
  
  fs.writeFileSync(path, content);
  console.log('Cleaned ' + path);
}

cleanFile('src/Pages/Dashboard.jsx');
cleanFile('src/Pages/Pickup.jsx');
cleanFile('src/Pages/ReportFood.jsx');
cleanFile('src/Pages/ReportPollution.jsx');
cleanFile('src/Pages/Service.jsx');
cleanFile('src/Pages/Impact.jsx');
cleanFile('src/Pages/About.jsx');
