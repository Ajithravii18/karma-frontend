import React, { useState, useEffect } from "react";
import {
  FaCheck, FaClock, FaPhoneAlt, FaLeaf, FaTrashAlt,
  FaDirections, FaHistory, FaCheckCircle, FaArrowRight,
  FaRecycle, FaSync, FaUser, FaMapMarkerAlt,
  FaExclamationTriangle, FaUtensils, FaTimes, FaFlag,
  FaCalendarAlt, FaEye
} from "react-icons/fa";
import api from "../utils/api";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Nav from "../Components/Nav";
import AOS from "aos";

// --- ⏲️ SUB-COMPONENT: LIVE EXPIRY TIMER ---
const FoodTimer = ({ expiryTime }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(expiryTime) - new Date();
      if (diff <= 0) return "EXPIRED";
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${mins}m left`;
    };
    setTimeLeft(calculate());
    const interval = setInterval(() => setTimeLeft(calculate()), 60000);
    return () => clearInterval(interval);
  }, [expiryTime]);

  if (timeLeft === "EXPIRED") return (
    <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase animate-pulse">
      Expired
    </span>
  );

  return (
    <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1">
      <FaClock size={8} /> {timeLeft}
    </span>
  );
};

const UserReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sectorFilter, setSectorFilter] = useState("All Sectors");
  const [userInfo, setUserInfo] = useState({ name: "", phone: "" });

  const navigate = useNavigate();
  const token = localStorage.getItem("authToken") || localStorage.getItem("token");


  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    fetchProfile();
    fetchReports(true);
    const interval = setInterval(() => fetchReports(false), 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/me");
      const data = res.data.user || res.data;
      setUserInfo({ name: data.name, phone: data.phone });
    } catch (err) { console.error("Profile Fetch Error", err); }
  };

  const fetchReports = async (isInitial = false) => {
    if (!token) return;
    try {
      if (isInitial) setLoading(true);
      else setIsSyncing(true);

      const [pickupsRes, pollutionRes, foodRes] = await Promise.all([
        api.get("/api/my-pickups"),
        api.get("/api/my-pollution"),
        api.get("/api/my-food")
      ]);



      const formattedPickups = pickupsRes.data.map(p => ({
        ...p,
        isWaste: true,
        isFood: false,
        isPollution: false,
        displayType: "Waste Pickup",
        displayTitle: p.wasteType || "Waste Collection",
        location: p.address,
        sector: "Waste"
      }));

      const formattedPollution = pollutionRes.data.map(p => ({
        ...p,
        isWaste: false,
        isFood: false,
        isPollution: true,
        displayType: "Pollution Report",
        displayTitle: p.pollutionType || "Environmental Issue",
        location: p.address,
        sector: "Pollution"
      }));

      const formattedFood = foodRes.data.map(f => ({
        ...f,
        isWaste: false,
        isFood: true,
        isPollution: false,
        displayType: "Food Donation",
        displayTitle: f.placeName || "Food Report",
        location: `${f.latitude?.toFixed(4)}, ${f.longitude?.toFixed(4)}`,
        sector: "Food"
      }));

      const combined = [...formattedPickups, ...formattedPollution, ...formattedFood].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setReports(combined);
    } catch (err) { console.error(err); } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const handleNavigation = (report) => {
    const lat = report.latitude || report.location?.lat;
    const lng = report.longitude || report.location?.lng;
    const url = (lat && lng)
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(report.address || report.placeName || "")}`;
    window.open(url, "_blank");
  };

  const handleCancelReport = async (reportId, type) => {
    if (!window.confirm("Cancel this report? This action cannot be undone.")) return;

    try {
      await api.delete(`/api/user/cancel-report/${type}/${reportId}`);
      toast.success("Report cancelled successfully");
      fetchReports(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel report");
    }
  };

  const handleFlagVolunteer = async (report) => {
    const reason = window.prompt("⚠️ Report Issue: Describe the problem with this volunteer/mission (e.g., No show, rude behavior):");
    if (!reason) return;

    let type = report.isFood ? "food" : report.isPollution ? "pollution" : "pickup";

    try {
      await api.patch(`/api/user/flag-volunteer/${type}/${report._id}`, { reason });
      toast.success("Issue reported to Admin HQ");
      fetchReports(false);
    } catch (err) {
      toast.error("Failed to submit report");
    }
  };

  // --- 🎯 CORE LOGIC: FILTERING ---
  const visibleReports = reports.filter(r => {
    const status = (r.status || "").toLowerCase();

    // Sector filter
    if (sectorFilter === "Food Only" && !r.isFood) return false;
    if (sectorFilter === "Waste Only" && !r.isWaste) return false;
    if (sectorFilter === "Pollution Only" && !r.isPollution) return false;

    // Status filter
    if (statusFilter === "Completed") return ["completed", "resolved", "delivered", "success", "paid"].includes(status);
    if (statusFilter === "Pending") return !["completed", "resolved", "delivered", "success", "paid"].includes(status);

    return true;
  });

  const completedCount = reports.filter(r => {
    const status = (r.status || "").toLowerCase();
    return ["completed", "resolved", "delivered", "success", "paid"].includes(status);
  }).length;

  const pendingCount = reports.length - completedCount;

  // --- 🎨 STATUS THEMES ---
  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'completed':
      case 'resolved':
      case 'delivered':
      case 'success':
      case 'paid':
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case 'claimed':
      case 'collected':
      case 'arrived':
        return "bg-sky-100 text-sky-700 border-sky-200";
      case 'available':
      case 'verified':
      case 'pending':
        return "bg-amber-100 text-amber-700 border-amber-200";
      case 'reported':
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status) => {
    const s = status?.toLowerCase();
    if (["completed", "resolved", "delivered", "success", "paid"].includes(s)) return <FaCheckCircle />;
    if (["claimed", "collected", "arrived"].includes(s)) return <FaSync className="animate-spin" />;
    return <FaClock />;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      <Nav />

      <div className="max-w-7xl mx-auto pt-32 px-6">

        {/* STATS OVERVIEW */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          <div className="flex-1 bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm flex items-center gap-6">
            <div className="w-20 h-20 bg-green-600 rounded-[2rem] flex items-center justify-center text-white text-3xl shadow-lg">
              <FaUser />
            </div>
            <div>
              <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Active Citizen</p>
              <h2 className="text-3xl font-black text-slate-900 leading-none mb-1">{userInfo.name || "User"}</h2>
              <p className="text-xs font-bold text-slate-400 mb-3 ml-1">{userInfo.phone}</p>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${pendingCount > 0 ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {pendingCount > 0 ? `• ${pendingCount} Active` : "• All Clear"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:w-80">
            <div onClick={() => { setStatusFilter("Completed"); navigate("/dashboard"); }} className="cursor-pointer bg-slate-900 p-6 rounded-[2.5rem] shadow-xl flex flex-col justify-center items-center group hover:bg-slate-800 transition-all text-white">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-xl mb-2"><FaCheckCircle /></div>
              <p className="text-2xl font-black">{completedCount}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Completed</p>
            </div>
            <div onClick={() => { setStatusFilter("Pending"); }} className="cursor-pointer bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-sm flex flex-col justify-center items-center group hover:border-amber-200 transition-all">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center text-xl mb-2"><FaClock /></div>
              <p className="text-2xl font-black text-slate-900">{pendingCount}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Pending</p>
            </div>
          </div>
        </div>

        {/* REPORTS CONTROL */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">My Reports <span className="text-emerald-500 font-thin italic">Hub</span></h1>
            <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest flex items-center gap-2">
              {isSyncing ? <><FaSync className="animate-spin" /> Live Syncing...</> : "Track your community impact"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white p-2.5 rounded-[2.2rem] border border-slate-200 shadow-sm">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {["All Sectors", "Food Only", "Waste Only", "Pollution Only"].map(s => (
                <button key={s} onClick={() => setSectorFilter(s)} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${sectorFilter === s ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>{s.split(' ')[0]}</button>
              ))}
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {["All", "Pending", "Completed"].map(f => (
                <button key={f} onClick={() => setStatusFilter(f)} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${statusFilter === f ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>{f}</button>
              ))}
            </div>
          </div>
        </div>

        {/* REPORTS TABLE */}
        <div className="bg-white border border-slate-200 rounded-[3.5rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-8 text-[11px] font-black uppercase text-slate-400">Type</th>
                <th className="p-8 text-[11px] font-black uppercase text-slate-400">Details</th>
                <th className="p-8 text-[11px] font-black uppercase text-slate-400 text-center">Date</th>
                <th className="p-8 text-[11px] font-black uppercase text-slate-400 text-center">Status</th>
                <th className="p-8 text-[11px] font-black uppercase text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visibleReports.length > 0 ? visibleReports.map((report) => {
                const status = (report.status || "").toLowerCase();
                const isFinished = ["completed", "resolved", "delivered", "success", "paid"].includes(status);
                const hasVolunteer = report.assignedVolunteer || report.claimedBy;

                return (
                  <tr key={report._id} className={`group transition-all ${isFinished ? 'opacity-60' : 'hover:bg-slate-50/50'}`}>
                    <td className="p-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-sm ${report.isFood ? 'bg-emerald-100 text-emerald-600' : report.isPollution ? 'bg-rose-100 text-rose-600' : 'bg-slate-900 text-white'}`}>
                        {report.isFood ? <FaUtensils /> : report.isPollution ? <FaExclamationTriangle /> : <FaTrashAlt />}
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                          {report.isFood ? "Food Donation" : report.isPollution ? "Pollution Report" : "Waste Pickup"}
                        </span>
                        {report.isFood && !isFinished && <FoodTimer expiryTime={report.expiryTime} />}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight">
                        {report.displayTitle}
                        {report.isFood && <span className="ml-2 text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">{report.quantity} servings</span>}
                      </h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase">
                          <FaMapMarkerAlt size={9} /> {report.location || "Location set"}
                        </span>
                        {hasVolunteer && (
                          <span className="text-[10px] font-black text-indigo-500 flex items-center gap-1 uppercase">
                            <FaUser size={9} /> Volunteer Assigned
                          </span>
                        )}
                        {report.weight > 0 && (
                          <span className="text-[10px] font-black text-emerald-600 flex items-center gap-1 uppercase">
                            <FaRecycle size={9} /> {report.weight} KG Collected
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-8 text-center">
                      <div className="text-[9px] font-black text-slate-500 uppercase">
                        {new Date(report.createdAt).toLocaleDateString()} <br />
                        <span className="text-slate-400">{new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="p-8 text-center">
                      <span className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase inline-flex items-center gap-2 border ${getStatusStyle(report.status)}`}>
                        {getStatusIcon(report.status)} {report.status || "Pending"}
                      </span>
                    </td>
                    <td className="p-8 text-right">
                      <div className="flex flex-col items-end gap-2">
                        {/* Navigation Button */}
                        <button 
                          onClick={() => handleNavigation(report)} 
                          className="text-[9px] font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest hover:underline flex items-center gap-1"
                        >
                          <FaDirections /> View Location
                        </button>

                        {/* Cancel Button - Only for unclaimed/unassigned reports */}
                        {!hasVolunteer && !isFinished && (
                          <button 
                            onClick={() => handleCancelReport(report._id, report.isFood ? "food" : report.isPollution ? "pollution" : "pickup")}
                            className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest hover:underline flex items-center gap-1"
                          >
                            <FaTimes /> Cancel Report
                          </button>
                        )}

                        {/* Flag Volunteer - Only if volunteer is assigned and report not finished */}
                        {hasVolunteer && !isFinished && (
                          <button 
                            onClick={() => handleFlagVolunteer(report)}
                            className="text-[9px] font-black text-orange-500 hover:text-orange-700 uppercase tracking-widest hover:underline flex items-center gap-1"
                          >
                            <FaFlag /> Report Issue
                          </button>
                        )}

                        {/* View Details for completed */}
                        {isFinished && (
                          <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1">
                            <FaCheckCircle /> Mission Complete
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" className="p-20 text-center">
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto flex items-center justify-center">
                        <FaCalendarAlt className="text-slate-300 text-3xl" />
                      </div>
                      <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No reports found in this sector</p>
                      <div className="flex justify-center gap-3 mt-4">
                        <button onClick={() => navigate("/report-food")} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase hover:bg-emerald-200 transition-all">
                          Report Food
                        </button>
                        <button onClick={() => navigate("/report-pollution")} className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl text-[10px] font-black uppercase hover:bg-rose-200 transition-all">
                          Report Pollution
                        </button>
                        <button onClick={() => navigate("/schedule-pickup")} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-slate-800 transition-all">
                          Schedule Pickup
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quick Action Footer */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div onClick={() => navigate("/report-food")} className="cursor-pointer bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all group">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
              <FaUtensils />
            </div>
            <h4 className="font-black text-slate-900 mb-1">Report Leftover Food</h4>
            <p className="text-xs text-slate-400 font-medium">Help feed the hungry with your surplus food</p>
          </div>

          <div onClick={() => navigate("/report-pollution")} className="cursor-pointer bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-sm hover:shadow-lg hover:border-rose-200 transition-all group">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
              <FaExclamationTriangle />
            </div>
            <h4 className="font-black text-slate-900 mb-1">Report Pollution</h4>
            <p className="text-xs text-slate-400 font-medium">Report environmental hazards in your area</p>
          </div>

          <div onClick={() => navigate("/schedule-pickup")} className="cursor-pointer bg-white border border-slate-200 p-6 rounded-[2.5rem] shadow-sm hover:shadow-lg hover:border-slate-400 transition-all group">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform">
              <FaRecycle />
            </div>
            <h4 className="font-black text-slate-900 mb-1">Schedule Pickup</h4>
            <p className="text-xs text-slate-400 font-medium">Book waste collection at your doorstep</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserReports;
