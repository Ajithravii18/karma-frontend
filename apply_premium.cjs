const fs = require('fs');

function applyPremiumEcoTech(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Backgrounds
  content = content.replace(/bg-slate-50/g, 'bg-[#F4F7F6]');
  
  // Cards: remove border, add premium soft shadow
  content = content.replace(/border-slate-200/g, 'border-transparent');
  content = content.replace(/border border-slate-200/g, '');
  content = content.replace(/border border-gray-100/g, '');
  content = content.replace(/border-gray-100/g, 'border-transparent');
  content = content.replace(/shadow-sm/g, 'shadow-[0_8px_30px_rgb(0,0,0,0.04)]');
  
  // Headings: text-gray-900 -> text-[#0A2F1D]
  content = content.replace(/text-gray-900/g, 'text-[#0A2F1D]');
  content = content.replace(/text-slate-900/g, 'text-[#0A2F1D]');
  
  // Dark Card in Dashboard
  content = content.replace(/bg-slate-900/g, 'bg-[#0A2F1D]');
  content = content.replace(/border-slate-800/g, 'border-[#062013]');
  content = content.replace(/bg-slate-800/g, 'bg-[#0E3D26]');
  content = content.replace(/border-slate-700/g, 'border-[#0A2F1D]');
  content = content.replace(/hover:bg-slate-700/g, 'hover:bg-[#134D30]');

  fs.writeFileSync(path, content);
  console.log('Premium Eco-Tech applied to ' + path);
}

try {
  applyPremiumEcoTech('src/Pages/Dashboard.jsx');
  applyPremiumEcoTech('src/Pages/Pickup.jsx');
  applyPremiumEcoTech('src/Pages/ReportFood.jsx');
  applyPremiumEcoTech('src/Pages/ReportPollution.jsx');
  applyPremiumEcoTech('src/components/Nav.jsx');
} catch (e) {
  console.log(e);
}
