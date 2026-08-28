const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'Pages', 'Dashboard.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Global Background
content = content.replace(
  `className="min-h-screen bg-[#F0F2F5] font-sans"`,
  `className="min-h-screen bg-slate-50 font-sans"`
);

// 2. Sidebar
content = content.replace(
  `{/* ── DARK SIDEBAR ── */}\n        <aside className="hidden lg:flex w-64 bg-[#1A2332] flex-col fixed top-[68px] left-0 h-[calc(100vh-68px)] overflow-y-auto z-40 border-r border-white/10 shadow-2xl rounded-tr-[2rem] rounded-br-[2rem]">`,
  `{/* ── LIGHT SIDEBAR ── */}\n        <aside className="hidden lg:flex w-64 bg-white flex-col fixed top-[68px] left-0 h-[calc(100vh-68px)] overflow-y-auto z-40 border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] rounded-tr-[2rem] rounded-br-[2rem]">`
);

content = content.replace(
  `<div className="p-6 border-b border-white/10">`,
  `<div className="p-6 border-b border-slate-100">`
);

content = content.replace(
  `<p className="text-white font-bold text-sm truncate">{currentName}</p>\n                <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest">Eco Citizen</p>`,
  `<p className="text-slate-800 font-bold text-sm truncate">{currentName}</p>\n                <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest">Eco Citizen</p>`
);

content = content.replace(
  `<div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">\n              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>\n              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">`,
  `<div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">\n              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>\n              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">`
);

content = content.replace(
  `<p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2">Navigation</p>`,
  `<p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Navigation</p>`
);

content = content.replace(
  `<div className="p-4 border-t border-white/10">\n            <div className="bg-white/5 rounded-xl p-4">\n              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Impact Score</p>\n              <p className="text-3xl font-black text-white">`,
  `<div className="p-4 border-t border-slate-100">\n            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">\n              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Impact Score</p>\n              <p className="text-3xl font-black text-slate-800">`
);

content = content.replace(
  `<p className="text-[10px] text-green-400 font-bold mt-1">Credits Earned</p>\n              <div className="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">\n                <div className="h-full bg-green-500 w-3/4 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>`,
  `<p className="text-[10px] text-green-600 font-bold mt-1">Credits Earned</p>\n              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">\n                <div className="h-full bg-green-500 w-3/4 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>`
);

// 3. TabButton
content = content.replace(
  `? "bg-green-500 text-white shadow-lg shadow-green-500/30"\n          : "text-slate-400 hover:bg-white/10 hover:text-white"`,
  `? "bg-green-50 text-green-700 shadow-sm border border-green-100"\n          : "text-slate-600 hover:bg-slate-50 hover:text-green-600"`
);

content = content.replace(
  `<div className={\`p-2 rounded-lg \${activeTab === id ? "bg-white/20" : "bg-white/5"}\`}>`,
  `<div className={\`p-2 rounded-lg \${activeTab === id ? "bg-green-200/50 text-green-600" : "bg-slate-100 text-slate-400"}\`}>`
);

// 4. Mobile Bottom Nav
content = content.replace(
  `<div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A2332] border-t border-white/10 flex">`,
  `<div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">`
);

content = content.replace(
  `className={\`flex-1 py-3 flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-widest transition-all \${activeTab === id ? "text-green-400" : "text-slate-500"}\`}`,
  `className={\`flex-1 py-3 flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-widest transition-all \${activeTab === id ? "text-green-600" : "text-slate-400"}\`}`
);

// 5. Hero Header Card
content = content.replace(
  `<div className="bg-[#1A2332] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">\n                <div className="absolute right-0 top-0 w-64 h-full bg-green-500/5 rounded-full blur-3xl pointer-events-none" />`,
  `<div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">`
);

content = content.replace(
  `<p className="text-white font-black text-lg leading-tight">{currentName}</p>\n                    <p className="text-slate-400 text-xs font-medium mt-0.5">Eco Citizen`,
  `<p className="text-slate-800 font-black text-lg leading-tight">{currentName}</p>\n                    <p className="text-slate-500 text-xs font-medium mt-0.5">Eco Citizen`
);

