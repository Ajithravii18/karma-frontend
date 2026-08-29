import React, { useState, useRef, useEffect } from"react";
import api from"../utils/api";
import toast from"react-hot-toast";
import { useNavigate } from"react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from"react-leaflet";
import L from"leaflet";
import"leaflet/dist/leaflet.css";
import Nav from"../Components/Nav";
import AOS from"aos";
import { FaMapMarkerAlt, FaCrosshairs, FaCamera, FaExclamationTriangle, FaTrash } from"react-icons/fa";

// Fix for Leaflet default marker icons
const markerIcon = new L.Icon({
  iconUrl:"https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
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
    getLocation(); // Auto-request location on mount
    fetchPastPollution();
  }, []);

  const getLocation = () => {
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("success");
        toast.success("Location Pinpoint Fixed");
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
      toast.error("Limit: 4 Evidence Images");
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

    if (locationStatus !=="success") {
      toast.error("Please tag a precise location");
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
        headers: {"Content-Type":"multipart/form-data",
        },
      });

      toast.success("Environmental Report Transmitted");
      setPollutionType("");
      setDescription("");
      setPhotos([]);
      fetchPastPollution();
    } catch (err) {
      toast.error(err.response?.data?.message ||"Transmission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Nav />

      <main className="flex-1 flex items-center justify-center px-4 py-8 pt-[88px]">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Card Top Banner */}
          <div className="bg-rose-950 px-6 sm:px-8 py-5 flex items-center justify-between border-b border-rose-900/50">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-rose-500/20 rounded-full mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                <span className="text-[9px] font-black text-rose-300 uppercase tracking-widest">Environmental Watch</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Report a <span className="text-rose-400 italic">Pollution Spot</span>
              </h1>
            </div>
            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 items-center justify-center text-rose-400 text-xl font-black">
              🚨
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            {/* Category & Photo Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <FaExclamationTriangle className="text-rose-500" /> Incident Category
                </label>
                <select
                  value={pollutionType}
                  onChange={(e) => setPollutionType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all cursor-pointer"
                  required
                >
                  <option value="">Select Category...</option>
                  <option value="Air Pollution">💨 Air Pollution</option>
                  <option value="Water Contamination">💧 Water Contamination</option>
                  <option value="Illegal Garbage Dump">🗑️ Illegal Garbage Dump</option>
                  <option value="Chemical/Toxic Waste">☠️ Chemical / Toxic Waste</option>
                  <option value="Noise Pollution">📢 Noise Hazard</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                  <FaCamera className="text-rose-500" /> Photos <span className="text-slate-400 font-normal lowercase">(max 4)</span>
                </label>
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-center cursor-pointer hover:bg-rose-50/50 hover:border-rose-300 transition-all flex items-center justify-center gap-2"
                >
                  <FaCamera className="text-slate-400" size={14} />
                  <span className="text-xs font-bold text-slate-600">
                    {photos.length > 0 ? `${photos.length}/4 Attached` : "Upload Evidence"}
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
              <div className="grid grid-cols-4 gap-2">
                {photos.map((file, index) => (
                  <div key={index} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group">
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removePhoto(index); }}
                      className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTrash size={9} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5 block">
                Description & Impact
              </label>
              <textarea
                placeholder="Describe visible damage, odors, source of contamination..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 outline-none transition-all resize-none"
                required
              />
            </div>

            {/* Map & Location */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FaMapMarkerAlt className="text-rose-500" /> Coordinates
                </label>
                <button
                  type="button"
                  onClick={getLocation}
                  className={`text-xs font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                    locationStatus === "success"
                      ? "text-emerald-700 bg-emerald-50"
                      : "text-rose-600 bg-rose-50 hover:bg-rose-100"
                  }`}
                >
                  <FaCrosshairs className={locationStatus === "loading" ? "animate-spin" : ""} size={11} />
                  <span>{locationStatus === "success" ? "✓ Synced" : "Pin My Location"}</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden h-[120px] w-full relative z-0 shadow-inner">
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
                className="w-full bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? "Transmitting Incident..." : "🚨 Transmit Pollution Report"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default PollutionReport;

