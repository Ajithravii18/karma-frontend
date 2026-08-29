import React, { useState, useEffect } from"react";
import { useNavigate } from"react-router-dom";
import toast from"react-hot-toast";
import api from"../utils/api";
import { MapContainer, TileLayer, Marker, useMap } from"react-leaflet";
import L from"leaflet";
import"leaflet/dist/leaflet.css";
import Nav from"../Components/Nav";
import AOS from"aos";
import { FaUtensils, FaClock, FaLayerGroup, FaMapMarkerAlt } from"react-icons/fa";

// Fix for Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:"https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
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
  const [foodType, setFoodType] = useState("Veg"); // New: Category
  const [expiryTime, setExpiryTime] = useState(""); // New: Dedicated Expiry
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
        toast.success("Location Synced");
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
      toast.error("Please login to report food");
      return;
    }

    // Validation: Ensure expiry is in the future
    if (new Date(expiryTime) <= new Date()) {
      toast.error("Expiry time must be in the future!");
      return;
    }

    try {
      setLoading(true);
      const payload = { 
        placeName, 
        latitude: position[0], 
        longitude: position[1], 
        quantity: parseInt(quantity), // Ensure number for analytics
        foodType, 
        expiryTime, 
        notes 
      };

      await api.post("/report-leftover-food", payload);

      toast.success("Mission Dispatched: Food Reported!");
      setPlaceName("");
      setQuantity("");
      setFoodType("Veg");
      setExpiryTime("");
      setNotes("");
      fetchPastFood();
    } catch (err) {
      toast.error(err.response?.data?.message ||"Reporting Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10 relative">
      <Nav />

      <section className="pt-[84px] pb-10 px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT PANE ── */}
          <div className="flex flex-col justify-between bg-amber-950 text-white rounded-[2.5rem] min-h-[680px] p-8 md:p-12">

            {/* Top content */}
            <div>
              {/* Badge pill */}
              <div className="bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full inline-flex items-center gap-2 mb-10">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Zero Hunger Initiative
              </div>

              {/* Heading */}
              <h1 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6">
                Turn Surplus<br />
                into<br />
                <span className="text-amber-400 italic">Sustainability.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-amber-200/60 text-base font-medium max-w-xs leading-relaxed">
                Your contribution prevents food waste and helps local communities.
                Fill in the specifics so our volunteers can act fast.
              </p>
            </div>

            {/* Bottom feature cards */}
            <div className="grid grid-cols-2 gap-4 mt-12">
              {/* Direct Impact */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <FaUtensils size={16} />
                </div>
                <h4 className="font-black text-white text-base mb-1">Direct Impact</h4>
                <p className="text-xs font-medium text-amber-200/50 leading-relaxed">
                  Meals go directly to those in need.
                </p>
              </div>

              {/* Fast Pickup */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                  <FaClock size={16} />
                </div>
                <h4 className="font-black text-white text-base mb-1">Fast Pickup</h4>
                <p className="text-xs font-medium text-amber-200/50 leading-relaxed">
                  Expiry tracking ensures food safety.
                </p>
              </div>
            </div>
          </div>


          {/* ── RIGHT PANE (FORM) ── */}
          <div className="bg-white rounded-[2.5rem] min-h-[680px] p-8 md:p-12 flex flex-col justify-center shadow-sm border border-slate-200">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Row 1 — Location & Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                    <FaMapMarkerAlt /> Pickup Location
                  </label>
                  <input
                    type="text"
                    placeholder="Restaurant / Event Name"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                    <FaUtensils /> Servings (Count)
                  </label>
                  <input
                    type="number"
                    placeholder="How many people?"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              {/* Row 2 — Category & Expiry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                    <FaLayerGroup /> Food Category
                  </label>
                  <select
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm cursor-pointer appearance-none"
                  >
                    <option value="Veg">🥦 Veg Only</option>
                    <option value="Non-Veg">🥩 Non-Veg</option>
                    <option value="Mix">🍲 Mixed Items</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                    <FaClock /> Best Before (Expiry)
                  </label>
                  <input
                    type="datetime-local"
                    value={expiryTime}
                    onChange={(e) => setExpiryTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              {/* Map section */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="w-full py-3.5 bg-emerald-50 text-emerald-700 font-black text-[11px] uppercase tracking-widest rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                >
                  <FaMapMarkerAlt />
                  {locationLoading ? "Detecting Location…" : "Pin Current Location"}
                </button>
                <div className="border-2 border-slate-100 rounded-2xl overflow-hidden h-[180px] w-full relative z-0">
                  <MapContainer center={position} zoom={16} className="h-full w-full z-0">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={position} />
                    <MapUpdater center={position} />
                  </MapContainer>
                </div>
              </div>

              {/* Additional Instructions */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                  Additional Instructions
                </label>
                <textarea
                  placeholder="E.g. Take from back gate, items are pre-packed..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all text-sm min-h-[100px] resize-none"
                />
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? "Syncing with Cloud…" : "🚀 Dispatch Report"}
                </button>
              </div>
            </form>
          </div>

        </div>
      </section>
    </div>
  );
}

export default ReportLeftoverFood;

