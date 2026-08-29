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
  FaUtensils, FaClock, FaLayerGroup, FaMapMarkerAlt, FaHistory,
  FaHeart, FaShieldAlt, FaTruck, FaCheckCircle, FaLeaf
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

  const [pastFood, setPastFood] = useState([]);
  const [loadingFood, setLoadingFood] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchPastFood = async () => {
    try {
      setLoadingFood(true);
      const res = await api.get("/api/my-food");
      setPastFood(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFood(false);
    }
  };

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    fetchPastFood();
  }, []);

  const getCurrentLocation = () => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setLocationLoading(false);
        toast.success("Doorstep Coordinates Synced");
      },
      () => {
        toast.error("Location access denied");
        setLocationLoading(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");

    if (!token) {
      toast.error("Please login to report surplus food");
      return;
    }

    if (new Date(expiryTime) <= new Date()) {
      toast.error("Best before expiry must be in the future!");
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

      toast.success("Food Rescue Mission Dispatched!");
      setPlaceName("");
      setQuantity("");
      setFoodType("Veg");
      setExpiryTime("");
      setNotes("");
      fetchPastFood();
    } catch (err) {
      toast.error(err.response?.data?.message || "Reporting Failed");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(pastFood.length / itemsPerPage);
  const currentRecords = pastFood.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col">
      <Nav />

      {/* ── TOP HERO BANNER & METRICS ── */}
      <section className="pt-[88px] pb-6 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200/60 rounded-full">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                Zero Hunger Network • Rapid Food Rescue
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Turn Surplus into <span className="text-amber-600 italic">Community Nourishment</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-base max-w-2xl font-medium leading-relaxed">
              Connect edible food surplus from weddings, banquets, restaurants, and corporate cafeterias directly with local shelter distribution hubs before expiration.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 overflow-x-auto pb-2 md:pb-0">
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-left min-w-[130px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Meals Rescued</p>
              <p className="text-lg font-black text-slate-800 mt-0.5">🍲 85,000+</p>
            </div>
            <div className="px-4 py-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-left min-w-[130px]">
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Pickup SLA</p>
              <p className="text-lg font-black text-amber-800 mt-0.5">⏱️ &lt; 45 Mins</p>
            </div>
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-left min-w-[130px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Shelter Network</p>
              <p className="text-lg font-black text-slate-800 mt-0.5">❤️ 120+ Hubs</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* TWO COLUMN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ── LEFT PANE: HYGIENE PROTOCOL & IMPACT ── */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Food Safety & Triage Protocol */}
              <div className="bg-amber-950 text-white rounded-3xl p-6 sm:p-8 border border-amber-900 shadow-sm relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
                
                <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-4">
                  Rescue & Safety Protocol
                </h3>
                
                <div className="space-y-5 relative z-10">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                      01
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Freshness & Temperature Check</h4>
                      <p className="text-xs text-amber-200/60 mt-0.5 leading-relaxed">
                        Verify meals were prepared in hygienic conditions and packaged in sealed, food-grade containers.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                      02
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Precise Expiry Timestamp</h4>
                      <p className="text-xs text-amber-200/60 mt-0.5 leading-relaxed">
                        Providing accurate best-before time enables volunteers to prioritize expedited cold-chain logistics.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                      03
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Direct Distribution to Verified Shelters</h4>
                      <p className="text-xs text-amber-200/60 mt-0.5 leading-relaxed">
                        Collected meals are transported directly to vetted orphanages, night shelters, and welfare centers.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Impact Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Environmental & Social Impact
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100">
                    <span className="text-base">🍲</span>
                    <p className="font-black text-amber-950 mt-1">Zero Hunger Aid</p>
                    <p className="text-[10px] text-amber-700 mt-0.5">Every 10 servings feeds 3 needy families.</p>
                  </div>
                  <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                    <span className="text-base">🌱</span>
                    <p className="font-black text-emerald-950 mt-1">Methane Prevention</p>
                    <p className="text-[10px] text-emerald-700 mt-0.5">Prevents landfill greenhouse gas emission.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* ── RIGHT PANE: FOOD DISPATCH CONSOLE ── */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Dispatch Food Rescue Mission
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Broadcast surplus details for immediate volunteer response and pickup.
                  </p>
                </div>
                <span className="text-xs font-black px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                  Priority Rescue
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Location & Servings Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-amber-500" /> Pickup Location / Kitchen
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Royal Palace Banquet Hall, Main Gate..."
                      value={placeName}
                      onChange={(e) => setPlaceName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <FaUtensils className="text-amber-500" /> Estimated Servings (Count)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 50 people"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Food Category & Expiry Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <FaLayerGroup className="text-amber-500" /> Category Selection
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
                          className={`py-2.5 px-2 rounded-2xl text-xs font-black transition-all border ${
                            foodType === cat.id
                              ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                              : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <FaClock className="text-amber-500" /> Best Before (Expiry Time)
                    </label>
                    <input
                      type="datetime-local"
                      value={expiryTime}
                      onChange={(e) => setExpiryTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all cursor-pointer"
                      required
                    />
                  </div>
                </div>

                {/* Map & Coordinates */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-amber-500" /> Exact Doorstep Coordinates
                    </label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-xl transition-all flex items-center gap-1.5 border border-emerald-200"
                    >
                      <span>📍</span>
                      <span>{locationLoading ? "Detecting…" : "Capture Location"}</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden h-[150px] w-full relative z-0 shadow-inner">
                    <MapContainer center={position} zoom={16} className="h-full w-full z-0" zoomControl={false}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={position} />
                      <MapUpdater center={position} />
                    </MapContainer>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Packaging / Logistics Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    placeholder="E.g. Packed in insulated containers, contact supervisor at rear entrance..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all resize-none"
                  />
                </div>

                {/* Action Trigger */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? "Dispatching Mission…" : "🚀 Broadcast Food Rescue Mission"}
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* ── LOWER SECTION: FOOD RESCUE HISTORY LEDGER ── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                  <FaHistory size={14} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Your Food Rescue Contribution Log</h3>
                  <p className="text-xs text-slate-400 font-medium">Real-time status of your food surplus reports and shelter deliveries.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 w-fit">
                {pastFood.length} Rescue Missions
              </span>
            </div>

            {loadingFood ? (
              <div className="py-12 text-center text-slate-400 font-bold text-sm">
                Loading rescue missions...
              </div>
            ) : pastFood.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FaHeart size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-sm text-slate-600">No food rescue reports yet</p>
                <p className="text-xs text-slate-400 mt-0.5">Use the console above whenever you have surplus meals to share.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
                      <th className="py-3 px-4">Venue / Kitchen</th>
                      <th className="py-3 px-4">Servings</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Best Before</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentRecords.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {item.placeName}
                          <span className="block text-[10px] text-slate-400 font-medium">{new Date(item.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {item.quantity} Servings
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                            {item.foodType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {item.expiryTime ? new Date(item.expiryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : "N/A"}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
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

export default ReportLeftoverFood;

