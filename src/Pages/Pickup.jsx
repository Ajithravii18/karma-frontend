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

  // UPDATED: Form now includes lat and lng
  const [form, setForm] = useState({
    address: "",
    wasteType: "",
    pickupDate: "",
    timeSlot: "",
    description: "",
    lat: null,
    lng: null
  });

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    // Auto-request location on mount for seamless navigation
    requestLocation();
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
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-[#FDFDFD] min-h-screen">
      <Nav />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* LEFT CONTENT: Impact Messaging */}
          <div className="lg:sticky lg:top-32 space-y-8">
            <div data-aos="fade-right" className="space-y-4">
              <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 w-max">
                <FaMapMarkerAlt /> Precision Logistics
              </span>
              <h1 className="text-6xl font-black text-slate-900 leading-[1.1]">
                Schedule Your <br />
                <span className="text-green-600 italic">Waste Pickup.</span>
              </h1>
              <p className="text-slate-500 text-xl max-w-lg leading-relaxed">
                Our AI-driven routing ensures the nearest volunteer finds your exact doorstep using GPS coordinates.
              </p>
            </div>

            <div data-aos="fade-up" data-aos-delay="200" className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <FaCrosshairs className="text-green-500 mb-3" size={24} />
                <h4 className="font-bold text-slate-800">Pinpoint Accuracy</h4>
                <p className="text-xs text-slate-400">Doorstep pickup with GPS routing.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <FaMapMarkerAlt className="text-amber-500 mb-3" size={24} />
                <h4 className="font-bold text-slate-800">Reliable Service</h4>
                <p className="text-xs text-slate-400">Convenient slots that suit you.</p>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT: The Power Form */}
          <div data-aos="zoom-in" className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-50">
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2">
                  <FaMapMarkerAlt /> Pickup Address / Landmark
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Enter detailed address..."
                  value={form.address}
                  onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-medium transition-all"
                  required
                />
              </div>

              {/* Row: Waste Type & Pickup Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Waste Type</label>
                  <select
                    name="wasteType"
                    value={form.wasteType}
                    onChange={handleChange}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold text-slate-600 outline-none appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Plastic">Plastic</option>
                    <option value="Food">Food Waste</option>
                    <option value="E-Waste">E-Waste</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Pickup Date</label>
                  <input
                    type="date"
                    name="pickupDate"
                    min={today}
                    value={form.pickupDate}
                    onChange={handleChange}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-medium text-slate-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Time Slot</label>
                <select
                  name="timeSlot"
                  value={form.timeSlot}
                  onChange={handleChange}
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-bold text-slate-600 outline-none appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select Time Slot</option>
                  <option value="9AM-12PM">9:00 AM - 12:00 PM</option>
                  <option value="12PM-3PM">12:00 PM - 3:00 PM</option>
                  <option value="3PM-6PM">3:00 PM - 6:00 PM</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Additional Notes</label>
                <textarea
                  name="description"
                  placeholder="Additional Notes for Volunteer..."
                  value={form.description}
                  onChange={handleChange}
                  rows="2"
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 font-medium"
                />
              </div>

              {/* Location Status Button */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={requestLocation}
                  className={`w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 ${locationStatus === "success"
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "bg-orange-50 text-orange-600 animate-pulse hover:bg-orange-100"
                    }`}
                >
                  <FaCrosshairs /> {locationStatus === "success" ? "GPS FIXED (RE-SYNC)" : "📍 Pin Current Location"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-green-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 shadow-xl shadow-green-200 transition-all transform hover:-translate-y-1 active:scale-95 disabled:bg-slate-300"
              >
                {loading ? "Transmitting..." : "🚀 Confirm Schedule"}
              </button>

            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
export default SchedulePickup;