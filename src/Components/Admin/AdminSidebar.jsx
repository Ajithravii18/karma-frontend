import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaFolderOpen,
  FaUsersCog,
  FaUserTimes,
  FaChartLine,
  FaRecycle,
  FaUtensils,
  FaUserShield,
  FaEdit,
  FaCheck,
  FaTimes,
  FaPhone,
  FaSpinner,
  FaChevronDown,
  FaChevronUp,
} from 'react-icons/fa';
import logo from '../../assets/logo.png';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from '../../firebaseconfig';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // --- Profile State ---
  const [adminName, setAdminName] = useState(localStorage.getItem('userName') || 'Admin');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [showProfile, setShowProfile] = useState(false);

  // --- Phone Change State ---
  const [phoneState, setPhoneState] = useState({
    show: false,
    newPhone: '',
    otp: '',
    step: 1,
    loading: false,
  });

  useEffect(() => {
    setNewName(localStorage.getItem('userName') || 'Admin');
  }, []);

  // Sync name from localStorage when updated elsewhere (e.g. Nav)
  useEffect(() => {
    const handleStorageUpdate = () => {
      setAdminName(localStorage.getItem('userName') || 'Admin');
    };
    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  // --- Handlers ---
  const handleUpdateName = async () => {
    if (!newName.trim()) return toast.error('Name cannot be empty');
    try {
      const res = await api.put('/api/update-profile', { name: newName });
      localStorage.setItem('userName', res.data.name);
      setAdminName(res.data.name);
      window.dispatchEvent(new Event('storage'));
      toast.success('Name updated!');
      setIsEditingName(false);
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!phoneState.newPhone) return toast.error('Enter new phone number');
    const formattedPhone = phoneState.newPhone.startsWith('+91')
      ? phoneState.newPhone
      : `+91${phoneState.newPhone}`;
    setPhoneState(prev => ({ ...prev, loading: true }));
    try {
      const check = await api.get(`/api/check-phone-availability?phone=${formattedPhone}`);
      if (check.data.exists) {
        setPhoneState(prev => ({ ...prev, loading: false }));
        return toast.error('Number already registered');
      }
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'admin-recaptcha-container', { size: 'invisible' });
      }
      const result = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      window.confirmationResult = result;
      toast.success('OTP sent!');
      setPhoneState(prev => ({ ...prev, step: 2, loading: false }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to send OTP. Try again.');
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      setPhoneState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleVerifyPhone = async () => {
    try {
      setPhoneState(prev => ({ ...prev, loading: true }));
      await window.confirmationResult.confirm(phoneState.otp);
      await api.patch('/api/update-phone', { newPhone: phoneState.newPhone });
      toast.success('Mobile updated! Please login again.');
      localStorage.clear();
      setTimeout(() => (window.location.href = '/login'), 1500);
    } catch (err) {
      toast.error('Invalid OTP. Try again.');
      setPhoneState(prev => ({ ...prev, loading: false }));
    }
  };

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

  const renderLinks = (links) =>
    links.map(link => {
      const isActive = currentPath === link.path;
      return (
        <button
          key={link.id}
          onClick={() => navigate(link.path)}
          className={`group flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
            isActive
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs'
              : 'text-slate-400 hover:bg-slate-800/70 hover:text-white border border-transparent'
          }`}
        >
          <div
            className={`p-2 rounded-lg transition-colors duration-200 flex items-center justify-center w-8 h-8 ${
              isActive
                ? 'bg-emerald-500/20 text-emerald-400'
                : `bg-slate-800/80 text-slate-400 group-hover:${link.bg} group-hover:${link.color}`
            }`}
          >
            <link.icon size={14} />
          </div>
          {link.label}
        </button>
      );
    });

  return (
    <aside className="hidden lg:flex w-64 bg-slate-900 flex-col fixed top-0 left-0 h-screen overflow-y-auto no-scrollbar hide-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden z-[150] border-r border-slate-800">
      {/* Invisible recaptcha anchor */}
      <div id="admin-recaptcha-container" />

      {/* Logo */}
      <div
        className="h-[68px] flex items-center gap-2.5 px-6 border-b border-slate-800/80 bg-slate-950/40 cursor-pointer shrink-0"
        onClick={() => navigate('/')}
      >
        <img src={logo} className="w-8" alt="E-Karma Logo" />
        <span className="text-base font-black tracking-tighter uppercase text-white">E-Karma</span>
        <span className="ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Admin
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1 p-4 flex-1">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-2">System</p>
        {renderLinks(systemLinks)}

        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-6">Analytics</p>
        {renderLinks(analyticsLinks)}
      </nav>

      {/* ── PROFILE SECTION ── */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">

        {/* Profile Card Toggle */}
        <button
          onClick={() => {
            setShowProfile(p => !p);
            setIsEditingName(false);
            setPhoneState({ show: false, newPhone: '', otp: '', step: 1, loading: false });
          }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition-all"
        >
          <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center shrink-0">
            <FaUserShield size={14} className="text-purple-400" />
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <p className="text-xs font-black text-white truncate">{adminName}</p>
            <p className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">Administrator</p>
          </div>
          {showProfile ? (
            <FaChevronDown size={10} className="text-slate-400 shrink-0" />
          ) : (
            <FaChevronUp size={10} className="text-slate-400 shrink-0" />
          )}
        </button>

        {/* Expanded Profile Panel */}
        {showProfile && (
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 space-y-4">

            {/* ── Edit Name ── */}
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <FaEdit size={9} /> Display Name
              </p>
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUpdateName()}
                    className="flex-1 bg-slate-900 border border-slate-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg outline-none focus:border-emerald-500 transition-colors placeholder-slate-600 min-w-0"
                    placeholder="Enter name..."
                  />
                  <button
                    onClick={handleUpdateName}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shrink-0"
                    title="Save"
                  >
                    <FaCheck size={10} />
                  </button>
                  <button
                    onClick={() => { setIsEditingName(false); setNewName(adminName); }}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all shrink-0"
                    title="Cancel"
                  >
                    <FaTimes size={10} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setIsEditingName(true); setNewName(adminName); }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50 hover:border-emerald-500/50 transition-all group"
                >
                  <span className="text-xs font-bold text-white truncate">{adminName}</span>
                  <FaEdit size={10} className="text-slate-500 group-hover:text-emerald-400 transition-colors shrink-0 ml-2" />
                </button>
              )}
            </div>

            {/* ── Change Mobile ── */}
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                <FaPhone size={9} /> Mobile Number
              </p>

              {!phoneState.show ? (
                <button
                  onClick={() => setPhoneState(prev => ({ ...prev, show: true, step: 1, newPhone: '', otp: '' }))}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50 hover:border-blue-500/50 transition-all group"
                >
                  <span className="text-xs font-bold text-slate-400">Change mobile...</span>
                  <FaPhone size={10} className="text-slate-500 group-hover:text-blue-400 transition-colors shrink-0 ml-2" />
                </button>
              ) : phoneState.step === 1 ? (
                <div className="space-y-2">
                  <input
                    type="tel"
                    maxLength={10}
                    value={phoneState.newPhone}
                    onChange={e => setPhoneState(prev => ({ ...prev, newPhone: e.target.value.replace(/\D/g, '') }))}
                    className="w-full bg-slate-900 border border-slate-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg outline-none focus:border-blue-500 transition-colors placeholder-slate-600"
                    placeholder="New 10-digit number"
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleSendPhoneOtp}
                      disabled={phoneState.loading || phoneState.newPhone.length !== 10}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase rounded-lg transition-all"
                    >
                      {phoneState.loading ? <FaSpinner className="animate-spin" size={10} /> : 'Send OTP'}
                    </button>
                    <button
                      onClick={() => setPhoneState({ show: false, newPhone: '', otp: '', step: 1, loading: false })}
                      className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-black rounded-lg transition-all"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] text-emerald-400 font-bold">OTP sent to +91{phoneState.newPhone}</p>
                  <input
                    type="tel"
                    maxLength={6}
                    value={phoneState.otp}
                    onChange={e => setPhoneState(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '') }))}
                    className="w-full bg-slate-900 border border-slate-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg outline-none focus:border-emerald-500 transition-colors placeholder-slate-600"
                    placeholder="Enter 6-digit OTP"
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleVerifyPhone}
                      disabled={phoneState.loading || phoneState.otp.length !== 6}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase rounded-lg transition-all"
                    >
                      {phoneState.loading ? <FaSpinner className="animate-spin" size={10} /> : <><FaCheck size={9} /> Verify</>}
                    </button>
                    <button
                      onClick={() => setPhoneState({ show: false, newPhone: '', otp: '', step: 1, loading: false })}
                      className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-black rounded-lg transition-all"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* System status */}
        <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">E-Karma Command</p>
          <p className="text-xs font-bold text-emerald-400 mt-0.5">● System Online</p>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;

