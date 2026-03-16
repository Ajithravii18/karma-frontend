import React, { useState, useEffect } from "react";
import {
  FaCheckCircle, FaHistory, FaCalendarCheck, FaLeaf, FaTrashAlt,
  FaArrowLeft, FaFileDownload, FaSearch, FaChartLine
} from "react-icons/fa";
import api from "../utils/api";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Nav from "../Components/Nav";

const VolunteerHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const token = localStorage.getItem("authToken") || localStorage.getItem("token");

  // Get current volunteer ID
  let currentVolunteerId = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      currentVolunteerId = String(decoded.userID || decoded.id || decoded._id || decoded.userId);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/api/volunteer/tasks", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const allTasks = Array.isArray(res.data) ? res.data : (res.data.tasks || []);

        // Filter specifically for tasks completed by THIS volunteer
        const completedByMe = allTasks.filter(task =>
          String(task.assignedVolunteer) === currentVolunteerId &&
          ["completed", "resolved", "delivered", "success"].includes(task.status?.toLowerCase())
        );

        setHistory(completedByMe);
      } catch (err) {
        console.error("History Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token, currentVolunteerId]);

  const filteredHistory = history.filter(h => {
    const q = searchTerm.toLowerCase();
    return (
      (h.wasteType || "").toLowerCase().includes(q) ||
      (h.placeName || "").toLowerCase().includes(q) ||
      (h.pollutionType || "").toLowerCase().includes(q) ||
      (h.address || "").toLowerCase().includes(q)
    );
  });

  const handleDownload = () => {
    if (filteredHistory.length === 0) {
      toast.error("No records to export");
      return;
    }

    const headers = ["ID", "Type", "Title/Category", "Completion Date", "Location", "Impact Detail"];
    const rows = filteredHistory.map(item => [
      String(item._id).slice(-6),
      item.type || "Waste",
      item.placeName || item.pollutionType || item.wasteType || "Mission",
      new Date(item.completedAt || item.deliveredAt || item.createdAt).toLocaleDateString(),
      (item.address || item.placeName || "Not Recorded").replace(/,/g, " "),
      item.type === 'food' ? `${item.quantity} Servings` : item.type === 'pollution' ? "Verified Safe" : `${item.weight || "—"} KG`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Volunteer_History_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-emerald-500 shadow-xl"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Decrypting Archive...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      <Nav />
      <div className="max-w-[1400px] mx-auto pt-32 px-8">

        {/* --- DYNAMIC HEADER --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 border-b border-slate-200 pb-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/volunteer-portal")}
                className="px-3 py-1 bg-slate-900 text-white rounded-full flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-slate-900/20"
              >
                <FaArrowLeft size={10} />
                <span className="text-[9px] font-black uppercase tracking-widest">Control</span>
              </button>
              <div className="px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-2">
                <FaCircle size={6} className="text-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Impact Ledger</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 flex items-center gap-4 mt-4 uppercase">
              SERVICE <span className="text-slate-400 font-thin italic">RECORDS</span>
            </h1>
          </div>

          {/* Stats & Tools */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="bg-white border border-slate-200 px-8 py-4 rounded-[2rem] flex items-center gap-6 shadow-sm">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifetime Tasks</p>
                   <p className="text-3xl font-black text-slate-900">{history.length}</p>
                </div>
                <div className="w-px h-8 bg-slate-100"></div>
                <div>
                   <FaChartLine className="text-emerald-500 text-2xl" />
                </div>
            </div>
            
            <button 
              onClick={handleDownload}
              className="w-full sm:w-auto bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black text-[11px] uppercase flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
            >
              <FaFileDownload size={14} /> Export Report
            </button>
          </div>
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="relative mb-10">
          <FaSearch className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="FILTER MISSIONS BY TYPE, LOCATION, OR CATEGORY..."
            className="w-full pl-16 pr-8 py-6 bg-white border border-slate-200 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] outline-none focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>

        {/* --- EXCEL-LIKE ANALYTICAL TABLE --- */}
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-300/20 border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-10 py-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Identity Node</th>
                  <th className="px-10 py-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Operation Type</th>
                  <th className="px-10 py-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Timestamp</th>
                  <th className="px-10 py-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Location / Area</th>
                  <th className="px-10 py-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Impact Matrix</th>
                  <th className="px-10 py-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] text-center">Protocol Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => {
                    const cfg = item.type === 'food'
                      ? { icon: <FaLeaf />, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Food Redistribution' }
                      : item.type === 'pollution'
                        ? { icon: <FaCheckCircle />, color: 'text-rose-600', bg: 'bg-rose-100', label: 'Enviro-Cleanup' }
                        : { icon: <FaTrashAlt />, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Resource Recovery' };

                    const impact = item.type === 'food'
                      ? `${item.quantity} Servings Saved`
                      : item.type === 'pollution'
                        ? `Site Verified Safe`
                        : `${item.weight || "0"} KG Collected`;

                    return (
                      <tr key={item._id} className="group hover:bg-slate-50 transition-all duration-300">
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="px-3 py-1 bg-slate-100 rounded-lg font-mono text-[10px] font-black text-slate-400">
                              #{String(item._id).slice(-6)}
                            </div>
                            <span className="text-sm font-black text-slate-800 uppercase truncate max-w-[150px]">
                              {item.placeName || item.pollutionType || item.wasteType || "MISSION"}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 transition-all ${item.type === 'food' ? 'bg-amber-50 border-amber-100 text-amber-700' : item.type === 'pollution' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest">{cfg.label}</span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-700">
                                {new Date(item.completedAt || item.deliveredAt || item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                                {new Date(item.completedAt || item.deliveredAt || item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                           <p className="text-xs font-bold text-slate-400 max-w-[200px] truncate">
                             {item.address || item.placeName || "Sector X-09"}
                           </p>
                        </td>
                        <td className="px-10 py-8">
                            <div className="flex items-center gap-3">
                                <div className={`${cfg.bg} ${cfg.color} p-2 rounded-lg text-xs`}>
                                    {cfg.icon}
                                </div>
                                <span className="text-sm font-black text-slate-700">{impact}</span>
                            </div>
                        </td>
                        <td className="px-10 py-8">
                          <div className="flex justify-center">
                            <div className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                                <FaCheckCircle size={10} /> Resolved
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-32 text-center bg-slate-50/50">
                      <FaChartLine className="mx-auto text-slate-200 mb-4" size={40} />
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Archive Cluster Empty</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerHistory;