// src/Components/Admin/MonthlyRevenue.jsx
import React from 'react';

const MonthlyRevenue = ({ reports }) => {
  // Logic to group your data by Month
  const monthlyData = Object.entries(reports.reduce((acc, report) => {
    // Only count as revenue if there is an actual payment amount
    const val = Number(report.paidAmount || report.amount || report.totalCost || report.price || 0);
    const month = new Date(report.createdAt).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + val;
    return acc;
  }, {})).sort((a, b) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return months.indexOf(a[0]) - months.indexOf(b[0]);
  });

  return (
    <div className="bg-white p-5 md:p-6 rounded-3xl md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transform h-full flex flex-col">
      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Monthly Revenue</h3>
      <div className="overflow-x-auto pb-4 flex-grow hide-scrollbar">
        <div className="flex items-end gap-2 md:gap-3 h-32 min-w-[300px]">
          {monthlyData.map(([month, value]) => {
          // calculate dynamic height properly
          const maxVal = Math.max(...monthlyData.map(d => d[1]), 100);
          const heightPercent = value > 0 ? (value / maxVal) * 100 : 0;

          return (
            <div key={month} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[9px] font-black text-slate-500 uppercase">{value > 0 ? `₹${value}` : ''}</span>
              <div
                className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-xl transition-all duration-1000"
                style={{ height: `${Math.max(heightPercent, value > 0 ? 10 : 0)}%` }}
              ></div>
              <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">{month}</span>
            </div>
          );
        })}
        </div>
      </div>
      <div className="mt-auto pt-4 border-t border-slate-50">
        <p className="text-xl font-black text-slate-800">₹{monthlyData.reduce((sum, [, val]) => sum + val, 0).toLocaleString()}</p>
        <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-1">Total System Earnings</p>
      </div>
    </div>
  );
};

export default MonthlyRevenue;