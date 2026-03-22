// src/Components/Admin/MonthlyRevenue.jsx
import React from 'react';

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

  return (
    <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm h-full flex flex-col min-w-0">
      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">
        Monthly Revenue
      </h3>

      {/* The Scroll Container */}
      <div className="flex-grow overflow-x-auto no-scrollbar select-none cursor-grab active:cursor-grabbing">
        <div className="flex items-end h-32 pb-2 min-w-max">
          {monthlyData.map(([month, value]) => {
            const heightPercent = value > 0 ? (value / maxVal) * 100 : 0;

            return (
              <div 
                key={month} 
                // flex-shrink-0 is the magic fix for mobile "squishing"
                // w-12 ensures each bar has enough room for the label
                className="flex-shrink-0 w-12 md:w-16 flex flex-col items-center gap-1.5"
              >
                <span className="text-[8px] font-black text-slate-500">
                  {value > 0 ? `₹${value > 999 ? (value/1000).toFixed(1) + 'k' : value}` : ''}
                </span>
                
                <div className="relative w-6 md:w-8 h-full flex items-end">
                  <div
                    className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-700 ease-out"
                    style={{ height: `${Math.max(heightPercent, value > 0 ? 8 : 0)}%` }}
                  ></div>
                </div>
                
                <span className="text-[9px] font-bold text-slate-400 uppercase">
                  {month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-50">
        <p className="text-xl font-black text-slate-800">
          ₹{monthlyData.reduce((sum, [, val]) => sum + val, 0).toLocaleString()}
        </p>
        <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-0.5">
          Total System Earnings
        </p>
      </div>
    </div>
  );
};

export default MonthlyRevenue;
