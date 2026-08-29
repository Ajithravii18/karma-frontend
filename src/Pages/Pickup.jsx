import React, { useState, useEffect } from"react";
import api from"../utils/api";
import toast from"react-hot-toast";
import { useNavigate } from"react-router-dom";
import Nav from"../Components/Nav";
import AOS from"aos";
import { FaMapMarkerAlt, FaCrosshairs } from"react-icons/fa";

function SchedulePickup() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle, loading, success, error

  const [form, setForm] = useState({
    address:"",
    wasteType:"",
    pickupDate:"",
    timeSlot:"",
    description:"",
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

  // New function to capture GPS
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
        toast.success("Exact location pinned!");
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

    // Validation: Ensure location is captured before submitting
    if (!form.lat || !form.lng) {
      toast.error("Please allow location access to proceed.");
      requestLocation();
      return;
    }

    try {
      setLoading(true);
      await api.post("/schedule-pickup", form);
      toast.success("Pickup Scheduled Successfully");
      setForm({
        address:"", wasteType:"", pickupDate:"", timeSlot:"", description:"",
        lat: form.lat, lng: form.lng // Keep location for next time if needed
      });
      fetchPastPickups();
    } catch (err) {
      toast.error(err.response?.data?.message ||"Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Nav />

      <main className="flex-1 flex items-center justify-center px-4 py-8 pt-[88px]">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Card Top Banner */}
          <div className="bg-slate-900 px-6 sm:px-8 py-5 flex items-center justify-between border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-500/20 rounded-full mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Doorstep Logistics</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Schedule <span className="text-emerald-400 italic">Waste Pickup</span>
              </h1>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center text-emerald-400 text-xl font-black">
              ♻️
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            {/* Address */}
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <FaMapMarkerAlt className="text-emerald-500" /> Pickup Address / Landmark
              </label>
              <input
                type="text"
                name="address"
                placeholder="Street address, apartment, flat no., landmark..."
                value={form.address}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                required
              />
            </div>

            {/* Waste Type & Date Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Waste Type
                </label>
                <select
                  name="wasteType"
                  value={form.wasteType}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all cursor-pointer"
                  required
                >
                  <option value="">Select Waste Category</option>
                  <option value="Plastic">♻️ Plastic & Dry Waste</option>
                  <option value="Food">🍃 Organic & Food Waste</option>
                  <option value="E-Waste">💻 Electronics & E-Waste</option>
                  <option value="Paper">📦 Cardboard & Paper</option>
                  <option value="Glass">🍾 Glass & Bottles</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Pickup Date
                </label>
                <input
                  type="date"
                  name="pickupDate"
                  min={today}
                  value={form.pickupDate}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all cursor-pointer"
                  required
                />
              </div>
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2 block">
                Preferred Time Window
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "9AM-12PM", label: "Morning", time: "9 AM - 12 PM", icon: "🌅" },
                  { id: "12PM-3PM", label: "Afternoon", time: "12 PM - 3 PM", icon: "☀️" },
                  { id: "3PM-6PM", label: "Evening", time: "3 PM - 6 PM", icon: "🌆" }
                ].map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setForm({ ...form, timeSlot: slot.id })}
                    className={`py-2 px-3 rounded-xl border text-left transition-all ${
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

            {/* Notes */}
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                Instructions for Volunteer <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <textarea
                name="description"
                placeholder="Gate code, floor number, or packaging notes..."
                value={form.description}
                onChange={handleChange}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none"
              />
            </div>

            {/* Location & Submit Action Row */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 items-stretch">
              <button
                type="button"
                onClick={requestLocation}
                className={`py-3.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider border transition-all flex items-center justify-center gap-2 shrink-0 ${
                  locationStatus === "success"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
                    : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                }`}
              >
                <FaCrosshairs className={locationStatus === "loading" ? "animate-spin" : ""} size={14} />
                {locationStatus === "success" ? "✓ GPS Locked" : "Pin Location"}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Scheduling Request..." : "🚀 Confirm Pickup Schedule"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default SchedulePickup;

