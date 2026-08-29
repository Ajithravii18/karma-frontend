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
    <div className="min-h-screen bg-slate-50 font-sans">
      <Nav />

      <section className="pt-[84px] pb-10 px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT PANE */}
          <div className="flex flex-col justify-between bg-slate-900 rounded-[2.5rem] min-h-[680px] p-8 md:p-12">
            <div>
              {/* Badge pill */}
              <div className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full inline-flex items-center gap-2 mb-10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Precision Logistics
              </div>

              {/* Heading */}
              <h1 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6">
                Schedule Your<br />
                <span className="text-emerald-400 italic">Waste Pickup.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-slate-400 text-base font-medium max-w-xs leading-relaxed">
                Our AI-driven routing ensures the nearest volunteer finds your exact doorstep using GPS coordinates.
              </p>
            </div>

            {/* Mini feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
              {/* Card: Pinpoint Accuracy */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
                  <FaCrosshairs size={16} className="text-emerald-400" />
                </div>
                <h4 className="font-black text-white text-base mb-1">Pinpoint Accuracy</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  Doorstep pickup with GPS routing.
                </p>
              </div>

              {/* Card: Reliable Service */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center mb-4">
                  <FaMapMarkerAlt size={16} className="text-amber-400" />
                </div>
                <h4 className="font-black text-white text-base mb-1">Reliable Service</h4>
                <p className="text-sm font-medium text-slate-400 leading-relaxed">
                  Convenient slots that suit you.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT PANE (FORM) */}
          <div className="bg-white rounded-[2.5rem] min-h-[680px] p-8 md:p-12 flex flex-col justify-center shadow-sm border border-slate-200">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Address */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                  <FaMapMarkerAlt /> Pickup Address / Landmark
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter detailed address..."
                  value={form.address}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm"
                  required
                />
              </div>

              {/* Row: Waste Type & Pickup Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                    Waste Type
                  </label>
                  <select
                    name="wasteType"
                    value={form.wasteType}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm cursor-pointer appearance-none"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Plastic">Plastic</option>
                    <option value="Food">Food Waste</option>
                    <option value="E-Waste">E-Waste</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                    Pickup Date
                  </label>
                  <input
                    type="date"
                    name="pickupDate"
                    min={today}
                    value={form.pickupDate}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm"
                    required
                  />
                </div>
              </div>

              {/* Time Slot */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                  Time Slot
                </label>
                <select
                  name="timeSlot"
                  value={form.timeSlot}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm cursor-pointer appearance-none"
                  required
                >
                  <option value="">Select Time Slot</option>
                  <option value="9AM-12PM">9:00 AM - 12:00 PM</option>
                  <option value="12PM-3PM">12:00 PM - 3:00 PM</option>
                  <option value="3PM-6PM">3:00 PM - 6:00 PM</option>
                </select>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                  Additional Notes
                </label>
                <textarea
                  name="description"
                  placeholder="Additional Notes for Volunteer..."
                  value={form.description}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm min-h-[100px] resize-none"
                />
              </div>

              {/* GPS Pin Button */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={requestLocation}
                  className={
                    locationStatus === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl py-3.5 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 w-full hover:bg-emerald-100 transition-all"
                      : "bg-slate-50 text-slate-700 border border-slate-200 rounded-xl py-3.5 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 w-full hover:bg-slate-100 transition-all"
                  }
                >
                  <FaCrosshairs size={14} />
                  {locationStatus === "success" ? "GPS Fixed — Re-Sync" : "📍 Pin Current Location"}
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? "Transmitting..." : "🚀 Confirm Schedule"}
                </button>
              </div>

            </form>
          </div>

        </div>
      </section>
    </div>
  );
}
export default SchedulePickup;

