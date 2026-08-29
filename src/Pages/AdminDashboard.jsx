import React, { useState, useEffect, useCallback } from "react";
import {
  FaTrash, FaRecycle, FaExclamationTriangle, FaUtensils, FaSearch, FaSyncAlt,
  FaLock, FaUnlock, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaCircle,
  FaChartLine, FaArrowRight, FaPhoneAlt, FaCamera, FaCalendarAlt, FaClock,
  FaStickyNote, FaLayerGroup, FaExternalLinkAlt, FaDownload, FaStar,
  FaInfoCircle, FaCheckDouble, FaFlag, FaCheckCircle, FaUser, FaShieldAlt
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import Nav from "../Components/Nav";
import AdminSidebar from "../Components/Admin/AdminSidebar";

// Analytics Components
import MonthlyRevenue from "../Components/Admin/MonthlyRevenue";
import WasteAnalysis from "../Components/Admin/WasteAnalysis";
import FoodAnalysis from "../Components/Admin/FoodAnalysis";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, statusFilter, searchQuery, dateFilter]);

  const fetchAdminData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const allReports = await api.get("/api/admin/all-reports");
      setReports(allReports.data || []);
      setLastSyncTime(new Date());
    } catch (err) {
      if (!isSilent) toast.error("Satellite Sync Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(() => fetchAdminData(true), 5000); // Live feel
    return () => clearInterval(interval);
  }, [fetchAdminData]);

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { text: "No Data", color: "bg-slate-100 text-slate-500 border border-slate-200" };
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffInHours = (expiry - now) / (1000 * 60 * 60);

    if (diffInHours < 0) return { text: "Expired", color: "bg-rose-50 text-rose-700 border border-rose-200 font-black" };

    const hours = Math.floor(diffInHours);
    const mins = Math.round((diffInHours - hours) * 60);
    const timeText = hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;

    return {
      text: timeText,
      color: diffInHours < 2 ? "bg-amber-50 text-amber-700 border border-amber-200 font-bold" : "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold"
    };
  };

  const updatePollutionStatus = async (e, id, newStatus) => {
    e.stopPropagation();
    try {
      await api.patch(`/api/admin/pollution/status/${id}`, { status: newStatus });
      toast.success(`Mission moved to ${newStatus}`);
      fetchAdminData(true);
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const handleAdminReset = async (e, taskId, reportType) => {
    e.stopPropagation();
    if (!window.confirm("FORCE UNASSIGN: This will remove the assigned volunteer from this task. Proceed?")) return;
    try {
      await api.patch(`/api/admin/reset-mission/${taskId}`, { type: reportType });
      toast.success("Mission Reset Successfully");
      fetchAdminData(true);
    } catch (err) {
      toast.error("Server rejected reset");
    }
  };

  const deleteReport = async (e, id, type) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this record? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/admin/report/${type}/${id}`);
      toast.success("Record Purged");
      fetchAdminData(true);
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  const handleFreezeUser = async (e, userId) => {
    e.stopPropagation();
    if (!userId) return toast.error("User ID not available.");
    if (!window.confirm("DISCIPLINARY ACTION: Freeze this user's account immediately? They will be locked out.")) return;
    try {
      await api.patch(`/api/admin/freeze-user/${userId}`);
      toast.success("Account frozen. User locked out.");
      fetchAdminData(true);
    } catch (err) {
      toast.error("Freeze command failed");
    }
  };

  const handleUnflag = async (e, id, type) => {
    e.stopPropagation();
    if (!window.confirm("Dismiss and remove the flag from this report?")) return;
    try {
      await api.patch(`/api/admin/unflag-report/${type}/${id}`);
      toast.success("Report unflagged successfully");
      fetchAdminData(true);
    } catch (err) {
      toast.error("Unflag operation failed");
    }
  };

  const handleDismissHelp = async (e, id, type) => {
    e.stopPropagation();
    if (!window.confirm("Mark help request as resolved and dismiss alert?")) return;
    try {
      await api.post("/api/admin/dismiss-help", { id, type });
      toast.success("Help signal dismissed");
      fetchAdminData(true);
    } catch (err) {
      toast.error("Dismissal failed");
    }
  };

  const handleResolveMisconduct = async (e, reportId, type, reviewId) => {
    e.stopPropagation();
    if (!window.confirm("Resolve this misconduct report and notify the reporting party?")) return;
    try {
      await api.patch(`/api/admin/unflag-report/${type}/${reportId}`, { reviewId });
      setReports(prev => prev.map(r => {
        if (r._id !== reportId) return r;
        return {
          ...r,
          reviews: (r.reviews || []).map(rv => rv._id === reviewId ? { ...rv, isReport: false } : rv)
        };
      }));
      toast.success("Misconduct resolved and reporter notified");
    } catch (err) {
      toast.error("Resolve operation failed");
    }
  };

  const processedReports = reports
    .filter(r => {
      const matchesCategory = filter === "all" || r.type === filter;
      const currentStatus = (r.status || "pending").toLowerCase();
      const matchesStatus = statusFilter === "all" || statusFilter === "support" ||
        (statusFilter === "pending" && ["pending", "reported", "available"].includes(currentStatus)) ||
        (statusFilter === "active" && ["verified", "claimed", "arrived", "collected"].includes(currentStatus)) ||
        (statusFilter === "completed" && ["completed", "resolved", "delivered"].includes(currentStatus));
      const q = searchQuery.toLowerCase();
      const matchesSearch = (
        (r.volunteerName || "").toLowerCase().includes(q) ||
        (r.displayName || r.userName || "").toLowerCase().includes(q) ||
        (r.address || r.placeName || "").toLowerCase().includes(q) ||
        (r.wasteType || r.pollutionType || r.foodType || "").toLowerCase().includes(q)
      );
      let matchesDate = true;
      if (dateFilter) {
        const reportMonth = new Date(r.createdAt).toISOString().slice(0, 7);
        matchesDate = reportMonth === dateFilter;
      }

      const matchesSupport = statusFilter !== "support" || r.helpRequested === true;

      return matchesCategory && matchesStatus && matchesSearch && matchesDate && matchesSupport;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedReports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(processedReports.length / itemsPerPage);

  const downloadCSV = () => {
    if (processedReports.length === 0) {
      toast.error("No data to download!");
      return;
    }
    const headers = ["ID", "Type", "Status", "Date", "Location/Address", "Content", "Agent", "Payment/Amount"];
    const rows = processedReports.map(r => [
      r._id,
      r.type,
      r.status || "Pending",
      new Date(r.createdAt).toLocaleString(),
      (r.address || r.placeName || "").replace(/,/g, " "),
      (r.wasteType || r.pollutionType || r.foodType || "").replace(/,/g, " "),
      (r.volunteerName || r.assignedVolunteer || "Unassigned").replace(/,/g, " "),
      r.paidAmount || r.amount || "-"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `karma_report_${dateFilter || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sosCount = reports.filter(r => r.helpRequested).length;
  const flaggedCount = reports.filter(r => r.isFlagged || r.volFlaggedByCitizen).length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <Nav />
      <div className="flex pt-[68px] min-h-screen">
        <AdminSidebar />
        
        <main className="flex-1 lg:ml-64 w-full p-4 sm:p-6 lg:p-8 xl:p-10 space-y-8 overflow-x-hidden">
          
          {/* ── TOP HEADER BAR ── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  Live Operations Console
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-bold text-slate-400">
                  {reports.length} Total Registered Missions
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Global Operations <span className="text-emerald-600 font-bold">Feed</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                Unified live intake and mission management across Waste Pickups, Pollution Reports, and Food Rescue streams.
              </p>
            </div>

            {/* Quick Action Hub */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px]">Synced {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>

              <button
                onClick={() => fetchAdminData()}
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-sm hover:shadow transition-all"
                title="Refresh Live Data"
              >
                <FaSyncAlt size={13} className={loading ? "animate-spin text-emerald-600" : ""} />
              </button>

              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:shadow transition-all"
              >
                <FaDownload size={11} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* ── TOP 3 ANALYTICS SUMMARY CARDS (CLICKABLE) ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => navigate("/admin/revenue-analysis")}
            >
              <MonthlyRevenue reports={reports} />
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                <span>View Revenue Dashboard</span>
                <FaArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => navigate("/admin/waste-analysis")}
            >
              <WasteAnalysis reports={reports} />
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-emerald-600 uppercase tracking-wider">
                <span>View Waste Metrics</span>
                <FaArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <div
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => navigate("/admin/food-analysis")}
            >
              <FoodAnalysis reports={reports} />
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-black text-amber-600 uppercase tracking-wider">
                <span>View Food Rescue Analytics</span>
                <FaArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* ── FILTER & SEARCH TOOLBAR ── */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              
              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 w-full lg:w-auto">
                {[
                  { id: "all", label: "All Streams" },
                  { id: "pickup", label: "♻️ Waste Pickup" },
                  { id: "pollution", label: "⚠️ Pollution" },
                  { id: "food", label: "🍲 Food Rescue" }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setFilter(t.id)}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                      filter === t.id
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 w-full lg:w-auto">
                {[
                  { id: "all", label: "All Status" },
                  { id: "pending", label: "⏳ Pending" },
                  { id: "active", label: "⚡ In Progress" },
                  { id: "completed", label: "✓ Completed" },
                  { id: "support", label: "🆘 SOS Alert", count: sosCount }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStatusFilter(s.id)}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                      statusFilter === s.id
                        ? s.id === "support"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-slate-900 text-white shadow-sm"
                        : s.id === "support" && s.count > 0
                          ? "text-rose-600 font-bold bg-rose-50"
                          : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span>{s.label}</span>
                    {s.count > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                        statusFilter === s.id ? "bg-white text-rose-600" : "bg-rose-500 text-white"
                      }`}>
                        {s.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

            </div>

            {/* Sub-row: Month selector + Search input */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-[11px] font-black uppercase text-slate-400 shrink-0">Month:</span>
                <input
                  type="month"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition-all cursor-pointer"
                />
                {dateFilter && (
                  <button
                    onClick={() => setDateFilter("")}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-xs font-bold"
                    title="Clear Date Filter"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-80">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by agent, location, waste type..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── MAIN DATA TABLE ── */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-5">Mission Stream & Details</th>
                    <th className="py-4 px-5">Location & Destination</th>
                    <th className="py-4 px-5">Reporter & Assigned Agent</th>
                    <th className="py-4 px-5 text-center">Timestamp</th>
                    <th className="py-4 px-5 text-center">Status</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {currentItems.length > 0 ? (
                    currentItems.map((report) => {
                      const currentStatus = (report.status || "pending").toLowerCase();
                      const isAssigned = !!(report.assignedVolunteer || report.volunteerName);
                      const isFinished = ['completed', 'resolved', 'delivered'].includes(currentStatus);
                      const isExpanded = expandedId === report._id;
                      const hasMisconductReport = Array.isArray(report.reviews) && report.reviews.some(r => r.isReport);
                      const reporterUserId = report.userId?._id || report.user?._id || report.userId || report.user;
                      const volunteerUserId = report.assignedVolunteer?._id || report.assignedVolunteer;

                      // Service configs
                      const serviceConfig =
                        report.type === 'food'
                          ? { icon: <FaUtensils size={13} />, bg: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Food Rescue', pill: 'bg-amber-50 text-amber-800' }
                          : report.type === 'pollution'
                            ? { icon: <FaExclamationTriangle size={13} />, bg: 'bg-rose-100 text-rose-800 border-rose-200', label: 'Pollution Hazard', pill: 'bg-rose-50 text-rose-800' }
                            : { icon: <FaRecycle size={13} />, bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Waste Pickup', pill: 'bg-emerald-50 text-emerald-800' };

                      return (
                        <React.Fragment key={report._id}>
                          {/* Main Row */}
                          <tr
                            onClick={() => setExpandedId(isExpanded ? null : report._id)}
                            className={`cursor-pointer transition-colors ${
                              report.isFlagged || report.volFlaggedByCitizen
                                ? "bg-rose-50/50 hover:bg-rose-50 border-l-4 border-rose-500"
                                : report.helpRequested
                                  ? "bg-sky-50/50 hover:bg-sky-50 border-l-4 border-sky-500"
                                  : isExpanded
                                    ? "bg-slate-50 border-l-4 border-emerald-500"
                                    : "hover:bg-slate-50/80"
                            }`}
                          >
                            {/* Column 1: Stream & Title */}
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${serviceConfig.bg}`}>
                                  {serviceConfig.icon}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                      {serviceConfig.label}
                                    </span>
                                    {report.isFlagged && (
                                      <span className="text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.2 rounded uppercase animate-pulse">
                                        Flagged
                                      </span>
                                    )}
                                    {report.helpRequested && (
                                      <span className="text-[9px] font-black bg-sky-600 text-white px-1.5 py-0.2 rounded uppercase">
                                        SOS
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-bold text-slate-900 truncate max-w-[220px]">
                                    {report.type === 'food'
                                      ? report.placeName
                                      : report.type === 'pollution'
                                        ? report.pollutionType
                                        : report.wasteType || "General Recyclables"}
                                  </p>
                                  {report.type === 'food' && (
                                    <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                                      <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                                        {report.quantity} Servings
                                      </span>
                                      <span className={`px-1.5 py-0.2 rounded ${getExpiryStatus(report.expiryTime).color}`}>
                                        ⏳ {getExpiryStatus(report.expiryTime).text}
                                      </span>
                                    </div>
                                  )}
                                  {report.type === 'pickup' && report.weight > 0 && (
                                    <span className="inline-block mt-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                      ⚖️ {report.weight} KG Collected
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Column 2: Location */}
                            <td className="py-4 px-5">
                              <div className="max-w-[200px]">
                                <p className="text-xs font-medium text-slate-700 truncate flex items-center gap-1.5">
                                  <FaMapMarkerAlt className="text-slate-400 shrink-0" size={10} />
                                  <span>{report.address || report.placeName || (report.lat ? `${report.lat?.toFixed(3)}, ${report.lng?.toFixed(3)}` : "Location pinned")}</span>
                                </p>
                                {(report.lat || report.latitude) && (
                                  <a
                                    href={`https://www.google.com/maps?q=${report.lat || report.latitude},${report.lng || report.longitude}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-1 mt-0.5"
                                  >
                                    <FaExternalLinkAlt size={8} /> View Google Maps
                                  </a>
                                )}
                              </div>
                            </td>

                            {/* Column 3: Reporter & Volunteer */}
                            <td className="py-4 px-5">
                              <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase w-12">User:</span>
                                  <span className="font-bold text-slate-800 truncate max-w-[130px]">
                                    {report.displayName || report.userName || "Citizen"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-indigo-500 uppercase w-12">Agent:</span>
                                  <span className={`font-bold truncate max-w-[130px] ${isAssigned ? "text-indigo-700" : "text-slate-400 italic"}`}>
                                    {report.volunteerName || "Unassigned"}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Column 4: Timestamp */}
                            <td className="py-4 px-5 text-center">
                              <p className="text-xs font-bold text-slate-700">
                                {new Date(report.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </td>

                            {/* Column 5: Status */}
                            <td className="py-4 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                              {report.type === "pollution" && report.status === "Reported" ? (
                                <button
                                  onClick={(e) => updatePollutionStatus(e, report._id, "Verified")}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider shadow-sm transition-all"
                                >
                                  Verify Hazard
                                </button>
                              ) : (
                                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                  isFinished
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : currentStatus === "claimed" || currentStatus === "arrived" || currentStatus === "collected"
                                      ? "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}>
                                  {currentStatus}
                                </span>
                              )}
                            </td>

                            {/* Column 6: Actions */}
                            <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setExpandedId(isExpanded ? null : report._id)}
                                  className={`p-2 rounded-lg transition-all ${
                                    isExpanded ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  }`}
                                  title="Expand Dossier"
                                >
                                  {isExpanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                                </button>

                                {isAssigned && !isFinished && (
                                  <button
                                    onClick={(e) => handleAdminReset(e, report._id, report.type)}
                                    className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg border border-amber-200 transition-all"
                                    title="Force Unassign Volunteer"
                                  >
                                    <FaUnlock size={10} />
                                  </button>
                                )}

                                {report.helpRequested && (
                                  <button
                                    onClick={(e) => handleDismissHelp(e, report._id, report.type)}
                                    className="p-2 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded-lg border border-sky-200 transition-all"
                                    title="Resolve SOS Help Signal"
                                  >
                                    <FaCheckDouble size={10} />
                                  </button>
                                )}

                                {(report.isFlagged || report.volFlaggedByCitizen) && (
                                  <button
                                    onClick={(e) => handleUnflag(e, report._id, report.type)}
                                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg border border-rose-200 transition-all"
                                    title="Clear Flag"
                                  >
                                    <FaFlag size={10} />
                                  </button>
                                )}

                                <button
                                  onClick={(e) => deleteReport(e, report._id, report.type)}
                                  className="p-2 bg-slate-100 text-slate-400 hover:bg-rose-600 hover:text-white rounded-lg transition-all"
                                  title="Delete Record"
                                >
                                  <FaTrash size={10} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* ── EXPANDED DETAILS DRAWER ── */}
                          {isExpanded && (
                            <tr className="bg-slate-50/90">
                              <td colSpan="6" className="p-5 sm:p-6 border-t border-b border-slate-200/80">
                                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-6">
                                  
                                  {/* Drawer Header */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                                        Mission Dossier • ID:
                                      </span>
                                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                        {report._id}
                                      </span>
                                    </div>

                                    {/* Action Buttons inside Drawer */}
                                    <div className="flex flex-wrap items-center gap-2">
                                      {report.userId && (
                                        <button
                                          onClick={(e) => handleFreezeUser(e, reporterUserId)}
                                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg text-xs font-bold border border-rose-200 transition-all flex items-center gap-1.5"
                                        >
                                          <FaLock size={9} /> Freeze User
                                        </button>
                                      )}
                                      {(report.isFlagged || report.volFlaggedByCitizen) && (
                                        <button
                                          onClick={(e) => handleUnflag(e, report._id, report.type)}
                                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
                                        >
                                          Dismiss Flag
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Drawer Content Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    
                                    {/* Card 1: Logistics & Coordinates */}
                                    <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-2">
                                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <FaMapMarkerAlt className="text-emerald-600" /> Location Details
                                      </p>
                                      <p className="text-xs font-bold text-slate-800">
                                        {report.address || report.placeName || "No street address specified"}
                                      </p>
                                      {(report.lat || report.latitude) && (
                                        <p className="text-[11px] font-medium text-slate-500 font-mono">
                                          GPS: {(report.lat || report.latitude)?.toFixed(5)}, {(report.lng || report.longitude)?.toFixed(5)}
                                        </p>
                                      )}
                                      {report.timeSlot && (
                                        <p className="text-[11px] font-medium text-slate-600">
                                          Window: <span className="font-bold">{report.timeSlot}</span>
                                        </p>
                                      )}
                                    </div>

                                    {/* Card 2: Contact Info */}
                                    <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-2">
                                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <FaUser className="text-indigo-600" /> Stakeholder Directory
                                      </p>
                                      <div className="text-xs space-y-1">
                                        <p className="font-medium text-slate-700">
                                          <span className="font-bold text-slate-900">Reporter:</span> {report.displayName || report.userName || "Citizen"}
                                        </p>
                                        {(report.userPhone || report.userId?.phone) && (
                                          <p className="text-slate-500 flex items-center gap-1">
                                            <FaPhoneAlt size={9} /> {report.userPhone || report.userId?.phone}
                                          </p>
                                        )}
                                        <div className="pt-1 border-t border-slate-200/60">
                                          <p className="font-medium text-slate-700">
                                            <span className="font-bold text-indigo-900">Volunteer:</span> {report.volunteerName || "Unassigned"}
                                          </p>
                                          {report.volunteerPhone && (
                                            <p className="text-slate-500 flex items-center gap-1">
                                              <FaPhoneAlt size={9} /> {report.volunteerPhone}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Card 3: Notes & Instructions */}
                                    <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-2">
                                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                        <FaStickyNote className="text-amber-600" /> Operational Notes
                                      </p>
                                      <p className="text-xs font-medium text-slate-700 italic">
                                        "{report.description || report.notes || "No special instructions provided."}"
                                      </p>
                                      {report.isPaid && (
                                        <div className="pt-1">
                                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded">
                                            Payment Verified: ₹{report.paidAmount || report.amount || 0}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                  </div>

                                  {/* Evidence Photos (if any) */}
                                  {report.photos && report.photos.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-slate-100">
                                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                        <FaCamera className="text-rose-500" /> Geotagged Evidence Photos ({report.photos.length})
                                      </p>
                                      <div className="flex gap-3 flex-wrap">
                                        {report.photos.map((photo, i) => (
                                          <img
                                            key={i}
                                            src={`${import.meta.env.VITE_API_URL}/uploads/${photo}`}
                                            alt={`Evidence ${i + 1}`}
                                            className="h-24 w-24 object-cover rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:opacity-90 hover:scale-105 transition-all"
                                            onClick={() => window.open(`${import.meta.env.VITE_API_URL}/uploads/${photo}`, '_blank')}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Delivery Proof */}
                                  {report.deliveryPhoto && (
                                    <div className="space-y-2 pt-2 border-t border-slate-100">
                                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                                        <FaCheckCircle /> Volunteer Delivery Proof
                                      </p>
                                      <img
                                        src={`${import.meta.env.VITE_API_URL}/uploads/${report.deliveryPhoto}`}
                                        alt="Delivery Proof"
                                        className="h-28 w-28 object-cover rounded-xl border border-emerald-200 shadow-sm cursor-pointer hover:scale-105 transition-all"
                                        onClick={() => window.open(`${import.meta.env.VITE_API_URL}/uploads/${report.deliveryPhoto}`, '_blank')}
                                      />
                                    </div>
                                  )}

                                  {/* Feedback & Activity Logs */}
                                  {report.reviews && report.reviews.length > 0 && (
                                    <div className="space-y-3 pt-3 border-t border-slate-100">
                                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                        <FaStar className="text-amber-500" /> Mission Feedback & Audit Logs ({report.reviews.length})
                                      </p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {report.reviews.map((rev, index) => {
                                          const reporterIsVolunteer = rev.reviewerId?.role === 'volunteer';
                                          const otherPartyId = reporterIsVolunteer ? reporterUserId : volunteerUserId;
                                          return (
                                            <div
                                              key={index}
                                              className={`p-4 rounded-xl border ${
                                                rev.isReport ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"
                                              }`}
                                            >
                                              <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                  Review from {rev.reviewerId?.role === 'volunteer' ? 'Agent' : 'Citizen'} ({rev.reviewerId?.name || "Participant"})
                                                </span>
                                                <div className="flex items-center gap-1 text-amber-500">
                                                  {[1, 2, 3, 4, 5].map((s) => (
                                                    <FaStar key={s} size={9} className={rev.rating >= s ? "fill-current" : "text-slate-300"} />
                                                  ))}
                                                </div>
                                              </div>
                                              <p className="text-xs text-slate-700 italic">
                                                "{rev.comment || "No comment provided."}"
                                              </p>

                                              {rev.isReport && (
                                                <div className="mt-3 pt-3 border-t border-rose-200 space-y-2">
                                                  <p className="text-xs font-bold text-rose-900">
                                                    Issue Reported: {rev.reportReason}
                                                  </p>
                                                  <button
                                                    onClick={(e) => handleResolveMisconduct(e, report._id, report.type, rev._id)}
                                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black uppercase tracking-wider"
                                                  >
                                                    Resolve Misconduct
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-16 text-slate-400">
                        <FaLayerGroup size={24} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-bold uppercase tracking-wider">No matching records found</p>
                        <p className="text-[11px] text-slate-400 mt-1">Try resetting filters or adjusting search keywords.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50/80 border-t border-slate-200/80">
                <p className="text-xs font-medium text-slate-500">
                  Showing <span className="font-bold text-slate-800">{indexOfFirstItem + 1}</span> to{" "}
                  <span className="font-bold text-slate-800">{Math.min(indexOfLastItem, processedReports.length)}</span> of{" "}
                  <span className="font-bold text-slate-800">{processedReports.length}</span> missions
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

        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
