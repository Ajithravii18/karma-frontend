import React, { useState, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Nav from "../Components/Nav";
import AOS from "aos";
import { FaMapMarkerAlt, FaCrosshairs } from "react-icons/fa";

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
        address: "", wasteType: "", pickupDate: "", timeSlot: "", description: "",
        lat: form.lat, lng: form.lng // Keep location for next time if needed
      });
      fetchPastPickups();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 font-sans text-slate-900 pb-10 relative">
      <Nav />
      <section className="pt-24 pb-10 px-4 md:px-8 flex items-center justify-center relative z-10">
        <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT PANE */}
          <div className="flex flex-col justify-between bg-white p-8 md:p-12 lg:p-16 rounded-[3rem] shadow-sm border border-gray-100 min-h-[680px]">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E9F5EC] rounded-full text-[#0B7A30] text-[10px] font-black tracking-widest uppercase mb-10">
                <span className="w-2 h-2 rounded-full bg-[#09B948]"></span>
                Precision Logistics
              </div>
              
              <h1 className="text-5xl md:text-[4rem] font-black text-[#1A2530] leading-[1.05] tracking-tight mb-6">
                Schedule Your <br />
                <span className="text-[#09B948] italic tracking-tighter">Waste Pickup.</span>
              </h1>
              
              <p className="text-gray-500 text-lg md:text-xl font-medium max-w-md leading-relaxed">
                Our AI-driven routing ensures the nearest volunteer finds your exact doorstep using GPS coordinates.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center min-h-[160px]">
                <div className="w-10 h-10 rounded-full bg-[#E9F5EC] text-[#0B7A30] flex items-center justify-center mb-4">
                  <FaCrosshairs size={16} />
                </div>
                <h4 className="font-black text-[#1A2530] text-lg mb-1">Pinpoint Accuracy</h4>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">Doorstep pickup with GPS routing.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center min-h-[160px]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 text-[#EA580C] flex items-center justify-center mb-4">
                  <FaMapMarkerAlt size={16} />
                </div>
                <h4 className="font-black text-[#1A2530] text-lg mb-1">Reliable Service</h4>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">Convenient slots that suit you.</p>
              </div>
            </div>
          </div>

          {/* RIGHT PANE (FORM) */}
          <div className="bg-white p-8 md:p-12 lg:p-16 rounded-[3rem] shadow-sm border border-gray-100 min-h-[680px] flex flex-col justify-center">
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                  <FaMapMarkerAlt /> Pickup Address / Landmark
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter detailed address..."
                  value={form.address}
                  onChange={handleChange}
                  className="w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 border-transparent rounded-2xl px-5 py-4 font-bold text-gray-700 outline-none focus:bg-white focus:border-[#09B948] transition-all border shadow-none"
                  required
                />
              </div>

              {/* Row: Waste Type & Pickup Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Waste Type</label>
                  <select
                    name="wasteType"
                    value={form.wasteType}
                    onChange={handleChange}
                    className="w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 border-transparent rounded-2xl px-5 py-4 font-bold text-gray-700 outline-none focus:bg-white focus:border-[#09B948] transition-all border shadow-none cursor-pointer appearance-none"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Plastic">Plastic</option>
                    <option value="Food">Food Waste</option>
                    <option value="E-Waste">E-Waste</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Pickup Date</label>
                  <input
                    type="date"
                    name="pickupDate"
                    min={today}
                    value={form.pickupDate}
                    onChange={handleChange}
                    className="w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 border-transparent rounded-2xl px-5 py-4 font-bold text-gray-700 outline-none focus:bg-white focus:border-[#09B948] transition-all border shadow-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Time Slot</label>
                <select
                  name="timeSlot"
                  value={form.timeSlot}
                  onChange={handleChange}
                  className="w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 border-transparent rounded-2xl px-5 py-4 font-bold text-gray-700 outline-none focus:bg-white focus:border-[#09B948] transition-all border shadow-none cursor-pointer appearance-none"
                  required
                >
                  <option value="">Select Time Slot</option>
                  <option value="9AM-12PM">9:00 AM - 12:00 PM</option>
                  <option value="12PM-3PM">12:00 PM - 3:00 PM</option>
                  <option value="3PM-6PM">3:00 PM - 6:00 PM</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Additional Notes</label>
                <textarea
                  name="description"
                  placeholder="Additional Notes for Volunteer..."
                  value={form.description}
                  onChange={handleChange}
                  className="w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 border-transparent rounded-3xl px-5 py-5 font-bold text-gray-700 outline-none focus:bg-white focus:border-[#09B948] transition-all border shadow-none min-h-[100px] resize-none"
                />
              </div>

              {/* Location Status Button */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={requestLocation}
                  className={`w-full py-4 font-black text-[11px] uppercase tracking-widest rounded-full border transition-all flex items-center justify-center gap-3 ${locationStatus === "success"
                      ? "bg-[#E9F5EC] text-[#0B7A30] border-[#09B948]/30 hover:bg-[#D5EAD9]"
                      : "bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 text-[#EA580C] border-[#EA580C]/30 hover:bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100"
                    }`}
                >
                  <FaCrosshairs size={14} /> {locationStatus === "success" ? "GPS FIXED (RE-SYNC)" : "📍 Pin Current Location"}
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#09B948] text-white py-5 rounded-full text-sm font-black uppercase tracking-widest hover:bg-[#0B7A30] transition-all shadow-[0_6px_20px_rgb(9,185,72,0.4)] flex items-center justify-center gap-3 disabled:opacity-50"
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

