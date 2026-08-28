import React, { useState, useRef, useEffect } from "react";
import api from "../utils/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Nav from "../Components/Nav";
import AOS from "aos";
import { FaMapMarkerAlt, FaCrosshairs, FaCamera, FaExclamationTriangle, FaTrash } from "react-icons/fa";

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

    if (locationStatus !== "success") {
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
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Environmental Report Transmitted");
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
                Citizen Watch
              </div>
              
              <h1 className="text-5xl md:text-[4rem] font-black text-[#1A2530] leading-[1.05] tracking-tight mb-6">
                Report <br />
                <span className="text-[#09B948] italic tracking-tighter">Pollution Spot.</span>
              </h1>
              
              <p className="text-gray-500 text-lg md:text-xl font-medium max-w-md leading-relaxed">
                Help our volunteers find and verify environmental hazards. Upload photos and pin the exact coordinates of the issue.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center min-h-[160px]">
                <div className="w-10 h-10 rounded-full bg-[#E9F5EC] text-[#0B7A30] flex items-center justify-center mb-4">
                  <FaCrosshairs size={16} />
                </div>
                <h4 className="font-black text-[#1A2530] text-lg mb-1">Pinpoint Accuracy</h4>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">GPS location helps fast verification.</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center min-h-[160px]">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 text-[#EA580C] flex items-center justify-center mb-4">
                  <FaCamera size={16} />
                </div>
                <h4 className="font-black text-[#1A2530] text-lg mb-1">Visual Evidence</h4>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">Upload photos for quick assessment.</p>
              </div>
            </div>
          </div>

          {/* RIGHT PANE (FORM) */}
          <div className="bg-white p-8 md:p-12 lg:p-16 rounded-[3rem] shadow-sm border border-gray-100 min-h-[680px] flex flex-col justify-center">
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                  <FaExclamationTriangle /> Incident Category
                </label>
                <select
                  value={pollutionType}
                  onChange={(e) => setPollutionType(e.target.value)}
                  className="w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 border-transparent rounded-2xl px-5 py-4 font-bold text-gray-700 outline-none focus:bg-white focus:border-[#09B948] transition-all border shadow-none cursor-pointer appearance-none"
                  required
                >
                  <option value="">Select Category...</option>
                  <option>Air Pollution</option>
                  <option>Water Contamination</option>
                  <option>Illegal Garbage Dump</option>
                  <option>Chemical/Toxic Waste</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Description</label>
                <textarea
                  placeholder="Describe the environmental hazard..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 border-transparent rounded-3xl px-5 py-5 font-bold text-gray-700 outline-none focus:bg-white focus:border-[#09B948] transition-all border shadow-none min-h-[100px] resize-none"
                  required
                />
              </div>

              {/* Enhanced Image Upload with Previews */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-2">
                  <FaCamera /> Evidence Photos
                </label>
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 border-2 border-dashed border-gray-300 rounded-3xl px-5 py-8 text-center cursor-pointer hover:bg-white hover:border-[#09B948] transition-all group flex flex-col items-center justify-center"
                >
                  <FaCamera className="text-gray-400 group-hover:text-[#09B948] mb-2 transition-colors" size={24} />
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                    {photos.length >= 4 ? "Max Capacity Reached" : "Attach Evidence Photos (Max 4)"}
                  </p>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    {photos.map((file, index) => (
                      <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 shadow-sm group">
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
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

              {/* Location Selector */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={getLocation}
                  className={w-full py-4 font-black text-[11px] uppercase tracking-widest rounded-full border transition-all flex items-center justify-center gap-3 }
                >
                  <FaCrosshairs size={14} /> {locationStatus === "success" ? "COORDINATES SECURED (RE-SYNC)" : "?? Pin Current Location"}
                </button>

                <div className="rounded-3xl overflow-hidden h-[180px] w-full border-4 border-[#F1F3F2] relative z-0">
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
                  className="w-full bg-[#09B948] text-white py-5 rounded-full text-sm font-black uppercase tracking-widest hover:bg-[#0B7A30] transition-all shadow-[0_6px_20px_rgb(9,185,72,0.4)] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {submitting ? "Transmitting Evidence..." : "?? Broadcast Report"}
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

