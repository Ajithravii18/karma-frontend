import React, { useState, useRef, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import Nav from "../Components/Nav";
import { 
  FaMapMarkerAlt, FaCrosshairs, FaCamera, FaExclamationTriangle, 
  FaRecycle, FaUtensils, FaClock, FaLayerGroup, FaTrash 
} from "react-icons/fa";

function ActionCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toISOString().split("T")[0];

  // Determine active tab based on route, default to "pickup"
  const [activeTab, setActiveTab] = useState("pickup");

  useEffect(() => {
    if (location.pathname === "/report-pollution") setActiveTab("pollution");
    else if (location.pathname === "/report-food") setActiveTab("food");
    else setActiveTab("pickup");
  }, [location.pathname]);

  // Handle Tab Switch (update URL without reload)
  const switchTab = (tab, path) => {
    setActiveTab(tab);
    window.history.pushState({}, "", path);
  };

  // -------------------------------------------------------------
  // STATE: WASTE PICKUP
  // -------------------------------------------------------------
  const [pickupForm, setPickupForm] = useState({
    address: "", wasteType: "", pickupDate: "", timeSlot: "", description: "", lat: null, lng: null
  });
  const [pickupLoading, setPickupLoading] = useState(false);
  const [pickupLocStatus, setPickupLocStatus] = useState("idle");

  const handlePickupChange = (e) => setPickupForm({ ...pickupForm, [e.target.name]: e.target.value });

  const getPickupLocation = () => {
    setPickupLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPickupForm({ ...pickupForm, lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPickupLocStatus("success");
        toast.success("Location locked.");
      },
      () => {
        setPickupLocStatus("error");
        toast.error("Location access denied.");
      }, { enableHighAccuracy: true }
    );
  };

  const handlePickupSubmit = async (e) => {
    e.preventDefault();
    if (!pickupForm.lat || !pickupForm.lng) {
      toast.error("GPS location required.");
      return;
    }
    try {
      setPickupLoading(true);
      await api.post("/schedule-pickup", pickupForm);
      toast.success("Pickup Scheduled.");
      setPickupForm({ address: "", wasteType: "", pickupDate: "", timeSlot: "", description: "", lat: pickupForm.lat, lng: pickupForm.lng });
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to schedule.");
    } finally { setPickupLoading(false); }
  };

  // -------------------------------------------------------------
  // STATE: POLLUTION REPORT
  // -------------------------------------------------------------
  const [pollForm, setPollForm] = useState({ type: "", description: "", lat: null, lng: null });
  const [pollPhotos, setPollPhotos] = useState([]);
  const [pollLoading, setPollLoading] = useState(false);
  const [pollLocStatus, setPollLocStatus] = useState("idle");
  const fileInputRef = useRef();

  const getPollLocation = () => {
    setPollLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPollForm({ ...pollForm, lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPollLocStatus("success");
        toast.success("Location locked.");
      },
      () => {
        setPollLocStatus("error");
        toast.error("Location access denied.");
      }, { enableHighAccuracy: true }
    );
  };

  const handlePollPhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (pollPhotos.length + files.length > 4) return toast.error("Max 4 images.");
    setPollPhotos([...pollPhotos, ...files]);
  };

  const handlePollSubmit = async (e) => {
    e.preventDefault();
    if (!pollForm.lat || !pollForm.lng) return toast.error("GPS location required.");
    try {
      setPollLoading(true);
      const fd = new FormData();
      fd.append("pollutionType", pollForm.type);
      fd.append("description", pollForm.description);
      fd.append("lat", pollForm.lat);
      fd.append("lng", pollForm.lng);
      pollPhotos.forEach(p => fd.append("photos", p));
      
      await api.post("/report-pollution", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Report Transmitted.");
      setPollForm({ type: "", description: "", lat: null, lng: null });
      setPollPhotos([]);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit.");
    } finally { setPollLoading(false); }
  };

  // -------------------------------------------------------------
  // STATE: FOOD DONATION
  // -------------------------------------------------------------
  const [foodForm, setFoodForm] = useState({
    placeName: "", quantity: "", foodType: "Veg", expiryTime: "", notes: "", lat: null, lng: null
  });
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodLocStatus, setFoodLocStatus] = useState("idle");

  const getFoodLocation = () => {
    setFoodLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFoodForm({ ...foodForm, lat: pos.coords.latitude, lng: pos.coords.longitude });
        setFoodLocStatus("success");
        toast.success("Location locked.");
      },
      () => {
        setFoodLocStatus("error");
        toast.error("Location access denied.");
      }, { enableHighAccuracy: true }
    );
  };

  const handleFoodSubmit = async (e) => {
    e.preventDefault();
    if (!foodForm.lat || !foodForm.lng) {
        getFoodLocation();
        return toast.error("GPS location required.");
    }
    if (new Date(foodForm.expiryTime) <= new Date()) return toast.error("Expiry must be in the future.");
    try {
      setFoodLoading(true);
      await api.post("/report-leftover-food", {
        placeName: foodForm.placeName, latitude: foodForm.lat, longitude: foodForm.lng,
        quantity: parseInt(foodForm.quantity), foodType: foodForm.foodType, 
        expiryTime: foodForm.expiryTime, notes: foodForm.notes
      });
      toast.success("Food Donated.");
      setFoodForm({ placeName: "", quantity: "", foodType: "Veg", expiryTime: "", notes: "", lat: null, lng: null });
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit.");
    } finally { setFoodLoading(false); }
  };

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------
  return (
    <div className="bg-[#F8FAFC] min-h-screen font-sans text-slate-900 pb-20">
      <Nav />
      <div className="max-w-3xl mx-auto pt-24 md:pt-32 px-4 md:px-6">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tight">Action <span className="font-thin italic text-slate-400">Center</span></h1>
          <p className="text-slate-500 font-medium text-sm mt-2">Submit and track your environmental requests efficiently.</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white p-2 rounded-2xl md:rounded-[2rem] shadow-sm border border-slate-200 flex flex-col md:flex-row gap-2 mb-8">
          <button 
            onClick={() => switchTab("pickup", "/pick-up")}
            className={`flex-1 py-3 px-4 rounded-xl md:rounded-[1.5rem] flex items-center justify-center gap-2 text-xs font-black uppercase transition-all duration-300 ${activeTab === "pickup" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-50 hover:text-indigo-600"}`}
          >
            <FaRecycle size={14} /> Waste Pickup
          </button>
          <button 
            onClick={() => switchTab("pollution", "/report-pollution")}
            className={`flex-1 py-3 px-4 rounded-xl md:rounded-[1.5rem] flex items-center justify-center gap-2 text-xs font-black uppercase transition-all duration-300 ${activeTab === "pollution" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-50 hover:text-indigo-600"}`}
          >
            <FaExclamationTriangle size={14} /> Pollution Report
          </button>
          <button 
            onClick={() => switchTab("food", "/report-food")}
            className={`flex-1 py-3 px-4 rounded-xl md:rounded-[1.5rem] flex items-center justify-center gap-2 text-xs font-black uppercase transition-all duration-300 ${activeTab === "food" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:bg-slate-50 hover:text-indigo-600"}`}
          >
            <FaUtensils size={14} /> Food Rescue
          </button>
        </div>

        {/* Form Container */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-200">
          
          {/* TAB 1: WASTE PICKUP */}
          {activeTab === "pickup" && (
            <form onSubmit={handlePickupSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Address / Landmark</label>
                <input type="text" name="address" required value={pickupForm.address} onChange={handlePickupChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-colors" placeholder="Enter pickup address..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Waste Type</label>
                  <select name="wasteType" required value={pickupForm.wasteType} onChange={handlePickupChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-colors appearance-none">
                    <option value="">Select Type</option>
                    <option value="Plastic">Plastic</option>
                    <option value="Food">Food Waste</option>
                    <option value="E-Waste">E-Waste</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Pickup Date</label>
                  <input type="date" name="pickupDate" required min={today} value={pickupForm.pickupDate} onChange={handlePickupChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Time Slot</label>
                <select name="timeSlot" required value={pickupForm.timeSlot} onChange={handlePickupChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-colors appearance-none">
                  <option value="">Select Time Slot</option>
                  <option value="9AM-12PM">9:00 AM - 12:00 PM</option>
                  <option value="12PM-3PM">12:00 PM - 3:00 PM</option>
                  <option value="3PM-6PM">3:00 PM - 6:00 PM</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Notes</label>
                <textarea name="description" value={pickupForm.description} onChange={handlePickupChange} rows="2" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-colors resize-none" placeholder="Optional instructions..."></textarea>
              </div>

              <button type="button" onClick={getPickupLocation} className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${pickupLocStatus === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                <FaCrosshairs /> {pickupLocStatus === "success" ? "Location Locked" : "Pin GPS Location"}
              </button>

              <button type="submit" disabled={pickupLoading} className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-colors mt-4">
                {pickupLoading ? "Scheduling..." : "Confirm Pickup"}
              </button>
            </form>
          )}

          {/* TAB 2: POLLUTION REPORT */}
          {activeTab === "pollution" && (
            <form onSubmit={handlePollSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Incident Type</label>
                <select required value={pollForm.type} onChange={(e) => setPollForm({...pollForm, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-colors appearance-none">
                  <option value="">Select Category...</option>
                  <option>Air Pollution</option>
                  <option>Water Contamination</option>
                  <option>Illegal Garbage Dump</option>
                  <option>Chemical/Toxic Waste</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</label>
                <textarea required value={pollForm.description} onChange={(e) => setPollForm({...pollForm, description: e.target.value})} rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-colors resize-none" placeholder="Describe the hazard..."></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Evidence Photos (Max 4)</label>
                <div onClick={() => fileInputRef.current.click()} className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors">
                  <FaCamera className="mx-auto text-slate-400 mb-2" size={20} />
                  <p className="text-xs font-bold text-slate-500 tracking-tight">Tap to upload photos</p>
                </div>
                <input type="file" multiple accept="image/*" hidden ref={fileInputRef} onChange={handlePollPhotoChange} />
                
                {pollPhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {pollPhotos.map((f, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                        <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" alt="evidence" />
                        <button type="button" onClick={(e) => { e.stopPropagation(); setPollPhotos(pollPhotos.filter((_, idx) => idx !== i)) }} className="absolute top-1 right-1 bg-rose-500 p-1.5 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <FaTrash size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="button" onClick={getPollLocation} className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${pollLocStatus === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                <FaCrosshairs /> {pollLocStatus === "success" ? "Location Locked" : "Pin GPS Location"}
              </button>

              <button type="submit" disabled={pollLoading} className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-colors mt-4">
                {pollLoading ? "Transmitting..." : "Submit Report"}
              </button>
            </form>
          )}

          {/* TAB 3: FOOD DONATION */}
          {activeTab === "food" && (
            <form onSubmit={handleFoodSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Location Name</label>
                  <input type="text" required value={foodForm.placeName} onChange={(e) => setFoodForm({...foodForm, placeName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-colors" placeholder="Restaurant / Event..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Servings Count</label>
                  <input type="number" required value={foodForm.quantity} onChange={(e) => setFoodForm({...foodForm, quantity: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-colors" placeholder="How many people?" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                  <select value={foodForm.foodType} onChange={(e) => setFoodForm({...foodForm, foodType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-colors appearance-none">
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Mix">Mix</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Best Before</label>
                  <input type="datetime-local" required value={foodForm.expiryTime} onChange={(e) => setFoodForm({...foodForm, expiryTime: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-colors" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Notes</label>
                <textarea value={foodForm.notes} onChange={(e) => setFoodForm({...foodForm, notes: e.target.value})} rows="2" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-colors resize-none" placeholder="Additional instructions..."></textarea>
              </div>

              <button type="button" onClick={getFoodLocation} className={`w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all ${foodLocStatus === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>
                <FaCrosshairs /> {foodLocStatus === "success" ? "Location Locked" : "Pin GPS Location"}
              </button>

              <button type="submit" disabled={foodLoading} className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-900 transition-colors mt-4">
                {foodLoading ? "Dispatched..." : "Donate Food"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default ActionCenter;
