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
  FaTrash, FaHistory, FaShieldAlt, FaEye, FaCheckCircle, FaFileAlt
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

  const [pastPollution, setPastPollution] = useState([]);
  const [loadingPollution, setLoadingPollution] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchPastPollution = async () => {
    try {
      setLoadingPollution(true);
      const res = await api.get("/api/my-pollution");
      setPastPollution(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPollution(false);
    }
  };

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    getLocation();
    fetchPastPollution();
  }, []);

  const getLocation = () => {
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("success");
        toast.success("Location Coordinates Secured");
      },
      () => {
        setLocationStatus("error");
        toast.error("Location access denied");
      },
      { enableHighAccuracy: true }
    );
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (photos.length + files.length > 4) {
      toast.error("Maximum 4 Evidence Images Allowed");
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
      toast.error("Authentication Required");
      navigate("/login");
      return;
    }

    if (locationStatus !== "success") {
      toast.error("Please pin the precise hazard coordinates");
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

      toast.success("Incident Broadcasted to Response Teams!");
      setPollutionType("");
      setDescription("");
      setPhotos([]);
      fetchPastPollution();
    } catch (err) {
      toast.error(err.response?.data?.message || "Transmission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(pastPollution.length / itemsPerPage);
  const currentRecords = pastPollution.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 flex flex-col">
      <Nav />

      {/* ── TOP HERO BANNER & METRICS ── */}
      <section className="pt-[88px] pb-6 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 border border-rose-200/60 rounded-full">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">
                Citizen Environmental Watchdog • Public Incident Registry
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              Report & Mobilize <span className="text-rose-600 italic">Pollution Hotspots</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-base max-w-2xl font-medium leading-relaxed">
              Document illegal waste dumps, air emissions, and toxic effluents. Real-time geo-tagging alerts nearby volunteer squads and civic monitoring teams for fast cleanup mobilization.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 overflow-x-auto pb-2 md:pb-0">
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-left min-w-[130px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hotspots Cleared</p>
              <p className="text-lg font-black text-slate-800 mt-0.5">📍 1,240+</p>
            </div>
            <div className="px-4 py-3 bg-rose-50 border border-rose-200/80 rounded-2xl text-left min-w-[130px]">
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Triage Speed</p>
              <p className="text-lg font-black text-rose-800 mt-0.5">🚨 &lt; 2 Hours</p>
            </div>
            <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-left min-w-[130px]">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Anonymity</p>
              <p className="text-lg font-black text-slate-800 mt-0.5">🔒 100% Private</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* TWO COLUMN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ── LEFT PANE: ESCALATION GUIDE & PROTOCOL ── */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Incident Verification Protocol */}
              <div className="bg-rose-950 text-white rounded-3xl p-6 sm:p-8 border border-rose-900 shadow-sm relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl" />
                
                <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-4">
                  Incident Action Protocol
                </h3>
                
                <div className="space-y-5 relative z-10">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 font-black text-xs flex items-center justify-center shrink-0">
                      01
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Identify Hazard Category</h4>
                      <p className="text-xs text-rose-200/60 mt-0.5 leading-relaxed">
                        Specify if the incident relates to air emissions, blackwater runoff, chemical spillage, or unauthorized dumping.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 font-black text-xs flex items-center justify-center shrink-0">
                      02
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Attach Clear Photographic Evidence</h4>
                      <p className="text-xs text-rose-200/60 mt-0.5 leading-relaxed">
                        Photos enable cleanup leads to estimate equipment requirements and scale of contamination.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 font-black text-xs flex items-center justify-center shrink-0">
                      03
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">Automatic Dispatch & Civic Tracking</h4>
                      <p className="text-xs text-rose-200/60 mt-0.5 leading-relaxed">
                        Reports are automatically routed to municipal green cells and community emergency units.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Severity Reference Guide */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Hazard Classification Guide
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">☠️</span>
                    <div>
                      <p className="font-black text-rose-950">Toxic / Chemical Effluents</p>
                      <p className="text-[11px] text-rose-700">Immediate hazard to local water supplies and public health.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">🗑️</span>
                    <div>
                      <p className="font-black text-amber-950">Illegal Dumping & Open Waste</p>
                      <p className="text-[11px] text-amber-700">Accumulated garbage causing breeding of pests and odors.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-2.5">
                    <span className="text-base shrink-0 mt-0.5">💨</span>
                    <div>
                      <p className="font-black text-slate-800">Emissions & Smoke Inversion</p>
                      <p className="text-[11px] text-slate-500">Unfiltered exhaust or open burning of plastic waste.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ── RIGHT PANE: INCIDENT REPORTING CONSOLE ── */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Submit Incident Dossier
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    All reports are validated by automated screening and green responder units.
                  </p>
                </div>
                <span className="text-xs font-black px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl border border-rose-100">
                  Direct Escalation
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Category & Photos Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <FaExclamationTriangle className="text-rose-500" /> Incident Category
                    </label>
                    <select
                      value={pollutionType}
                      onChange={(e) => setPollutionType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all cursor-pointer"
                      required
                    >
                      <option value="">Select Category...</option>
                      <option value="Air Pollution">💨 Air Pollution & Smoke</option>
                      <option value="Water Contamination">💧 Water Body Contamination</option>
                      <option value="Illegal Garbage Dump">🗑️ Illegal Garbage Dump</option>
                      <option value="Chemical/Toxic Waste">☠️ Chemical / Toxic Waste</option>
                      <option value="Noise Pollution">📢 Industrial Noise Violation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                      <FaCamera className="text-rose-500" /> Photographic Evidence <span className="text-slate-400 font-normal lowercase">(max 4)</span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current.click()}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-center cursor-pointer hover:bg-rose-50/40 hover:border-rose-300 transition-all flex items-center justify-center gap-2"
                    >
                      <FaCamera className="text-slate-400" size={14} />
                      <span className="text-xs font-bold text-slate-600">
                        {photos.length > 0 ? `${photos.length}/4 Photos Attached` : "Upload Photos"}
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
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5 block">
                    Detailed Observations & Severity
                  </label>
                  <textarea
                    placeholder="Provide details on odors, duration of dumping, surrounding water bodies, or landmarks..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all resize-none"
                    required
                  />
                </div>

                {/* Map & Coordinates */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <FaMapMarkerAlt className="text-rose-500" /> Precise Coordinates Pin
                    </label>
                    <button
                      type="button"
                      onClick={getLocation}
                      className={`text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all ${
                        locationStatus === "success"
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-200"
                          : "text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                      }`}
                    >
                      <FaCrosshairs className={locationStatus === "loading" ? "animate-spin" : ""} size={12} />
                      <span>{locationStatus === "success" ? "✓ Coordinates Locked" : "Capture Location"}</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden h-[150px] w-full relative z-0 shadow-inner">
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

                {/* Action Trigger */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? "Broadcasting Dossier..." : "🚨 Broadcast Environmental Report"}
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* ── LOWER SECTION: REPORTED HOTSPOTS HISTORY LEDGER ── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                  <FaHistory size={14} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">Your Transmitted Incident Registry</h3>
                  <p className="text-xs text-slate-400 font-medium">Track resolution and cleanup stages for your reported spots.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 w-fit">
                {pastPollution.length} Reported Incidents
              </span>
            </div>

            {loadingPollution ? (
              <div className="py-12 text-center text-slate-400 font-bold text-sm">
                Loading incident logs...
              </div>
            ) : pastPollution.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <FaShieldAlt size={28} className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-sm text-slate-600">No reported incidents</p>
                <p className="text-xs text-slate-400 mt-0.5">Use the console above if you notice an environmental violation.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-black uppercase tracking-wider">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Observation Notes</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentRecords.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleDateString()}
                          <span className="block text-[10px] text-slate-400 font-medium">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {item.pollutionType}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 max-w-sm truncate">
                          {item.description}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                            {item.status || "Escalated"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                    <p className="text-xs text-slate-400 font-bold">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default PollutionReport;

