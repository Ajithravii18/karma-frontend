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
    <div className="bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 min-h-screen relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-200/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-200/20 rounded-full blur-[100px] pointer-events-none"></div>
      
      <Nav />

      <section className="min-h-[90vh] pt-24 pb-12 px-6 flex items-center justify-center relative z-10">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

          {/* LEFT CONTENT: Impact Messaging */}
          <div className="lg:sticky lg:top-32 space-y-8">
            <div data-aos="fade-down" className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-green-50 rounded-lg text-green-700 text-[10px] font-bold tracking-[0.2em] uppercase border border-green-100 shadow-sm">
              <span className="relative flex h-2 w-2 mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Precision Logistics
            </div>
            
            <div data-aos="fade-right" className="space-y-4">
              <h1 className="text-6xl font-black text-slate-900 leading-[1.1]">
                Schedule Your <br />
                <span className="text-green-600 italic">Waste Pickup.</span>
              </h1>
              <p className="text-slate-500 text-xl max-w-lg leading-relaxed">
                Our AI-driven routing ensures the nearest volunteer finds your exact doorstep using GPS coordinates.
              </p>
            </div>

            <div data-aos="fade-up" data-aos-delay="200" className="grid grid-cols-2 gap-6">
              <div className="bg-white/50 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white/60">
                <FaCrosshairs className="text-green-500 mb-3" size={24} />
                <h4 className="font-bold text-slate-800">Pinpoint Accuracy</h4>
                <p className="text-xs text-slate-400">Doorstep pickup with GPS routing.</p>
              </div>
              <div className="bg-white/50 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white/60">
                <FaMapMarkerAlt className="text-amber-500 mb-3" size={24} />
                <h4 className="font-bold text-slate-800">Reliable Service</h4>
                <p className="text-xs text-slate-400">Convenient slots that suit you.</p>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT */}
          <div data-aos="zoom-in" className="space-y-6">
            {/* The Power Form */}
            <div className="bg-white/60 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-2xl shadow-emerald-200/20 border border-white/80">
              <form onSubmit={handleSubmit} className="space-y-5">

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
        </div>
      </section>
    </div>
  );
}
export default SchedulePickup;
