import React, { useState, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Nav from "../Components/Nav";
import AOS from "aos";
import {
  FaMapMarkerAlt, FaCrosshairs, FaRecycle, FaBox, FaShieldAlt,
  FaTruck, FaHistory, FaCheckCircle, FaClock, FaCalendarAlt, FaLeaf
} from "react-icons/fa";

function SchedulePickup() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle, loading, success, error

  const [form, setForm] = useState({
    address: "",
    wasteType: "",
    pickupDate: "",
    timeSlot: "",
    description: "",
    lat: null,
    lng: null
  });

  const [pastPickups, setPastPickups] = useState([]);
  const [loadingPickups, setLoadingPickups] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchPastPickups = async () => {
    try {
      setLoadingPickups(true);
      const res = await api.get("/api/my-pickups");
      setPastPickups(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPickups(false);
    }
  };

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    requestLocation();
    fetchPastPickups();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported by your browser");
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm(prev => ({
          ...prev,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }));
        setLocationStatus("success");
        toast.success("Exact doorstep GPS captured!");
      },
      (error) => {
        setLocationStatus("error");
        toast.error("Please enable location for doorstep pickup accuracy.");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");
    if (!token) { toast.error("Please login to continue"); navigate("/login"); return; }

    if (!form.lat || !form.lng) {
      toast.error("Please allow location access to proceed.");
      requestLocation();
      return;
    }

    try {
      setLoading(true);
      await api.post("/schedule-pickup", form);
      toast.success("Pickup Mission Dispatched Successfully!");
      setForm({
        address: "", wasteType: "", pickupDate: "", timeSlot: "", description: "",
        lat: form.lat, lng: form.lng
      });
      fetchPastPickups();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const totalPages = Math.ceil(pastPickups.length / itemsPerPage);
  const currentRecords = pastPickups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col">
      <Nav />

      {/* ── TOP HERO BANNER & METRICS ── */}
      <section className="pt-[88px] pb-6 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200/60 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                AI Logistics Network • Doorstep Collection
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              On-Demand <span className="text-emerald-600 italic">Waste & Recyclable</span> Pickup
            </h1>
            <p className="text-slate-500 text-sm sm:text-base max-w-2xl font-medium leading-relaxed">
              Schedule convenient doorstep pickups for segregated recyclables, e-waste, and dry scrap. Our intelligent routing connects you with vetted community volunteers.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 overflow-x-auto pb-2 md:pb-0">
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-left min-w-[130px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Avg. Response</p>
              <p className="text-lg font-black text-slate-800 mt-0.5">⚡ &lt; 15 Mins</p>
            </div>
            <div className="px-4 py-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-left min-w-[130px]">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Diversion Rate</p>
              <p className="text-lg font-black text-emerald-800 mt-0.5">🌱 98.4%</p>
            </div>
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-left min-w-[130px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Verification</p>
              <p className="text-lg font-black text-slate-800 mt-0.5">🛡️ 100% Eco</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* TWO COLUMN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ── LEFT PANE: WORKFLOW & PROTOCOL ── */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Step-by-step dispatch workflow */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
                
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-4">
                  Collection Process
                </h3>
                
                <div className="space-y-5 relative z-10">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                      01
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Segregate Materials</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Group your recyclables into Dry, Plastic, or Electronics for streamlined sorting.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                      02
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Pin Exact Doorstep Coordinates</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        One-click GPS lock eliminates route navigation confusion for volunteers.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                      03
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Live Tracking & Verification</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Receive instant status alerts as volunteers collect and transport items to certified recovery centers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Accepted Materials Matrix */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Accepted Material Streams
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                    <span className="text-base">♻️</span>
                    <div>
                      <p className="font-black text-slate-800">Plastics & Polymers</p>
                      <p className="text-[10px] text-slate-400">PET, HDPE, Wraps</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                    <span className="text-base">💻</span>
                    <div>
                      <p className="font-black text-slate-800">E-Waste</p>
                      <p className="text-[10px] text-slate-400">Cables, Circuit boards</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                    <span className="text-base">📦</span>
                    <div>
                      <p className="font-black text-slate-800">Paper & Cardboard</p>
                      <p className="text-[10px] text-slate-400">Cartons, Newsprint</p>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
                    <span className="text-base">🍾</span>
                    <div>
                      <p className="font-black text-slate-800">Glass & Metals</p>
                      <p className="text-[10px] text-slate-400">Bottles, Tin cans</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ── RIGHT PANE: INTERACTIVE DISPATCH FORM ── */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Schedule Pickup Mission
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Fill in your pickup specifications below for instantaneous dispatcher broadcast.
                  </p>
                </div>
                <span className="text-xs font-black px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                  Ready to Dispatch
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Pickup Address */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <FaMapMarkerAlt className="text-emerald-500" /> Pickup Address / Landmark
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="e.g. Flat 402, Green Meadows, 12th Main Road..."
                    value={form.address}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                    required
                  />
                </div>

                {/* Waste Category & Date Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 block">
                      Waste Category
                    </label>
                    <select
                      name="wasteType"
                      value={form.wasteType}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all cursor-pointer"
                      required
                    >
                      <option value="">Select Waste Stream</option>
                      <option value="Plastic">♻️ Plastic & Dry Waste</option>
                      <option value="Food">🍃 Organic / Food Waste</option>
                      <option value="E-Waste">💻 Electronics & E-Waste</option>
                      <option value="Paper">📦 Paper & Cardboard</option>
                      <option value="Glass">🍾 Glass & Metals</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 block">
                      Pickup Date
                    </label>
                    <input
                      type="date"
                      name="pickupDate"
                      min={today}
                      value={form.pickupDate}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all cursor-pointer"
                      required
                    />
                  </div>
                </div>

                {/* Preferred Time Slot */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-2 block">
                    Preferred Time Window
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { id: "9AM-12PM", label: "Morning", time: "9 AM - 12 PM", icon: "🌅" },
                      { id: "12PM-3PM", label: "Afternoon", time: "12 PM - 3 PM", icon: "☀️" },
                      { id: "3PM-6PM", label: "Evening", time: "3 PM - 6 PM", icon: "🌆" }
                    ].map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setForm({ ...form, timeSlot: slot.id })}
                        className={`py-2.5 px-3 rounded-2xl border text-left transition-all ${
                          form.timeSlot === slot.id
                            ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-black">
                          <span>{slot.icon}</span>
                          <span>{slot.label}</span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">{slot.time}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Instructions */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Special Handover Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    name="description"
                    placeholder="Gate entry code, call on arrival, items pre-bagged in corridor..."
                    value={form.description}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none"
                  />
                </div>

                {/* GPS Pin & Action Trigger */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3 items-stretch">
                  <button
                    type="button"
                    onClick={requestLocation}
                    className={`py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider border transition-all flex items-center justify-center gap-2 shrink-0 ${
                      locationStatus === "success"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    <FaCrosshairs className={locationStatus === "loading" ? "animate-spin" : ""} size={14} />
                    {locationStatus === "success" ? "✓ Doorstep GPS Locked" : "Capture Doorstep GPS"}
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? "Transmitting Mission..." : "🚀 Transmit Pickup Request"}
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* ── LOWER SECTION: PERSONAL ACTIVITY & HISTORY LEDGER ── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <FaHistory size={14} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Your Scheduled Pickup Log</h3>
                  <p className="text-xs text-slate-400 font-medium">Real-time status of your active and past waste collection dispatches.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 w-fit">
                {pastPickups.length} Total Missions
              </span>
            </div>

            {loadingPickups ? (
              <div className="py-12 text-center text-slate-400 font-bold text-sm">
                Fetching dispatch ledger...
              </div>
            ) : pastPickups.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FaBox size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-sm text-slate-600">No scheduled pickups yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Use the dispatch console above to book your first collection.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
                      <th className="py-3 px-4">Date & Slot</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Address</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentRecords.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {item.pickupDate || new Date(item.createdAt).toLocaleDateString()}
                          <span className="block text-[10px] text-slate-400 font-medium">{item.timeSlot || "Standard"}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {item.wasteType}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                          {item.address}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {item.status || "Dispatched"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                    <p className="text-xs text-slate-400 font-bold">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default SchedulePickup;

