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

          {/* RIGHT CONTENT */}
          <div data-aos="zoom-in" className="space-y-12">
            {/* The Power Form */}
            <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-50">
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

            {/* History List */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-50">
               <h3 className="text-xl font-black text-slate-800 mb-6 uppercase tracking-tight">Recent Requests</h3>
               {loadingPickups ? (
                 <p className="text-slate-400 text-sm font-bold animate-pulse text-center py-4">Loading past pickups...</p>
               ) : pastPickups.length === 0 ? (
                 <p className="text-slate-400 text-sm font-bold text-center py-4">No past pickups found.</p>
               ) : (
                 <div className="space-y-4">
                   {pastPickups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((req) => (
                     <div key={req._id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow">
                       <div>
                         <p className="text-sm font-black text-slate-800">{req.wasteType}</p>
                         <p className="text-[10px] font-bold text-slate-500 mt-1">{new Date(req.pickupDate).toLocaleDateString()} | {req.timeSlot}</p>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest self-start sm:self-auto ${
                         req.status?.toLowerCase() === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                         req.status?.toLowerCase() === 'assigned' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'
                       }`}>
                         {req.status || 'Pending'}
                       </span>
                     </div>
                   ))}
                   
                   {/* Pagination */}
                   {Math.ceil(pastPickups.length / itemsPerPage) > 1 && (
                     <div className="flex justify-center items-center gap-4 pt-4 border-t border-slate-100 mt-6">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex justify-center items-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all font-black text-[10px]"
                        >
                            &lt;
                        </button>
                        <span className="text-[10px] font-black uppercase text-slate-500">
                            Page <span className="text-green-600">{currentPage}</span> of {Math.ceil(pastPickups.length / itemsPerPage)}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(pastPickups.length / itemsPerPage), p + 1))}
                            disabled={currentPage === Math.ceil(pastPickups.length / itemsPerPage)}
                            className="w-8 h-8 flex justify-center items-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all font-black text-[10px]"
                        >
                            &gt;
                        </button>
                     </div>
                   )}
                 </div>
               )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
export default SchedulePickup;