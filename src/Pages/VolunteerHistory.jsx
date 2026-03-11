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
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <Nav />
      <div className="max-w-7xl mx-auto pt-28 pb-12 px-6">

        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <button
              onClick={() => navigate("/volunteer-portal")}
              className="flex items-center gap-2 text-slate-400 hover:text-emerald-500 transition-colors text-xs font-black uppercase tracking-widest mb-4"
            >
              <FaArrowLeft /> Back to Mission Control
            </button>
            <h1 className="text-5xl font-black tracking-tight text-slate-900 flex items-center gap-4">
              Service <span className="text-emerald-500">Archive</span> <FaHistory className="text-slate-200 text-3xl" />
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white border border-slate-200 p-4 rounded-3xl shadow-sm text-center min-w-[120px]">
              <p className="text-[9px] font-black text-slate-400 uppercase">Total Lifetime Impact</p>
              <p className="text-2xl font-black text-emerald-600">{history.length}</p>
            </div>
          </div>
        </div>

        {/* Search & Export Bar */}
        <div className="bg-white p-4 rounded-[2.5rem] shadow-sm border border-slate-200 mb-8 flex flex-wrap gap-4 items-center justify-between px-8">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <FaSearch className="text-slate-300" />
            <input
              type="text"
              placeholder="SEARCH MISSIONS..."
              className="bg-transparent border-none outline-none text-[11px] font-black uppercase w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-slate-800 transition-all">
            <FaFileDownload /> Download Report
          </button>
        </div>

        {/* History Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredHistory.length > 0 ? filteredHistory.map((item) => {

            // --- Determine styling based on type ---
            const cfg = item.type === 'food'
              ? { icon: <FaLeaf />, bg: 'bg-amber-100 text-amber-600', ring: 'group-hover:ring-amber-200', title: item.placeName || "Food Rescue", badge: "Food Redistribution" }
              : item.type === 'pollution'
                ? { icon: <FaCheckCircle />, bg: 'bg-rose-100 text-rose-600', ring: 'group-hover:ring-rose-200', title: item.pollutionType || "Pollution Clearing", badge: "Enviro-Cleanup" }
                : { icon: <FaTrashAlt />, bg: 'bg-emerald-100 text-emerald-600', ring: 'group-hover:ring-emerald-200', title: item.wasteType || "Waste Pickup", badge: "Resource Recovery" };

            // --- Determine specific metrics to show ---
            const spec = item.type === 'food'
              ? `${item.quantity} Servings Saved`
              : item.type === 'pollution'
                ? `Site Cleared`
                : `${item.weight || "—"} KG Collected`;

            return (
              <div key={item._id} className={`bg-white border-2 border-transparent rounded-[3rem] p-8 shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden ${cfg.ring} hover:border-slate-100`}>

                {/* Background Decor */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-slate-50 rounded-full blur-2xl group-hover:bg-slate-100 transition-all z-0"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-inner ${cfg.bg}`}>
                      {cfg.icon}
                    </div>
                    <span className="bg-slate-50 text-slate-400 text-[9px] font-black px-4 py-2 rounded-[1rem] uppercase tracking-widest border border-slate-100 shadow-sm">
                      ID: {String(item._id).slice(-6)}
                    </span>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-2xl font-black text-slate-900 mb-2 leading-tight truncate">
                      {cfg.title}
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FaCalendarCheck className="text-emerald-500" /> {new Date(item.completedAt || item.deliveredAt || item.createdAt || item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-50">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Impact</span>
                      <span className="text-[10px] font-black text-slate-700 uppercase">
                        {spec}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sector</span>
                      <span className="text-[9px] font-black bg-slate-900 text-white px-3 py-1 rounded-lg uppercase tracking-widest shadow-md">
                        {cfg.badge}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-20 text-center bg-white border border-dashed border-slate-200 rounded-[3rem]">
              <FaChartLine className="mx-auto text-slate-100 text-6xl mb-4" />
              <p className="text-slate-400 font-black uppercase text-xs">No service records found in the archive</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VolunteerHistory;