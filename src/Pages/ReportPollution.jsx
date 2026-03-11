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

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    getLocation(); // Auto-request location on mount
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
    } catch (err) {
      toast.error(err.response?.data?.message || "Transmission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FDFDFD] min-h-screen">
      <Nav />

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* LEFT CONTENT: Impact Messaging */}
          <div className="lg:sticky lg:top-32 space-y-8">
            <div data-aos="fade-right" className="space-y-4">
              <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 w-max">
                <FaExclamationTriangle /> Urgent Incident Report
              </span>
              <h1 className="text-6xl font-black text-slate-900 leading-[1.1]">
                Report <br />
                <span className="text-emerald-600 italic">Pollution Spot.</span>
              </h1>
              <p className="text-slate-500 text-xl max-w-lg leading-relaxed">
                Help our volunteers find and verify environmental hazards. Upload photos and pin the exact coordinates of the issue.
              </p>
            </div>

            <div data-aos="fade-up" data-aos-delay="200" className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <FaCrosshairs className="text-emerald-500 mb-3" size={24} />
                <h4 className="font-bold text-slate-800">Pinpoint Accuracy</h4>
                <p className="text-xs text-slate-400">GPS location helps fast verification.</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <FaCamera className="text-blue-500 mb-3" size={24} />
                <h4 className="font-bold text-slate-800">Visual Evidence</h4>
                <p className="text-xs text-slate-400">Upload photos for quick assessment.</p>
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT: The Power Form */}
          <div data-aos="zoom-in" className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-50">
            <form onSubmit={handleSubmit} className="space-y-6">

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2">
                  <FaExclamationTriangle /> Incident Category
                </label>
                <select
                  value={pollutionType}
                  onChange={(e) => setPollutionType(e.target.value)}
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-600 outline-none appearance-none cursor-pointer"
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
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Description</label>
                <textarea
                  placeholder="Describe the environmental hazard..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              {/* Enhanced Image Upload with Previews */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2">
                  <FaCamera /> Evidence Photos
                </label>
                <div
                  onClick={() => fileInputRef.current.click()}
                  className="border-2 border-dashed border-slate-200 p-6 rounded-2xl text-center cursor-pointer bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
                >
                  <FaCamera className="mx-auto text-slate-300 group-hover:text-emerald-500 mb-2 transition-colors" size={24} />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">
                    {photos.length >= 4 ? "Max Capacity Reached" : "Attach Evidence Photos (Max 4)"}
                  </p>
                </div>

                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {photos.map((file, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-sm group">
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
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={getLocation}
                  className={`w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 ${locationStatus === "success"
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "bg-orange-50 text-orange-600 animate-pulse hover:bg-orange-100"
                    }`}
                >
                  <FaCrosshairs /> {locationStatus === "success" ? "COORDINATES SECURED (RE-SYNC)" : "📍 Pin Current Location"}
                </button>

                <div className="rounded-[2rem] overflow-hidden border-8 border-slate-50 h-56 shadow-inner relative group">
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
                  <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-[1.5rem]" />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-5 bg-emerald-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 shadow-xl shadow-emerald-200 transition-all transform hover:-translate-y-1 active:scale-95 disabled:bg-slate-300"
              >
                {submitting ? "Transmitting Evidence..." : "🚀 Broadcast Report"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PollutionReport;