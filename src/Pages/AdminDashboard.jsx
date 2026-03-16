import React, { useState, useEffect, useCallback } from "react";
import {
  FaTrash, FaRecycle, FaExclamationTriangle, FaUtensils,
  FaSearch, FaSyncAlt, FaLock, FaUnlock, FaChevronDown, FaChevronUp,
  FaMapMarkerAlt, FaCircle, FaUserCheck, FaChartLine, FaArrowRight,
  FaUsersCog, FaPhoneAlt, FaCamera, FaCalendarAlt, FaClock,
  FaLeaf, FaStickyNote, FaLayerGroup, FaExternalLinkAlt, FaDownload, FaUserTimes,
  FaStar, FaInfoCircle, FaCheckDouble, FaFlag, FaCheckCircle, FaEye, FaCheck
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import Nav from "../Components/Nav";

// Analytics Components
import MonthlyRevenue from "../Components/Admin/MonthlyRevenue";
import WasteAnalysis from "../Components/Admin/WasteAnalysis";
import FoodAnalysis from "../Components/Admin/FoodAnalysis";
import AdminSidebar from "../Components/Admin/AdminSidebar";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const stats = [
    { label: "Active Nodes", value: reports.length, icon: FaSyncAlt, color: "text-blue-600", trend: "+12%" },
    { label: "Total Salvage", value: reports.filter(r => r.status === 'Resolved' || r.status === 'Completed').length, icon: FaCheckCircle, color: "text-green-600", trend: "+5%" },
    { label: "Pending Intel", value: reports.filter(r => r.status === 'Reported' || r.status === 'Pending').length, icon: FaClock, color: "text-amber-600", trend: "-2%" },
    { label: "Critical Priority", value: reports.filter(r => r.isFlagged).length, icon: FaExclamationTriangle, color: "text-rose-600", trend: "0%" }
  ];

  const fetchAdminData = useCallback(async (isSilent = false) => {
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
    const interval = setInterval(() => fetchAdminData(true), 5000);
    return () => clearInterval(interval);
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
    e?.stopPropagation();
    try {
      await api.patch(`/api/admin/pollution/status/${id}`, { status: newStatus });
      toast.success(`Mission moved to ${newStatus}`);
      fetchAdminData(true);
    } catch (err) { toast.error("Update failed"); }
  };

  const handleResolve = async (id) => {
    try {
      await api.patch(`/api/admin/pollution/status/${id}`, { status: 'Resolved' });
      toast.success("Mission Resolved");
      fetchAdminData(true);
    } catch (err) { toast.error("Resolution failed"); }
  };

  const handleAdminReset = async (e, taskId, reportType) => {
    e.stopPropagation();
    if (!window.confirm("FORCE UNASSIGN: This will remove the agent. Proceed?")) return;
    try {
      await api.patch(`/api/admin/reset-mission/${taskId}`, { type: reportType });
      toast.success("Mission Reset Successfully");
      fetchAdminData(true);
    } catch (err) { toast.error("Server rejected reset"); }
  };

  const deleteReport = async (e, id, type) => {
    e.stopPropagation();
    if (!window.confirm("Permanent Delete?")) return;
    try {
      await api.delete(`/api/admin/report/${type}/${id}`);
      toast.success("Record Purged");
      fetchAdminData(true);
    } catch (err) { toast.error("Delete failed"); }
  };

  const handleFreezeUser = async (e, userId) => {
    e.stopPropagation();
    if (!userId) return toast.error("System Node ID mismatch.");
    if (!window.confirm("🧊 ACCELERATED DISCIPLINARY ACTION: Freeze this user's account immediately?")) return;
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
      await api.patch(`/api/admin/unflag-report/${type}/${reportId}`, { reviewId });
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

  const filteredReports = reports
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
        const reportMonth = new Date(r.createdAt).toISOString().slice(0, 7);
        matchesDate = reportMonth === dateFilter;
      }

      return matchesCategory && matchesStatus && matchesSearch && matchesDate;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const downloadCSV = () => {
    if (filteredReports.length === 0) {
      toast.error("No data to download!");
      return;
    }
    const headers = ["ID", "Type", "Status", "Date", "Location/Address", "Content", "Agent", "Payment/Amount"];
    const rows = filteredReports.map(r => [
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

  const renderMobileCard = (report) => {
    const status = report.status?.toLowerCase();
    const isResolved = status === 'resolved' || status === 'completed' || status === 'delivered';

    return (
      <div key={report._id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm mb-4 relative overflow-hidden group">
        <div className={`absolute top-0 right-0 w-1.5 h-full ${isResolved ? 'bg-green-500' : 'bg-amber-500'}`}></div>

        <div className="flex justify-between items-start mb-4">
           <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${isResolved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
             <div className={`w-1 h-1 rounded-full ${isResolved ? 'bg-green-600 animate-pulse' : 'bg-amber-600'}`}></div>
             {report.status}
           </div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
             {new Date(report.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
           </p>
        </div>

        <h4 className="text-lg font-black text-gray-900 mb-1 leading-tight">
          {report.pollutionType || report.wasteType || report.placeName || "Report Details"}
        </h4>
        <p className="text-[10px] text-gray-400 font-bold mb-4 opacity-70">
           Ref: #{report._id?.slice(-8).toUpperCase()}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => setExpandedId(expandedId === report._id ? null : report._id)}
            className="w-full bg-slate-900 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95"
          >
            <FaEye /> {expandedId === report._id ? "Close Details" : "View Details"}
          </button>
          {!isResolved && (
            <button
               onClick={() => handleResolve(report._id)}
               className="w-full bg-green-50 text-green-600 py-3.5 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 border border-green-100 active:scale-95"
            >
               <FaCheck /> Mark as Resolved
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex">
      <AdminSidebar />
      <div className="flex-1 ml-72">
        <Nav />
        <div className="max-w-7xl mx-auto pt-24 md:pt-32 pb-12 px-4 md:px-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
          <div data-aos="fade-right">
            <h1 className="text-3xl md:text-5xl font-black text-gray-950 tracking-tighter leading-none mb-2 md:mb-4">
              INTEL <span className="text-green-600">DASHBOARD</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-12 md:w-20 bg-green-600 rounded-full"></div>
              <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Administrative Oversight</p>
            </div>
          </div>
          <p className="hidden md:block text-right text-[10px] font-black text-gray-400 uppercase tracking-widest leading-loose">
            Last Updated: <span className="text-green-600">{new Date().toLocaleTimeString()}</span><br />
            System Status: <span className="text-green-600">Encrypted & Secure</span>
          </p>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
          {stats.map((stat, i) => (
            <div key={i} data-aos="fade-up" data-aos-delay={i * 100} className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-sm border border-gray-100 group hover:shadow-xl hover:shadow-green-900/5 transition-all duration-500 relative overflow-hidden">
              <div className={`absolute top-0 right-0 p-4 md:p-6 opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 ${stat.color}`}>
                <stat.icon size={60} />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl md:text-4xl font-black text-gray-950 tracking-tighter">{stat.value}</h2>
                  <span className={`${stat.color} text-[10px] font-bold`}>{stat.trend}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
          <div data-aos="fade-right" className="bg-white p-6 md:p-10 rounded-[3rem] md:rounded-[4rem] shadow-2xl shadow-green-900/5 border border-gray-100 flex flex-col justify-center min-h-[300px] md:min-h-[400px]">
            <h3 className="text-xl md:text-2xl font-black text-gray-950 mb-6 md:mb-8 tracking-tight flex items-center gap-3">
              <div className="w-2 h-8 bg-green-600 rounded-full"></div>
              Intel Feed
            </h3>
            <MonthlyRevenue reports={reports} />
          </div>
          <div data-aos="fade-up" className="bg-slate-900 p-6 md:p-10 rounded-[3rem] md:rounded-[4rem] shadow-2xl text-white flex flex-col justify-center min-h-[300px] md:min-h-[400px]">
             <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-8 tracking-tight flex items-center gap-3">
              <div className="w-2 h-8 bg-green-400 rounded-full"></div>
              Resource Allocation
            </h3>
            <WasteAnalysis reports={reports} />
          </div>
          <div data-aos="fade-left" className="bg-white p-6 md:p-10 rounded-[3rem] md:rounded-[4rem] shadow-2xl shadow-green-900/5 border border-gray-100 flex flex-col justify-center min-h-[300px] md:min-h-[400px]">
            <h3 className="text-xl md:text-2xl font-black text-gray-950 mb-6 md:mb-8 tracking-tight flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              Local Impact
            </h3>
            <FoodAnalysis reports={reports} />
          </div>
        </div>

        {/* Controls Section */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-slate-100 mb-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 w-full md:w-auto">
              {['all', 'pollution', 'pickup', 'food'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === f ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:text-green-600'}`}
                >
                  {f} logs
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-grow md:w-64">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={12} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query intel..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-[10px] font-bold uppercase outline-none focus:ring-2 ring-green-100"
                />
              </div>
              <button onClick={downloadCSV} className="bg-slate-900 text-white p-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-md">
                <FaDownload size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Data Table / Cards */}
        {loading ? (
          <div className="p-20 text-center">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Synchronizing Encrypted Data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table */}
            <div className="hidden md:block bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-xl">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Asset Details</th>
                    <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                    <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest">Timeline</th>
                    <th className="p-8 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredReports.map((report) => {
                    const status = report.status?.toLowerCase();
                    const isResolved = ['completed', 'resolved', 'delivered'].includes(status);
                    const isExpanded = expandedId === report._id;
                    return (
                      <React.Fragment key={report._id}>
                        <tr className={`hover:bg-slate-50/50 transition-colors group ${isExpanded ? 'bg-slate-50/80' : ''}`}>
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${report.type === 'food' ? 'bg-amber-50 text-amber-500' : report.type === 'pollution' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                 {report.type === 'food' ? <FaUtensils /> : report.type === 'pollution' ? <FaExclamationTriangle /> : <FaRecycle />}
                               </div>
                               <div>
                                 <p className="text-sm font-black text-slate-900">{report.pollutionType || report.wasteType || report.placeName}</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: #{report._id?.slice(-8)}</p>
                               </div>
                            </div>
                          </td>
                          <td className="p-8">
                             <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit ${isResolved ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'}`}>
                               <div className={`w-1 h-1 rounded-full ${isResolved ? 'bg-green-600' : 'bg-amber-600 animate-pulse'}`}></div>
                               {report.status}
                             </span>
                          </td>
                          <td className="p-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {new Date(report.createdAt).toLocaleDateString()}<br/>
                            <span className="text-slate-300 font-medium">{new Date(report.createdAt).toLocaleTimeString()}</span>
                          </td>
                          <td className="p-8 text-right">
                            <div className="flex justify-end gap-2">
                               <button onClick={() => setExpandedId(isExpanded ? null : report._id)} className={`p-3 rounded-xl transition-all ${isExpanded ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white'}`}>
                                 <FaEye size={12} />
                               </button>
                               <button onClick={() => navigate(`/admin/report/${report.type}/${report._id}`)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                                 <FaExternalLinkAlt size={12} />
                               </button>
                               {!isResolved && (
                                 <button onClick={() => handleResolve(report._id)} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all">
                                   <FaCheck size={12} />
                                 </button>
                               )}
                               <button onClick={(e) => deleteReport(e, report._id, report.type)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all">
                                 <FaTrash size={12} />
                               </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/30">
                            <td colSpan="4" className="p-8">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-4">
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Location Data</h5>
                                  <div className="flex items-center gap-3 text-slate-700">
                                    <FaMapMarkerAlt className="text-emerald-500" />
                                    <span className="text-xs font-bold">{report.address || report.placeName || "Coordinates Only"}</span>
                                  </div>
                                  <div className="bg-white p-4 rounded-2xl border border-slate-100 text-[10px] font-mono text-slate-500">
                                    LAT: {report.location?.lat || "N/A"}<br/>
                                    LNG: {report.location?.lng || "N/A"}
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Asset Agent</h5>
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xs">
                                      {report.volunteerName?.charAt(0) || "A"}
                                    </div>
                                    <div>
                                      <p className="text-xs font-black text-slate-800">{report.volunteerName || "Unassigned"}</p>
                                      <p className="text-[9px] font-bold text-slate-400 uppercase">{report.volunteerPhone || "No contact logged"}</p>
                                    </div>
                                  </div>
                                  <button onClick={(e) => handleAdminReset(e, report._id, report.type)} className="w-full py-3 bg-amber-50 text-amber-600 rounded-xl text-[9px] font-black uppercase border border-amber-100 flex items-center justify-center gap-2 hover:bg-amber-100 transition-all">
                                    <FaSyncAlt size={10} /> Force Unassign Agent
                                  </button>
                                </div>
                                <div className="space-y-4">
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Security Protocol</h5>
                                  <div className="flex flex-col gap-2">
                                    <button onClick={(e) => handleFreezeUser(e, report.userId?._id || report.userId)} className="w-full py-3 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-red-200">
                                      <FaLock size={10} /> Freeze User Node
                                    </button>
                                    {report.isFlagged && (
                                      <button onClick={(e) => handleUnflag(e, report._id, report.type)} className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase border border-blue-100 flex items-center justify-center gap-2">
                                        <FaCheckDouble size={10} /> Dismiss Flag Alert
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
               {filteredReports.map(report => renderMobileCard(report))}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);
};

export default AdminDashboard;