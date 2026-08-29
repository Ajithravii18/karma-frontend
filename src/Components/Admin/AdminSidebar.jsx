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
    { id: 'global-feed', path: '/admin-dashboard', label: 'Global Feed', icon: FaFolderOpen, color: 'text-emerald-500', bg: 'bg-emerald-100/50' },
    { id: 'users', path: '/admin/users', label: 'Users', icon: FaUsersCog, color: 'text-indigo-600', bg: 'bg-indigo-100/50' },
    { id: 'archives', path: '/admin/deletion-logs', label: 'Archives', icon: FaUserTimes, color: 'text-rose-500', bg: 'bg-rose-100/50' },
  ];

  const analyticsLinks = [
    { id: 'revenue', path: '/admin/revenue-analysis', label: 'Revenue', icon: FaChartLine, color: 'text-blue-500', bg: 'bg-blue-100/50' },
    { id: 'waste', path: '/admin/waste-analysis', label: 'Waste', icon: FaRecycle, color: 'text-emerald-500', bg: 'bg-emerald-100/50' },
    { id: 'food', path: '/admin/food-analysis', label: 'Food', icon: FaUtensils, color: 'text-amber-500', bg: 'bg-amber-100/50' },
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
              ? "bg-slate-900 text-white shadow-lg"
              : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
          }`}
        >
          <div className={`p-2 rounded-lg transition-colors duration-200 flex items-center justify-center w-8 h-8 ${
            isActive
              ? "bg-white/20 text-white" 
              : `bg-slate-100 text-slate-400 group-hover:${link.bg} group-hover:${link.color}`
          }`}>
            <link.icon size={14} />
          </div>
          {link.label}
        </button>
      );
    })
  );

  return (
    <aside className="hidden lg:flex w-64 bg-white flex-col fixed top-0 left-0 h-screen overflow-y-auto no-scrollbar hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden z-[150] border-r border-slate-200">
      {/* Logo Section */}
      <div className="h-[68px] flex items-center gap-2 px-6 border-b border-slate-200 cursor-pointer shrink-0" onClick={() => navigate("/")}>
        <img src={logo} className="w-8" alt="E-Karma Logo" />
        <span className="text-base font-black tracking-tighter uppercase text-slate-800">E-Karma</span>
      </div>

      <nav className="flex flex-col gap-1 p-4 flex-1">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-2">System</p>
        {renderLinks(systemLinks)}
        
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-6">Analytics</p>
        {renderLinks(analyticsLinks)}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
