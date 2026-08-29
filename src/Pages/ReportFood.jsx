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
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Nav />

      <main className="flex-1 flex items-center justify-center px-4 py-8 pt-[88px]">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Card Top Banner */}
          <div className="bg-amber-950 px-6 sm:px-8 py-5 flex items-center justify-between border-b border-amber-900/50">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-500/20 rounded-full mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest">Food Rescue Initiative</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Turn Surplus into <span className="text-amber-400 italic">Community Impact</span>
              </h1>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 items-center justify-center text-amber-400 text-xl font-black">
              🍲
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            {/* Location & Servings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <FaMapMarkerAlt className="text-amber-500" /> Pickup Location / Venue
                </label>
                <input
                  type="text"
                  placeholder="Restaurant, Banquet hall, Address..."
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <FaUtensils className="text-amber-500" /> Est. Servings (People Count)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 25 people"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Food Category & Expiry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <FaLayerGroup className="text-amber-500" /> Category
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "Veg", label: "🥦 Veg" },
                    { id: "Non-Veg", label: "🥩 Non-Veg" },
                    { id: "Mix", label: "🍲 Mixed" }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFoodType(cat.id)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all border ${
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
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <FaClock className="text-amber-500" /> Best Before (Expiry)
                </label>
                <input
                  type="datetime-local"
                  value={expiryTime}
                  onChange={(e) => setExpiryTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Map & Location */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FaMapMarkerAlt className="text-amber-500" /> Exact Pinpoint
                </label>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5"
                >
                  <span>📍</span>
                  <span>{locationLoading ? "Detecting…" : "Auto-Pin Location"}</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden h-[120px] w-full relative z-0 shadow-inner">
                <MapContainer center={position} zoom={16} className="h-full w-full z-0" zoomControl={false}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={position} />
                  <MapUpdater center={position} />
                </MapContainer>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                Packaging / Handover Details <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <textarea
                placeholder="E.g. Packed in hot boxes, enter from rear kitchen entrance..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all resize-none"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Dispatching Report…" : "🚀 Dispatch Food Rescue"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default ReportLeftoverFood;

