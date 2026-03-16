import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from "../utils/api";
import {
  FaArrowLeft, FaMapMarkerAlt, FaWeightHanging,
  FaMoneyBillWave, FaLeaf, FaCheckCircle, FaClock, FaIdBadge
} from 'react-icons/fa';
import Nav from '../Components/Nav';

const ReportDetails = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();

  const [report, setReport] = useState(state?.report || null);
  const [loading, setLoading] = useState(!state?.report);

  useEffect(() => {
    const fetchSingleReport = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const res = await api.get(`/api/admin/report/${type}/${id}`);
        setReport(prev => ({ ...prev, ...res.data }));
      } catch (err) {
        console.error("Payment Sync Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSingleReport();
  }, [id, type]);

  if (!report && loading) return (
    <div className="min-h-screen bg-[#F0F4F2] flex flex-col items-center justify-center font-black text-emerald-800 uppercase tracking-widest text-xs">
      <FaLeaf className="animate-spin mb-4" size={24} />
      Synchronizing Eco-Ledger...
    </div>
  );

  // LOGIC PRESERVED: Consistent payment mapping
  const amountPaid = report?.amount || report?.paymentAmount || report?.paidAmount || report?.totalCost || 0;
  const isPaid = amountPaid > 0;

  const [freezing, setFreezing] = useState(false);

  const handleFreezeUser = async () => {
    const targetUserId = report.userId?._id || report.user?._id || report.userId || report.user;
    if (!targetUserId) return alert("System Node ID mismatch: Contact developer.");

    if (!window.confirm("🧊 ACCELERATED DISCIPLINARY ACTION: Are you sure you want to FREEZE this user's account? They will lose all access immediately.")) return;

    setFreezing(true);
    try {
      await api.patch(`/api/admin/freeze-user/${targetUserId}`);
      alert("🔒 SECURITY PROTOCOL ACTIVATED: Account Frozen.");
      navigate(-1);
    } catch (err) {
      alert(err.response?.data?.message || "Protocol Failure: Could not freeze account.");
    } finally {
      setFreezing(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#F8FAF9] font-sans text-slate-900 flex">
      <div className="flex-1 pb-20">
        <Nav />
        <div className="max-w-7xl mx-auto pt-32 px-6">
        {/* TOP NAV BAR */}
        <div className="flex justify-between items-center mb-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-emerald-700/50 hover:text-emerald-700 font-black text-[10px] uppercase transition-all group">
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Return to Command Center
          </button>
          <div className="flex gap-2">
            <span className="px-4 py-2 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">
              Case ID: {id.slice(-8)}
            </span>
          </div>
        </div>

        {/* MAIN COMMAND GRID */}
        <div className="grid grid-cols-12 gap-8">

          {/* LEFT SECTION: 8 Columns - Narrative & Evidence */}
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* Header & Payment Summary Card */}
            <div className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-emerald-900/5 border border-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-[0.2em]">
                      <FaLeaf /> Resource Validation
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter capitalize leading-none">
                      {report.wasteType || report.pollutionType || "Logistics Entry"}
                    </h1>
                  </div>
                  <div className={`flex flex-col items-end p-4 rounded-3xl border ${isPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Transaction Total</p>
                    <span className={`text-3xl font-black ${isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ₹{amountPaid}
                    </span>
                    <div className="flex items-center gap-1 mt-1 font-black text-[8px] uppercase tracking-widest">
                      {isPaid ? <><FaCheckCircle className="text-emerald-500" /> Verified</> : <span className="text-rose-400 italic font-medium">Awaiting Payout</span>}
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/30 p-8 rounded-[2.5rem] border border-emerald-100/50">
                  <p className="text-slate-600 leading-relaxed italic text-lg font-medium">
                    "{report.description || "Field investigator reported no additional description for this node."}"
                  </p>
                </div>
              </div>
            </div>

            {/* Evidence Gallery: Grid inside the Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {report.photos && report.photos.length > 0 ? (
                report.photos.map((img, i) => (
                  <div key={i} className="group overflow-hidden rounded-[3rem] border-8 border-white shadow-2xl aspect-[4/3] bg-slate-200">
                    <img
                      src={`${import.meta.env.VITE_API_URL}/uploads/${img}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      alt="Visual Evidence"
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-2 h-64 bg-white/50 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-300">
                  <FaLeaf className="mb-2 opacity-20" size={40} />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Visual Assets Logged</p>
                </div>
              )}

              {/* Delivery Proof Photo for Food Reports */}
              {type === 'food' && report.deliveryPhoto && (
                <div className="group overflow-hidden rounded-[3rem] border-8 border-green-200 shadow-2xl aspect-[4/3] bg-slate-200">
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase z-10">
                    Delivery Proof
                  </div>
                  <img
                    src={`${import.meta.env.VITE_API_URL}/uploads/${report.deliveryPhoto}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    alt="Delivery Proof"
                  />
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SECTION: 4 Columns - Intelligence & Metrics */}
          <div className="col-span-12 lg:col-span-4 space-y-6">

            {/* Logistics Card */}
            <div className="bg-white p-8 rounded-[3rem] border border-white shadow-xl shadow-emerald-900/5 space-y-6">
              <div className="flex items-center gap-3 text-slate-400">
                <FaWeightHanging />
                <span className="text-[10px] font-black uppercase tracking-widest">Payload Metrics</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-50 pb-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Gross Load</p>
                  <p className="text-2xl font-black text-slate-800">{report.weight || 0} KG</p>
                </div>
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Applied Rate</p>
                  <p className="text-sm font-black text-emerald-600">₹50.00 <span className="text-[9px] text-slate-300">/UNIT</span></p>
                </div>
              </div>
            </div>

            {/* Geo-Intelligence Card */}
            <div className="bg-[#11221B] p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                    <FaMapMarkerAlt size={18} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/50">Field Geolocation</p>
                </div>

                <div className="bg-white/5 p-5 rounded-2xl font-mono text-[10px] text-emerald-100 mb-6 border border-white/5">
                  LAT: {report.location?.lat || report.location?.coordinates?.[1] || "0.0"}<br />
                  LNG: {report.location?.lng || report.location?.coordinates?.[0] || "0.0"}
                </div>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${report.location?.lat || report.location?.coordinates?.[1]},${report.location?.lng || report.location?.coordinates?.[0]}`}
                  target="_blank" rel="noreferrer"
                  className="block w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-center text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-emerald-900/40 transition-all active:scale-95"
                >
                  Launch Sat-View
                </a>
              </div>
              <FaLeaf className="absolute -right-12 -bottom-12 text-white/5 rotate-12 group-hover:rotate-45 transition-transform duration-1000" size={180} />
            </div>

            {/* Contributor Card */}
            <div className="bg-emerald-600 p-8 rounded-[3rem] text-white shadow-xl shadow-emerald-200/40 border-b-8 border-emerald-700">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-md">
                  <FaIdBadge size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mb-1">Impact Origin</p>
                  <h3 className="text-xl font-black uppercase tracking-tighter leading-none truncate">{report.displayName || report.userName || "Contributor"}</h3>
                </div>
              </div>
              <div className="py-3 px-5 bg-black/10 rounded-xl text-[10px] font-mono border border-white/5 text-center flex justify-between">
                <span className="opacity-40 uppercase">Trace_ID:</span>
                <span>{report.userPhone || "PUBLIC_NODE"}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest mt-6 opacity-40">
                <FaClock size={10} /> Logged {new Date(report.createdAt).toLocaleDateString()}
              </div>

              {/* 🧊 ADMINISTRATIVE ACTION */}
              <button
                onClick={handleFreezeUser}
                disabled={freezing}
                className="w-full mt-6 py-4 bg-slate-900/50 hover:bg-rose-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-rose-500/20 active:scale-95 disabled:opacity-50"
              >
                {freezing ? "Executing Protocol..." : "Freeze This node / User"}
              </button>
            </div>

          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDetails;