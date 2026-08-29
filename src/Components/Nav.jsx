import React, { useState, useEffect, useRef, useCallback } from "react";
import logo from "../assets/logo.png";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaChevronDown, FaColumns, FaSignOutAlt, FaUserShield, FaSearch,
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

  const dashboardRoutes = ["/dashboard", "/volunteer-portal", "/admin-dashboard", "/volunteer-history", "/admin"];
  const isDashboard = dashboardRoutes.some(route => location.pathname.startsWith(route));

  // Service pages: clean app navbar (no marketing links) but full-width
  const serviceRoutes = ["/pick-up", "/report-pollution", "/report-food", "/my-reports", "/volunteer-history"];
  const isServicePage = serviceRoutes.some(route => location.pathname.startsWith(route));

  return (
    <>
      <nav className={`fixed top-0 z-[100] transition-all duration-300 font-sans flex items-center ${
        isDashboard
          ? "h-[68px] w-full lg:w-[calc(100%-16rem)] left-0 lg:left-64 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/90 text-white border-b border-white/10 shadow-lg backdrop-blur-xl"
          : "h-[68px] w-full left-0 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white border-b border-white/10 shadow-lg backdrop-blur-xl"
      }`}>

        <div className="w-full px-4 sm:px-6 flex items-center relative z-10 justify-between">

          {/* Left Side Group: Logo + Return Home */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div onClick={handleHome} className={`cursor-pointer ${isDashboard ? 'lg:hidden' : ''}`}>
              <div className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-all hover:scale-105 active:scale-95 border bg-white/10 shadow-sm border-white/15">
                <img src={logo} className="w-7 h-7 object-contain" alt="E-Karma Logo" />
                <span className="text-base font-black tracking-tight uppercase text-white">E-Karma</span>
              </div>
            </div>

            {isServicePage && (
              <div className="flex items-center gap-2 pl-2 border-l border-white/15">
                <button
                  onClick={handleHome}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/15 transition-all active:scale-95"
                >
                  <span>←</span>
                  <span className="hidden sm:inline">Home</span>
                </button>
              </div>
            )}
          </div>

          {/* Dashboard Greeting (Desktop only) */}
          {isDashboard && (
            <div className="hidden lg:flex flex-col ml-4">
              <h2 className="text-lg font-black text-white tracking-tight leading-none">
                Welcome back, {userName?.split(' ')[0] || 'User'}! 👋
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          )}

          {/* Desktop Service Page Switcher Tabs */}
          {isServicePage && (
            <div className="hidden md:flex items-center bg-white/10 p-1 rounded-2xl border border-white/15 backdrop-blur-md shadow-inner gap-1">
              <button
                onClick={() => nav('/pick-up')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                  location.pathname === '/pick-up'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/25'
                    : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>♻️</span>
                <span>Waste Pickup</span>
              </button>
              <button
                onClick={() => nav('/report-pollution')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                  location.pathname === '/report-pollution'
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/25'
                    : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🚨</span>
                <span>Pollution Spot</span>
              </button>
              <button
                onClick={() => nav('/report-food')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                  location.pathname === '/report-food'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/25'
                    : 'border-transparent text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>🍲</span>
                <span>Food Rescue</span>
              </button>
            </div>
          )}

          {/* Desktop Marketing Nav Links */}
          {!isDashboard && !isServicePage && (
            <div className="hidden lg:flex items-center space-x-6">
              {menuItems.filter(i => !i.isAccordion).map((item, idx) => (
                <button key={idx} onClick={item.onClick}
                  className="font-semibold transition-all duration-200 py-2 text-sm relative group text-slate-200 hover:text-emerald-400">
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-emerald-400 transition-all duration-300 group-hover:w-full"></span>
                </button>
              ))}

              {/* Services Dropdown */}
              <div className="relative group">
                <button className="font-semibold transition-all duration-200 py-2 text-sm flex items-center gap-1 text-slate-200 hover:text-emerald-400">
                  Services <FaChevronDown className="text-[10px]" />
                </button>
                <div className="absolute left-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 z-50 overflow-hidden">
                  {services.map((service, index) => (
                    <button key={index}
                      onClick={() => {
                        if (!isLoggedIn) {
                          toast.error("Please login to access services");
                          nav("/login");
                          return;
                        }
                        nav(service.path);
                      }}
                      className="flex items-center gap-3 w-full p-3.5 hover:bg-white/10 transition border-b border-white/5 last:border-0 text-left group/item"
                    >
                      <span className="text-lg">{service.icon}</span>
                      <p className="font-bold text-white text-xs group-hover/item:text-emerald-400 transition">{service.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Right Side Actions: Alerts + Profile / Auth */}
          <div className="flex items-center space-x-2.5">
            {isLoggedIn ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2.5 rounded-xl transition-all cursor-pointer bg-white/10 hover:bg-white/20 text-white border border-white/15 active:scale-95"
                    title="Notifications"
                  >
                    <FaBell size={16} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-slate-900 animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="fixed inset-x-4 top-20 mx-auto w-auto max-w-[calc(100vw-2rem)] md:absolute md:inset-auto md:right-0 md:mt-4 md:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[200] overflow-hidden animate-in fade-in zoom-in duration-200 text-slate-900">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Alerts Hub</h3>
                        <button onClick={() => setShowNotifications(false)} className="md:hidden text-slate-400 p-1 hover:text-slate-600"><FaTimes size={14} /></button>
                      </div>
                      <div className="max-h-[60vh] md:max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? notifications.map(n => {
                          let Icon = FaInfoCircle, iconBg = "bg-blue-100 text-blue-600";
                          if (n.type === 'VOLUNTEER_ARRIVED') { Icon = FaTruck; iconBg = "bg-orange-100 text-orange-600"; }
                          else if (n.type === 'PAYMENT_SUCCESS') { Icon = FaCreditCard; iconBg = "bg-emerald-100 text-emerald-600"; }
                          return (
                            <div key={n._id} onClick={() => { markAsRead(n._id); setShowNotifications(false); }} className={`p-4 border-b border-slate-50 flex gap-3.5 items-start hover:bg-slate-50 transition-colors cursor-pointer ${!n.isRead ? 'bg-emerald-50/50' : ''}`}>
                              <div className={`${iconBg} p-2 rounded-xl text-sm shrink-0`}><Icon /></div>
                              <div className="flex-1 text-left">
                                <p className="text-xs font-bold text-slate-700 leading-relaxed">{n.message}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          );
                        }) : <div className="p-10 text-center text-[10px] font-black text-slate-400 uppercase">No Alerts Yet</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Pill */}
                <div className="relative group/profile" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 border bg-white/10 hover:bg-white/20 border-white/15 backdrop-blur-md"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-xs ${userRole === 'admin' ? 'bg-purple-600' : userRole === 'volunteer' ? 'bg-blue-600' : 'bg-emerald-500'}`}>
                      {userRole === 'admin' ? <FaUserShield size={11} /> : (userName?.charAt(0).toUpperCase() || "U")}
                    </div>
                    <span className="font-bold text-xs hidden sm:inline text-white truncate max-w-[100px]">{userName}</span>
                    <FaChevronDown className={`text-[9px] text-slate-300 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2 text-slate-900">
                      <button onClick={goToDashboard} className="flex items-center gap-3 w-full text-left px-5 py-3.5 hover:bg-slate-50 text-slate-700 font-bold text-xs transition border-b border-slate-100">
                        <FaColumns className={userRole === 'admin' ? "text-purple-600" : "text-emerald-600"} />
                        {userRole === 'admin' ? "Admin Console" : "Dashboard"}
                      </button>
                      <button onClick={() => handleLogout(true)} className="flex items-center gap-3 w-full text-left px-5 py-3.5 hover:bg-rose-50 text-rose-600 font-bold text-xs transition">
                        <FaSignOutAlt /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Sign In Button */
              <button
                onClick={() => nav("/login")}
                className="px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle (on marketing pages) */}
            {!isDashboard && (
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl transition-all duration-300 menu-toggle bg-white/10 hover:bg-white/20 text-white border border-white/15 active:scale-95"
                title="Open Menu"
              >
                {isMenuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── MOBILE STICKY SERVICE SWITCHER SUB-BAR (ONLY ON SERVICE PAGES) ── */}
      {isServicePage && (
        <div className="fixed top-[68px] left-0 w-full z-40 bg-slate-950/95 backdrop-blur-xl px-3 py-2 border-b border-white/10 shadow-lg md:hidden">
          <div className="w-full max-w-sm mx-auto grid grid-cols-3 gap-1.5 p-1 bg-white/10 rounded-2xl border border-white/15">
            <button
              onClick={() => nav('/pick-up')}
              className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                location.pathname === '/pick-up'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>♻️</span>
              <span>Waste</span>
            </button>
            <button
              onClick={() => nav('/report-pollution')}
              className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                location.pathname === '/report-pollution'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>🚨</span>
              <span>Pollution</span>
            </button>
            <button
              onClick={() => nav('/report-food')}
              className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                location.pathname === '/report-food'
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/25'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <span>🍲</span>
              <span>Food</span>
            </button>
          </div>
        </div>
      )}

      {/* ── POLISHED MOBILE DRAWER ── */}
      <div className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] transition-opacity duration-300 lg:hidden ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setIsMenuOpen(false)}>
        <div ref={menuRef} className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-slate-950 text-white shadow-2xl border-l border-white/10 transition-transform duration-300 transform flex flex-col ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`} onClick={(e) => e.stopPropagation()}>
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-2.5">
              <img src={logo} className="w-8 h-8 object-contain" alt="Logo" />
              <h2 className="font-black text-lg text-white tracking-tight uppercase">E-Karma</h2>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:text-white"><FaTimes size={20} /></button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {/* Quick Service Switcher in Drawer */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Our Services</p>
              <div className="space-y-1.5">
                {services.map((s, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (!isLoggedIn) toast.error("Please login to access services");
                      else nav(s.path);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl font-bold text-xs transition-all border ${
                      location.pathname === s.path
                        ? 'bg-white/15 border-emerald-500 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{s.icon}</span>
                      <span>{s.label}</span>
                    </div>
                    <span>→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Links */}
            <div className="pt-2 border-t border-white/10">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Navigation</p>
              <div className="space-y-1">
                {menuItems.filter(i => !i.isAccordion).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsMenuOpen(false);
                      item.onClick();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white transition"
                  >
                    <span className="text-slate-400">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-5 border-t border-white/10 bg-white/5">
            {isLoggedIn ? (
              <div className="space-y-2">
                <button
                  onClick={goToDashboard}
                  className="w-full py-3 bg-emerald-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <FaColumns /> Go to Dashboard
                </button>
                <button
                  onClick={() => handleLogout(true)}
                  className="w-full py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded-xl font-bold text-xs"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { nav("/login"); setIsMenuOpen(false); }}
                className="w-full py-3 bg-emerald-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20"
              >
                Sign In to E-Karma
              </button>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default Nav;
