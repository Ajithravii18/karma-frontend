import React, { useState, useEffect } from "react";
import { FaUserTimes, FaCalendarAlt, FaPhoneAlt, FaCommentAlt, FaArrowLeft, FaSync, FaExclamationTriangle, FaChevronDown, FaUserShield, FaUser, FaHandsHelping } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import toast from "react-hot-toast";
import Nav from "../Components/Nav";
import AdminSidebar from "../Components/Admin/AdminSidebar";

const DeletionLogs = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const res = await api.get("/api/admin/deletion-logs");
            setLogs(res.data);
        } catch (err) {
            toast.error("Cloud Access Denied");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const getRoleIcon = (role) => {
        if (role === "admin") return <FaUserShield className="text-purple-500" />;
        if (role === "volunteer") return <FaHandsHelping className="text-blue-500" />;
        return <FaUser className="text-emerald-500" />;
    };

    const getRoleBadgeStyle = (role) => {
        if (role === "admin") return "bg-purple-50 text-purple-600 border-purple-200";
        if (role === "volunteer") return "bg-blue-50 text-blue-600 border-blue-200";
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex">
            <AdminSidebar />
            <div className="flex-1 ml-72 pb-20">
                <Nav />
                <div className="max-w-4xl mx-auto pt-32 px-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-5">
                        <button onClick={() => navigate("/admin-dashboard")} className="p-3.5 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-400 hover:text-rose-600 active:scale-95">
                            <FaArrowLeft />
                        </button>
                        <div>
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-1">Archive Department</p>
                            <h1 className="text-3xl font-black text-slate-900">Deletion <span className="font-thin italic text-slate-400">Logs</span></h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider hidden sm:block">{logs.length} Records</span>
                        <button onClick={fetchLogs} className="p-3.5 bg-white rounded-2xl shadow-sm hover:rotate-180 transition-all duration-500 active:scale-95">
                            <FaSync className={loading ? "animate-spin text-rose-500" : "text-slate-400"} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="bg-white p-20 rounded-3xl text-center border border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FaUserTimes size={30} className="text-slate-200" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Pristine Records</h3>
                        <p className="text-slate-400 font-medium">No account deletions have been recorded yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* List Header */}
                        <div className="grid grid-cols-12 px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            <div className="col-span-1">#</div>
                            <div className="col-span-4">User</div>
                            <div className="col-span-3">Role</div>
                            <div className="col-span-3">Deleted On</div>
                            <div className="col-span-1"></div>
                        </div>

                        {/* List Items */}
                        {logs.map((log, index) => (
                            <div key={log._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">
                                {/* Collapsed Row */}
                                <button
                                    onClick={() => toggleExpand(log._id)}
                                    className="w-full grid grid-cols-12 items-center px-6 py-5 text-left cursor-pointer group transition-colors hover:bg-slate-50/50"
                                >
                                    {/* Index */}
                                    <div className="col-span-1">
                                        <span className="text-xs font-black text-slate-300">{String(index + 1).padStart(2, '0')}</span>
                                    </div>

                                    {/* User Info */}
                                    <div className="col-span-4 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 font-black text-sm flex-shrink-0">
                                            {log.userName?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate group-hover:text-rose-600 transition-colors">{log.userName}</p>
                                            <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1 truncate">
                                                <FaPhoneAlt size={8} /> {log.userPhone}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Role Badge */}
                                    <div className="col-span-3">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getRoleBadgeStyle(log.userRole)}`}>
                                            {getRoleIcon(log.userRole)}
                                            {log.userRole}
                                        </span>
                                    </div>

                                    {/* Date */}
                                    <div className="col-span-3">
                                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                                            <FaCalendarAlt size={10} className="text-slate-300" />
                                            {new Date(log.deletedAt).toLocaleDateString("en-IN", {
                                                day: "2-digit", month: "short", year: "numeric"
                                            })}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                            {new Date(log.deletedAt).toLocaleTimeString("en-IN", {
                                                hour: "2-digit", minute: "2-digit"
                                            })}
                                        </p>
                                    </div>

                                    {/* Expand Icon */}
                                    <div className="col-span-1 flex justify-end">
                                        <FaChevronDown
                                            className={`text-slate-300 transition-transform duration-300 ${expandedId === log._id ? "rotate-180 text-rose-500" : ""}`}
                                            size={12}
                                        />
                                    </div>
                                </button>

                                {/* Expanded Details */}
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedId === log._id ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
                                    <div className="px-6 pb-6 pt-2 border-t border-slate-100">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                                            <div className="bg-slate-50 p-4 rounded-xl">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                                                <p className="text-sm font-bold text-slate-700">{log.userName}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                                                <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                                    <FaPhoneAlt size={10} className="text-indigo-400" /> {log.userPhone}
                                                </p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-wider mb-1">Verification</p>
                                                <p className="text-xs font-bold text-emerald-500">✅ OTP Verified</p>
                                            </div>
                                        </div>

                                        {/* Reason Section */}
                                        <div className="p-5 bg-rose-50/50 rounded-2xl relative overflow-hidden border border-rose-100/50">
                                            <FaCommentAlt className="absolute -right-2 -bottom-2 text-5xl text-rose-100 opacity-30 rotate-12" />
                                            <p className="text-[9px] font-black text-rose-500 uppercase mb-2 flex items-center gap-2 tracking-wider">
                                                <FaExclamationTriangle size={10} /> Reason for Deletion
                                            </p>
                                            <p className="text-sm font-medium text-slate-700 italic leading-relaxed relative z-10">
                                                "{log.reason}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </div>
    );
};

export default DeletionLogs;
