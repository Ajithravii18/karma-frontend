import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Nav from "../Components/Nav";
import AOS from "aos";
import { FaUtensils, FaClock, FaLayerGroup, FaMapMarkerAlt } from "react-icons/fa";

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
  const [foodType, setFoodType] = useState("Veg"); // New: Category
  const [expiryTime, setExpiryTime] = useState(""); // New: Dedicated Expiry
  const [notes, setNotes] = useState("");
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
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
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Reporting Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FDFDFD] min-h-screen">
      <Nav />
      
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* LEFT CONTENT: Impact Messaging */}
          <div className="lg:sticky lg:top-32 space-y-8">
            <div data-aos="fade-right" className="space-y-4">
              <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                Zero Waste Initiative
              </span>
              <h1 className="text-6xl font-black text-slate-900 leading-[1.1]">
                Turn Surplus into <br />
                <span className="text-green-600 italic">Sustainability.</span>
              </h1>
              <p className="text-slate-500 text-xl max-w-lg leading-relaxed">
                Your contribution prevents food waste and helps local communities. 
                Fill in the specifics so our volunteers can act fast.
              </p>
            </div>

            <div data-aos="fade-up" data-aos-delay="200" className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <FaUtensils className="text-green-500 mb-3" size={24} />
                <h4 className="font-bold text-slate-800">Direct Impact</h4>
                <p className="text-xs text-slate-400">Meals go directly to those in need.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <FaClock className="text-amber-500 mb-3" size={24} />
                <h4 className="font-bold text-slate-800">Fast Pickup</h4>
                <p className="text-xs text-slate-400">Expiry tracking ensures food safety.</p>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT: The Power Form */}
          <div data-aos="zoom-in" className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-50">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Row 1: Place & Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2">
                    <FaMapMarkerAlt /> Pickup Location
                  </label>
                  <input 
                    type="text" placeholder="Restaurant / Event Name" 
                    value={placeName} onChange={(e) => setPlaceName(e.target.value)} 
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-medium transition-all" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2">
                    <FaUtensils /> Servings (Count)
                  </label>
                  <input 
                    type="number" placeholder="How many people?" 
                    value={quantity} onChange={(e) => setQuantity(e.target.value)} 
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-medium transition-all" 
                    required 
                  />
                </div>
              </div>

              {/* Row 2: Category & Expiry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2">
                    <FaLayerGroup /> Food Category
                  </label>
                  <select 
                    value={foodType} onChange={(e) => setFoodType(e.target.value)}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold text-slate-600 outline-none appearance-none cursor-pointer"
                  >
                    <option value="Veg">🥦 Veg Only</option>
                    <option value="Non-Veg">🍖 Non-Veg</option>
                    <option value="Mix">🍱 Mixed Items</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2">
                    <FaClock /> Best Before (Expiry)
                  </label>
                  <input 
                    type="datetime-local" 
                    value={expiryTime} onChange={(e) => setExpiryTime(e.target.value)} 
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-medium text-slate-600" 
                    required 
                  />
                </div>
              </div>

              {/* Location Selector */}
              <div className="space-y-4">
                <button 
                  type="button" onClick={getCurrentLocation} 
                  className="w-full py-4 bg-emerald-50 text-emerald-700 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-100 transition-all flex items-center justify-center gap-3"
                >
                  {locationLoading ? "Analyzing Satellite Data..." : "📍 Pin Current Location"}
                </button>

                <div className="rounded-[2rem] overflow-hidden border-8 border-slate-50 h-56 shadow-inner relative group">
                  <MapContainer center={position} zoom={16} className="h-full w-full z-0">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={position} />
                    <MapUpdater center={position} />
                  </MapContainer>
                  <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-[1.5rem]"></div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Additional Instructions</label>
                <textarea 
                  placeholder="E.g. Take from back gate, items are pre-packed..." 
                  value={notes} onChange={(e) => setNotes(e.target.value)} 
                  rows="2" 
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-medium" 
                />
              </div>

              {/* Submit */}
              <button 
                type="submit" disabled={loading} 
                className="w-full py-5 bg-green-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 shadow-xl shadow-green-200 transition-all transform hover:-translate-y-1 active:scale-95 disabled:bg-slate-300"
              >
                {loading ? "Syncing with Cloud..." : "🚀 Dispatch Report"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ReportLeftoverFood;