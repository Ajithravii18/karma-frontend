import React from 'react';
import { FaUtensils, FaHistory, FaHeartbeat } from "react-icons/fa";

const FoodAnalysis = ({ reports }) => {
  // 🔥 ADVANCED IMPACT LOGIC: Processing Servings and Delivery Status
  const foodStats = reports.reduce((acc, r) => {
    if (r.type === 'food') {
      acc.total += 1;

      // Normalize status to match your backend/lifecycle
      const status = (r.status || "Available").toLowerCase();

      // Calculate Total Servings (Impact Weight)
      const servings = parseInt(r.quantity) || 0;
      acc.totalServings += servings;

      if (['delivered', 'completed', 'resolved'].includes(status)) {
        acc.delivered += 1;
        acc.servingsSaved += servings;
      } else if (['claimed', 'arrived', 'collected'].includes(status)) {
        acc.active += 1;
      } else if (status === 'available' || status === 'pending' || status === 'verified') {
        acc.available += 1;
      }
    }
    return acc;
  }, { total: 0, delivered: 0, active: 0, available: 0, totalServings: 0, servingsSaved: 0 });

  // Success rate is based on actual completions
  const successRate = foodStats.total > 0
    ? Math.round((foodStats.delivered / foodStats.total) * 100)
    : 0;

  return (
    <div className="bg-slate-900 p-6 md:p-8 rounded-3xl md:rounded-[3rem] shadow-2xl text-white border border-white/5 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 blur-[100px] rounded-full"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 sm:gap-0 relative z-10">
        <div>
          <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-[0.2em] mb-2">Food Impact Radar</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-white">{foodStats.servingsSaved}</p>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-tighter">Meals Saved</p>
          </div>
        </div>
        <div className="bg-amber-400 text-slate-900 p-4 rounded-[1.5rem] shadow-lg shadow-amber-400/20">
          <FaUtensils size={22} />
        </div>
      </div>

      {/* Impact Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
        <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Delivered
          </p>
          <p className="text-2xl font-black text-white">{foodStats.delivered}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-1">Closed Missions</p>
        </div>
        <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Active
          </p>
          <p className="text-2xl font-black text-white">{foodStats.active + foodStats.available}</p>
          <p className="text-[10px] text-slate-400 font-medium mt-1">In Pipeline</p>
        </div>
      </div>

      {/* Progress & Efficiency */}
      <div className="space-y-4 relative z-10">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2 sm:gap-0">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Rescue Efficiency</span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <FaHeartbeat size={10} /> Community Optimized
            </span>
          </div>
          <span className="text-3xl font-black text-amber-400">{successRate}<span className="text-sm font-light text-slate-500">%</span></span>
        </div>

        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
            style={{ width: `${successRate}%` }}
          ></div>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
            <FaHistory /> Total Reach: {foodStats.total}
          </p>
          <div className="px-3 py-1 bg-emerald-500/10 rounded-lg">
            <p className="text-[8px] font-black text-emerald-500 uppercase italic">Live Sync</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodAnalysis;