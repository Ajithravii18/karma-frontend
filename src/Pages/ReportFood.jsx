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
      toast.error(err.response?.data?.message || "Reporting Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F3F4F6] min-h-screen relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-200/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-200/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <Nav />
      
      <section className="min-h-[90vh] pt-20 pb-4 px-6 flex items-center justify-center relative z-10">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* LEFT CONTENT: Impact Messaging */}
          <div className="lg:sticky lg:top-32 space-y-6 bg-white/50 p-8 md:p-10 rounded-[3rem] backdrop-blur-md border border-white shadow-lg shadow-emerald-100/50" data-aos="fade-right" data-aos-duration="1000">
            <div data-aos="fade-down" className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-green-50 rounded-lg text-green-700 text-[10px] font-bold tracking-[0.2em] uppercase border border-green-100 shadow-sm">
              <span className="relative flex h-2 w-2 mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Zero Hunger Initiative
            </div>
            
            <div data-aos="fade-right" className="space-y-2">
              <h1 className="text-4xl font-black text-slate-900 leading-[1.1]">
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

          {/* RIGHT CONTENT */}
          <div data-aos="zoom-in" className="space-y-2">
            {/* Form */}
            <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-transparent p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-emerald-200/20 border border-white/80">
              <form onSubmit={handleSubmit} className="space-y-3">
                
                {/* Row 1: Place & Quantity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2">
                      <FaMapMarkerAlt /> Pickup Location
                    </label>
                    <input 
                      type="text" placeholder="Restaurant / Event Name" 
                      value={placeName} onChange={(e) => setPlaceName(e.target.value)} 
                      className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-medium transition-all" 
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
                      className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-medium transition-all" 
                      required 
                    />
                  </div>
                </div>

                {/* Row 2: Category & Expiry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2">
                      <FaLayerGroup /> Food Category
                    </label>
                    <select 
                      value={foodType} onChange={(e) => setFoodType(e.target.value)}
                      className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold text-slate-600 outline-none appearance-none cursor-pointer"
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
                      className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-medium text-slate-600" 
                      required 
                    />
                  </div>
                </div>

                {/* Location Selector */}
                <div className="space-y-2">
                  <button 
                    type="button" onClick={getCurrentLocation} 
                    className="w-full py-3 bg-emerald-50 text-emerald-700 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-100 transition-all flex items-center justify-center gap-3"
                  >
                    {locationLoading ? "Analyzing Satellite Data..." : "📍 Pin Current Location"}
                  </button>

                  <div className="rounded-[2rem] overflow-hidden border-8 border-slate-50 h-40 shadow-inner relative group">
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
                    className="w-full p-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-medium" 
                  />
                </div>

                {/* Submit */}
                <button 
                  type="submit" disabled={loading} 
                  className="w-full py-3 bg-green-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 shadow-xl shadow-green-200 transition-all transform hover:-translate-y-1 active:scale-95 disabled:bg-slate-300"
                >
                  {loading ? "Syncing with Cloud..." : "🚀 Dispatch Report"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ReportLeftoverFood;

