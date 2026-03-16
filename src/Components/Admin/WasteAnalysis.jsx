import React from 'react';
import { FaRecycle, FaWeightHanging, FaChartPie } from "react-icons/fa";

const WasteAnalysis = ({ reports }) => {
  // 🔥 Advanced Data Processing
  const stats = reports.reduce((acc, r) => {
    if (r.type === 'pickup') {
      const type = r.wasteType || "General";
      const weight = parseFloat(r.weight) || 0;
      
      acc.totalWeight += weight;
      acc.breakdown[type] = (acc.breakdown[type] || 0) + weight;
      acc.count += 1;
    }
    return acc;
  }, { totalWeight: 0, breakdown: {}, count: 0 });

  // Calculate the max weight to scale the bars relative to each other
  const maxWeight = Math.max(...Object.values(stats.breakdown), 10);

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl md:rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden relative">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 sm:gap-0">
        <div>
          <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2">Collection Volume</h3>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-black text-slate-900">{stats.totalWeight.toFixed(1)}</p>
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Total KG</p>
          </div>
        </div>
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-[1.5rem] shadow-sm">
          <FaRecycle size={22} className="animate-spin-slow" />
        </div>
      </div>

      {/* Waste Category Bars */}
      <div className="space-y-6">
        {Object.entries(stats.breakdown).length > 0 ? (
          Object.entries(stats.breakdown).map(([type, weight]) => {
            const percentage = (weight / maxWeight) * 100;
            return (
              <div key={type} className="group">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400 group-hover:text-indigo-600 transition-colors">
                      {type}
                    </span>
                    <span className="text-[9px] text-slate-300 font-bold italic">
                      {((weight / stats.totalWeight) * 100).toFixed(0)}% of total
                    </span>
                  </div>
                  <span className="text-sm font-black text-slate-800 tracking-tighter">
                    {weight} <span className="text-[10px] text-slate-400">KG</span>
                  </span>
                </div>
                
                {/* Advanced Progress Bar */}
                <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
            <p className="text-[10px] font-black uppercase text-slate-300 italic">No Waste Data Logged</p>
          </div>
        )}
      </div>

      {/* Bottom Footer Stats */}
      <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <FaWeightHanging size={12} className="text-indigo-400" />
          Avg: {(stats.totalWeight / (stats.count || 1)).toFixed(1)} KG/Pick
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
          <FaChartPie size={12} className="text-emerald-400" />
          {stats.count} Jobs
        </div>
      </div>
    </div>
  );
};

export default WasteAnalysis;