const fs = require('fs');
const file = 'src/Pages/VolunteerPortal.jsx';
let content = fs.readFileSync(file, 'utf8');

// We need to inject the sidebar logic.
// Find the `return (` of the VolunteerPortal component.
// The easiest way is to find `<Nav />` and replace the structure around it.
// Wait, the VolunteerPortal component doesn't have the TabButton definition. I'll inject TabButton inside the component or just render it inline.

const sidebarCode = `
      {/* ── SaaS SIDEBAR ── */}
      <div className="flex pt-[68px] min-h-screen w-full">
        <aside className="hidden lg:flex w-64 bg-white flex-col fixed top-[68px] left-0 h-[calc(100vh-68px)] overflow-y-auto z-40 border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] rounded-tr-[2rem] rounded-br-[2rem]">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/30">
                <FaUserShield />
              </div>
              <div className="overflow-hidden">
                <p className="text-slate-800 font-bold text-sm truncate">{volunteerInfo.name || "Agent"}</p>
                <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest">Active Agent</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              <div className={\`w-2 h-2 rounded-full animate-pulse \${isVolunteerBusy ? 'bg-amber-500' : 'bg-emerald-500'}\`}></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isVolunteerBusy ? "In Mission" : "Standby"}</span>
            </div>
          </div>
          
          <nav className="flex flex-col gap-1 p-4 flex-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Missions</p>
            {[
              { id: "All Sectors", icon: FaColumns, label: "All Missions" },
              { id: "Waste Only", icon: FaTrashAlt, label: "Waste Control" },
              { id: "Pollution Only", icon: FaExclamationTriangle, label: "Pollution Cases" },
              { id: "Food Only", icon: FaUtensils, label: "Food Rescues" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSectorFilter(tab.id)}
                className={\`group flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm \${
                  sectorFilter === tab.id
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600 border border-transparent"
                }\`}
              >
                <div className={\`p-2 rounded-lg transition-colors duration-200 \${
                  sectorFilter === tab.id 
                    ? "bg-white/20 text-white" 
                    : "bg-slate-100 text-slate-400 group-hover:bg-indigo-100/50 group-hover:text-indigo-600"
                }\`}>
                  <tab.icon size={14} />
                </div>
                {tab.label}
              </button>
            ))}
            
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-4">History</p>
            <button onClick={() => window.location.href = "/volunteer-history"} className="group flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm text-slate-500 hover:bg-slate-50 hover:text-indigo-600 border border-transparent">
              <div className="p-2 rounded-lg transition-colors duration-200 bg-slate-100 text-slate-400 group-hover:bg-indigo-100/50 group-hover:text-indigo-600">
                <FaCheckCircle size={14} />
              </div>
              Completed Log
            </button>
          </nav>
          
          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Performance Score</p>
              <div className="flex items-center gap-2 mb-2">
                <FaStar className="text-amber-500 text-lg" />
                <span className="text-xl font-black text-slate-800">{volunteerInfo.averageRating || "0.0"}</span>
              </div>
              <p className="text-[10px] text-indigo-600 font-bold">From {volunteerInfo.reviewCount || 0} Reviews</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 lg:ml-64 w-full">`;

// Replace `<Nav />` with `<Nav />` + sidebar wrapper
content = content.replace(/<Nav \/>/, '<Nav />\n' + sidebarCode);

// Add the closing `</main></div>` right before the final `</div>\n    </div>\n  );`
const lastDivIndex = content.lastIndexOf('</div>');
const secondLastDivIndex = content.lastIndexOf('</div>', lastDivIndex - 1);
// Actually, it's easier to just replace `    </div>\n  );\n};` with `      </main>\n      </div>\n    </div>\n  );\n};`
content = content.replace(/<\/div>\n\s*<\/div>\n\s*\);\n};/, '        </main>\n      </div>\n    </div>\n  );\n};');

// Also, the old container `<div className="max-w-7xl mx-auto pt-32 px-6">`
// needs to be changed to `<div className="max-w-[1400px] mx-auto pt-8 lg:pt-10 px-6">`
content = content.replace(/<div className="max-w-7xl mx-auto pt-32 px-6">/, '<div className="max-w-[1400px] mx-auto pt-8 lg:pt-10 px-4 sm:px-6">');

// Finally, we must hide the original giant STATS OVERVIEW block on large screens because the sidebar handles it now!
// It's `<div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-8 lg:mb-12">` directly under `{/* STATS OVERVIEW */}`
content = content.replace(/\{\/\* STATS OVERVIEW \*\/\}\s*<div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-8 lg:mb-12">/, '{/* STATS OVERVIEW (Mobile only now that Sidebar exists) */}\n        <div className="flex lg:hidden flex-col gap-4 mb-8">');

fs.writeFileSync(file, content);
console.log('Sidebar integrated successfully!');
