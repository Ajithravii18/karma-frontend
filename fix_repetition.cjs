const fs = require('fs');
const file = 'src/Pages/Dashboard.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="flex flex-col gap-3 w-full xl:w-64 shrink-0">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const newBlock = `<div className="flex flex-col items-center justify-center w-full xl:w-72 shrink-0 bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30 transform group-hover:scale-110 transition-transform duration-500 border-2 border-white/20 relative z-10">
                          <FaStar className="text-3xl text-white" />
                        </div>
                        <p className="text-green-100 text-[10px] font-black uppercase tracking-widest text-center">Next Milestone</p>
                        <p className="text-white font-black text-2xl text-center leading-tight mt-1">Eco Warrior</p>
                        <div className="w-12 h-1 bg-white/20 rounded-full my-4 relative z-10"></div>
                        <p className="text-xs font-medium text-green-50 text-center relative z-10">
                          Earn <strong className="text-white font-black text-sm bg-white/20 px-1.5 py-0.5 rounded-md mx-0.5">7</strong> more credits to unlock this badge!
                        </p>
                      </div>
                    </div>
                  </div>`;

content = content.replace(regex, newBlock);
fs.writeFileSync(file, content);
console.log('Removed repetition and added gamification block!');
