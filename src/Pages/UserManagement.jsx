import React, { useState, useEffect, useMemo } from "react";
import api from "../utils/api";
import {
  FaArrowLeft, FaExchangeAlt, FaSearch, FaUserShield,
  FaUser, FaCircle, FaDatabase, FaShieldAlt, FaUsers, FaUserTie,
  FaSnowflake, FaUnlock, FaStar, FaInfoCircle, FaCalendarAlt,
  FaTrash, FaTrashAlt
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Nav from "../Components/Nav";
import AdminSidebar from "../Components/Admin/AdminSidebar";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all"); // New Availability Filter
  const navigate = useNavigate();


  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(searchTerm);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchUsers = async (query = "") => {
    try {
      setLoading(true);
      const res = await api.get(`/api/users?search=${query}`);
      const filtered = res.data.filter((u) => u.role !== "admin");
      setUsers(filtered);
    } catch (err) {
      toast.error("Systems Offline: Access Denied");
    } finally {
      setLoading(false);
    }
  };

  // Logic for Segmented Counts
  const counts = useMemo(() => ({
    total: users.length,
    citizens: users.filter(u => u.role === 'user').length,
    volunteers: users.filter(u => u.role === 'volunteer').length,
    freeVolunteers: users.filter(u => u.role === 'volunteer' && !u.isBusy).length,
    busyVolunteers: users.filter(u => u.role === 'volunteer' && u.isBusy).length
  }), [users]);

  // Logic for Filtering Table Rows
  const filteredUsers = useMemo(() => {
    let list = users;
    if (roleFilter !== "all") {
      list = list.filter(u => u.role === (roleFilter === "citizens" ? "user" : "volunteer"));
    }
    if (availabilityFilter !== "all" && roleFilter === "volunteers") {
      list = list.filter(u => availabilityFilter === "busy" ? u.isBusy : !u.isBusy);
    }
    return list;
  }, [users, roleFilter, availabilityFilter]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, availabilityFilter]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === "user" ? "volunteer" : "user";
    if (newRole === "volunteer" && !window.confirm("Promoting to Volunteer will automatically assign a unique Agent ID (e.g. volunteer_e101). Proceed?")) return;

    try {
      await api.patch(`/api/admin/update-role/${userId}`, { newRole });
      toast.success(`NODE UPDATED: ${newRole.toUpperCase()}`);
      fetchUsers(searchTerm);
    } catch (err) {
      toast.error("Protocol Error: Update Failed");
    }
  };

  const handleToggleFreeze = async (userId, isCurrentlyFrozen) => {
    const action = isCurrentlyFrozen ? "UNFREEZE" : "FREEZE";
    if (!window.confirm(`Are you sure you want to ${action} this account?`)) return;

    try {
      await api.patch(`/api/admin/freeze-user/${userId}`);
      toast.success(`PROTOCOL: ACCOUNT ${action}ED`);
      fetchUsers(searchTerm);
    } catch (err) {
      toast.error("Action Failed");
    }
  };

  const handleDeleteUser = async (userId, userName, role) => {
    const promptReason = window.prompt(
      `⚠️ PERMANENT ACCOUNT TERMINATION:\nAre you sure you want to permanently delete the ${role} account for "${userName || 'this user'}"?\n\nEnter reason for administrative deletion (optional):`,
      "Administrative termination by Admin HQ"
    );

    if (promptReason === null) return; // User cancelled

    try {
      setLoading(true);
      const res = await api.delete(`/api/admin/delete-user/${userId}`, {
        data: { reason: promptReason }
      });
      toast.success(res.data?.message || "Account permanently deleted and logged to archives.");
      fetchUsers(searchTerm);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user account.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex pb-20">
      <Nav />
      <div className="flex pt-[68px] min-h-screen w-full">
        <AdminSidebar />
        <main className="flex-1 lg:ml-64 w-full p-4 md:p-8 overflow-x-hidden">

        {/* --- SYSTEM HEADER --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 border-b border-slate-200 pb-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="px-3 py-1 bg-slate-900 text-white rounded-full flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-slate-900/20"
              >
                <FaArrowLeft size={10} />
                <span className="text-[9px] font-black uppercase tracking-widest">Return</span>
              </button>
              <div className="px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20 flex items-center gap-2">
                <FaCircle className="text-indigo-500 animate-pulse" size={6} />
                <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">Network Registry</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 flex items-center gap-4 mt-4 uppercase">
              CITIZEN <span className="text-slate-400 font-thin italic">CONTROL</span>
            </h1>
          </div>

          {/* SEARCH & FILTERS */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="EXECUTE SEARCH..."
                className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
            {roleFilter === "volunteers" && (
              <div className="flex w-full sm:w-auto bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto no-scrollbar">
                {["all", "free", "busy"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setAvailabilityFilter(type)}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${availabilityFilter === type ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- COUNT METRICS --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div onClick={() => { setRoleFilter("all"); setAvailabilityFilter("all"); }} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${roleFilter === 'all' ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white border-transparent text-slate-900 hover:border-slate-200'}`}>
            <div className="flex justify-between items-center">
              <FaUsers size={24} className={roleFilter === 'all' ? 'text-emerald-400' : 'text-slate-300'} />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Nodes</span>
            </div>
            <h2 className="text-4xl font-black mt-4">{counts.total}</h2>
          </div>

          <div onClick={() => setRoleFilter("citizens")} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${roleFilter === 'citizens' ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl' : 'bg-white border-transparent text-slate-900 hover:border-emerald-200'}`}>
            <div className="flex justify-between items-center">
              <FaUser size={20} className={roleFilter === 'citizens' ? 'text-white' : 'text-emerald-500'} />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Citizens</span>
            </div>
            <h2 className="text-4xl font-black mt-4">{counts.citizens}</h2>
          </div>

          <div onClick={() => { setRoleFilter("volunteers"); setAvailabilityFilter("free"); }} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${roleFilter === 'volunteers' && availabilityFilter === 'free' ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-transparent text-slate-900 hover:border-indigo-200'}`}>
            <div className="flex justify-between items-center">
              <FaUserShield size={20} className={roleFilter === 'volunteers' && availabilityFilter === 'free' ? 'text-white' : 'text-indigo-500'} />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Free Agents</span>
            </div>
            <h2 className="text-4xl font-black mt-4">{counts.freeVolunteers}</h2>
          </div>

          <div onClick={() => { setRoleFilter("volunteers"); setAvailabilityFilter("busy"); }} className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${roleFilter === 'volunteers' && availabilityFilter === 'busy' ? 'bg-amber-500 border-amber-500 text-white shadow-xl' : 'bg-white border-transparent text-slate-900 hover:border-amber-200'}`}>
            <div className="flex justify-between items-center">
              <FaShieldAlt size={20} className={roleFilter === 'volunteers' && availabilityFilter === 'busy' ? 'text-white' : 'text-amber-500'} />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">In Task</span>
            </div>
            <h2 className="text-4xl font-black mt-4">{counts.busyVolunteers}</h2>
          </div>
        </div>

        {/* --- USER LEDGER --- */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* DESKTOP TABLE */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Identity Node</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Role & Rating</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Occupancy</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Security State</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-center">Protocol Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.length > 0 ? (
                  currentItems.map((u) => (
                    <tr key={u._id} className="group hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs ${
                            u.role === 'volunteer' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          }`}>
                            {u.role === 'volunteer' ? <FaShieldAlt size={16} /> : <FaUser size={16} />}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-900">{u.name || "Unnamed User"}</p>
                            <p className="text-[10px] font-mono font-medium text-slate-400">{u.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                            u.role === 'volunteer'
                              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}>
                            {u.role}
                          </span>
                          {u.role === 'volunteer' && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <FaStar className="text-amber-400" size={10} />
                              <span className="text-xs font-bold text-slate-700">{u.averageRating || "0.0"}</span>
                              <span className="text-[10px] text-slate-400">({u.reviewCount || 0})</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.role === 'volunteer' ? (
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase tracking-wider ${
                            u.isBusy ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${u.isBusy ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                            {u.isBusy ? "In Mission" : "Available"}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-300 font-bold">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-[10px] uppercase tracking-wider ${
                          u.isFrozen ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          {u.isFrozen ? <><FaSnowflake className="text-rose-500 animate-pulse" /> Frozen</> : <><FaShieldAlt className="text-emerald-500" /> Active</>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleToggleRole(u._id, u.role)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-xs active:scale-95 border ${
                              u.role === 'user'
                                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                            title={`Change role to ${u.role === 'user' ? 'Volunteer' : 'Citizen'}`}
                          >
                            <FaExchangeAlt size={9} /> Role
                          </button>

                          <button
                            onClick={() => handleToggleFreeze(u._id, u.isFrozen)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-xs active:scale-95 border ${
                              u.isFrozen
                                ? 'bg-slate-900 hover:bg-black text-white border-slate-900'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                            }`}
                            title={u.isFrozen ? "Unfreeze Account" : "Freeze Account"}
                          >
                            {u.isFrozen ? <><FaUnlock size={9} /> Unfreeze</> : <><FaSnowflake size={9} /> Freeze</>}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u._id, u.name, u.role)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 shadow-xs active:scale-95"
                            title="Permanently Delete Account"
                          >
                            <FaTrash size={9} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-24 text-center">
                      <FaDatabase className="mx-auto text-slate-300 mb-3" size={32} />
                      <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">No matching users found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="lg:hidden p-4 space-y-4">
             {currentItems.length > 0 ? (
               currentItems.map((u) => (
                 <div key={u._id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs border ${
                          u.role === 'volunteer' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        }`}>
                           {u.role === 'volunteer' ? <FaShieldAlt size={16} /> : <FaUser size={16} />}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{u.name || "Unnamed User"}</h3>
                          <p className="text-[10px] font-mono text-slate-400">{u.phone}</p>
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wider ${
                        u.isFrozen ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                         {u.isFrozen ? "Frozen" : "Active"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                       <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Role</p>
                          <p className={`text-xs font-black uppercase ${u.role === 'volunteer' ? 'text-indigo-600' : 'text-emerald-600'}`}>{u.role}</p>
                       </div>
                       <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Availability</p>
                          <p className={`text-xs font-bold ${u.role === 'volunteer' ? (u.isBusy ? 'text-amber-600' : 'text-emerald-600') : 'text-slate-400'}`}>
                             {u.role === 'volunteer' ? (u.isBusy ? "In Mission" : "Available") : "N/A"}
                          </p>
                       </div>
                    </div>

                    <div className="flex gap-2 pt-1 border-t border-slate-100">
                       <button
                         onClick={() => handleToggleRole(u._id, u.role)}
                         className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                           u.role === 'user' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                         }`}
                       >
                         <FaExchangeAlt size={9} /> Role
                       </button>
                       <button
                         onClick={() => handleToggleFreeze(u._id, u.isFrozen)}
                         className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
                           u.isFrozen ? 'bg-slate-900 text-white border-slate-900' : 'bg-amber-50 text-amber-700 border-amber-200'
                         }`}
                       >
                         {u.isFrozen ? <FaUnlock size={9} /> : <FaSnowflake size={9} />}
                         {u.isFrozen ? "Unfreeze" : "Freeze"}
                       </button>
                       <button
                         onClick={() => handleDeleteUser(u._id, u.name, u.role)}
                         className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white"
                       >
                         <FaTrash size={9} /> Delete
                       </button>
                    </div>
                 </div>
               ))
             ) : (
               <div className="py-16 text-center">
                 <FaDatabase className="mx-auto text-slate-300 mb-3" size={28} />
                 <p className="text-xs font-bold uppercase text-slate-400">No users found</p>
               </div>
             )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 p-8 border-t border-slate-100">
                  <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-10 h-10 flex justify-center items-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 disabled:opacity-50 shadow-sm transition-all font-black text-[12px]"
                  >
                      &lt;
                  </button>
                  <span className="text-[11px] font-black uppercase text-slate-500">
                      Page <span className="text-indigo-600">{currentPage}</span> of {totalPages}
                  </span>
                  <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="w-10 h-10 flex justify-center items-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 disabled:opacity-50 shadow-sm transition-all font-black text-[12px]"
                  >
                      &gt;
                  </button>
              </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
};

export default UserManagement;
