import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../utils/api"
import {
  FaArrowLeft, FaChartLine, FaDollarSign, FaCalendarAlt,
  FaFileInvoiceDollar, FaArrowUp, FaBriefcase
} from "react-icons/fa";
import Nav from "../../Components/Nav";
import MonthlyRevenue from "../Admin/MonthlyRevenue";
import AdminSidebar from "../Admin/AdminSidebar";

const RevenueAnalysisPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  const [reports, setReports] = useState(location.state?.reports || []);
  const [loading, setLoading] = useState(!location.state?.reports);

  useEffect(() => {
    if (reports.length === 0) {
      const token = localStorage.getItem("authToken");
    api.get("/api/admin/all-reports", {
  headers: { Authorization: `Bearer ${token}` }
}).then(res => {
        setReports(res.data || []);
      }).catch(() => { }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [reports.length]);

  const analysisData = useMemo(() => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return months.map((month, index) => {
      const monthlyReports = reports.filter(r => {
        const d = new Date(r.createdAt);
        return d.getMonth() === index && d.getFullYear() === currentYear;
      });

      const total = monthlyReports.reduce((sum, r) => {
        const val = r.paidAmount || r.amount || r.totalCost || r.price || 0;
        return sum + Number(val);
      }, 0);

      return {
        month,
        total,
        caseCount: monthlyReports.length // Total count of cases per month
      };
    });
  }, [reports, currentYear]);

  const totalAnnualRevenue = useMemo(() =>
    analysisData.reduce((sum, m) => sum + m.total, 0),
    [analysisData]);

  const averageMonthly = totalAnnualRevenue / 12;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex">
      <AdminSidebar />
      <div className="flex-1 ml-72 pb-20">
        <Nav />
        <div className="max-w-[1200px] mx-auto pt-32 px-8">

        {/* --- NAVIGATION --- */}
        <div className="flex items-center justify-between mb-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-sm">
              <FaArrowLeft size={14} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Return to Base</p>
              <h4 className="text-xs font-black uppercase text-slate-700">Command Dashboard</h4>
            </div>
          </button>
          <div className="px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              {loading ? "Syncing Data..." : `Live System Audit: ${reports.length} Reports Found`}
            </span>
          </div>
        </div>

        {/* --- TOP METRICS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <FaDollarSign size={80} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Revenue ({currentYear})</p>
            <h2 className="text-4xl font-black text-slate-900">₹{totalAnnualRevenue.toLocaleString()}</h2>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Case Avg. Value</p>
            <h2 className="text-4xl font-black text-slate-900">
              ₹{reports.length > 0 ? (totalAnnualRevenue / reports.length).toFixed(0) : 0}
            </h2>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Yearly Total Cases</p>
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-black text-slate-900">{reports.length}</h2>
              <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-1 rounded">CASES</span>
            </div>
          </div>
        </div>

        {/* --- AUDIT LEDGER TABLE --- */}
        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Monthly Performance Matrix</h3>
            <span className="text-[10px] font-bold text-slate-400 italic">Fiscal Year {currentYear}</span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white">
                <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Month</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Case Volume</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Revenue</th>
                <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {analysisData.map((data, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                        <FaCalendarAlt size={14} />
                      </div>
                      <span className="text-sm font-black text-slate-700 uppercase">{data.month}</span>
                    </div>
                  </td>

                  {/* --- CASE VOLUME COLUMN --- */}
                  <td className="px-10 py-8">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm font-black text-slate-800">{data.caseCount}</span>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-1000"
                          style={{ width: `${Math.min((data.caseCount / 20) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  <td className="px-10 py-8">
                    <span className={`text-base font-black ${data.total > 0 ? 'text-slate-900' : 'text-slate-300'}`}>
                      ₹{data.total.toLocaleString()}
                    </span>
                  </td>

                  <td className="px-10 py-8 text-right">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${data.caseCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-300'
                      }`}>
                      {data.caseCount > 0 ? 'Active' : 'Dormant'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalysisPage;