import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FaFolderOpen, 
  FaUsersCog, 
  FaUserTimes, 
  FaChartLine, 
  FaRecycle, 
  FaUtensils 
} from 'react-icons/fa';
import logo from '../../assets/logo.png';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const systemLinks = [
    { id: 'global-feed', path: '/admin-dashboard', label: 'Global Feed', icon: FaFolderOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    { id: 'users', path: '/admin/users', label: 'Users', icon: FaUsersCog, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
    { id: 'archives', path: '/admin/deletion-logs', label: 'Archives', icon: FaUserTimes, color: 'text-rose-400', bg: 'bg-rose-500/20' },
  ];

  const analyticsLinks = [
    { id: 'revenue', path: '/admin/revenue-analysis', label: 'Revenue', icon: FaChartLine, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { id: 'waste', path: '/admin/waste-analysis', label: 'Waste', icon: FaRecycle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    { id: 'food', path: '/admin/food-analysis', label: 'Food', icon: FaUtensils, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  ];

  const renderLinks = (links) => (
    links.map(link => {
      const isActive = currentPath === link.path;
      return (
        <button
          key={link.id}
          onClick={() => navigate(link.path)}
          className={`group flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
            isActive
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs"
              : "text-slate-400 hover:bg-slate-800/70 hover:text-white border border-transparent"
          }`}
        >
          <div className={`p-2 rounded-lg transition-colors duration-200 flex items-center justify-center w-8 h-8 ${
            isActive
              ? "bg-emerald-500/20 text-emerald-400" 
              : `bg-slate-800/80 text-slate-400 group-hover:${link.bg} group-hover:${link.color}`
          }`}>
            <link.icon size={14} />
          </div>
          {link.label}
        </button>
      );
    })
  );

  return (
    <aside className="hidden lg:flex w-64 bg-slate-900 flex-col fixed top-0 left-0 h-screen overflow-y-auto no-scrollbar hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden z-[150] border-r border-slate-800">
      {/* Logo Section */}
      <div className="h-[68px] flex items-center gap-2.5 px-6 border-b border-slate-800/80 bg-slate-950/40 cursor-pointer shrink-0" onClick={() => navigate("/")}>
        <img src={logo} className="w-8" alt="E-Karma Logo" />
        <span className="text-base font-black tracking-tighter uppercase text-white">E-Karma</span>
        <span className="ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Admin</span>
      </div>

      <nav className="flex flex-col gap-1 p-4 flex-1">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-2">System</p>
        {renderLinks(systemLinks)}
        
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-6">Analytics</p>
        {renderLinks(analyticsLinks)}
      </nav>

      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-800/50 rounded-2xl p-3.5 border border-slate-700/50 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">E-Karma Command</p>
          <p className="text-xs font-bold text-emerald-400 mt-0.5">● System Online</p>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
