import React, { useState, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Nav from "../Components/Nav";
import AOS from "aos";
import {
  FaMapMarkerAlt, FaCrosshairs, FaRecycle, FaShieldAlt,
  FaTruck, FaClock, FaLeaf, FaBoxOpen, FaCheckCircle, FaAward
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
    timeSlot: "9AM-12PM",
    description: "",
    lat: null,
    lng: null
  });

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    requestLocation();
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
        toast.success("Doorstep GPS coordinates locked!");
      },
      (error) => {
        setLocationStatus("error");
        toast.error("Please enable location access for doorstep accuracy.");
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
      toast.error("Please lock your doorstep location before submitting.");
      requestLocation();
      return;
    }

    try {
      setLoading(true);
      await api.post("/schedule-pickup", form);
      toast.success("Pickup Mission Dispatched Successfully! 🚀");
      setForm({
        address: "", wasteType: "", pickupDate: "", timeSlot: "9AM-12PM", description: "",
        lat: form.lat, lng: form.lng
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 font-sans flex flex-col relative overflow-x-hidden selection:bg-emerald-500 selection:text-white">
      {/* ── AMBIENT GLOW MESHES ── */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-10 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      <Nav />

      {/* ── HERO BANNER ── */}
      <section className="pt-[96px] pb-6 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="w-full max-w-[1550px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
              <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                Smart Eco Logistics • Doorstep Collection
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Schedule a <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 italic">Waste & Recyclable</span> Pickup
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-3xl font-medium leading-relaxed">
              Select your segregated waste streams and preferred time window. We connect you directly with certified volunteers for prompt zero-landfill collection.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 shrink-0 overflow-x-auto pb-2 lg:pb-0">
            <div className="px-5 py-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl min-w-[135px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Avg. Response</p>
              <p className="text-lg font-black text-white mt-0.5">⚡ &lt; 15 Mins</p>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 backdrop-blur-xl min-w-[135px]">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Diversion Rate</p>
              <p className="text-lg font-black text-emerald-300 mt-0.5">🌱 98.4%</p>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl min-w-[135px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Verification</p>
              <p className="text-lg font-black text-white mt-0.5">🛡️ 100% Eco</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN WORKSPACE (FULL-WIDTH 2-COLUMN BALANCED) ── */}
      <main className="flex-1 py-4 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="w-full max-w-[1550px] mx-auto space-y-8">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* ── LEFT PANE: WORKFLOW & ACCEPTED MATERIALS ── */}
            <div className="lg:col-span-5 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 rounded-3xl p-7 sm:p-9 border border-slate-800/90 shadow-2xl backdrop-blur-xl flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-8 relative z-10">
                <div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                    Collection Protocol
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-tight mt-1">
                    How Doorstep Pickup Works
                  </h2>
                </div>

                {/* 3 Step Guide */}
                <div className="space-y-5">
                  <div className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-emerald-500/10">
                      01
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Choose Waste Category</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Group plastic, dry recyclables, paper, or electronic items for sorting.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-emerald-500/10">
                      02
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Pin Doorstep GPS</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        Accurate coordinate locks ensure volunteers reach your exact entrance.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-lg shadow-emerald-500/10">
                      03
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Handover to Volunteer</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                        The collector arrives during your selected window and transports items to certified hubs.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Material Stream Matrix */}
                <div className="pt-4 border-t border-slate-800/80">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    Accepted Streams
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5 hover:border-slate-700 transition-colors">
                      <span className="text-lg">♻️</span>
                      <div>
                        <p className="font-black text-slate-200">Plastics & Polymers</p>
                        <p className="text-[10px] text-slate-500">Bottles, Wraps</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5 hover:border-slate-700 transition-colors">
                      <span className="text-lg">💻</span>
                      <div>
                        <p className="font-black text-slate-200">E-Waste & Scrap</p>
                        <p className="text-[10px] text-slate-500">Cables, Circuit boards</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5 hover:border-slate-700 transition-colors">
                      <span className="text-lg">📦</span>
                      <div>
                        <p className="font-black text-slate-200">Cardboard & Paper</p>
                        <p className="text-[10px] text-slate-500">Cartons, Newsprint</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center gap-2.5 hover:border-slate-700 transition-colors">
                      <span className="text-lg">🍾</span>
                      <div>
                        <p className="font-black text-slate-200">Glass & Metals</p>
                        <p className="text-[10px] text-slate-500">Bottles, Cans</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Guarantee */}
              <div className="pt-6 mt-6 border-t border-slate-800/80 text-[11px] font-bold text-slate-400 flex items-center justify-between relative z-10">
                <span className="text-emerald-400">🌱 Zero Landfill Commitment</span>
                <span>Verified Eco Handlers</span>
              </div>
            </div>

            {/* ── RIGHT PANE: DISPATCH FORM ── */}
            <div className="lg:col-span-7 bg-gradient-to-br from-slate-900/95 via-slate-900/85 to-slate-950/95 rounded-3xl p-7 sm:p-9 border border-slate-800/90 shadow-2xl backdrop-blur-xl flex flex-col justify-center">
              <div className="pb-5 border-b border-slate-800/80 mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    Pickup Request Details
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Provide your address and preferred collection time slot.
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Ready to Dispatch
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Address */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <FaMapMarkerAlt className="text-emerald-400" /> Pickup Address / House Number
                  </label>
                  <input
                    type="text"
                    name="address"
                    placeholder="e.g. Flat 402, Green Ridge Apartments, 5th Cross..."
                    value={form.address}
                    onChange={handleChange}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm font-medium text-white placeholder-slate-500 focus:bg-slate-950 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all"
                    required
                  />
                </div>

                {/* Waste Type & Pickup Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 block">
                      Waste Stream Category
                    </label>
                    <select
                      name="wasteType"
                      value={form.wasteType}
                      onChange={handleChange}
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm font-bold text-slate-200 focus:bg-slate-950 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer"
                      required
                    >
                      <option value="" className="bg-slate-900 text-slate-400">Select Category...</option>
                      <option value="Plastic" className="bg-slate-900 text-white">♻️ Plastic & Dry Waste</option>
                      <option value="Food" className="bg-slate-900 text-white">🍃 Organic & Food Waste</option>
                      <option value="E-Waste" className="bg-slate-900 text-white">💻 Electronics & E-Waste</option>
                      <option value="Paper" className="bg-slate-900 text-white">📦 Paper & Cardboard</option>
                      <option value="Glass" className="bg-slate-900 text-white">🍾 Glass & Bottles</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 block">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      name="pickupDate"
                      min={today}
                      value={form.pickupDate}
                      onChange={handleChange}
                      className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm font-bold text-slate-200 focus:bg-slate-950 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all cursor-pointer"
                      required
                    />
                  </div>
                </div>

                {/* Time Window Buttons */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 block">
                    Collection Time Window
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
                        className={`py-3 px-3 rounded-2xl border text-left transition-all ${
                          form.timeSlot === slot.id
                            ? "bg-emerald-500/20 border-emerald-400 text-emerald-200 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/15"
                            : "bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-900 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-black">
                          <span>{slot.icon}</span>
                          <span className="text-white">{slot.label}</span>
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">{slot.time}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1 block">
                    Special Handover Instructions <span className="text-slate-500 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    name="description"
                    placeholder="E.g. Placed outside gate, ring bell on arrival, bags pre-sorted..."
                    value={form.description}
                    onChange={handleChange}
                    rows={2}
                    className="w-full bg-slate-950/70 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-sm font-medium text-white placeholder-slate-500 focus:bg-slate-950 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                  />
                </div>

                {/* GPS Pin & Submit Action */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3 items-stretch">
                  <button
                    type="button"
                    onClick={requestLocation}
                    className={`py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider border transition-all flex items-center justify-center gap-2 shrink-0 ${
                      locationStatus === "success"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/20"
                        : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    <FaCrosshairs className={locationStatus === "loading" ? "animate-spin" : ""} size={13} />
                    {locationStatus === "success" ? "✓ Doorstep GPS Locked" : "Capture Doorstep GPS"}
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.99] text-slate-950 font-black py-3.5 px-6 rounded-2xl text-sm uppercase tracking-wider transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? "Transmitting Mission..." : "🚀 Confirm Pickup Schedule"}
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* ── BOTTOM FEATURE GUARANTEE STRIP ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-6">
            <div className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800/80 shadow-lg backdrop-blur-xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-lg shrink-0">
                <FaShieldAlt />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">100% Certified Recovery</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  All collected dry waste is weighed and transferred to authorized municipal recyclers.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800/80 shadow-lg backdrop-blur-xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-lg shrink-0">
                <FaClock />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">Punctual Time Slots</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Volunteers adhere strictly to your selected window for zero disruption to your routine.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800/80 shadow-lg backdrop-blur-xl flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center text-lg shrink-0">
                <FaAward />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">Earn Karma Points</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Every completed pickup adds verified green points to your environmental impact profile.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default SchedulePickup;

