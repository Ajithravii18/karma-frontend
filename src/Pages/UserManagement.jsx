import React, { useState, useEffect, useMemo } from "react";
import api from "../utils/api";
import {
  FaArrowLeft, FaExchangeAlt, FaSearch, FaUserShield,
  FaUser, FaCircle, FaDatabase, FaShieldAlt, FaUsers, FaUserTie,
  FaSnowflake, FaUnlock
} from "react-icons/fa";

import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Nav from "../Components/Nav";

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


  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      <Nav />
      <div className="max-w-[1400px] mx-auto pt-32 px-8">

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
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                {["all", "free", "busy"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setAvailabilityFilter(type)}
                    className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${availabilityFilter === type ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
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
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-300/20 border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-10 py-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Identity Node</th>
                  <th className="px-10 py-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Role Status</th>
                  <th className="px-10 py-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Occupancy</th>
                  <th className="px-10 py-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Security State</th>
                  <th className="px-10 py-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] text-center">Protocol Management</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <tr key={u._id} className="group hover:bg-slate-50 transition-all duration-300">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-white shadow-lg transition-transform group-hover:scale-110 duration-500 ${u.role === 'volunteer' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                            {u.role === 'volunteer' ? <FaShieldAlt size={20} /> : <FaUser size={20} />}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-black uppercase text-slate-800">{u.name || "UNNAMED_NODE"}</p>
                            <p className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded w-fit">{u.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 transition-all ${u.role === 'volunteer'
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-700'
                          : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          }`}>
                          <span className="text-[10px] font-black uppercase tracking-[0.15em]">{u.role}</span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        {u.role === 'volunteer' ? (
                          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest ${u.isBusy ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-green-50 border-green-100 text-green-700'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${u.isBusy ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div>
                            {u.isBusy ? "In Task" : "Free"}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">N/A</span>
                        )}
                      </td>
                      <td className="px-10 py-8">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border font-black text-[9px] uppercase tracking-widest ${u.isFrozen ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-green-50 border-green-100 text-green-400'
                          }`}>
                          {u.isFrozen ? <><FaSnowflake className="animate-pulse" /> Frozen</> : <><FaShieldAlt /> Active</>}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex justify-center gap-4">
                          <button
                            onClick={() => handleToggleRole(u._id, u.role)}
                            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${u.role === 'user'
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200'
                              }`}
                          >
                            <FaExchangeAlt /> Role
                          </button>

                          <button
                            onClick={() => handleToggleFreeze(u._id, u.isFrozen)}
                            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${u.isFrozen
                              ? 'bg-slate-900 text-white hover:bg-black shadow-slate-200'
                              : 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white shadow-rose-100'
                              }`}
                          >
                            {u.isFrozen ? <><FaUnlock /> Unfreeze</> : <><FaSnowflake /> Freeze</>}
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-32 text-center bg-slate-50/50">
                      <FaDatabase className="mx-auto text-slate-200 mb-4" size={40} />
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Empty Cluster Found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;