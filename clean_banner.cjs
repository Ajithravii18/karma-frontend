const fs = require('fs');
const file = 'src/Pages/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\/\* Impact Banner \*\/\}[\s\S]*?(?=\s*<\/div>\s*<\/div>\s*<\/div>\s*\) : \()/;

const simpleBanner = `{/* Impact Banner */}
                  <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-xl shadow-green-900/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <p className="text-green-100 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
                        <FaLeaf /> Contribution Excellence
                      </p>
                      <div className="flex items-baseline justify-center gap-3 mt-4">
                        <span className="text-7xl md:text-8xl font-black text-white"><Counter end={stats.totalImpact} /></span>
                        <span className="text-2xl font-black text-green-200">CREDITS</span>
                      </div>
                      <p className="text-green-50/80 text-sm font-medium mt-4 max-w-md mx-auto">
                        Your total environmental impact score. Keep completing missions to earn more credits and unlock exclusive eco-rewards.
                      </p>
                      <div className="w-full max-w-md h-3 bg-black/20 rounded-full mt-8 overflow-hidden mx-auto">
                        <div className="h-full bg-white w-3/4 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
                      </div>
                    </div>
                  </div>`;

content = content.replace(regex, simpleBanner);
fs.writeFileSync(file, content);
console.log('Replaced with simple centered banner');