content = content.replace(
  `<div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />\n                      <span className="text-green-400 text-[10px] font-bold uppercase tracking-widest">Active Member</span>`,
  `<div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />\n                      <span className="text-green-600 text-[10px] font-bold uppercase tracking-widest">Active Member</span>`
);

content = content.replace(
  `isEditing ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-white/10 text-white hover:bg-white/20 border border-white/10"`,
  `isEditing ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"`
);

// 6. Impact Banner
content = content.replace(
  `{/* Impact Banner */}\n              <div className="bg-[#1A2332] rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">\n                <div className="absolute -top-10 -right-10 w-48 h-48 bg-green-500/10 rounded-full blur-2xl pointer-events-none"></div>\n                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">\n                  <div className="flex-1 text-center md:text-left">\n                    <p className="text-green-400 text-[10px] font-black uppercase tracking-widest mb-3">Contribution Excellence</p>\n                    <div className="flex items-baseline gap-3 justify-center md:justify-start">\n                      <span className="text-6xl font-black text-white"><Counter end={stats.totalImpact} /></span>\n                      <span className="text-2xl font-black text-green-400">CREDITS</span>\n                    </div>\n                    <p className="text-slate-400 text-xs font-medium mt-2">Total environmental impact score</p>\n                    <div className="w-full max-w-xs h-2 bg-white/10 rounded-full mt-4 overflow-hidden mx-auto md:mx-0">\n                      <div className="h-full bg-green-500 w-3/4 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.5)]"></div>\n                    </div>\n                  </div>\n                  <div className="flex flex-col gap-3 w-full md:w-64 shrink-0">\n                    {[\n                      { icon: FaRecycle, label: "Waste Managed", val: stats.breakdown?.pickups, color: "text-emerald-400" },\n                      { icon: FaExclamationTriangle, label: "Pollution Cases", val: stats.breakdown?.pollution, color: "text-rose-400" },\n                      { icon: FaUtensils, label: "Food Donations", val: stats.breakdown?.food, color: "text-amber-400" },\n                    ].map((s, i) => (\n                      <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 hover:bg-white/10 transition-all">\n                        <s.icon size={14} className={s.color} />\n                        <div>\n                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>\n                          <p className="text-base font-black text-white"><Counter end={s.val || 0} /></p>\n                        </div>\n                      </div>\n                    ))}\n                  </div>\n                </div>\n              </div>`,
  `{/* Impact Banner */}\n              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 md:p-8 text-slate-800 relative overflow-hidden">\n                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">\n                  <div className="flex-1 text-center md:text-left">\n                    <p className="text-green-600 text-[10px] font-black uppercase tracking-widest mb-3">Contribution Excellence</p>\n                    <div className="flex items-baseline gap-3 justify-center md:justify-start">\n                      <span className="text-6xl font-black text-slate-800"><Counter end={stats.totalImpact} /></span>\n                      <span className="text-2xl font-black text-green-600">CREDITS</span>\n                    </div>\n                    <p className="text-slate-500 text-xs font-medium mt-2">Total environmental impact score</p>\n                    <div className="w-full max-w-xs h-2 bg-slate-100 rounded-full mt-4 overflow-hidden mx-auto md:mx-0">\n                      <div className="h-full bg-green-500 w-3/4 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.3)]"></div>\n                    </div>\n                  </div>\n                  <div className="flex flex-col gap-3 w-full md:w-64 shrink-0">\n                    {[\n                      { icon: FaRecycle, label: "Waste Managed", val: stats.breakdown?.pickups, color: "text-emerald-600" },\n                      { icon: FaExclamationTriangle, label: "Pollution Cases", val: stats.breakdown?.pollution, color: "text-rose-600" },\n                      { icon: FaUtensils, label: "Food Donations", val: stats.breakdown?.food, color: "text-amber-600" },\n                    ].map((s, i) => (\n                      <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 hover:bg-slate-100 transition-all">\n                        <s.icon size={14} className={s.color} />\n                        <div>\n                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>\n                          <p className="text-base font-black text-slate-800"><Counter end={s.val || 0} /></p>\n                        </div>\n                      </div>\n                    ))}\n                  </div>\n                </div>\n              </div>`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Dashboard theme updated successfully.');
