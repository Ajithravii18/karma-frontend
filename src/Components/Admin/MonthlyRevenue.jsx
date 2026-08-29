// src/Components/Admin/MonthlyRevenue.jsx
import React from 'react';
import { FaChartLine } from "react-icons/fa";

const MonthlyRevenue = ({ reports }) => {
  const monthlyData = Object.entries(reports.reduce((acc, report) => {
    const val = Number(report.paidAmount || report.amount || report.totalCost || report.price || 0);
    const month = new Date(report.createdAt).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + val;
    return acc;
  }, {})).sort((a, b) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.indexOf(a[0]) - months.indexOf(b[0]);
  });

  const maxVal = Math.max(...monthlyData.map(d => d[1]), 100);
  const totalRevenue = monthlyData.reduce((sum, [, val]) => sum + val, 0);

  return (
    <div className="h-full flex flex-col justify-between min-w-0">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            System Revenue
          </span>
          <p className="text-2xl font-black text-slate-900 mt-0.5">
            ₹{totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 flex items-center justify-center text-sm shrink-0">
          <FaChartLine />
        </div>
      </div>

      {/* The Scroll Container */}
      <div className="flex-grow overflow-x-auto no-scrollbar select-none cursor-grab py-2">
        <div className="flex items-end h-28 pb-1 min-w-max gap-1">
          {monthlyData.map(([month, value]) => {
            const heightPercent = value > 0 ? (value / maxVal) * 100 : 0;

            return (
              <div 
                key={month} 
                className="flex-shrink-0 w-11 flex flex-col items-center gap-1.5"
              >
                <span className="text-[8px] font-bold text-slate-400">
                  {value > 0 ? `₹${value > 999 ? (value/1000).toFixed(1) + 'k' : value}` : '—'}
                </span>
                
                <div className="relative w-5 h-full flex items-end bg-slate-50 rounded-t-md p-0.5">
                  <div
                    className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-t transition-all duration-500"
                    style={{ height: `${Math.max(heightPercent, value > 0 ? 12 : 4)}%` }}
                  ></div>
                </div>
                
                <span className="text-[9px] font-black text-slate-500 uppercase">
                  {month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2 text-[11px] font-medium text-slate-500">
        <span className="text-emerald-600 font-bold">● Active Gateway</span> • Direct user settlements
      </div>
    </div>
  );
};

export default MonthlyRevenue;
