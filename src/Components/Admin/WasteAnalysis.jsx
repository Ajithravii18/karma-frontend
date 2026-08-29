import React from 'react';
import { FaRecycle, FaWeightHanging, FaChartPie } from "react-icons/fa";

const WasteAnalysis = ({ reports }) => {
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

  const maxWeight = Math.max(...Object.values(stats.breakdown), 10);

  return (
    <div className="h-full flex flex-col justify-between min-w-0">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Collection Volume
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <p className="text-2xl font-black text-slate-900">{stats.totalWeight.toFixed(1)}</p>
            <span className="text-xs font-bold text-emerald-600 uppercase">KG</span>
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center text-sm shrink-0">
          <FaRecycle />
        </div>
      </div>

      {/* Waste Category Bars */}
      <div className="space-y-3 py-1 flex-grow">
        {Object.entries(stats.breakdown).length > 0 ? (
          Object.entries(stats.breakdown).slice(0, 3).map(([type, weight]) => {
            const percentage = (weight / maxWeight) * 100;
            return (
              <div key={type} className="group">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="text-[11px] font-bold text-slate-700">
                    {type}
                  </span>
                  <span className="text-[11px] font-black text-slate-800">
                    {weight} <span className="text-[9px] text-slate-400">KG</span>
                  </span>
                </div>
                
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase">No Collection Data</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500">
        <span className="flex items-center gap-1">
          <FaWeightHanging size={10} className="text-slate-400" />
          Avg: {(stats.totalWeight / (stats.count || 1)).toFixed(1)} KG/Pick
        </span>
        <span className="font-bold text-slate-700">
          {stats.count} Missions
        </span>
      </div>
    </div>
  );
};

export default WasteAnalysis;