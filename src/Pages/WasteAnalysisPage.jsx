import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaArrowLeft, FaRecycle, FaCalendarAlt, FaCheckCircle,
    FaClock, FaLayerGroup, FaChartBar, FaTruck
} from "react-icons/fa";
import api from "../utils/api";
import Nav from "../Components/Nav";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const WasteAnalysisPage = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        api.get("/api/admin/all-reports").then(res => {
            setReports((res.data || []).filter(r => r.type === "pickup"));
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const currentYear = new Date().getFullYear();

    const stats = useMemo(() => {
        const byStatus = { Pending: 0, Claimed: 0, Arrived: 0, Paid: 0, Completed: 0 };
        const byType = {};
        const byMonth = Array(12).fill(0);

        reports.forEach(r => {
            const s = r.status || "Pending";
            const normalized = Object.keys(byStatus).find(k => k.toLowerCase() === s.toLowerCase()) || "Pending";
            byStatus[normalized] = (byStatus[normalized] || 0) + 1;

            const t = r.wasteType || "General";
            byType[t] = (byType[t] || 0) + 1;

            const month = new Date(r.createdAt).getMonth();
            if (new Date(r.createdAt).getFullYear() === currentYear) byMonth[month]++;
        });

        const completed = byStatus.Completed || 0;
        const total = reports.length;
        const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return { byStatus, byType, byMonth, total, completed, successRate };
    }, [reports, currentYear]);

    const maxMonth = Math.max(...stats.byMonth, 1);
    const maxType = Math.max(...Object.values(stats.byType), 1);

    const statusColors = {
        Pending: "bg-slate-200 text-slate-600",
        Claimed: "bg-amber-400 text-white",
        Arrived: "bg-blue-400 text-white",
        Paid: "bg-indigo-500 text-white",
        Completed: "bg-emerald-500 text-white",
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
            <Nav />
            <div className="max-w-[1200px] mx-auto pt-32 px-8">

                {/* HEADER */}
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
                            {loading ? "Loading..." : `${stats.total} Waste Pickups Total`}
                        </span>
                    </div>
                </div>

                <div className="mb-8">
                    <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-1">Waste Operations</p>
                    <h1 className="text-5xl font-black text-slate-900">Collection <span className="font-thin italic text-slate-400">Analysis</span></h1>
                </div>

                {/* TOP METRICS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: "Total Pickups", value: stats.total, icon: <FaTruck />, color: "bg-emerald-50 text-emerald-600" },
                        { label: "Completed", value: stats.completed, icon: <FaCheckCircle />, color: "bg-indigo-50 text-indigo-600" },
                        { label: "Success Rate", value: `${stats.successRate}%`, icon: <FaChartBar />, color: "bg-amber-50 text-amber-600" },
                        { label: "Waste Types", value: Object.keys(stats.byType).length, icon: <FaLayerGroup />, color: "bg-rose-50 text-rose-500" },
                    ].map(({ label, value, icon, color }) => (
                        <div key={label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-sm ${color}`}>{icon}</div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                            <p className="text-3xl font-black text-slate-900">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                    {/* STATUS FUNNEL */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6">Status Lifecycle</h3>
                        <div className="space-y-4">
                            {Object.entries(stats.byStatus).map(([status, count]) => (
                                <div key={status} className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase w-24 text-center ${statusColors[status] || "bg-slate-100 text-slate-500"}`}>{status}</span>
                                    <div className="flex-1 h-2.5 bg-slate-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-400 to-indigo-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-black text-slate-700 w-8 text-right">{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* WASTE TYPE BREAKDOWN */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6">Waste Category Breakdown</h3>
                        {Object.keys(stats.byType).length > 0 ? (
                            <div className="space-y-5">
                                {Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                                    <div key={type}>
                                        <div className="flex justify-between items-end mb-1">
                                            <span className="text-[10px] font-black text-slate-500 uppercase">{type}</span>
                                            <span className="text-sm font-black text-slate-800">{count} <span className="text-[10px] font-normal text-slate-400">jobs</span></span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${(count / maxType) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                <p className="text-[10px] font-black uppercase text-slate-300 italic">No waste data logged yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* MONTHLY ACTIVITY CHART */}
                <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl text-white">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-1">Monthly Activity</h3>
                            <p className="text-2xl font-black">Pickup Volume — {currentYear}</p>
                        </div>
                        <div className="bg-emerald-500/10 px-4 py-2 rounded-xl">
                            <span className="text-[9px] font-black text-emerald-400 uppercase">Live Data</span>
                        </div>
                    </div>
                    <div className="flex items-end gap-3 h-40">
                        {stats.byMonth.map((count, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <span className="text-[9px] font-black text-slate-500">{count > 0 ? count : ""}</span>
                                <div
                                    className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-xl transition-all duration-1000 hover:from-indigo-600 hover:to-indigo-400"
                                    style={{ height: `${Math.max((count / maxMonth) * 130, count > 0 ? 8 : 4)}px` }}
                                    title={`${MONTH_FULL[i]}: ${count} pickups`}
                                />
                                <span className="text-[8px] font-black text-slate-500 uppercase">{MONTHS[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default WasteAnalysisPage;
