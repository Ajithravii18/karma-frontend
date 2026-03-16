import React, { useState, useEffect, useCallback } from "react";
import {
  FaTrash, FaRecycle, FaExclamationTriangle, FaUtensils,
  FaSearch, FaSyncAlt, FaLock, FaUnlock, FaChevronDown, FaChevronUp,
  FaMapMarkerAlt, FaCircle, FaUserCheck, FaChartLine, FaArrowRight,
  FaUsersCog, FaPhoneAlt, FaCamera, FaCalendarAlt, FaClock,
  FaLeaf, FaStickyNote, FaLayerGroup, FaExternalLinkAlt, FaDownload, FaUserTimes,
  FaStar, FaInfoCircle, FaCheckDouble, FaFlag, FaCheckCircle
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import Nav from "../Components/Nav";

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

  const fetchAdminData = useCallback(async (isSilent = false) => {
    const token = localStorage.getItem("authToken");
    try {
      if (!isSilent) setLoading(true);
      const allReports = await api.get("/api/admin/all-reports");
      setReports(allReports.data);
    } catch (err) {
      if (!isSilent) toast.error("Satellite Sync Failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
    const liveInterval = setInterval(() => fetchAdminData(true), 20000);
    return () => clearInterval(liveInterval);
  }, [fetchAdminData]);

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { text: "No Data", color: "bg-slate-100 text-slate-400" };
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffInHours = (expiry - now) / (1000 * 60 * 60);

    if (diffInHours < 0) return { text: "Expired", color: "bg-rose-500 text-white animate-pulse" };
    const hours = Math.floor(diffInHours);
    const mins = Math.round((diffInHours - hours) * 60);
    const timeText = hours > 0 ? `${hours}h ${mins}m left` : `${mins}m left`;
    return { text: timeText, color: diffInHours < 2 ? "bg-orange-500 text-white" : "bg-emerald-100 text-emerald-700" };
  };

  const updatePollutionStatus = async (e, id, newStatus) => {
    e.stopPropagation();
    const token = localStorage.getItem("authToken");
    try {
      await api.patch(`/api/admin/pollution/status/${id}`,
        { status: newStatus }
      );
      toast.success(`Mission moved to ${newStatus}`);
      fetchAdminData(true);
    } catch (err) { toast.error("Update failed"); }
  };

  const handleAdminReset = async (e, taskId, reportType) => {
    e.stopPropagation();
    if (!window.confirm("FORCE UNASSIGN: This will remove the agent. Proceed?")) return;
    const token = localStorage.getItem("authToken");
    try {
      await api.patch(`/api/admin/reset-mission/${taskId}`,
        { type: reportType }
      );
      toast.success("Mission Reset Successfully");
      fetchAdminData(true);
    } catch (err) { toast.error("Server rejected reset"); }
  };

  const deleteReport = async (e, id, type) => {
    e.stopPropagation();
    if (!window.confirm("Permanent Delete?")) return;
    const token = localStorage.getItem("authToken");
    try {
      await api.delete(`/api/admin/report/${type}/${id}`);
      toast.success("Record Purged");
      fetchAdminData(true);
    } catch (err) { toast.error("Delete failed"); }
  };

  const handleFreezeUser = async (e, userId) => {
    e.stopPropagation();
    if (!userId) return toast.error("System Node ID mismatch.");
    if (!window.confirm("=ƒºè ACCELERATED DISCIPLINARY ACTION: Freeze this user's account immediately?")) return;
    try {
      await api.patch(`/api/admin/freeze-user/${userId}`);
      toast.success("Account frozen. User locked out.");
      fetchAdminData(true);
    } catch (err) { toast.error("Freeze command failed"); }
  };

  const handleUnflag = async (e, id, type) => {
    e.stopPropagation();
    if (!window.confirm("Remove flag from this report? The flag will be dismissed as a minor issue.")) return;
    try {
      await api.patch(`/api/admin/unflag-report/${type}/${id}`);
      toast.success("Report unflagged successfully");
      fetchAdminData(true);
    } catch (err) { toast.error("Unflag operation failed"); }
  };

  const handleDismissHelp = async (e, id, type) => {
    e.stopPropagation();
    if (!window.confirm("Mark help request as resolved and dismiss alert?")) return;
    try {
      await api.post("/api/admin/dismiss-help", { id, type });
      toast.success("Help signal dismissed");
      fetchAdminData(true);
    } catch (err) { toast.error("Dismissal failed"); }
  };

  const handleResolveMisconduct = async (e, reportId, type, reviewId) => {
    e.stopPropagation();
    if (!window.confirm("Resolve this misconduct report and notify the reporting party?")) return;
    try {
      // Reuse existing unflag endpoint for notifications + clear local misconduct flag
      await api.patch(`/api/admin/unflag-report/${type}/${reportId}`, { reviewId });

      // Optimistically clear this specific misconduct in local state so row colour resets
      setReports(prev =>
        prev.map(r => {
          if (r._id !== reportId) return r;
          return {
            ...r,
            reviews: (r.reviews || []).map(rv =>
              rv._id === reviewId ? { ...rv, isReport: false } : rv
            )
          };
        })
      );

      toast.success("Misconduct resolved and reporter notified");
    } catch (err) {
      toast.error("Resolve operation failed");
    }
  };

  const processedReports = reports
    .filter(r => {
      const matchesCategory = filter === "all" || r.type === filter;
      const currentStatus = (r.status || "pending").toLowerCase();
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "pending" && ["pending", "reported", "available"].includes(currentStatus)) ||
        (statusFilter === "active" && ["verified", "claimed", "arrived", "collected"].includes(currentStatus)) ||
        (statusFilter === "completed" && ["completed", "resolved", "delivered"].includes(currentStatus));

      const q = searchQuery.toLowerCase();
      const matchesSearch = (
        (r.volunteerName || "").toLowerCase().includes(q) ||
        (r.wasteType || r.pollutionType || r.placeName || "").toLowerCase().includes(q)
      );

      let matchesDate = true;
      if (dateFilter) {
        // match YYYY-MM
        const reportMonth = new Date(r.createdAt).toISOString().slice(0, 7);
        matchesDate = reportMonth === dateFilter;
      }

      return matchesCategory && matchesStatus && matchesSearch && matchesDate;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `karma_report_${dateFilter || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      <Nav />
      <div className="max-w-[1440px] mx-auto pt-32 px-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FaCircle className="text-emerald-500 animate-pulse" size={8} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">System Overseer Mode</p>
            </div>
            <h1 className="text-6xl font-black text-slate-900 uppercase">Admin <span className="font-thin italic text-slate-400">console</span></h1>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin/users")} className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase shadow-sm hover:bg-slate-50 transition-all">
              <FaUsersCog className="text-indigo-600" /> Users
            </button>
            <button onClick={() => navigate("/admin/deletion-logs")} className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase shadow-sm hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition-all">
              <FaUserTimes className="text-rose-500" /> Archives
            </button>
            <button onClick={() => navigate("/admin/revenue-analysis")} className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase shadow-sm hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all">
              <FaChartLine className="text-indigo-500" /> Revenue
            </button>
            <button onClick={() => navigate("/admin/waste-analysis")} className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase shadow-sm hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-all">
              <FaRecycle className="text-emerald-500" /> Waste
            </button>
            <button onClick={() => navigate("/admin/food-analysis")} className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase shadow-sm hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-all">
              <FaUtensils className="text-amber-500" /> Food
            </button>
            <button onClick={() => fetchAdminData()} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all">
              <FaSyncAlt size={15} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ANALYTICS SECTION GÇö Clickable cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div
            className="bg-white p-6 rounded-[3rem] shadow-xl border border-white cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group"
            onClick={() => navigate("/admin/revenue-analysis")}
          >
            <MonthlyRevenue reports={reports} />
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              View Full Analysis <FaArrowRight size={8} />
            </p>
          </div>
          <div
            className="bg-white p-6 rounded-[3rem] shadow-xl border border-white cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group"
            onClick={() => navigate("/admin/waste-analysis")}
          >
            <WasteAnalysis reports={reports} />
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              View Full Analysis <FaArrowRight size={8} />
            </p>
          </div>
          <div
            className="bg-white p-6 rounded-[3rem] shadow-xl border border-white cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group"
            onClick={() => navigate("/admin/food-analysis")}
          >
            <FoodAnalysis reports={reports} />
            <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mt-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
              View Full Analysis <FaArrowRight size={8} />
            </p>
          </div>
        </div>

        {/* FILTERS & SEARCH */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              {["all", "pickup", "pollution", "food"].map((t) => (
                <button key={t} onClick={() => setFilter(t)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${filter === t ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"}`}>
                  {t === 'pickup' ? 'Waste' : t}
                </button>
              ))}
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              {["all", "pending", "active", "completed"].map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${statusFilter === s ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400"}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl items-center">
              <input
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-[11px] font-black uppercase text-slate-500 outline-none px-4 py-1.5 border-none w-[130px] cursor-pointer"
              />
              {dateFilter && (
                <button onClick={() => setDateFilter("")} className="px-3 py-1.5 rounded-xl text-rose-500 hover:text-white hover:bg-rose-500 transition-all">
                  <FaTrash size={10} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search records..." className="w-full pl-16 pr-8 py-4 bg-slate-50 border-none rounded-[1.2rem] text-[11px] font-bold uppercase outline-none focus:ring-2 ring-indigo-100" />
            </div>
            <button onClick={downloadCSV} className="bg-slate-900 text-white p-4 rounded-[1.2rem] hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center min-w-[50px]" title="Download CSV Report">
              <FaDownload size={14} />
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-10 text-[10px] font-black uppercase text-slate-400">Mission Content</th>
                <th className="p-10 text-[10px] font-black uppercase text-slate-400">Assigned Agent</th>
                <th className="p-10 text-[10px] font-black uppercase text-slate-400 text-center">Time</th>
                <th className="p-10 text-[10px] font-black uppercase text-slate-400 text-center">Lifecycle</th>
                <th className="p-10 text-[10px] font-black uppercase text-slate-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {processedReports.length > 0 ? processedReports.map((report) => {
                const currentStatus = (report.status || "pending").toLowerCase();
                const isAssigned = !!(report.assignedVolunteer || report.volunteerName);
                const isFinished = ['completed', 'resolved', 'delivered'].includes(currentStatus);
                const isExpanded = expandedId === report._id;
                const hasMisconductReport = Array.isArray(report.reviews) && report.reviews.some(r => r.isReport);
                const reporterUserId = report.userId?._id || report.user?._id || report.userId || report.user;
                const volunteerUserId = report.assignedVolunteer?._id || report.assignedVolunteer;

                // --- Service icon + colour ---
                const serviceConfig = report.type === 'food'
                  ? { icon: <FaUtensils />, bg: 'bg-amber-100', text: 'text-amber-600', label: 'Food Rescue', accent: 'border-amber-200 bg-amber-50' }
                  : report.type === 'pollution'
                    ? { icon: <FaExclamationTriangle />, bg: 'bg-rose-100', text: 'text-rose-600', label: 'Pollution', accent: 'border-rose-200 bg-rose-50' }
                    : { icon: <FaRecycle />, bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Waste Pickup', accent: 'border-emerald-200 bg-emerald-50' };

                return (
                  <React.Fragment key={report._id}>
                    {/* GöÇGöÇ MAIN SUMMARY ROW GöÇGöÇ */}
                    <tr
                      className={`group transition-all cursor-pointer relative ${report.isFlagged
                          ? 'bg-rose-50 shadow-[inset_4px_0_0_0_#f43f5e] z-10 scale-[1.01]'
                          : report.volFlaggedByCitizen
                            ? 'bg-amber-50 shadow-[inset_4px_0_0_0_#f59e0b]'
                            : hasMisconductReport
                              ? 'bg-amber-50/70 shadow-[inset_4px_0_0_0_#f59e0b]'
                              : isExpanded
                                ? 'bg-white z-[10]'
                                : isFinished
                                  ? 'opacity-50 grayscale-[0.2]'
                                  : 'bg-white hover:bg-slate-50'
                        } transform transition-all duration-300`}
                      onClick={() => setExpandedId(isExpanded ? null : report._id)}
                    >
                      {/* COLUMN 1: SERVICE TYPE + TITLE */}
                      <td className={`p-8 first:rounded-l-[3.5rem] transition-all ${report.isFlagged
                          ? 'bg-rose-50/30'
                          : report.volFlaggedByCitizen || hasMisconductReport
                            ? 'bg-amber-50/40'
                            : isExpanded
                              ? 'bg-indigo-50/80'
                              : ''
                        }`}>
                        <div className="flex items-center gap-4 relative">
                          {isExpanded && (
                            <div className="absolute -left-4 top-0 bottom-0 w-1 rounded-full bg-indigo-500" />
                          )}
                          {/* Alert Pulse Dot */}
                          {(report.isFlagged || report.volFlaggedByCitizen || report.helpRequested) && (
                            <div className={`absolute -top-1 -left-1 w-3 h-3 rounded-full animate-ping ${report.isFlagged ? 'bg-rose-500' : report.volFlaggedByCitizen ? 'bg-amber-500' : 'bg-sky-500'}`}></div>
                          )}

                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shrink-0 ${serviceConfig.bg} ${serviceConfig.text}`}>
                            {serviceConfig.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className={`text-[9px] font-black uppercase tracking-widest ${serviceConfig.text}`}>{serviceConfig.label}</p>
                              {report.isFlagged && <span className="text-[7px] bg-rose-600 text-white px-1.5 py-0.5 rounded-full font-black animate-pulse">SECURITY FLAG</span>}
                              {report.volFlaggedByCitizen && <span className="text-[7px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-black">USER REPORT</span>}
                              {isExpanded && <span className="text-[7px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-black">ACTIVE VIEW</span>}
                            </div>
                            <p className="text-sm font-black text-slate-800 truncate max-w-[200px]">
                              {report.type === 'food' ? report.placeName
                                : report.type === 'pollution' ? report.pollutionType
                                  : report.wasteType}
                            </p>
                            {report.type === 'food' && (
                              <div className="flex gap-1.5 mt-1">
                                <span className="bg-indigo-50 text-indigo-600 text-[8px] px-2 py-0.5 rounded font-black border border-indigo-100">{report.quantity} ppl</span>
                                <span className={`text-[8px] px-2 py-0.5 rounded font-black ${getExpiryStatus(report.expiryTime).color}`}>GÅ¦ {getExpiryStatus(report.expiryTime).text}</span>
                              </div>
                            )}
                            {report.type === 'pickup' && report.address && (
                              <p className="text-[9px] text-slate-400 mt-1 truncate max-w-[200px] flex items-center gap-1"><FaMapMarkerAlt size={8} /> {report.address}</p>
                            )}
                            {report.type === 'pollution' && report.description && (
                              <p className="text-[9px] text-slate-400 mt-1 truncate max-w-[200px]">{report.description}</p>
                            )}
                            {(report.isFlagged || report.volFlaggedByCitizen) && (
                              <div className="flex items-center gap-1.5 mt-1 bg-white/80 text-rose-600 px-2 py-0.5 rounded border border-rose-200 w-fit shadow-sm">
                                <FaExclamationTriangle size={8} className={report.isFlagged ? "animate-pulse" : ""} />
                                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                                  {report.isFlagged ? "Vol Flagged Citizen" : `Citizen Flagged Volunteer`}
                                </span>
                              </div>
                            )}
                            {report.helpRequested && (
                              <div className="flex flex-col gap-1 mt-1 bg-sky-600 text-white px-2 py-1.5 rounded border border-sky-600 animate-bounce-subtle w-fit shadow-lg">
                                <div className="flex items-center gap-1.5">
                                  <FaInfoCircle size={8} />
                                  <span className="text-[8px] font-black uppercase tracking-widest">LIVE HELP NEEDED</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* COLUMN 2: REPORTER + VOLUNTEER */}
                      <td className={`p-8 transition-colors ${isExpanded ? 'bg-indigo-50/20' : ''}`}>
                        <div className="space-y-2">
                          {/* Reporter */}
                          <div>
                            <p className="text-[8px] font-black text-slate-300 uppercase">Reporter</p>
                            <p className="text-xs font-bold text-slate-600">{report.displayName || report.userName || "GÇö"}</p>
                            {(report.userPhone || report.userId?.phone) && (
                              <p className="text-[9px] text-slate-400 flex items-center gap-1"><FaPhoneAlt size={7} /> {report.userPhone || report.userId?.phone}</p>
                            )}
                          </div>
                          {/* Volunteer */}
                          {isAssigned && (
                            <div className="border-t border-slate-50 pt-2">
                              <p className="text-[8px] font-black text-indigo-300 uppercase">Agent</p>
                              <p className="text-xs font-bold text-indigo-600">{report.volunteerName}</p>
                              {report.volunteerPhone && <p className="text-[9px] text-slate-400 flex items-center gap-1"><FaPhoneAlt size={7} /> {report.volunteerPhone}</p>}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* COLUMN 3: TIME */}
                      <td className={`p-8 text-center transition-colors ${isExpanded ? 'bg-indigo-50/20' : ''}`}>
                        <div className="text-[9px] font-black text-slate-500 uppercase">
                          {new Date(report.createdAt).toLocaleDateString()} <br />
                          <span className="text-slate-400">{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>

                      {/* COLUMN 4: STATUS */}
                      <td className={`p-8 text-center transition-colors ${isExpanded ? 'bg-indigo-50/20' : ''}`} onClick={(e) => e.stopPropagation()}>
                        {report.type === "pollution" && report.status === "Reported" ? (
                          <button onClick={(e) => updatePollutionStatus(e, report._id, "Verified")} className="bg-emerald-500 text-white px-5 py-2 rounded-xl font-black text-[9px] uppercase hover:bg-emerald-600 shadow-lg transition-all">Verify</button>
                        ) : (
                          <div className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-[9px] font-black uppercase ${isFinished ? 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                            : currentStatus === 'claimed' || currentStatus === 'arrived' || currentStatus === 'collected' ? 'bg-amber-100 text-amber-600 animate-pulse'
                              : 'bg-slate-100 text-slate-400'
                            }`}>
                            {currentStatus}
                          </div>
                        )}
                      </td>

                      {/* COLUMN 5: ACTIONS */}
                      <td className={`p-8 text-right last:rounded-r-[3rem] transition-colors ${isExpanded ? 'bg-indigo-50/20' : ''}`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : report._id)}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${isExpanded ? 'bg-indigo-600 text-white animate-bounce-subtle' : 'bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600'}`}
                            title="Expand details"
                          >
                            {isExpanded ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
                          </button>
                          {isAssigned && !isFinished && (
                            <button onClick={(e) => handleAdminReset(e, report._id, report.type)} className="w-9 h-9 flex items-center justify-center bg-amber-50 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all" title="Force Unassign">
                              <FaUnlock size={11} />
                            </button>
                          )}
                          {report.helpRequested && (
                            <button onClick={(e) => handleDismissHelp(e, report._id, report.type)} className="w-9 h-9 flex items-center justify-center bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-600 hover:text-white transition-all shadow-lg shadow-sky-100" title="Resolve Help Request">
                              <FaCheckDouble size={11} />
                            </button>
                          )}
                          {(report.isFlagged || report.volFlaggedByCitizen) && (
                            <button
                              onClick={(e) => handleUnflag(e, report._id, report.type)}
                              className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-100 border border-rose-100"
                              title="Clear/Resolve Flag"
                            >
                              <FaFlag size={11} />
                            </button>
                          )}
                          <button onClick={(e) => deleteReport(e, report._id, report.type)} className="w-9 h-9 flex items-center justify-center bg-slate-50 text-slate-300 hover:bg-rose-500 hover:text-white rounded-xl transition-all">
                            <FaTrash size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* GöÇGöÇ EXPANDED DETAIL PANEL GöÇGöÇ */}
                    {isExpanded && (
                      <tr className="bg-indigo-50/30 border-t-0 border-b-0">
                        <td colSpan="5" className="px-8 pb-6">
                          <div className={`rounded-[2rem] border p-6 ${serviceConfig.accent}`}>

                            {/* === FOOD DETAILS === */}
                            {report.type === 'food' && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white rounded-2xl p-4 shadow-sm">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><FaMapMarkerAlt size={8} /> Location</p>
                                  <p className="text-sm font-bold text-slate-800">{report.placeName}</p>
                                  {report.latitude && <p className="text-[9px] text-slate-400 mt-1">{report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}</p>}
                                </div>
                                <div className="bg-white rounded-2xl p-4 shadow-sm">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><FaUtensils size={8} /> Food Info</p>
                                  <p className="text-sm font-bold text-slate-800">{report.foodType || "GÇö"}</p>
                                  <p className="text-[9px] text-slate-500 mt-1">{report.quantity} servings</p>
                                </div>
                                <div className="bg-white rounded-2xl p-4 shadow-sm">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><FaClock size={8} /> Expiry</p>
                                  <p className="text-sm font-bold text-slate-800">{report.expiryTime ? new Date(report.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "GÇö"}</p>
                                  <p className="text-[9px] text-slate-500 mt-1">{report.expiryTime ? new Date(report.expiryTime).toLocaleDateString() : ""}</p>
                                </div>
                                <div className="bg-white rounded-2xl p-4 shadow-sm">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><FaStickyNote size={8} /> Notes</p>
                                  <p className="text-[11px] text-slate-700 leading-relaxed">{report.notes || "No additional notes."}</p>
                                </div>
                                {report.helpRequested && report.helpMessage && (
                                  <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 shadow-sm col-span-2 md:col-span-4 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center animate-pulse shrink-0">
                                      <FaInfoCircle size={14} />
                                    </div>
                                    <div>
                                      <p className="text-[8px] font-black text-sky-600 uppercase mb-1 tracking-widest">Live Help Message</p>
                                      <p className="text-sm font-bold text-sky-900 italic">"{report.helpMessage}"</p>
                                    </div>
                                  </div>
                                )}
                                {(report.isFlagged || report.volFlaggedByCitizen) && (
                                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 shadow-sm col-span-2 md:col-span-4 flex justify-between items-center">
                                    <div>
                                      <p className="text-[8px] font-black text-rose-600 uppercase mb-1 flex items-center gap-1"><FaExclamationTriangle size={8} /> INTEGRITY ALERT</p>
                                      <p className="text-sm font-black text-rose-700">
                                        {report.isFlagged ? `Flagged: ${report.flagReason || "Suspicious content"}` : `User Issue: ${report.volFlagReason || "Reported by citizen"}`}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => handleUnflag(e, report._id, report.type)}
                                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
                                      >
                                        Unflag
                                      </button>
                                      <button
                                        onClick={(e) => handleFreezeUser(e, report.userId?._id || report.user?._id || report.userId || report.user)}
                                        className="px-6 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-rose-200"
                                      >
                                        Freeze User
                                      </button>
                                    </div>
                                  </div>
                                )}


                                {report.deliveryPhoto && (
                                  <div className="col-span-2 md:col-span-4">
                                    <p className="text-[8px] font-black text-emerald-600 uppercase mb-2 flex items-center gap-1"><FaCamera size={8} /> Delivery Proof</p>
                                    <img src={report.deliveryPhoto} alt="Delivery proof" className="h-40 rounded-2xl object-cover border-4 border-emerald-100 shadow-md" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* === WASTE / PICKUP DETAILS === */}
                            {report.type === 'pickup' && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white rounded-2xl p-4 shadow-sm">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><FaMapMarkerAlt size={8} /> Address</p>
                                  <p className="text-[11px] font-bold text-slate-800 leading-snug">{report.address || "GÇö"}</p>
                                </div>
                                <div className="bg-white rounded-2xl p-4 shadow-sm">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><FaLayerGroup size={8} /> Waste Type</p>
                                  <p className="text-sm font-bold text-slate-800">{report.wasteType || "GÇö"}</p>
                                </div>
                                <div className="bg-white rounded-2xl p-4 shadow-sm">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><FaCalendarAlt size={8} /> Pickup Date</p>
                                  <p className="text-sm font-bold text-slate-800">{report.pickupDate ? new Date(report.pickupDate).toLocaleDateString() : "GÇö"}</p>
                                  <p className="text-[9px] text-slate-500 mt-1">{report.timeSlot || ""}</p>
                                </div>
                                <div className="bg-white rounded-2xl p-4 shadow-sm">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><FaStickyNote size={8} /> Description</p>
                                  <p className="text-[11px] text-slate-700">{report.description || "No description."}</p>
                                </div>
                                {report.helpRequested && report.helpMessage && (
                                  <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 shadow-sm col-span-2 md:col-span-4 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center animate-pulse shrink-0">
                                      <FaInfoCircle size={14} />
                                    </div>
                                    <div>
                                      <p className="text-[8px] font-black text-sky-600 uppercase mb-1 tracking-widest">Live Help Message</p>
                                      <p className="text-sm font-bold text-sky-900 italic">"{report.helpMessage}"</p>
                                    </div>
                                  </div>
                                )}
                                {(report.isFlagged || report.volFlaggedByCitizen) && (
                                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 shadow-sm col-span-2 md:col-span-4 flex justify-between items-center">
                                    <div>
                                      <p className="text-[8px] font-black text-rose-600 uppercase mb-1 flex items-center gap-1"><FaExclamationTriangle size={8} /> INTEGRITY ALERT</p>
                                      <p className="text-sm font-black text-rose-700">
                                        {report.isFlagged ? `Flagged: ${report.flagReason || "Suspicious content"}` : `User Issue: ${report.volFlagReason || "Reported by citizen"}`}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => handleUnflag(e, report._id, report.type)}
                                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
                                      >
                                        Unflag
                                      </button>
                                      <button
                                        onClick={(e) => handleFreezeUser(e, report.userId?._id || report.user?._id || report.userId || report.user)}
                                        className="px-6 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-rose-200"
                                      >
                                        Freeze User
                                      </button>
                                    </div>
                                  </div>
                                )}


                                {report.location && (
                                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Coordinates</p>
                                    <p className="text-[10px] font-bold text-slate-600">{report.location.lat?.toFixed(4)}, {report.location.lng?.toFixed(4)}</p>
                                    <a href={`https://www.google.com/maps?q=${report.location.lat},${report.location.lng}`} target="_blank" rel="noreferrer" className="text-[9px] text-indigo-500 font-bold flex items-center gap-1 mt-1 hover:underline"><FaExternalLinkAlt size={7} /> Open Map</a>
                                  </div>
                                )}
                                {report.isPaid && (
                                  <div className="bg-emerald-50 rounded-2xl p-4 shadow-sm border border-emerald-100">
                                    <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">Payment</p>
                                    <p className="text-sm font-black text-emerald-700">Gé¦ Paid G£à</p>
                                    <p className="text-[9px] text-slate-400 mt-1">{report.paymentId || ""}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* === POLLUTION DETAILS === */}
                            {report.type === 'pollution' && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white rounded-2xl p-4 shadow-sm">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><FaExclamationTriangle size={8} /> Type</p>
                                  <p className="text-sm font-bold text-slate-800">{report.pollutionType || "GÇö"}</p>
                                </div>
                                <div className="bg-white rounded-2xl p-4 shadow-sm col-span-2">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><FaStickyNote size={8} /> Description</p>
                                  <p className="text-[11px] text-slate-700 leading-relaxed">{report.description || "No description."}</p>
                                </div>
                                {report.helpRequested && report.helpMessage && (
                                  <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 shadow-sm col-span-2 md:col-span-4 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center animate-pulse shrink-0">
                                      <FaInfoCircle size={14} />
                                    </div>
                                    <div>
                                      <p className="text-[8px] font-black text-sky-600 uppercase mb-1 tracking-widest">Live Help Message</p>
                                      <p className="text-sm font-bold text-sky-900 italic">"{report.helpMessage}"</p>
                                    </div>
                                  </div>
                                )}
                                {(report.isFlagged || report.volFlaggedByCitizen) && (
                                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 shadow-sm col-span-2 md:col-span-4 flex justify-between items-center">
                                    <div>
                                      <p className="text-[8px] font-black text-rose-600 uppercase mb-1 flex items-center gap-1"><FaExclamationTriangle size={8} /> INTEGRITY ALERT</p>
                                      <p className="text-sm font-black text-rose-700">
                                        {report.isFlagged ? `Flagged: ${report.flagReason || "Suspicious content"}` : `User Issue: ${report.volFlagReason || "Reported by citizen"}`}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => handleUnflag(e, report._id, report.type)}
                                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
                                      >
                                        Unflag
                                      </button>
                                      <button
                                        onClick={(e) => handleFreezeUser(e, report.userId?._id || report.user?._id || report.userId || report.user)}
                                        className="px-6 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-rose-200"
                                      >
                                        Freeze User
                                      </button>
                                    </div>
                                  </div>
                                )}


                                <div className="bg-white rounded-2xl p-4 shadow-sm">
                                  <p className="text-[8px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><FaMapMarkerAlt size={8} /> Location</p>
                                  {report.location ? (
                                    <a href={`https://www.google.com/maps?q=${report.location.lat},${report.location.lng}`} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-500 font-bold flex items-center gap-1 hover:underline"><FaExternalLinkAlt size={7} /> Open Map</a>
                                  ) : <p className="text-[10px] text-slate-400">No GPS data</p>}
                                </div>
                                {report.photos && report.photos.length > 0 && (
                                  <div className="col-span-2 md:col-span-4">
                                    <p className="text-[8px] font-black text-rose-500 uppercase mb-2 flex items-center gap-1"><FaCamera size={8} /> Evidence Photos</p>
                                    <div className="flex gap-3 flex-wrap">
                                      {report.photos.map((photo, i) => (
                                        <img key={i} src={`${import.meta.env.VITE_API_URL}/uploads/${photo}`} alt={`Evidence ${i + 1}`} className="h-28 w-28 object-cover rounded-2xl border-4 border-rose-100 shadow-md cursor-pointer hover:scale-105 transition-transform" onClick={() => window.open(`${import.meta.env.VITE_API_URL}/uploads/${photo}`, '_blank')} />
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {report.type === 'food' && report.deliveryPhoto && (
                                  <div className="col-span-2 md:col-span-4">
                                    <p className="text-[8px] font-black text-green-600 uppercase mb-2 flex items-center gap-1"><FaCheckCircle size={8} /> Delivery Proof</p>
                                    <img
                                      src={`${import.meta.env.VITE_API_URL}/uploads/${report.deliveryPhoto}`}
                                      alt="Delivery Proof"
                                      className="h-28 w-28 object-cover rounded-2xl border-4 border-green-100 shadow-md cursor-pointer hover:scale-105 transition-transform"
                                      onClick={() => window.open(`${import.meta.env.VITE_API_URL}/uploads/${report.deliveryPhoto}`, '_blank')}
                                    />
                                  </div>
                                )}
                                {/* Admin Status Control */}
                                <div className="col-span-2 md:col-span-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                                  <p className="text-[8px] font-black text-slate-400 uppercase w-full">Update Status:</p>
                                  {["Reported", "Verified", "Claimed", "Resolved"].map(s => (
                                    <button key={s} onClick={(e) => updatePollutionStatus(e, report._id, s)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${report.status === s ? 'bg-rose-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-600'
                                      }`}>{s}</button>
                                  ))}
                                </div>
                              </div>
                            )}


                          </div>

                          {/* === FEEDBACK & REVIEWS SECTION === */}
                          {report.reviews && report.reviews.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
                              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest px-1 flex items-center gap-2">
                                <FaStar className="text-amber-500" /> Mission Activity Logs ({report.reviews.length})
                              </h3>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {report.reviews.map((rev, index) => {
                                  const reporterIsVolunteer = rev.reviewerId?.role === 'volunteer';
                                  const otherPartyId = reporterIsVolunteer ? reporterUserId : volunteerUserId;

                                  return (
                                    <div key={index} className={`p-6 rounded-[2rem] border transition-all ${rev.isReport ? 'bg-rose-50 border-rose-100 shadow-sm' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                                      <div className="flex justify-between items-start mb-4">
                                        <div>
                                          <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${rev.reviewerId?.role === 'volunteer' ? 'text-indigo-500' : 'text-emerald-600'}`}>
                                            Review from {rev.reviewerId?.role === 'volunteer' ? 'Agent' : 'Citizen'} ({rev.reviewerId?.name || "Participant"})
                                          </p>
                                          <div className="flex items-center gap-1 text-amber-500">
                                            {[1, 2, 3, 4, 5].map(s => (
                                              <FaStar key={s} size={10} className={rev.rating >= s ? "fill-current" : "text-slate-200"} />
                                            ))}
                                            <span className="ml-2 text-xs font-black text-slate-700">{rev.rating}/5</span>
                                          </div>
                                        </div>
                                        {rev.isReport && (
                                          <span className="bg-rose-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 shadow-sm">
                                            <FaExclamationTriangle size={7} /> Misconduct Logged
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm font-medium text-slate-700 italic border-l-2 border-slate-100 pl-4 py-1">
                                        "{rev.comment || "No written feedback."}"
                                      </p>
                                      {rev.isReport && (
                                        <div className="mt-4 p-4 bg-white/80 rounded-xl border border-rose-200 flex flex-col gap-3">
                                          <div className="flex flex-col gap-1">
                                            <p className="text-[8px] font-black text-rose-500 uppercase mb-1 flex items-center gap-1">
                                              <FaExclamationTriangle size={7} /> Problem Description
                                            </p>
                                            <p className="text-xs font-bold text-rose-900 leading-relaxed">{rev.reportReason}</p>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            <button
                                              onClick={(e) => handleResolveMisconduct(e, report._id, report.type, rev._id)}
                                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-[0.18em] flex items-center gap-1 transition-all"
                                            >
                                              <FaCheckDouble size={9} /> Resolve Issue
                                            </button>
                                            {otherPartyId && (
                                              <button
                                                onClick={(e) => handleFreezeUser(e, otherPartyId)}
                                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[8px] font-black uppercase tracking-[0.18em] flex items-center gap-1 transition-all"
                                              >
                                                <FaLock size={8} /> Freeze {reporterIsVolunteer ? 'Citizen' : 'Agent'}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>

                              {/* Security Command Center block removed; controls are now inline with each issue */}
                            </div>
                          )}

                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              }) : <tr><td colSpan="5" className="text-center py-12"><span className="text-[9px] px-2 py-1 rounded-lg font-black uppercase bg-slate-100 text-slate-400">GÅ¦ No Data</span></td></tr>}
            </tbody>
          </table>
        </div >
      </div >
    </div >
  );
};

export default AdminDashboard;
