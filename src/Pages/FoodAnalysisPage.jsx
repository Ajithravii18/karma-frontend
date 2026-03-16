import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaArrowLeft, FaUtensils, FaCheckCircle, FaFireAlt,
    FaLayerGroup, FaChartBar, FaClock, FaLeaf, FaHeart
} from "react-icons/fa";
import api from "../utils/api";
import Nav from "../Components/Nav";
import AdminSidebar from "../Components/Admin/AdminSidebar";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const FoodAnalysisPage = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        api.get("/api/admin/all-reports").then(res => {
            setReports((res.data || []).filter(r => r.type === "food"));
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const currentYear = new Date().getFullYear();

    const stats = useMemo(() => {
        const byStatus = { Available: 0, Claimed: 0, Collected: 0, Delivered: 0, Expired: 0 };
        const byFoodType = {};
        const byMonth = Array(12).fill(0);
        let totalServings = 0;
        let servingsSaved = 0;

        reports.forEach(r => {
            const s = r.status || "Available";
            const normalized = Object.keys(byStatus).find(k => k.toLowerCase() === s.toLowerCase()) || "Available";
            byStatus[normalized] = (byStatus[normalized] || 0) + 1;

            const ft = r.foodType || "Mixed";
            byFoodType[ft] = (byFoodType[ft] || 0) + 1;

            const qty = parseInt(r.quantity) || 0;
            totalServings += qty;
            if (["delivered", "completed"].includes(s.toLowerCase())) servingsSaved += qty;

            const month = new Date(r.createdAt).getMonth();
            if (new Date(r.createdAt).getFullYear() === currentYear) byMonth[month]++;
        });

        const total = reports.length;
        const delivered = byStatus.Delivered || 0;
        const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

        return { byStatus, byFoodType, byMonth, total, delivered, totalServings, servingsSaved, successRate };
    }, [reports, currentYear]);

    const maxMonth = Math.max(...stats.byMonth, 1);
    const maxFoodType = Math.max(...Object.values(stats.byFoodType), 1);

    const statusColors = {
        Available: "bg-emerald-400 text-white",
        Claimed: "bg-amber-400 text-white",
        Collected: "bg-blue-500 text-white",
        Delivered: "bg-indigo-500 text-white",
        Expired: "bg-rose-400 text-white",
    };

    const foodTypeColors = {
        Veg: "from-green-400 to-emerald-500",
        "Non-Veg": "from-orange-400 to-red-500",
        Mix: "from-amber-400 to-yellow-500",
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex">
            <AdminSidebar />
            <div className="flex-1 ml-72 pb-20">
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
                    <div className="px-6 py-3 bg-amber-50 rounded-2xl border border-amber-100">
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                            {loading ? "Loading..." : `${stats.total} Food Reports Total`}
                        </span>
                    </div>
                </div>

                <div className="mb-8">
                    <p className="text-[11px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1">Food Rescue Program</p>
                    <h1 className="text-5xl font-black text-slate-900">Impact <span className="font-thin italic text-slate-400">Analysis</span></h1>
                </div>

                {/* TOP METRICS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: "Total Reports", value: stats.total, icon: <FaUtensils />, color: "bg-amber-50 text-amber-600" },
                        { label: "Delivered", value: stats.delivered, icon: <FaCheckCircle />, color: "bg-emerald-50 text-emerald-600" },
                        { label: "Meals Saved", value: stats.servingsSaved, icon: <FaHeart />, color: "bg-rose-50 text-rose-500" },
                        { label: "Success Rate", value: `${stats.successRate}%`, icon: <FaChartBar />, color: "bg-indigo-50 text-indigo-600" },
                    ].map(({ label, value, icon, color }) => (
                        <div key={label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-sm ${color}`}>{icon}</div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                            <p className="text-3xl font-black text-slate-900">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                    {/* STATUS LIFECYCLE */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-8">
                        <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-6">Mission Lifecycle</h3>
                        <div className="space-y-4">
                            {Object.entries(stats.byStatus).map(([status, count]) => (
                                <div key={status} className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase w-24 text-center ${statusColors[status] || "bg-slate-100 text-slate-500"}`}>{status}</span>
                                    <div className="flex-1 h-2.5 bg-slate-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-1000"
                                            style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-black text-slate-700 w-8 text-right">{count}</span>
                                </div>
                            ))}
                        </div>

                        {/* Servings breakdown */}
                        <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
                            <div className="bg-amber-50 rounded-2xl p-4">
                                <p className="text-[9px] font-black text-amber-500 uppercase mb-1">Total Servings</p>
                                <p className="text-2xl font-black text-slate-900">{stats.totalServings}</p>
                            </div>
                            <div className="bg-emerald-50 rounded-2xl p-4">
                                <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Meals Saved</p>
                                <p className="text-2xl font-black text-slate-900">{stats.servingsSaved}</p>
                            </div>
                        </div>
                    </div>

                    {/* FOOD TYPE DISTRIBUTION */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl text-white">
                        <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-6">Food Category Distribution</h3>
                        {Object.keys(stats.byFoodType).length > 0 ? (
                            <div className="space-y-5">
                                {Object.entries(stats.byFoodType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                                    const percent = Math.round((count / stats.total) * 100);
                                    const gradClass = foodTypeColors[type] || "from-slate-400 to-slate-500";
                                    return (
                                        <div key={type}>
                                            <div className="flex justify-between items-end mb-2">
                                                <div>
                                                    <span className="text-sm font-black text-white">{type === "Veg" ? "🥦" : type === "Non-Veg" ? "🍖" : "🍱"} {type}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-white">{count}</span>
                                                    <span className="text-[9px] text-slate-500 ml-1">({percent}%)</span>
                                                </div>
                                            </div>
                                            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5">
                                                <div
                                                    className={`h-full bg-gradient-to-r ${gradClass} rounded-full transition-all duration-1000`}
                                                    style={{ width: `${(count / maxFoodType) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-12 text-center border-2 border-dashed border-white/10 rounded-3xl">
                                <p className="text-[10px] font-black uppercase text-slate-600 italic">No food data yet</p>
                            </div>
                        )}

                        {/* Success ring */}
                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Rescue Efficiency</p>
                                <p className="text-3xl font-black text-amber-400 mt-1">{stats.successRate}<span className="text-sm font-light text-slate-500">%</span></p>
                            </div>
                            <div className="w-full max-w-[160px] h-2 bg-white/5 rounded-full overflow-hidden ml-6">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-1000"
                                    style={{ width: `${stats.successRate}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* MONTHLY BAR CHART */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl p-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Monthly Donations</h3>
                            <p className="text-2xl font-black text-slate-900">Food Reports — {currentYear}</p>
                        </div>
                        <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                            <span className="text-[9px] font-black text-amber-500 uppercase">Live Data</span>
                        </div>
                    </div>
                    <div className="flex items-end gap-3 h-40">
                        {stats.byMonth.map((count, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <span className="text-[9px] font-black text-slate-400">{count > 0 ? count : ""}</span>
                                <div
                                    className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-xl transition-all duration-1000 hover:from-orange-500 hover:to-orange-300"
                                    style={{ height: `${Math.max((count / maxMonth) * 130, count > 0 ? 8 : 4)}px` }}
                                    title={`${MONTH_FULL[i]}: ${count} reports`}
                                />
                                <span className="text-[8px] font-black text-slate-400 uppercase">{MONTHS[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    </div>
    );
};

export default FoodAnalysisPage;
