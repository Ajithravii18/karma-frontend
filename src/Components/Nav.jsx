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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    setShowLogoutConfirm(false);
    setNotifications([]);
    setUserRole("user");
    if (showToast) toast.success("Logged out successfully");
    nav("/");
  };

  const promptLogout = () => {
    setShowDropdown(false);
    setIsMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    handleLogout(true);
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

  const dashboardRoutes = ["/dashboard", "/volunteer-portal", "/admin-dashboard", "/volunteer-history", "/admin", "/waste-analysis", "/food-analysis", "/user-management", "/deletion-logs", "/user-reports"];
  const isDashboard = dashboardRoutes.some(route => location.pathname.startsWith(route));

  // Service creation pages: only for /pick-up, /report-pollution, /report-food
  const serviceRoutes = ["/pick-up", "/report-pollution", "/report-food"];
  const isServicePage = !isDashboard && serviceRoutes.includes(location.pathname);

  return (
    <>
      <nav className={`fixed top-0 z-[100] transition-all duration-300 font-sans flex items-center ${
        isDashboard
          ? "h-[68px] w-full lg:w-[calc(100%-16rem)] left-0 lg:left-64 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-sm text-slate-800"
          : location.pathname === "/" && !isScrolled
            ? "w-full left-0 bg-transparent text-white py-5"
            : "h-[68px] w-full left-0 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-sm text-slate-800"
      }`}>

        <div className="w-full px-4 sm:px-6 flex items-center relative z-10 justify-between">

          {/* Left Side Group: Logo / Dashboard Greeting */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div onClick={handleHome} className={`cursor-pointer ${isDashboard ? 'lg:hidden' : ''}`}>
              <div className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95 border bg-white shadow-md border-slate-200/80">
                <img src={logo} className="w-7 h-7 object-contain" alt="E-Karma Logo" />
                <span className="text-base font-black tracking-tight uppercase text-slate-900">E-Karma</span>
              </div>
            </div>

            {/* Back to Home Button (Only on Service Pages) */}
            {isServicePage && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <button
                  onClick={handleHome}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 transition-all active:scale-95 shadow-xs"
                >
                  <span>←</span>
                  <span className="hidden sm:inline">Home</span>
                </button>
              </div>
            )}

            {/* Dashboard Greeting - Leftmost on Desktop */}
            {isDashboard && (
              <div className="hidden lg:flex flex-col">
                <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                  Welcome back, {userName?.split(' ')[0] || 'User'}! 👋
                </h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}

            {/* Dashboard Nav Shortcuts (Home & Services) */}
            {isDashboard && (
              <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200">
                <button
                  onClick={handleHome}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs transition-all active:scale-95"
                >
                  <span>🏠</span>
                  <span>Home</span>
                </button>

                {/* Services Dropdown in Dashboard - Citizen only */}
                {userRole !== "admin" && userRole !== "volunteer" && (
                  <div className="relative group/dashservices">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs transition-all">
                      <FaConciergeBell className="text-emerald-600" />
                      <span>Services</span>
                      <FaChevronDown className="text-[9px] text-slate-400" />
                    </button>
                    <div className="absolute left-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 opacity-0 invisible group-hover/dashservices:opacity-100 group-hover/dashservices:visible transition-all duration-200 transform group-hover/dashservices:translate-y-0 translate-y-2 z-50 overflow-hidden text-slate-800">
                      {services.map((service, index) => (
                        <button
                          key={index}
                          onClick={() => nav(service.path)}
                          className="flex items-center gap-3 w-full p-3 hover:bg-emerald-50/60 transition border-b border-slate-100 last:border-0 text-left"
                        >
                          <span className="text-base">{service.icon}</span>
                          <p className="font-bold text-slate-800 text-xs hover:text-emerald-700">{service.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Service Page Switcher Tabs */}
          {isServicePage && (
            <div className="hidden md:flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-xs gap-1">
              <button
                onClick={() => nav('/pick-up')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                  location.pathname === '/pick-up'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <span>♻️</span>
                <span>Waste Pickup</span>
              </button>
              <button
                onClick={() => nav('/report-pollution')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                  location.pathname === '/report-pollution'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                <span>🚨</span>
                <span>Pollution Spot</span>
              </button>
              <button
                onClick={() => nav('/report-food')}
                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                  location.pathname === '/report-food'
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
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
                  className={`font-semibold transition-all duration-200 py-2 text-sm relative group ${
                    location.pathname === "/" && !isScrolled 
                      ? "text-white hover:text-emerald-300 drop-shadow-sm"
                      : "text-slate-700 hover:text-emerald-600"
                  }`}>
                  {item.label}
                  <span className={`absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full ${
                    location.pathname === "/" && !isScrolled ? "bg-white" : "bg-emerald-600"
                  }`}></span>
                </button>
              ))}

              {/* Services Dropdown */}
              <div className="relative group">
                <button className={`font-semibold transition-all duration-200 py-2 text-sm flex items-center gap-1 ${
                  location.pathname === "/" && !isScrolled 
                    ? "text-white hover:text-emerald-300 drop-shadow-sm"
                    : "text-slate-700 hover:text-emerald-600"
                }`}>
                  Services <FaChevronDown className="text-[10px]" />
                </button>
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-2 z-50 overflow-hidden text-slate-800">
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
                      className="flex items-center gap-3 w-full p-3.5 hover:bg-emerald-50/60 transition border-b border-slate-100 last:border-0 text-left group/item"
                    >
                      <span className="text-lg">{service.icon}</span>
                      <p className="font-bold text-slate-800 text-xs group-hover/item:text-emerald-700 transition">{service.label}</p>
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
                {/* Notification Bell - Solid White */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2.5 rounded-xl transition-all cursor-pointer border bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80 shadow-md active:scale-95"
                    title="Notifications"
                  >
                    <FaBell size={16} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white animate-pulse">
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

                {/* Profile Pill - Solid White */}
                <div className="relative group/profile" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 border bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800 shadow-md"
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-xs ${userRole === 'admin' ? 'bg-purple-600' : userRole === 'volunteer' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                      {userRole === 'admin' ? <FaUserShield size={11} /> : (userName?.charAt(0).toUpperCase() || "U")}
                    </div>
                    <span className="font-bold text-xs hidden sm:inline truncate max-w-[100px] text-slate-800">{userName}</span>
                    <FaChevronDown className={`text-[9px] text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[110] overflow-hidden animate-in fade-in slide-in-from-top-2 text-slate-900">
                      <button onClick={goToDashboard} className="flex items-center gap-3 w-full text-left px-5 py-3.5 hover:bg-slate-50 text-slate-700 font-bold text-xs transition border-b border-slate-100">
                        <FaColumns className={userRole === 'admin' ? "text-purple-600" : "text-emerald-600"} />
                        {userRole === 'admin' ? "Admin Console" : "Dashboard"}
                      </button>
                      <button onClick={promptLogout} className="flex items-center gap-3 w-full text-left px-5 py-3.5 hover:bg-rose-50 text-rose-600 font-bold text-xs transition">
                        <FaSignOutAlt /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Sign In Button - Solid */
              <button
                onClick={() => nav("/login")}
                className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all active:scale-95 ${
                  location.pathname === "/" && !isScrolled
                    ? "bg-white text-emerald-950 hover:bg-slate-50 shadow-md border border-slate-200/80"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                }`}
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle - Solid White */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl transition-all duration-300 menu-toggle border bg-white hover:bg-slate-50 text-slate-800 border-slate-200/80 shadow-md active:scale-95"
              title="Open Menu"
            >
              {isMenuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE STICKY SERVICE SWITCHER SUB-BAR (ONLY ON SERVICE PAGES) ── */}
      {isServicePage && (
        <div className="fixed top-[68px] left-0 w-full z-40 bg-white/95 backdrop-blur-xl px-3 py-2 border-b border-emerald-100/90 shadow-xs md:hidden">
          <div className="w-full max-w-sm mx-auto grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80">
            <button
              onClick={() => nav('/pick-up')}
              className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                location.pathname === '/pick-up'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>♻️</span>
              <span>Waste</span>
            </button>
            <button
              onClick={() => nav('/report-pollution')}
              className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                location.pathname === '/report-pollution'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🚨</span>
              <span>Pollution</span>
            </button>
            <button
              onClick={() => nav('/report-food')}
              className={`py-2 px-1 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                location.pathname === '/report-food'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🍲</span>
              <span>Food</span>
            </button>
          </div>
        </div>
      )}

      {/* ── POLISHED LIGHT MOBILE DRAWER ── */}
      <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[150] transition-opacity duration-300 lg:hidden ${isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={() => setIsMenuOpen(false)}>
        <div ref={menuRef} className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white text-slate-900 shadow-2xl border-l border-slate-200 transition-transform duration-300 transform flex flex-col ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`} onClick={(e) => e.stopPropagation()}>
          
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50/50">
            <div className="flex items-center gap-2.5">
              <img src={logo} className="w-8 h-8 object-contain" alt="Logo" />
              <h2 className="font-black text-lg text-slate-900 tracking-tight uppercase">E-Karma</h2>
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="p-2 text-slate-400 hover:text-slate-700"><FaTimes size={20} /></button>
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
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{s.icon}</span>
                      <span>{s.label}</span>
                    </div>
                    <span className="text-slate-400 font-bold">→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation Links */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Navigation</p>
              <div className="space-y-1">
                {menuItems.filter(i => !i.isAccordion).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsMenuOpen(false);
                      item.onClick();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50/60 hover:text-emerald-700 transition"
                  >
                    <span className="text-slate-400">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/60">
            {isLoggedIn ? (
              <div className="space-y-2">
                <button
                  onClick={goToDashboard}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
                >
                  <FaColumns /> Go to Dashboard
                </button>
                <button
                  onClick={promptLogout}
                  className="w-full py-2.5 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl font-bold text-xs"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { nav("/login"); setIsMenuOpen(false); }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-sm"
              >
                Sign In to E-Karma
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ── SIGN OUT CONFIRMATION MODAL ── */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95 duration-200 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center text-xl shadow-inner">
              <FaSignOutAlt />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Sign Out of E-Karma?
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                Are you sure you want to end your active session? You will need to sign in again to access your dashboard.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95 border border-slate-200/80"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="flex-1 py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25 transition-all active:scale-95"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Nav;
