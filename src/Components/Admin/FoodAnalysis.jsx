import React from 'react';
import { FaUtensils, FaHeartbeat } from "react-icons/fa";

const FoodAnalysis = ({ reports }) => {
  const foodStats = reports.reduce((acc, r) => {
    if (r.type === 'food') {
      acc.total += 1;
      const status = (r.status || "Available").toLowerCase();
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

  const successRate = foodStats.total > 0
    ? Math.round((foodStats.delivered / foodStats.total) * 100)
    : 0;

  return (
    <div className="h-full flex flex-col justify-between min-w-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Food Impact Radar
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <p className="text-2xl font-black text-slate-900">{foodStats.servingsSaved}</p>
            <span className="text-xs font-bold text-amber-600 uppercase">Meals Rescued</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center text-sm shrink-0">
          <FaUtensils />
        </div>
      </div>

      {/* Impact Metric Row */}
      <div className="grid grid-cols-2 gap-2.5 py-1 flex-grow">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase">Delivered</p>
          <p className="text-base font-black text-slate-800 mt-0.5">{foodStats.delivered}</p>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <p className="text-[9px] font-bold text-slate-400 uppercase">In Pipeline</p>
          <p className="text-base font-black text-amber-600 mt-0.5">{foodStats.active + foodStats.available}</p>
        </div>
      </div>

      {/* Progress & Efficiency */}
      <div className="space-y-1.5 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
            <FaHeartbeat className="text-emerald-500" size={10} /> Rescue Success
          </span>
          <span className="text-xs font-black text-amber-600">{successRate}%</span>
        </div>

        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(successRate, 5)}%` }}
          ></div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500">
          <span>Total Logged: {foodStats.total}</span>
          <span className="text-emerald-600 font-bold">● Zero Waste</span>
        </div>
      </div>
    </div>
  );
};

export default FoodAnalysis;