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

  const handleResolve = async (id, type) => {
    try {
      let endpoint = `/api/admin/pollution/status/${id}`;
      let data = { status: 'Resolved' };

      if (type === 'food') {
        endpoint = `/api/food/update/${id}`;
        data = { status: 'Delivered' };
      } else if (type === 'pickup') {
        endpoint = `/api/admin/pollution/status/${id}`;
        data = { status: 'Completed' };
      }

      await api.patch(endpoint, data);
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
    const headers = ["ID", "Type", "Status", "Date", "Location/Address", "Category", "Contributor", "Agent", "Amount", "Security"];
    const rows = filteredReports.map(r => [
      r._id,
      r.type,
      r.status || "Pending",
      new Date(r.createdAt).toLocaleString(),
      (r.address || r.placeName || "").replace(/,/g, " "),
      (r.wasteType || r.pollutionType || r.foodType || "General").replace(/,/g, " "),
      (r.displayName || r.userName || "Contributor").replace(/,/g, " "),
      (r.volunteerName || r.assignedVolunteer || "Unassigned").replace(/,/g, " "),
      r.paidAmount || r.amount || "0",
      r.isFlagged ? "Flagged" : "Clear"
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
    const isExpanded = expandedId === report._id;
    const status = report.status?.toLowerCase();
    const isResolved = status === 'resolved' || status === 'completed' || status === 'delivered';
    const expiry = getExpiryStatus(report.expiryTime);
    
    return (
      <div key={report._id} className={`mb-4 mx-4 bg-white rounded-[2rem] border transition-all overflow-hidden ${isExpanded ? 'ring-2 ring-indigo-500 shadow-xl' : 'border-slate-100 shadow-sm'} ${report.isFlagged ? 'border-rose-200 bg-rose-50/20' : report.volFlaggedByCitizen ? 'border-amber-200 bg-amber-50/20' : ''}`}>
        <div className="p-6" onClick={() => setExpandedId(isExpanded ? null : report._id)}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex gap-4 items-center">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${report.type === 'food' ? 'bg-amber-100 text-amber-600' : report.type === 'pollution' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {report.type === 'food' ? <FaUtensils size={20} /> : report.type === 'pollution' ? <FaExclamationTriangle size={20} /> : <FaRecycle size={20} />}
              </div>
              <div className="relative">
                {report.helpRequested && (
                   <div className="absolute -left-2 -top-2 w-4 h-4 bg-sky-500 rounded-full animate-bounce flex items-center justify-center text-white">
                     <FaInfoCircle size={8} />
                   </div>
                )}
                <h4 className="font-black text-slate-900 text-sm leading-tight">{report.pollutionType || report.wasteType || report.placeName}</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">#{report._id.slice(-6)}</span>
                  {report.isFlagged && <FaFlag className="text-rose-500" size={10} />}
                  {report.volFlaggedByCitizen && <FaExclamationTriangle className="text-amber-500" size={10} />}
                </div>
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${
              isResolved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {report.status}
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-400">
             <div className="flex items-center gap-2 text-slate-600">
               <FaMapMarkerAlt size={12} className="text-emerald-500" />
               <p className="text-[11px] font-bold truncate max-w-[150px]">{report.address || report.placeName}</p>
             </div>
             <p className="text-[10px] font-bold uppercase">{new Date(report.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {isExpanded && (
          <div className="px-6 pb-6 space-y-6 pt-2 border-t border-slate-50 animate-in slide-in-from-top-4 duration-300">
            {/* TYPE SPECIFIC STATS */}
            <div className="grid grid-cols-2 gap-3">
              {report.type === 'food' && (
                <>
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Servings</p>
                    <p className="text-xs font-black text-slate-900">{report.quantity || "—"} PPL</p>
                  </div>
                  <div className={`p-3 rounded-2xl border ${expiry.color}`}>
                    <p className="text-[8px] font-black uppercase mb-1 opacity-70">Lifespan</p>
                    <p className="text-xs font-black">{expiry.text}</p>
                  </div>
                </>
              )}
              {report.type === 'pickup' && (
                <>
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Mass Index</p>
                    <p className="text-xs font-black text-slate-900">{report.weight || "0"} KG</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">State</p>
                    <p className="text-xs font-black text-slate-900">{report.isPaid ? 'PAID ✅' : 'PENDING ⏳'}</p>
                  </div>
                </>
              )}
            </div>

            {/* GPS & COMMANDS */}
            <div className="space-y-4">
               <a 
                 href={`https://www.google.com/maps?q=${report.location?.lat || report.latitude},${report.location?.lng || report.longitude}`}
                 target="_blank"
                 rel="noreferrer"
                 className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase border border-indigo-100 shadow-sm"
               >
                 <FaMapMarkerAlt size={12} /> Launch Satellite Tracking
               </a>

               {/* OPERATIONS BUTTONS */}
               <div className="grid grid-cols-2 gap-3">
                 <button onClick={(e) => { e.stopPropagation(); handleResolve(report._id, report.type); }} className="py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-emerald-900/10">
                   Resolve Node
                 </button>
                 <button onClick={(e) => deleteReport(e, report._id, report.type)} className="py-4 bg-white text-rose-600 border border-rose-100 rounded-2xl text-[10px] font-black uppercase">
                   Purge Link
                 </button>
               </div>

               {report.helpRequested && (
                 <button onClick={(e) => handleDismissHelp(e, report._id, report.type)} className="w-full py-4 bg-sky-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-sky-900/10 flex items-center justify-center gap-2">
                   <FaInfoCircle size={14} /> Resolve Help Request
                 </button>
               )}
            </div>

            {/* VOLUNTEER INTEL */}
            <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
               <p className="text-[9px] font-black text-slate-400 uppercase mb-3 text-center">Assigned Field Agent</p>
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white border border-slate-100 rounded-full flex items-center justify-center font-black text-xs text-indigo-600">
                   {report.volunteerName?.charAt(0) || "U"}
                 </div>
                 <div className="flex-1">
                   <p className="text-xs font-black text-slate-900">{report.volunteerName || "Awaiting Selection"}</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{report.volunteerPhone || "No contact logged"}</p>
                 </div>
                 <button onClick={(e) => handleAdminReset(e, report._id, report.type)} className="p-3 bg-white text-amber-600 rounded-xl border border-amber-100 shadow-sm">
                   <FaSyncAlt size={12} />
                 </button>
               </div>
            </div>

            {/* VISUAL EVIDENCE GALLERY (MOBILE) */}
            {(report.photos?.length > 0 || report.deliveryPhoto) && (
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-4">Ground Intel Gallery</p>
                <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
                  {report.photos?.map((photo, i) => (
                    <img 
                      key={i} 
                      src={`${import.meta.env.VITE_API_URL}/uploads/${photo}`} 
                      className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 border-2 border-white shadow-sm" 
                      onClick={() => window.open(`${import.meta.env.VITE_API_URL}/uploads/${photo}`, '_blank')}
                    />
                  ))}
                  {report.deliveryPhoto && (
                    <div className="relative flex-shrink-0" onClick={() => window.open(`${import.meta.env.VITE_API_URL}/uploads/${report.deliveryPhoto}`, '_blank')}>
                      <img src={`${import.meta.env.VITE_API_URL}/uploads/${report.deliveryPhoto}`} className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm" />
                      <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-1"><FaCheckCircle size={10} /></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FIELD VERIFICATIONS / REVIEWS */}
            {report.reviews?.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-slate-50">
                 <p className="text-[9px] font-black text-slate-400 uppercase">Field Verifications ({report.reviews?.length})</p>
                 {report.reviews.map((rev, idx) => (
                   <div key={idx} className={`p-4 rounded-[2rem] border transition-all ${rev.isReport ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100 shadow-sm'}`}>
                     <div className="flex justify-between items-center mb-2">
                       <span className="text-[10px] font-black text-slate-900">{rev.userName || "Observer"}</span>
                       {rev.isReport && (
                         <div className="flex items-center gap-1 text-[8px] font-black text-rose-600 uppercase">
                           <FaExclamationTriangle size={8} /> Misconduct
                         </div>
                       )}
                     </div>
                     <p className="text-[11px] text-slate-500 italic leading-relaxed">"{rev.comment || rev.text}"</p>
                     {rev.isReport && (
                       <button 
                         onClick={(e) => handleResolveMisconduct(e, report._id, report.type, rev._id)}
                         className="mt-3 w-full py-2 bg-white text-rose-600 rounded-xl text-[8px] font-black uppercase border border-rose-100"
                       >
                         Resolve Alert
                       </button>
                     )}
                   </div>
                 ))}
              </div>
            )}
          </div>
        )}
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
              <div className="h-8 w-px bg-slate-100 mx-2 hidden md:block"></div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-4 py-2.5 outline-none ring-green-100 focus:ring-2 appearance-none text-slate-500 cursor-pointer"
              >
                <option value="all">Any Status</option>
                <option value="pending">⚠️ Pending Intelex</option>
                <option value="active">⚡ Operations Live</option>
                <option value="completed">✅ Mission Closed</option>
              </select>
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
              <input 
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-slate-50 border-none rounded-xl text-[10px] font-black uppercase px-4 py-3 outline-none ring-green-100 focus:ring-2 text-slate-500 cursor-pointer hidden md:block"
              />
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
                        <tr className={`hover:bg-slate-50/50 transition-all cursor-pointer group ${isExpanded ? 'bg-slate-50/80 shadow-[inset_4px_0_0_0_#4f46e5]' : ''} ${report.isFlagged ? 'bg-rose-50/50 shadow-[inset_4px_0_0_0_#ef4444]' : report.volFlaggedByCitizen ? 'bg-amber-50/50 shadow-[inset_4px_0_0_0_#f59e0b]' : ''}`}>
                          <td className="p-8">
                            <div className="flex items-center gap-4 relative">
                               {report.helpRequested && (
                                 <div className="absolute -left-2 -top-2">
                                   <div className="w-4 h-4 bg-sky-500 rounded-full animate-bounce flex items-center justify-center text-white">
                                     <FaInfoCircle size={8} />
                                   </div>
                                 </div>
                               )}
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${report.type === 'food' ? 'bg-amber-50 text-amber-500' : report.type === 'pollution' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                 {report.type === 'food' ? <FaUtensils /> : report.type === 'pollution' ? <FaExclamationTriangle /> : <FaRecycle />}
                               </div>
                               <div>
                                 <div className="flex items-center gap-2">
                                   <p className="text-sm font-black text-slate-900">{report.pollutionType || report.wasteType || report.placeName}</p>
                                   {report.isFlagged && <FaFlag className="text-rose-500" size={10} />}
                                   {report.volFlaggedByCitizen && <FaExclamationTriangle className="text-amber-500" size={10} />}
                                 </div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: #{report._id?.slice(-8)} • {report.type}</p>
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
                                 <button onClick={() => handleResolve(report._id, report.type)} className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-600 hover:text-white transition-all">
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
                                {/* LOCATION & GEO-INTEL */}
                                <div className="space-y-4">
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Location Data</h5>
                                  <div className="flex items-center gap-3 text-slate-700">
                                    <FaMapMarkerAlt className="text-emerald-500" />
                                    <span className="text-xs font-bold">{report.address || report.placeName || "Coordinates Only"}</span>
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 text-[10px] font-mono text-slate-500">
                                      LAT: {report.location?.lat || report.latitude?.toFixed(4) || "N/A"}<br/>
                                      LNG: {report.location?.lng || report.longitude?.toFixed(4) || "N/A"}
                                    </div>
                                    {(report.location || (report.latitude && report.longitude)) && (
                                      <a 
                                        href={`https://www.google.com/maps?q=${report.location?.lat || report.latitude},${report.location?.lng || report.longitude}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2 hover:underline"
                                      >
                                        <FaExternalLinkAlt size={8} /> Launch Satellite Map
                                      </a>
                                    )}
                                  </div>
                                </div>

                                {/* TYPE-SPECIFIC INTEL & CASE NOTES */}
                                <div className="space-y-4">
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Field Intel</h5>
                                  <div className="bg-white p-5 rounded-[2rem] border border-slate-100 space-y-4 shadow-sm">
                                    {report.type === 'food' && (
                                      <>
                                        <div className="flex justify-between items-center">
                                           <span className="text-[9px] font-black text-slate-400 uppercase">Servings</span>
                                           <span className="text-xs font-black text-amber-600">{report.quantity || "—"} PPL</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                           <span className="text-[9px] font-black text-slate-400 uppercase">Lifespan</span>
                                           <span className={`text-[9px] font-black px-2 py-0.5 rounded ${getExpiryStatus(report.expiryTime).color}`}>
                                             {getExpiryStatus(report.expiryTime).text}
                                           </span>
                                        </div>
                                      </>
                                    )}
                                    {report.type === 'pickup' && (
                                      <>
                                        <div className="flex justify-between items-center">
                                           <span className="text-[9px] font-black text-slate-400 uppercase">Mass Index</span>
                                           <span className="text-xs font-black text-emerald-600">{report.weight || "0"} KG</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                           <span className="text-[9px] font-black text-slate-400 uppercase">Security Fee</span>
                                           <span className="text-[9px] font-black text-slate-800">{report.isPaid ? 'PAID ✅' : 'PENDING ⏳'}</span>
                                        </div>
                                      </>
                                    )}
                                    <div className="pt-2 border-t border-slate-50">
                                      <p className="text-[8px] font-black text-slate-300 uppercase mb-1">Incident Narrative</p>
                                      <p className="text-[11px] text-slate-600 leading-relaxed italic">
                                        "{report.description || report.notes || "No additional logs provided."}"
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* AGENT & SECURITY PROTOCOLS */}
                                <div className="space-y-6">
                                  <div className="space-y-4">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Assigned Agent</h5>
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
                                      {(report.isFlagged || report.volFlaggedByCitizen) && (
                                        <button onClick={(e) => handleUnflag(e, report._id, report.type)} className="w-full py-3 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase border border-blue-100 flex items-center justify-center gap-2">
                                          <FaCheckDouble size={10} /> Dismiss Sec-Flag Alert
                                        </button>
                                      )}
                                      {report.helpRequested && (
                                        <button onClick={(e) => handleDismissHelp(e, report._id, report.type)} className="w-full py-3 bg-sky-600 text-white rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-sky-200">
                                          <FaInfoCircle size={10} /> Resolve Help Request
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* VISUAL EVIDENCE GALLERY */}
                              {(report.photos?.length > 0 || report.deliveryPhoto) && (
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <FaCamera size={12} className="text-slate-300" /> Ground Intel Photo Gallery
                                  </h5>
                                  <div className="flex flex-wrap gap-4">
                                    {report.photos?.map((photo, i) => (
                                      <div key={i} className="group relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-md cursor-pointer" onClick={() => window.open(`${import.meta.env.VITE_API_URL}/uploads/${photo}`, '_blank')}>
                                        <img src={`${import.meta.env.VITE_API_URL}/uploads/${photo}`} alt="Evidence" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <FaEye className="text-white" size={20} />
                                        </div>
                                      </div>
                                    ))}
                                    {report.deliveryPhoto && (
                                      <div className="group relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-emerald-100 shadow-md cursor-pointer" onClick={() => window.open(`${import.meta.env.VITE_API_URL}/uploads/${report.deliveryPhoto}`, '_blank')}>
                                        <img src={`${import.meta.env.VITE_API_URL}/uploads/${report.deliveryPhoto}`} alt="Delivery Proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-emerald-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <FaCheckCircle className="text-white" size={24} />
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-emerald-600 text-white text-[7px] font-black uppercase text-center py-1">Delivery Proof</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* POLLUTION STATUS CONTROLS - RE-INTEGRATED */}
                              {report.type === 'pollution' && (
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Command Status Control</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {["Reported", "Verified", "Claimed", "Resolved"].map(s => (
                                      <button 
                                        key={s} 
                                        onClick={(e) => updatePollutionStatus(e, report._id, s)} 
                                        className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${report.status === s ? 'bg-rose-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-600' }`}
                                      >
                                        {s}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* VERIFIED FEEDBACK / REVIEWS SECTION */}
                              {(report.reviews?.length > 0 || report.rating) && (
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                  <div className="flex items-center justify-between mb-8">
                                    <div>
                                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Verified Ground Intel</h5>
                                      <div className="flex items-center gap-2">
                                        <div className="flex text-amber-400">
                                          {[...Array(5)].map((_, i) => (
                                            <FaStar key={i} className={i < (report.rating || 0) ? "fill-current" : "text-slate-200"} size={14} />
                                          ))}
                                        </div>
                                        <span className="text-xl font-black text-slate-900">{report.rating || "N/A"}</span>
                                      </div>
                                    </div>
                                    <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {report.reviews?.length || 0} External Verifications
                                      </span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {(report.reviews || []).map((review, rIdx) => (
                                      <div key={rIdx} className={`p-6 rounded-[2.5rem] border transition-all ${review.isReport ? 'bg-rose-50 border-rose-100 shadow-xl shadow-rose-900/5' : 'bg-slate-50/50 border-slate-100'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 font-black text-xs border border-slate-100">
                                              {review.userName?.charAt(0) || "C"}
                                            </div>
                                            <div>
                                              <p className="text-xs font-black text-slate-900">{review.userName || "Citizen Inspector"}</p>
                                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                {new Date(review.createdAt).toLocaleDateString()}
                                              </p>
                                            </div>
                                          </div>
                                          {review.isReport && (
                                            <div className="flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded-lg animate-pulse">
                                              <FaExclamationTriangle size={10} />
                                              <span className="text-[8px] font-black uppercase">Misconduct</span>
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-sm text-slate-600 italic leading-relaxed mb-6 cursor-help" title={review.comment || review.text}>
                                          "{review.comment || review.text || "Reported without narrative."}"
                                        </p>
                                        {review.isReport && (
                                          <button 
                                            onClick={(e) => handleResolveMisconduct(e, report._id, report.type, review._id)}
                                            className="w-full py-3 bg-white text-rose-600 rounded-xl text-[9px] font-black uppercase border border-rose-200 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
                                          >
                                            <FaCheckDouble size={10} /> Resolve Misconduct Alert
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
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