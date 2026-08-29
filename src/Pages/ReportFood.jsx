import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Nav from "../Components/Nav";
import AOS from "aos";
import {
  FaUtensils, FaClock, FaLayerGroup, FaMapMarkerAlt,
  FaHeart, FaShieldAlt, FaTruck, FaCheckCircle, FaLeaf, FaHandsHelping
} from "react-icons/fa";

// Fix for Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 16);
  }, [center]);
  return null;
}

function ReportLeftoverFood() {
  const navigate = useNavigate();
  
  // Form States
  const [position, setPosition] = useState([10.7867, 76.6548]);
  const [placeName, setPlaceName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [foodType, setFoodType] = useState("Veg");
  const [expiryTime, setExpiryTime] = useState("");
  const [notes, setNotes] = useState("");
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setLocationLoading(false);
        toast.success("Doorstep coordinates synced!");
      },
      () => {
        toast.error("Location access denied");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");

    if (!token) {
      toast.error("Please login to report surplus food");
      navigate("/login");
      return;
    }

    if (new Date(expiryTime) <= new Date()) {
      toast.error("Best before expiry time must be in the future!");
      return;
    }

    try {
      setLoading(true);
      const payload = { 
        placeName, 
        latitude: position[0], 
        longitude: position[1], 
        quantity: parseInt(quantity),
        foodType, 
        expiryTime, 
        notes 
      };

      await api.post("/report-leftover-food", payload);

      toast.success("Food Rescue Mission Dispatched! 🍲");
      setPlaceName("");
      setQuantity("");
      setFoodType("Veg");
      setExpiryTime("");
      setNotes("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reporting Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/60 via-orange-50/30 to-slate-100/80 text-slate-900 font-sans flex flex-col relative overflow-x-hidden selection:bg-amber-500 selection:text-white">
      {/* ── AMBIENT DECORATIVE GLOWS ── */}
      <div className="fixed top-10 left-10 w-[500px] h-[500px] bg-amber-200/40 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-[500px] h-[500px] bg-emerald-200/40 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Nav />

      {/* ── MAIN WORKSPACE (FULL-WIDTH 2-COLUMN BALANCED) ── */}
      <main className="flex-1 pt-[128px] md:pt-[88px] pb-10 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="w-full max-w-[1550px] mx-auto space-y-8">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* ── LEFT PANE: RESCUE PROTOCOL & IMPACT ── */}
            <div className="lg:col-span-5 bg-gradient-to-br from-amber-950 via-[#2d1a0e] to-slate-900 text-white rounded-3xl p-7 sm:p-9 border border-amber-800/50 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-8 relative z-10">
                <div>
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest">
                    Rescue Protocol
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-tight mt-1">
                    Safe Handling & Transit
                  </h2>
                </div>

                {/* 3 Step Guide */}
                <div className="space-y-5">
                  <div className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      01
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Freshness & Packaging</h4>
                      <p className="text-xs text-amber-100/70 mt-0.5 leading-relaxed">
                        Verify food is fresh and pre-packed in clean, covered containers.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      02
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Set Expiry Timestamp</h4>
                      <p className="text-xs text-amber-100/70 mt-0.5 leading-relaxed">
                        Accurate best-before limits ensure volunteers prioritize urgent collections.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      03
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Direct Distribution</h4>
                      <p className="text-xs text-amber-100/70 mt-0.5 leading-relaxed">
                        Surplus meals are routed straight to registered orphanages and community kitchens.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Impact Matrix */}
                <div className="pt-4 border-t border-amber-800/80">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-300 mb-3">
                    Impact Equivalents
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5 hover:bg-white/15 transition-colors">
                      <span className="text-lg">🍲</span>
                      <div>
                        <p className="font-black text-white">Zero Hunger Aid</p>
                        <p className="text-[10px] text-amber-200/70">Every 10 feeds 3</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5 hover:bg-white/15 transition-colors">
                      <span className="text-lg">🌱</span>
                      <div>
                        <p className="font-black text-white">Prevents Methane</p>
                        <p className="text-[10px] text-amber-200/70">Zero Landfill Gas</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5 hover:bg-white/15 transition-colors">
                      <span className="text-lg">🚚</span>
                      <div>
                        <p className="font-black text-white">Cold-Chain Route</p>
                        <p className="text-[10px] text-amber-200/70">Insulated Transit</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5 hover:bg-white/15 transition-colors">
                      <span className="text-lg">❤️</span>
                      <div>
                        <p className="font-black text-white">100% Non-Profit</p>
                        <p className="text-[10px] text-amber-200/70">Direct Delivery</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Guarantee */}
              <div className="pt-6 mt-6 border-t border-amber-800/80 text-[11px] font-bold text-amber-300 flex items-center justify-between relative z-10">
                <span className="text-amber-400">🛡️ Verified Shelter Network</span>
                <span>Hygienic Handover</span>
              </div>
            </div>

            {/* ── RIGHT PANE: FOOD DISPATCH FORM ── */}
            <div className="lg:col-span-7 bg-white/95 rounded-3xl p-7 sm:p-9 border border-amber-100 shadow-xl shadow-amber-950/5 backdrop-blur-md flex flex-col justify-center">
              <div className="pb-5 border-b border-slate-100 mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Food Rescue Mission Details
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Broadcast surplus details for immediate volunteer response.
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                  Priority Mission
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Location & Servings Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-amber-600" /> Pickup Location / Venue
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Royal Palace Banquet Hall, Rear Gate..."
                      value={placeName}
                      onChange={(e) => setPlaceName(e.target.value)}
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <FaUtensils className="text-amber-600" /> Estimated Servings (Count)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50 people"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Category & Expiry Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <FaLayerGroup className="text-amber-600" /> Food Category
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "Veg", label: "🥦 Veg" },
                        { id: "Non-Veg", label: "🥩 Non-Veg" },
                        { id: "Mix", label: "🍲 Mixed" }
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFoodType(cat.id)}
                          className={`py-3 px-2 rounded-2xl text-xs font-black transition-all border ${
                            foodType === cat.id
                              ? "bg-amber-50 text-amber-900 border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                              : "bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <FaClock className="text-amber-600" /> Best Before (Expiry)
                    </label>
                    <input
                      type="datetime-local"
                      value={expiryTime}
                      onChange={(e) => setExpiryTime(e.target.value)}
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all cursor-pointer"
                      required
                    />
                  </div>
                </div>

                {/* Map & Coordinates */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-amber-600" /> Exact Doorstep Coordinates
                    </label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 border border-amber-300 shadow-sm"
                    >
                      <span>📍</span>
                      <span>{locationLoading ? "Detecting…" : "Capture Location"}</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden h-[135px] w-full relative z-0 shadow-inner">
                    <MapContainer center={position} zoom={16} className="h-full w-full z-0" zoomControl={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={position} />
                      <MapUpdater center={position} />
                    </MapContainer>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1 block">
                    Packaging / Logistics Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    placeholder="E.g. Packed in insulated containers, call kitchen supervisor upon arrival..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-2 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all resize-none"
                  />
                </div>

                {/* Action Trigger */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-black py-3.5 px-6 rounded-2xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? "Dispatching Mission…" : "🚀 Broadcast Food Rescue Mission"}
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* ── BOTTOM FEATURE GUARANTEE STRIP ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-6">
            <div className="bg-white/90 rounded-3xl p-6 border border-slate-200/80 shadow-sm backdrop-blur-md flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center text-lg shrink-0">
                <FaClock />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">Priority Rescue SLA</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Surplus food requests are dispatched with highest priority for immediate shelter routing.
                </p>
              </div>
            </div>

            <div className="bg-white/90 rounded-3xl p-6 border border-slate-200/80 shadow-sm backdrop-blur-md flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                <FaHeart />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">Direct to Need</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Meals are delivered directly to verified orphanages, shelters, and community kitchens.
                </p>
              </div>
            </div>

            <div className="bg-white/90 rounded-3xl p-6 border border-slate-200/80 shadow-sm backdrop-blur-md flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center text-lg shrink-0">
                <FaShieldAlt />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">Hygienic Transit</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Volunteers follow strict food safety procedures and insulated temperature-safe handling.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default ReportLeftoverFood;

