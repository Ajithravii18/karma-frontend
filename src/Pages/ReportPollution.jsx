import React, { useState, useRef, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Nav from "../Components/Nav";
import AOS from "aos";
import {
  FaMapMarkerAlt, FaCrosshairs, FaCamera, FaExclamationTriangle,
  FaTrash, FaShieldAlt, FaEye, FaCheckCircle, FaBolt
} from "react-icons/fa";

// Fix for Leaflet default marker icons
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 16);
  }, [lat, lng]);
  return null;
}

function PollutionReport() {
  const navigate = useNavigate();
  const [pollutionType, setPollutionType] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState({ lat: 20.5937, lng: 78.9629 });
  const [locationStatus, setLocationStatus] = useState("idle"); // idle, loading, success, error
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    getLocation();
  }, []);

  const getLocation = () => {
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("success");
        toast.success("Hazard coordinates secured!");
      },
      () => {
        setLocationStatus("error");
        toast.error("Location access denied. Please click to pin.");
      },
      { enableHighAccuracy: true }
    );
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 4) {
      toast.error("Maximum 4 evidence images allowed");
      return;
    }
    setPhotos([...photos, ...files]);
  };

  const removePhoto = (index) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("authToken");

    if (!token) {
      toast.error("Please login to report an incident");
      navigate("/login");
      return;
    }

    if (locationStatus !== "success") {
      toast.error("Please lock the hazard coordinates on the map.");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("pollutionType", pollutionType);
      formData.append("description", description);
      formData.append("lat", location.lat);
      formData.append("lng", location.lng);
      photos.forEach((photo) => formData.append("photos", photo));

      await api.post("/report-pollution", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Environmental Report Transmitted! 🚨");
      setPollutionType("");
      setDescription("");
      setPhotos([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Transmission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/60 via-orange-50/30 to-slate-100/80 text-slate-900 font-sans flex flex-col relative overflow-x-hidden selection:bg-rose-500 selection:text-white">
      {/* ── AMBIENT DECORATIVE GLOWS ── */}
      <div className="fixed top-10 left-10 w-[500px] h-[500px] bg-rose-200/40 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-[500px] h-[500px] bg-orange-200/40 rounded-full blur-[150px] pointer-events-none -z-10" />

      <Nav />

      {/* ── HERO BANNER (FULL WIDTH) ── */}
      <section className="pt-[96px] pb-6 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="w-full max-w-[1550px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-rose-100">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-rose-100/80 border border-rose-300/80 rounded-full shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              <span className="text-[11px] font-black text-rose-800 uppercase tracking-widest">
                Citizen Environmental Watchdog • Public Hazard Registry
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Report an <span className="text-rose-600 italic">Environmental Hazard</span>
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-3xl font-medium leading-relaxed">
              Document open burning, toxic dumping, or water contamination. Photographic proof and GPS coordinates trigger immediate volunteer and civic response.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 shrink-0 overflow-x-auto pb-2 lg:pb-0">
            <div className="px-5 py-3 rounded-2xl bg-white/90 border border-slate-200/90 shadow-sm backdrop-blur-md min-w-[135px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hotspots Cleared</p>
              <p className="text-lg font-black text-slate-800 mt-0.5">📍 1,240+</p>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-rose-50/90 border border-rose-200/90 shadow-sm backdrop-blur-md min-w-[135px]">
              <p className="text-[10px] font-black text-rose-700 uppercase tracking-wider">Triage Speed</p>
              <p className="text-lg font-black text-rose-900 mt-0.5">🚨 &lt; 2 Hours</p>
            </div>
            <div className="px-5 py-3 rounded-2xl bg-white/90 border border-slate-200/90 shadow-sm backdrop-blur-md min-w-[135px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Anonymity</p>
              <p className="text-lg font-black text-slate-800 mt-0.5">🔒 100% Private</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN WORKSPACE (FULL-WIDTH 2-COLUMN BALANCED) ── */}
      <main className="flex-1 py-4 px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="w-full max-w-[1550px] mx-auto space-y-8">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* ── LEFT PANE: ACTION PROTOCOL & HAZARD GUIDE ── */}
            <div className="lg:col-span-5 bg-gradient-to-br from-rose-950 via-[#2d0e19] to-slate-900 text-white rounded-3xl p-7 sm:p-9 border border-rose-800/50 shadow-2xl flex flex-col justify-between relative overflow-hidden">
              <div className="space-y-8 relative z-10">
                <div>
                  <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest">
                    Response Protocol
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-tight mt-1">
                    How We Triage Reports
                  </h2>
                </div>

                {/* 3 Step Guide */}
                <div className="space-y-5">
                  <div className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      01
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Identify & Classify</h4>
                      <p className="text-xs text-rose-100/70 mt-0.5 leading-relaxed">
                        Categorize the incident by pollutant type (Air, Water, Garbage, Chemical).
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      02
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Attach Visual Proof</h4>
                      <p className="text-xs text-rose-100/70 mt-0.5 leading-relaxed">
                        Photos provide immediate context on volume, risk level, and equipment needed.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      03
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Dispatch & Authority Alert</h4>
                      <p className="text-xs text-rose-100/70 mt-0.5 leading-relaxed">
                        Automated alerts mobilize nearby green response squads and civic cells.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Severity Guide */}
                <div className="pt-4 border-t border-rose-800/80">
                  <p className="text-[10px] font-black uppercase tracking-widest text-rose-300 mb-3">
                    Priority Streams
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5 hover:bg-white/15 transition-colors">
                      <span className="text-lg">☠️</span>
                      <div>
                        <p className="font-black text-white">Chemical Waste</p>
                        <p className="text-[10px] text-rose-200/70">Toxic, Effluents</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5 hover:bg-white/15 transition-colors">
                      <span className="text-lg">💧</span>
                      <div>
                        <p className="font-black text-white">Water Runoff</p>
                        <p className="text-[10px] text-rose-200/70">Rivers, Drains</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5 hover:bg-white/15 transition-colors">
                      <span className="text-lg">🗑️</span>
                      <div>
                        <p className="font-black text-white">Illegal Dumpsite</p>
                        <p className="text-[10px] text-rose-200/70">Open Garbage</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5 hover:bg-white/15 transition-colors">
                      <span className="text-lg">💨</span>
                      <div>
                        <p className="font-black text-white">Smoke & Emissions</p>
                        <p className="text-[10px] text-rose-200/70">Open Burning</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Guarantee */}
              <div className="pt-6 mt-6 border-t border-rose-800/80 text-[11px] font-bold text-rose-300 flex items-center justify-between relative z-10">
                <span className="text-rose-400">🔒 Whistleblower Privacy</span>
                <span>Encrypted Transmissions</span>
              </div>
            </div>

            {/* ── RIGHT PANE: INCIDENT FORM ── */}
            <div className="lg:col-span-7 bg-white/95 rounded-3xl p-7 sm:p-9 border border-rose-100 shadow-xl shadow-rose-950/5 backdrop-blur-md flex flex-col justify-center">
              <div className="pb-5 border-b border-slate-100 mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Incident Report Details
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Broadcast accurate information to dispatch teams.
                  </p>
                </div>
                <span className="px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                  Direct Escalation
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Category & Evidence Upload */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <FaExclamationTriangle className="text-rose-500" /> Incident Category
                    </label>
                    <select
                      value={pollutionType}
                      onChange={(e) => setPollutionType(e.target.value)}
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all cursor-pointer"
                      required
                    >
                      <option value="">Select Category...</option>
                      <option value="Air Pollution">💨 Air Pollution & Smoke</option>
                      <option value="Water Contamination">💧 Water Contamination</option>
                      <option value="Illegal Garbage Dump">🗑️ Illegal Garbage Dump</option>
                      <option value="Chemical/Toxic Waste">☠️ Chemical / Toxic Waste</option>
                      <option value="Noise Pollution">📢 Industrial Noise</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <FaCamera className="text-rose-500" /> Evidence Photos <span className="text-slate-400 font-normal lowercase">(max 4)</span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current.click()}
                      className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-3 text-center cursor-pointer hover:bg-rose-50/50 hover:border-rose-300 transition-all flex items-center justify-center gap-2"
                    >
                      <FaCamera className="text-slate-500" size={14} />
                      <span className="text-xs font-bold text-slate-700">
                        {photos.length > 0 ? `${photos.length}/4 Photos Added` : "Attach Photos"}
                      </span>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      hidden
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                    />
                  </div>
                </div>

                {/* Photo Previews */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2.5">
                    {photos.map((file, index) => (
                      <div key={index} className="relative aspect-video rounded-2xl overflow-hidden border border-slate-200 group shadow-sm">
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removePhoto(index); }}
                          className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <FaTrash size={9} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1 block">
                    Detailed Observation & Landmark Notes
                  </label>
                  <textarea
                    placeholder="Describe visible fumes, odors, approximate duration, proximity to water bodies..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all resize-none"
                    required
                  />
                </div>

                {/* Map & Coordinates */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-rose-500" /> Precise Hazard Coordinates
                    </label>
                    <button
                      type="button"
                      onClick={getLocation}
                      className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all ${
                        locationStatus === "success"
                          ? "text-emerald-800 bg-emerald-50 border border-emerald-300 shadow-sm"
                          : "text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                      }`}
                    >
                      <FaCrosshairs className={locationStatus === "loading" ? "animate-spin text-rose-600" : "text-rose-600"} size={11} />
                      <span>{locationStatus === "success" ? "✓ Coordinates Locked" : "Capture Location"}</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden h-[135px] w-full relative z-0 shadow-inner">
                    <MapContainer
                      center={[location.lat, location.lng]}
                      zoom={location.lat === 20.5937 ? 5 : 16}
                      className="h-full w-full z-0"
                      zoomControl={false}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <RecenterMap lat={location.lat} lng={location.lng} />
                      <Marker position={[location.lat, location.lng]} icon={markerIcon} />
                    </MapContainer>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-black py-3.5 px-6 rounded-2xl text-sm uppercase tracking-wider transition-all shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? "Broadcasting Dossier..." : "🚨 Broadcast Pollution Report"}
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* ── BOTTOM FEATURE GUARANTEE STRIP ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-6">
            <div className="bg-white/90 rounded-3xl p-6 border border-slate-200/80 shadow-sm backdrop-blur-md flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center text-lg shrink-0">
                <FaBolt />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">Rapid Triage Protocol</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  High-risk hazardous reports are triaged and routed to civic officers within 2 hours.
                </p>
              </div>
            </div>

            <div className="bg-white/90 rounded-3xl p-6 border border-slate-200/80 shadow-sm backdrop-blur-md flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                <FaCamera />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">Verified Photo Proof</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Visual evidence is cryptographically timestamped and geotagged for verified authority action.
                </p>
              </div>
            </div>

            <div className="bg-white/90 rounded-3xl p-6 border border-slate-200/80 shadow-sm backdrop-blur-md flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center text-lg shrink-0">
                <FaShieldAlt />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">Whistleblower Protection</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Citizen identities remain strictly confidential and protected across all public logs.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default PollutionReport;

