import React, { useState, useEffect, useRef, useCallback } from "react";
import logo from "../assets/logo.png";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaChevronDown, FaColumns, FaSignOutAlt, FaUserShield,
  FaBell, FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaClock, FaCreditCard, FaTruck,
  FaBars, FaTimes, FaHome, FaInfoCircle as FaInfo, FaImage, FaEnvelope, FaConciergeBell
} from "react-icons/fa";
import api from "../utils/api";
import toast from "react-hot-toast";

const Nav = ({ onHomeClick, onAboutClick, onServiceClick, onContactClick, onGalleryClick }) => {
  const nav = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("authToken"));
  const [userName, setUserName] = useState(localStorage.getItem("userName"));
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole") || "user");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const dropdownRef = useRef();
  const notifRef = useRef();
  const menuRef = useRef();

  // --- Theme Logic ---
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isDarkNav = isScrolled || location.pathname !== "/";

  // --- 1. Notification Fetcher with Live Toast Logic ---
  const fetchNotifications = useCallback(async (isSilent = false) => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await api.get("/api/notifications", {
        headers: { "Cache-Control": "no-cache" }
      });

      const newDocs = res.data || [];

      if (isSilent && newDocs.length > notifications.length) {
        const latest = newDocs[0];
        if (!latest.isRead) {
          toast(latest.message, {
            duration: 6000,
            position: "top-right",
            style: {
              borderRadius: '16px',
              background: '#1a2e1a',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '1px solid #2d4d2d'
            },
          });
        }
      }
      setNotifications(newDocs);
    } catch (err) {
      console.error("Notification sync failed", err);
    }
  }, [notifications.length]);

  // --- 2. User Sync Logic ---
  const syncUser = useCallback(async () => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("token");

    if (token) {
      setIsLoggedIn(true);
      try {
        const res = await api.get("/me");
        if (res.data) {
          const freshRole = (res.data.role || "user").toLowerCase().trim();
          setUserName(res.data.name);
          setUserRole(freshRole);
          localStorage.setItem("userRole", freshRole);
          localStorage.setItem("userName", res.data.name);
          fetchNotifications(false);
        }
      } catch (err) {
        if (err.response?.status === 401) handleLogout(false);
      }
    } else {
      setIsLoggedIn(false);
      setUserRole("user");
      setUserName(null);
      setNotifications([]);
    }
  }, [fetchNotifications]);

  const handleLogout = (showToast = true) => {
    localStorage.clear();
    setIsLoggedIn(false);
    setShowDropdown(false);
    setIsMenuOpen(false);
    setNotifications([]);
    setUserRole("user");
    if (showToast) toast.success("Logged out successfully");
    nav("/");
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/read/${id}`, {});
      fetchNotifications(false);
    } catch (err) {
      console.error("Failed to mark read", err);
    }
  };

  useEffect(() => {
    syncUser();
    const handleStorageUpdate = () => syncUser();
    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener("local-auth-update", handleStorageUpdate);

    const token = localStorage.getItem("authToken") || localStorage.getItem("token");
    let interval;
    if (token) {
      interval = setInterval(() => fetchNotifications(true), 5000);
    }

    return () => {
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener("local-auth-update", handleStorageUpdate);
      if (interval) clearInterval(interval);
    };
  }, [location.pathname, syncUser, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setShowDropdown(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifications(false);
      if (menuRef.current && !menuRef.current.contains(event.target) && !event.target.closest('.menu-toggle')) setIsMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
  }, [isMenuOpen]);

  const goToDashboard = () => {
    setShowDropdown(false);
    setIsMenuOpen(false);
    const role = (userRole || "").toLowerCase().trim();
    if (role === 'admin') nav('/admin-dashboard');
    else if (role === 'volunteer') nav('/volunteer-portal');
    else nav('/dashboard');
  };

  const handleHome = () => {
    setIsMenuOpen(false);
    if (location.pathname === "/") {
      if (onHomeClick) onHomeClick();
      else window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      nav("/");
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const services = [
    { label: "Schedule Pickup", icon: "♻️", color: "bg-green-100", path: "/pick-up" },
    { label: "Report Pollution", icon: "🚨", color: "bg-red-100", path: "/report-pollution" },
    { label: "Leftover Food", icon: "🍲", color: "bg-yellow-100", path: "/report-food" }
  ];

  const menuItems = [
    { label: "Home", icon: <FaHome />, onClick: handleHome },
    { label: "About", icon: <FaInfo />, onClick: () => { onAboutClick?.(); setIsMenuOpen(false); } },
    { label: "Services", icon: <FaConciergeBell />, isAccordion: true },
    { label: "Gallery", icon: <FaImage />, onClick: () => { onGalleryClick?.(); setIsMenuOpen(false); } },
    { label: "Contact", icon: <FaEnvelope />, onClick: () => { onContactClick?.(); setIsMenuOpen(false); } }
  ];

  const freshUserRoleCheck = (role) => role !== "user" && role !== "" && role !== null;

  return (
    <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${
      isScrolled
        ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-green-100/50 py-3"
        : isDarkNav
          ? "bg-white border-b border-gray-100 py-4"
          : "bg-transparent py-5"
    } font-sans`}>
      
      {/* Dynamic Gradient Overlay for separation */}
      {isScrolled && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-50/20 to-transparent pointer-events-none" />}

      <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center relative z-10">

        {/* Logo Section Pill */}
        <div
          onClick={handleHome}
          className={`flex items-center gap-2 cursor-pointer pl-2 pr-5 py-1.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 border ${
            isScrolled || location.pathname !== "/"
              ? "bg-white/60 border-green-100 shadow-sm hover:border-green-300 hover:bg-white"
              : "bg-white shadow-lg border-white/20 hover:shadow-xl hover:border-green-200"
          }`}
        >
          <img src={logo} className="w-8" alt="E-Karma Logo" />
          <span className="text-lg font-black tracking-tighter uppercase text-green-900">
            E-Karma
          </span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center space-x-8">
          {menuItems.filter(i => !i.isAccordion).map((item, idx) => (
            <button
              key={idx}
              onClick={item.onClick}
              className={`font-bold transition-all duration-300 py-2 text-sm relative group ${
                isDarkNav ? "text-gray-700 hover:text-green-600" : "text-white/90 hover:text-white"
              }`}
            >
              {item.label}
              <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${isDarkNav ? "bg-green-600" : "bg-white"}`}></span>
            </button>
          ))}

          {/* Services Dropdown */}
          <div className="relative group">
            <button className={`font-bold transition-all duration-300 py-2 text-sm flex items-center gap-1 ${
              isDarkNav ? "text-gray-700 hover:text-green-600" : "text-white/90 hover:text-white"
            }`}>
              Services <FaChevronDown className="text-[10px]" />
            </button>

            <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-4 z-50 overflow-hidden">
              {services.map((service, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!isLoggedIn) toast.error("Please login to continue");
                    else if (freshUserRoleCheck(userRole)) toast.error("This service is only available for Regular Users");
                    else nav(service.path);
                  }}
                  className="flex items-center gap-4 w-full text-left px-6 py-4 hover:bg-green-50 text-gray-700 font-bold border-b border-gray-50 last:border-0"
                >
                  <span className={`${service.color} p-2 rounded-lg text-lg`}>{service.icon}</span>
                  {service.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {isLoggedIn ? (
            <>
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2.5 rounded-full transition-all cursor-pointer ${
                    isDarkNav ? "bg-gray-100 text-gray-400 hover:text-green-600 hover:bg-green-50" : "bg-white/10 text-white/80 hover:bg-white/20"
                  }`}
                >
                  <FaBell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="fixed inset-x-4 top-20 mx-auto w-auto max-w-[calc(100vw-2rem)] md:absolute md:inset-auto md:right-0 md:mt-4 md:w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 z-[200] overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                      <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Alerts Hub</h3>
                      <button onClick={() => setShowNotifications(false)} className="md:hidden text-gray-400 p-1"><FaTimes size={14} /></button>
                    </div>
                    <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? notifications.map(n => {
                        let Icon = FaInfoCircle, iconBg = "bg-blue-100 text-blue-600";
                        if (n.type === 'VOLUNTEER_ARRIVED') { Icon = FaTruck; iconBg = "bg-orange-100 text-orange-600"; }
                        else if (n.type === 'PAYMENT_SUCCESS') { Icon = FaCreditCard; iconBg = "bg-emerald-100 text-emerald-600"; }
                        return (
                          <div key={n._id} onClick={() => { markAsRead(n._id); setShowNotifications(false); }} className={`p-5 border-b border-gray-50 flex gap-4 items-start hover:bg-gray-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-green-50/40' : ''}`}>
                            <div className={`${iconBg} p-2 rounded-xl text-sm shrink-0`}><Icon /></div>
                            <div className="flex-1 text-left">
                              <p className="text-xs font-bold text-gray-800 leading-relaxed">{n.message}</p>
                              <p className="text-[9px] font-black text-gray-400 uppercase mt-1">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        );
                      }) : <div className="p-12 text-center text-[10px] font-black text-gray-300 uppercase">No Alerts Yet</div>}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown Pill */}
              <div className="relative group/profile" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center gap-3 pl-1.5 pr-2 md:pr-4 py-1.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 border ${
                    isScrolled || location.pathname !== "/"
                      ? "bg-white border-green-100 shadow-sm"
                      : "bg-white shadow-lg border-white/20"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow-sm ${userRole === 'admin' ? 'bg-purple-600' : userRole === 'volunteer' ? 'bg-blue-600' : 'bg-green-600'}`}>
                    {userRole === 'admin' ? <FaUserShield /> : (userName?.charAt(0).toUpperCase() || "U")}
                  </div>
                  <span className="font-black text-sm hidden lg:inline text-green-900">{userName}</span>
                  <FaChevronDown className={`text-[10px] text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-4 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <button onClick={goToDashboard} className="flex items-center gap-3 w-full text-left px-6 py-4 hover:bg-gray-50 text-gray-700 font-bold text-sm transition">
                      <FaColumns className={userRole === 'admin' ? "text-purple-600" : "text-green-600"} />
                      {userRole === 'admin' ? "Admin Console" : "Dashboard"}
                    </button>
                    <button onClick={() => handleLogout(true)} className="flex items-center gap-3 w-full text-left px-6 py-4 hover:bg-red-50 text-red-600 font-bold text-sm transition border-t border-gray-50">
                      <FaSignOutAlt /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* --- Sign In Pill Styled like Logo Pill --- */
            <button 
              onClick={() => nav("/login")} 
              className={`px-6 py-2.5 rounded-full font-black text-sm transition-all duration-300 transform active:scale-95 border ${
                isScrolled || location.pathname !== "/"
                ? "bg-green-600 text-white border-green-600 shadow-md hover:bg-green-700 hover:shadow-lg"
                : "bg-white text-green-900 border-white shadow-lg hover:bg-green-50 hover:shadow-xl hover:border-green-200"
              }`}
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`lg:hidden p-2.5 rounded-xl transition-all duration-300 menu-toggle ${isDarkNav ? "text-gray-700 hover:bg-gray-100" : "text-white/90 hover:bg-white/10"}`}
          >
            {isMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Logic Untouched) */}
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] transition-opacity duration-300 lg:hidden ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setIsMenuOpen(false)}>
        <div ref={menuRef} className={`absolute right-0 top-0 h-full w-[80%] max-w-sm bg-white shadow-2xl transition-transform duration-300 transform flex flex-col ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`} onClick={(e) => e.stopPropagation()}>
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3"><img src={logo} className="w-10" alt="Logo" /><h2 className="font-black text-xl text-green-900 tracking-tighter uppercase">E-Karma</h2></div>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-400"><FaTimes size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto py-6 px-6 space-y-2">
            {menuItems.map((item, idx) => (
              <div key={idx}>
                <button onClick={item.isAccordion ? () => setActiveAccordion(activeAccordion === idx ? null : idx) : item.onClick} className={`w-full flex items-center justify-between p-4 rounded-xl font-bold ${activeAccordion === idx ? "bg-green-50 text-green-700" : "text-gray-700"}`}>
                  <div className="flex items-center gap-4"><span>{item.icon}</span><span>{item.label}</span></div>
                  {item.isAccordion && <FaChevronDown className={`transition-transform ${activeAccordion === idx ? 'rotate-180' : ''}`} />}
                </button>
                {item.isAccordion && activeAccordion === idx && (
                  <div className="pl-14 space-y-2 py-2">
                    {services.map((s, sIdx) => (
                      <button key={sIdx} onClick={() => { if (!isLoggedIn) toast.error("Login first"); else nav(s.path); }} className="w-full text-left p-2 text-sm font-bold text-gray-500 flex items-center gap-2"><span>{s.icon}</span>{s.label}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Mobile Footer */}
          <div className="p-6 border-t bg-gray-50/50">
            {isLoggedIn ? (
              <button onClick={() => handleLogout(true)} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-sm">Sign Out</button>
            ) : (
              <button onClick={() => { nav("/login"); setIsMenuOpen(false); }} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black shadow-lg">Sign In</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
