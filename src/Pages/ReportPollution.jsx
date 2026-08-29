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
    <div className="min-h-screen bg-slate-50 font-sans pb-10 relative">
      <Nav />

      <section className="pt-[84px] pb-10 px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT PANE */}
          <div className="flex flex-col justify-between bg-rose-950 text-white rounded-[2.5rem] min-h-[680px] p-8 md:p-12">

            <div>
              {/* Badge pill */}
              <div className="bg-rose-500/20 text-rose-300 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full inline-flex items-center gap-2 mb-10">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                Citizen Watch
              </div>

              {/* Heading */}
              <h1 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6">
                Report <br />
                <span className="text-rose-400 italic">Pollution Spot.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-rose-200/60 text-base font-medium max-w-xs leading-relaxed">
                Help our volunteers find and verify environmental hazards. Upload photos and pin the exact coordinates of the issue.
              </p>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-2 gap-4 mt-12">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                  <FaCrosshairs size={16} />
                </div>
                <h4 className="font-black text-white text-sm mb-1">Pinpoint Accuracy</h4>
                <p className="text-xs font-medium text-rose-200/50 leading-relaxed">GPS location helps fast verification.</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <FaCamera size={16} />
                </div>
                <h4 className="font-black text-white text-sm mb-1">Visual Evidence</h4>
                <p className="text-xs font-medium text-rose-200/50 leading-relaxed">Upload photos for quick assessment.</p>
              </div>
            </div>
          </div>

          {/* RIGHT PANE (FORM) */}
          <div className="bg-white rounded-[2.5rem] min-h-[680px] p-8 md:p-12 flex flex-col justify-center shadow-sm border border-slate-200">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Incident Category */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                  <FaExclamationTriangle /> Incident Category
                </label>
                <select
                  value={pollutionType}
                  onChange={(e) => setPollutionType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all text-sm cursor-pointer appearance-none"
                  required
                >
                  <option value="">Select Category...</option>
                  <option>Air Pollution</option>
                  <option>Water Contamination</option>
                  <option>Illegal Garbage Dump</option>
                  <option>Chemical/Toxic Waste</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                  Description
                </label>
                <textarea
                  placeholder="Describe the environmental hazard..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all text-sm min-h-[100px] resize-none"
                  required
                />
              </div>

              {/* Evidence Photos */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                  <FaCamera /> Evidence Photos
                </label>

                <div
                  onClick={() => fileInputRef.current.click()}
                  className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl px-5 py-8 text-center cursor-pointer hover:bg-white hover:border-rose-400 transition-all group flex flex-col items-center justify-center"
                >
                  <FaCamera className="text-slate-400 group-hover:text-rose-500 mb-2 transition-colors" size={24} />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                    {photos.length >= 4 ? "Max Capacity Reached" : "Attach Evidence Photos (Max 4)"}
                  </p>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    {photos.map((file, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removePhoto(index); }}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                        >
                          <FaTrash size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                />
              </div>

              {/* Location */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                  <FaMapMarkerAlt /> Location
                </label>

                <button
                  type="button"
                  onClick={getLocation}
                  className={
                    locationStatus === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl py-3.5 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 w-full hover:bg-emerald-100 transition-all"
                      : "bg-slate-50 text-slate-700 border border-slate-200 rounded-xl py-3.5 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 w-full hover:bg-slate-100 transition-all"
                  }
                >
                  <FaCrosshairs size={14} />
                  {locationStatus === "success"
                    ? "Coordinates Secured — Re-Sync"
                    : "Pin Current Location"}
                </button>

                <div className="border-2 border-slate-100 rounded-2xl overflow-hidden h-[180px] w-full relative z-0">
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

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? "Transmitting Evidence..." : "Broadcast Report"}
                </button>
              </div>

            </form>
          </div>

        </div>
      </section>
    </div>
  );
}

export default PollutionReport;

