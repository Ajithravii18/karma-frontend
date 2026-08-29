import React, { useState, useEffect } from "react";
import {
  FaCheckCircle, FaHistory, FaCalendarCheck, FaLeaf, FaTrashAlt,
  FaArrowLeft, FaFileDownload, FaSearch, FaChartLine, FaCircle,
  FaUtensils, FaExclamationTriangle, FaColumns, FaUserShield, FaStar,
  FaSync, FaMapMarkerAlt
} from "react-icons/fa";
import api from "../utils/api";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Nav from "../Components/Nav";
import logo from "../assets/logo.png";

const VolunteerHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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

  const getAvailableMonths = () => {
    const months = history.map(item => {
      const date = new Date(item.completedAt || item.deliveredAt || item.createdAt);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    });
    return ["All", ...new Set(months)];
  };

  const filteredHistory = history.filter(h => {
    const q = searchTerm.toLowerCase();
    const date = new Date(h.completedAt || h.deliveredAt || h.createdAt);
    const itemMonth = date.toLocaleString('default', { month: 'long', year: 'numeric' });

    const matchesSearch = (
      (h.wasteType || "").toLowerCase().includes(q) ||
      (h.placeName || "").toLowerCase().includes(q) ||
      (h.pollutionType || "").toLowerCase().includes(q) ||
      (h.address || "").toLowerCase().includes(q) ||
      (String(h._id || "")).toLowerCase().includes(q)
    );

    const matchesMonth = selectedMonth === "All" || itemMonth === selectedMonth;

    return matchesSearch && matchesMonth;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMonth]);

  const handleDownload = () => {
    if (filteredHistory.length === 0) {
      toast.error("No records to export");
      return;
    }

    const headers = ["ID", "Category", "Title", "Completion Date", "Location", "Impact Summary", "Status"];
    const rows = filteredHistory.map(item => [
      String(item._id).slice(-6),
      item.placeName ? "Food Rescue" : item.pollutionType ? "Pollution Hazard" : "Waste Recovery",
      item.placeName || item.pollutionType || item.wasteType || "Mission",
      new Date(item.completedAt || item.deliveredAt || item.createdAt).toLocaleDateString(),
      (item.address || item.placeName || "Location Not Recorded").replace(/,/g, " "),
      item.placeName ? `${item.quantity || 0} Servings` : item.pollutionType ? "Resolved & Verified" : `${item.weight || 0} KG Collected`,
      "Completed"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Volunteer_Service_Log_${selectedMonth === "All" ? "All_Time" : selectedMonth.replace(/ /g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Report downloaded successfully!");
  };

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = currentPage * itemsPerPage;
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

  // Compute overall metric totals
  const totalFoodServings = history.reduce((acc, h) => acc + (parseInt(h.quantity) || 0), 0);
  const totalWasteKg = history.reduce((acc, h) => acc + (parseFloat(h.weight) || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-emerald-600"></div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Loading Service Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Nav />

      {/* ── SaaS SIDEBAR ── */}
      <div className="flex pt-[68px] min-h-screen w-full">
        <aside className="hidden lg:flex w-64 bg-slate-900 flex-col fixed top-0 left-0 h-screen overflow-y-auto no-scrollbar hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden z-[150] border-r border-slate-800">
          {/* Logo Section */}
          <div className="h-[68px] flex items-center gap-2.5 px-6 border-b border-slate-800/80 bg-slate-950/40 cursor-pointer shrink-0" onClick={() => navigate("/")}>
            <img src={logo} className="w-8" alt="E-Karma Logo" />
            <span className="text-base font-black tracking-tighter uppercase text-white">E-Karma</span>
            <span className="ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Volunteer</span>
          </div>

          <nav className="flex flex-col gap-1 p-4 flex-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Missions</p>
            <button
              onClick={() => navigate("/volunteer-portal")}
              className="group flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm text-slate-400 hover:bg-slate-800/70 hover:text-white border border-transparent"
            >
              <div className="p-2 rounded-lg transition-colors duration-200 flex items-center justify-center w-8 h-8 bg-slate-800/80 text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-400">
                <FaColumns size={14} />
              </div>
              All Missions
            </button>
            
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-6">History</p>
            <button
              className="group flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs"
            >
              <div className="p-2 rounded-lg transition-colors duration-200 flex items-center justify-center w-8 h-8 bg-emerald-500/20 text-emerald-400">
                <FaCheckCircle size={14} />
              </div>
              Completed Log
            </button>

            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-6">Account</p>
            <button
              onClick={() => navigate("/volunteer-portal")}
              className="group flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm text-slate-400 hover:bg-slate-800/70 hover:text-white border border-transparent"
            >
              <div className="p-2 rounded-lg transition-colors duration-200 flex items-center justify-center w-8 h-8 bg-slate-800/80 text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400">
                <FaUserShield size={14} />
              </div>
              Profile & Security
            </button>
          </nav>

          <div className="p-4 border-t border-slate-800/80">
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lifetime Impact</p>
              <p className="text-xl font-black text-white">{history.length} <span className="text-xs font-semibold text-slate-400">Missions</span></p>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 lg:ml-64 w-full p-4 sm:p-6 lg:p-8 min-w-0 pb-36 sm:pb-32 lg:pb-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <button
                  onClick={() => navigate("/volunteer-portal")}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg flex items-center gap-1.5 hover:bg-slate-100 transition-all text-xs font-bold shadow-xs"
                >
                  <FaArrowLeft size={10} /> Back to Portal
                </button>
                <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1">
                  <FaCircle size={6} className="text-emerald-500 animate-pulse" /> Verified Log
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Service <span className="text-emerald-600">Records</span></h1>
              <p className="text-xs font-semibold text-slate-500 mt-1">Audit log of all completed tasks, food deliveries, and environmental clearances.</p>
            </div>

            {/* Quick KPI Stat Cards */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-xs">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Completed</p>
                <p className="text-base font-black text-slate-800">{history.length}</p>
              </div>
              {totalFoodServings > 0 && (
                <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-xs">
                  <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Food Saved</p>
                  <p className="text-base font-black text-amber-700">{totalFoodServings} ppl</p>
                </div>
              )}
              {totalWasteKg > 0 && (
                <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-xs">
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Waste Cleared</p>
                  <p className="text-base font-black text-emerald-700">{totalWasteKg.toFixed(1)} KG</p>
                </div>
              )}
            </div>
          </div>

          {/* Search, Month Filter & Export CSV Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs mb-6">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by mission ID, category, or location..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[170px] flex-1 sm:flex-none">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
                >
                  {getAvailableMonths().map(m => (
                    <option key={m} value={m}>{m === "All" ? "📅 All Time Records" : `📅 ${m}`}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <FaCalendarCheck size={12} />
                </div>
              </div>

              <button
                onClick={handleDownload}
                className="bg-slate-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all shrink-0"
              >
                <FaFileDownload size={12} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 border-b border-slate-200/80">
                  <tr>
                    <th className="py-3.5 px-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Mission Node</th>
                    <th className="py-3.5 px-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Operation Type</th>
                    <th className="py-3.5 px-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Location</th>
                    <th className="py-3.5 px-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Impact Result</th>
                    <th className="py-3.5 px-5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center">Completed At</th>
                    <th className="py-3.5 px-5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentItems.length > 0 ? (
                    currentItems.map((item) => {
                      const isFood = Boolean(item.placeName || item.type === 'food' || item.quantity);
                      const isPollution = Boolean(item.pollutionType || item.type === 'pollution');

                      const cfg = isFood
                        ? { icon: <FaUtensils />, color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200', label: 'Food Rescue' }
                        : isPollution
                          ? { icon: <FaExclamationTriangle />, color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200', label: 'Pollution Cleanup' }
                          : { icon: <FaTrashAlt />, color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', label: 'Waste Collection' };

                      const impact = isFood
                        ? `${item.quantity || 0} Servings Saved`
                        : isPollution
                          ? `Hazard Verified Safe`
                          : `${item.weight || 0} KG Collected`;

                      const completedDate = new Date(item.completedAt || item.deliveredAt || item.createdAt);

                      return (
                        <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-mono text-[10px] font-bold border border-slate-200">
                                #{String(item._id).slice(-6)}
                              </span>
                              <span className="text-xs font-bold text-slate-900 truncate max-w-[160px]">
                                {item.placeName || item.pollutionType || item.wasteType || "Mission"}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                              {cfg.icon} {cfg.label}
                            </span>
                          </td>
                          <td className="py-4 px-5">
                            <p className="text-xs font-medium text-slate-600 max-w-[200px] truncate flex items-center gap-1">
                              <FaMapMarkerAlt size={10} className="text-slate-400 shrink-0" />
                              {item.address || item.placeName || "Location on record"}
                            </p>
                          </td>
                          <td className="py-4 px-5">
                            <span className="text-xs font-bold text-slate-800">
                              {impact}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-center">
                            <p className="text-xs font-bold text-slate-700">{completedDate.toLocaleDateString()}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{completedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="py-4 px-5 text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase">
                              <FaCheckCircle size={10} className="text-emerald-600" /> Resolved
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-16 text-center text-slate-400">
                        <FaHistory size={24} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-bold uppercase tracking-wider">No Matching Records Found</p>
                        <p className="text-[11px] text-slate-400 mt-1">Try clearing your search query or selecting a different month.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Desktop Table Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50/80 border-t border-slate-200/80">
                <p className="text-xs font-medium text-slate-500">
                  Showing <span className="font-bold text-slate-800">{indexOfFirstItem + 1}</span> to{" "}
                  <span className="font-bold text-slate-800">{Math.min(indexOfLastItem, filteredHistory.length)}</span> of{" "}
                  <span className="font-bold text-slate-800">{filteredHistory.length}</span> records
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
                  >
                    ← Previous
                  </button>
                  <span className="text-xs font-black text-slate-600 px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden space-y-3">
            {currentItems.length > 0 ? (
              currentItems.map((item) => {
                const isFood = Boolean(item.placeName || item.type === 'food' || item.quantity);
                const isPollution = Boolean(item.pollutionType || item.type === 'pollution');

                const cfg = isFood
                  ? { icon: <FaUtensils />, color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200', label: 'Food Rescue' }
                  : isPollution
                    ? { icon: <FaExclamationTriangle />, color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200', label: 'Pollution Cleanup' }
                    : { icon: <FaTrashAlt />, color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', label: 'Waste Collection' };

                const impact = isFood
                  ? `${item.quantity || 0} Servings Saved`
                  : isPollution
                    ? `Hazard Verified Safe`
                    : `${item.weight || 0} KG Collected`;

                const completedDate = new Date(item.completedAt || item.deliveredAt || item.createdAt);

                return (
                  <div key={item._id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-start justify-between">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <span className="font-mono text-[10px] font-bold text-slate-400">
                        #{String(item._id).slice(-6)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {item.placeName || item.pollutionType || item.wasteType || "Mission"}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
                        <FaMapMarkerAlt size={10} className="text-slate-400 shrink-0" />
                        {item.address || item.placeName || "Location on record"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Completed</p>
                        <p className="text-xs font-bold text-slate-700">{completedDate.toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Impact</p>
                        <p className="text-xs font-bold text-emerald-700">{impact}</p>
                      </div>
                    </div>

                    <div className="pt-1">
                      <div className="flex items-center justify-center gap-1.5 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200">
                        <FaCheckCircle size={11} className="text-emerald-600" /> Mission Complete
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <p className="text-xs font-bold uppercase">No Matching History</p>
              </div>
            )}

            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl mt-4">
                <p className="text-xs font-medium text-slate-500">
                  Showing <span className="font-bold text-slate-800">{indexOfFirstItem + 1}</span> to{" "}
                  <span className="font-bold text-slate-800">{Math.min(indexOfLastItem, filteredHistory.length)}</span> of{" "}
                  <span className="font-bold text-slate-800">{filteredHistory.length}</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 shadow-sm transition-all"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs font-black text-slate-600 px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 shadow-sm transition-all"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 📱 MOBILE BOTTOM NAV 📱 */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 flex shadow-lg">
        <button onClick={() => navigate("/volunteer-portal")} className="flex-1 py-3 flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-widest transition-all text-slate-400">
          <FaColumns size={15} />
          Missions
        </button>
        <button className="flex-1 py-3 flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-widest transition-all text-emerald-600">
          <FaCheckCircle size={15} />
          Log
        </button>
        <button onClick={() => navigate("/volunteer-portal")} className="flex-1 py-3 flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-widest transition-all text-slate-400">
          <FaUserShield size={15} />
          Profile
        </button>
      </div>
    </div>
  );
};

export default VolunteerHistory;

