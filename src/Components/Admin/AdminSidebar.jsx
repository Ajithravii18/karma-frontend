import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaColumns,
  FaUsersCog,
  FaChartLine,
  FaHistory,
  FaSignOutAlt,
  FaHome,
  FaChevronRight,
  FaEnvelopeOpenText
} from "react-icons/fa";
import logo from "../../assets/logo.png";
import toast from "react-hot-toast";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: "Dashboard", icon: FaColumns, path: "/admin-dashboard" },
    { label: "Citizen Control", icon: FaUsersCog, path: "/admin/users" },
    { label: "Revenue Analysis", icon: FaChartLine, path: "/admin/revenue-analysis" },
    { label: "Waste Analysis", icon: FaHistory, path: "/admin/waste-analysis" },
    { label: "Food Analytics", icon: FaEnvelopeOpenText, path: "/admin/food-analysis" },
    { label: "Deletion Logs", icon: FaHistory, path: "/admin/deletion-logs" },
  ];

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="fixed left-0 top-0 h-full w-72 bg-white border-r border-slate-100 flex flex-col z-[150] shadow-2xl shadow-slate-200/50">
      {/* Sidebar Header */}
      <div className="p-8 border-b border-slate-50 flex items-center gap-3">
        <div 
          onClick={() => navigate("/")}
          className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
        >
          <img src={logo} className="w-6" alt="Logo" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter">HQ Command</h2>
          <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Admin Control Center</p>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-2 no-scrollbar">
        <p className="px-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Operations Hub</p>
        
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group ${
                isActive 
                ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20 translate-x-1" 
                : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${isActive ? "bg-white/10" : "bg-slate-50 group-hover:bg-emerald-100"}`}>
                  <item.icon size={14} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
              </div>
              <FaChevronRight size={10} className={`transition-transform duration-300 ${isActive ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}`} />
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-6 border-t border-slate-50 space-y-2">
        <button
          onClick={() => navigate("/")}
          className="w-full flex items-center gap-4 p-4 text-slate-500 hover:text-slate-900 transition-all font-black text-[11px] uppercase tracking-tight"
        >
          <FaHome size={14} /> Main Site
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-4 text-rose-500 hover:bg-rose-50 rounded-2xl transition-all font-black text-[11px] uppercase tracking-tight"
        >
          <FaSignOutAlt size={14} /> System Exit
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
