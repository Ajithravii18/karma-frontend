import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaHome, FaRecycle, FaExclamationTriangle, FaUtensils, FaUserShield, FaHistory, FaUsersCog, FaUserTimes, FaChartLine } from 'react-icons/fa';

const BottomNav = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("authToken"));
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole") || "user");
  const location = useLocation();

  useEffect(() => {
    const handleStorageUpdate = () => {
      setIsLoggedIn(!!localStorage.getItem("authToken"));
      setUserRole(localStorage.getItem("userRole") || "user");
    };
    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("local-auth-update", handleStorageUpdate);
    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("local-auth-update", handleStorageUpdate);
    };
  }, []);

  // Don't show bottom nav on auth pages or home if not logged in
  if (!isLoggedIn || ['/', '/login', '/register', '/otp'].includes(location.pathname)) return null;

  const role = userRole.toLowerCase().trim();

  const getLinks = () => {
    if (role === 'admin') {
      return [
        { to: '/admin-dashboard', icon: <FaHome size={22} />, label: 'Home' },
        { to: '/admin/users', icon: <FaUsersCog size={22} />, label: 'Users' },
        { to: '/admin/deletion-logs', icon: <FaUserTimes size={22} />, label: 'Logs' },
        { to: '/admin/revenue-analysis', icon: <FaChartLine size={22} />, label: 'Analysis' },
      ];
    }
    if (role === 'volunteer') {
      return [
        { to: '/volunteer-portal', icon: <FaHome size={22} />, label: 'Portal' },
        { to: '/volunteer-history', icon: <FaHistory size={22} />, label: 'History' },
      ];
    }
    
    // Regular User
    return [
      { to: '/dashboard', icon: <FaHome size={22} />, label: 'Home' },
      { to: '/pick-up', icon: <FaRecycle size={22} />, label: 'Waste' },
      { to: '/report-pollution', icon: <FaExclamationTriangle size={22} />, label: 'Pollution' },
      { to: '/report-food', icon: <FaUtensils size={22} />, label: 'Food' }
    ];
  };

  const links = getLinks();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-[100] pb-2 pt-2 px-4 flex justify-around items-center rounded-t-3xl">
      {links.map((link, idx) => (
        <NavLink 
          key={idx} 
          to={link.to} 
          className={({isActive}) => `flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-green-600 scale-110' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          {link.icon}
          <span className="text-[9px] font-black tracking-wider uppercase">{link.label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default BottomNav;
