import React, { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png";
import {
  FaColumns, FaCheck, FaClock, FaPhoneAlt, FaLeaf, FaTrashAlt,
  FaDirections, FaHistory, FaCheckCircle, FaArrowRight,
  FaTruckLoading, FaSync, FaUserShield, FaMapMarkerAlt,
  FaExclamationTriangle, FaCamera, FaUtensils, FaImages, FaTimes, FaUpload,
  FaStar, FaInfoCircle
} from "react-icons/fa";
import api from "../utils/api";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Nav from "../Components/Nav";
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "../firebaseconfig";


// --- ⏲️ SUB-COMPONENT: LIVE EXPIRY TIMER ---
const FoodTimer = ({ expiryTime }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(expiryTime) - new Date();
      if (diff <= 0) return "EXPIRED";
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${mins}m left`;
    };
    setTimeLeft(calculate());
    const interval = setInterval(() => setTimeLeft(calculate()), 60000);
    return () => clearInterval(interval);
  }, [expiryTime]);

  if (timeLeft === "EXPIRED") return (
    <span className="bg-rose-500 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase animate-pulse">
      Expired
    </span>
  );

  return (
    <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[9px] font-black uppercase flex items-center gap-1">
      <FaClock size={8} /> {timeLeft}
    </span>
  );
};

const VolunteerPortal = () => {
  const [activeTab, setActiveTab] = useState("missions");
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sectorFilter, setSectorFilter] = useState("All Sectors");
  const [volunteerInfo, setVolunteerInfo] = useState({ name: "", phone: "" });
  const [photoModal, setPhotoModal] = useState({ open: false, taskId: null, preview: null, file: null, uploading: false });
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- 🔒 SECURITY STATES ---
  const [showSecurity, setShowSecurity] = useState(false);
  const [phoneState, setPhoneState] = useState({ show: false, newPhone: "", otp: "", step: 1, loading: false });
  const [deleteState, setDeleteState] = useState({ show: false, reason: "", otp: "", loading: false });
  const [reviewModal, setReviewModal] = useState({ show: false, item: null, type: "", rating: 0, comment: "", isReport: false, reportReason: "", loading: false });

  const navigate = useNavigate();
  const token = localStorage.getItem("authToken") || localStorage.getItem("token");

  let currentVolunteerId = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      currentVolunteerId = String(decoded.userID || decoded.id || decoded._id || decoded.userId);
    } catch (e) { console.error("Token Error", e); }
  }

  // Check if volunteer is already in the middle of a mission
  const activeTask = tasks.find(t =>
    String(t.assignedVolunteer) === currentVolunteerId &&
    !["completed", "resolved", "delivered", "success"].includes((t.status || "").toLowerCase())
  );

  const isVolunteerBusy = !!activeTask;
  useEffect(() => {
    fetchProfile();
    fetchTasks(true);
    const interval = setInterval(() => fetchTasks(false), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, sectorFilter]);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/me");
      const data = res.data.user || res.data;
      setVolunteerInfo({
        name: data.name,
        phone: data.phone,
        averageRating: data.averageRating,
        reviewCount: data.reviewCount
      });
    } catch (err) { console.error("Profile Fetch Error", err); }
  };

  const fetchTasks = async (isInitial = false) => {
    if (!token) return;
    try {
      if (isInitial) setLoading(true);
      else setIsSyncing(true);
      const res = await api.get("/api/volunteer/tasks");
      const rawData = Array.isArray(res.data) ? res.data : (res.data.tasks || []);

      setTasks(rawData.map(task => ({
        ...task,
        isWaste: !!task.wasteType,
        isFood: !!task.placeName,
        isPollution: !!task.pollutionType
      })));
    } catch (err) { console.error(err); } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  const handleNavigation = (task) => {
    const lat = task.latitude || task.location?.lat;
    const lng = task.longitude || task.location?.lng;
    const url = (lat && lng)
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address || task.placeName || "")}`;
    window.open(url, "_blank");
  };

  const handleClaim = async (task) => {
    if (isVolunteerBusy) return toast.error("Complete your active mission first!");

    let url = "";
    if (task.isFood) url = `/api/food/volunteer-claim/${task._id}`;
    else if (task.isPollution) url = `/api/volunteer/claim-pollution/${task._id}`;
    else url = `/api/volunteer/claim-pickup/${task._id}`;

    try {
      await api.patch(url, {});
      toast.success("Mission Secured!");
      fetchTasks(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Claim failed.");
    }
  };

  const handleAction = async (taskId, actionType, extraData = {}) => {
    let endpoint = "";
    const task = tasks.find(t => t._id === taskId);
    let payload = {};

    switch (actionType) {
      case 'arrival':
        endpoint = task.isPollution ? `pollution/arrival/${taskId}` : `confirm-arrival/${taskId}`;
        break;
      case 'complete':
        const recordedWeight = window.prompt("⚖️ MISSION DEBRIEF: Enter the total weight of waste collected (KG):", "0");
        if (recordedWeight === null) return; // Cancelled
        payload.weight = parseFloat(recordedWeight) || 0;
        endpoint = `complete-collection/${taskId}`;
        break;
      case 'resolve':
        endpoint = `resolve-pollution/${taskId}`;
        break;
      case 'collect_food':
        try {
          await api.patch(`/api/food/volunteer-collected/${taskId}`, {});
          toast.success("Food Collected! 🍲");
          fetchTasks(false);
        } catch (err) {
          toast.error(err.response?.data?.message || "Collection failed.");
        }
        return;
      case 'deliver_food':
        // Route is: PATCH /api/food/complete/:id (different base path)
        try {
          payload.deliveryPhoto = extraData.photoUrl;
          await api.patch(`/api/food/complete/${taskId}`, payload);
          toast.success("Delivery Confirmed! 🎉");
          fetchTasks(false);
        } catch (err) {
          console.error("Deliver food error:", err.response?.data);
          toast.error(err.response?.data?.message || "Delivery failed.");
        }
        return; // Early return - already handled
      default: return;
    }

    try {
      await api.patch(`/api/volunteer/${endpoint}`, payload);
      toast.success("Impact Recorded!");
      fetchTasks(false);
    } catch (err) { toast.error("Action failed."); }
  };

  // Opens the Camera / Gallery picker modal
  const triggerPhotoUpload = (taskId) => {
    setPhotoModal({ open: true, taskId, preview: null, file: null, uploading: false });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPhotoModal(prev => ({ ...prev, preview, file }));
  };

  const submitDeliveryPhoto = async () => {
    if (!photoModal.file) return toast.error("Please select a photo first.");
    setPhotoModal(prev => ({ ...prev, uploading: true }));
    const loadingToast = toast.loading("Uploading proof of delivery...");
    try {
      const formData = new FormData();
      formData.append("photo", photoModal.file);
      // Upload to our own server's /uploads directory
      const res = await api.post("/api/upload-delivery-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.dismiss(loadingToast);
      const photoUrl = res.data.url;
      setPhotoModal({ open: false, taskId: null, preview: null, file: null, uploading: false });
      handleAction(photoModal.taskId, 'deliver_food', { photoUrl });
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Upload failed. Try again.");
      setPhotoModal(prev => ({ ...prev, uploading: false }));
    }
  };

  const handleUnclaim = async (taskId, isPollution = false) => {
    if (!window.confirm("Abandon this mission?")) return;
    const url = isPollution
      ? `/api/volunteer/unclaim-pollution/${taskId}`
      : `/api/volunteer/unclaim-mission/${taskId}`;

    try {
      await api.patch(url, {});
      toast.success("Mission released.");
      fetchTasks(false);
    } catch (err) { toast.error("Release failed"); }
  };

  const handleFlagReport = async (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    const type = task.isFood ? "food" : task.isPollution ? "pollution" : "pickup";

    const reason = window.prompt("⚠️ SECURITY ALERT: Describe why this report is fraudulent/wrong (e.g. Empty location, fake photo):");
    if (!reason) return;

    try {
      await api.patch(`/api/volunteer/flag-report/${type}/${taskId}`, { reason });
      toast.success("Identity reported to Admin HQ.");
      fetchTasks(false);
    } catch (err) {
      toast.error("Handshake failed.");
    }
  };

  const handleReviewSubmit = async () => {
    if (reviewModal.rating === 0 && !reviewModal.isReport) return toast.error("Select a rating or file a report");
    if (reviewModal.isReport && reviewModal.reportReason.length < 5) return toast.error("Provide a detailed report reason");

    setReviewModal(prev => ({ ...prev, loading: true }));
    try {
      const revieweeId = reviewModal.item.userId?._id || reviewModal.item.userId || reviewModal.item.user;

      await api.post("/api/user/submit-review", {
        requestId: reviewModal.item._id,
        requestType: reviewModal.item.isFood ? 'food' : reviewModal.item.isPollution ? 'pollution' : 'pickup',
        revieweeId,
        rating: reviewModal.rating,
        comment: reviewModal.comment,
        isReport: reviewModal.isReport,
        reportReason: reviewModal.reportReason
      });
      toast.success("Identity review uploaded to mission logs");
      setReviewModal({ show: false, item: null, type: "", rating: 0, comment: "", isReport: false, reportReason: "", loading: false });
      fetchTasks(false);
    } catch (err) {
      toast.error("Upload failed. Offline?");
      setReviewModal(prev => ({ ...prev, loading: false }));
    }
  };

  // --- PHONE UPDATE HANDLERS (FIREBASE) ---
  const handleSendPhoneOtp = async () => {
    if (!phoneState.newPhone) return toast.error("Enter new phone number");
    const formattedPhone = phoneState.newPhone.startsWith("+91") ? phoneState.newPhone : `+91${phoneState.newPhone}`;

    setPhoneState(prev => ({ ...prev, loading: true }));
    try {
      // 1. Check availability on backend
      const check = await api.get(`/api/check-phone-availability?phone=${formattedPhone}`);
      if (check.data.exists) {
        setPhoneState(prev => ({ ...prev, loading: false }));
        return toast.error("Number already registered ❌");
      }

      // 2. Firebase Recaptcha
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }

      // 3. Send SMS
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;

      toast.success("Security code sent! 📱");
      setPhoneState(prev => ({ ...prev, step: 2, loading: false }));
    } catch (err) {
      console.error(err);
      toast.error("Process failed. Try again.");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      setPhoneState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleVerifyPhone = async () => {
    try {
      setPhoneState(prev => ({ ...prev, loading: true }));
      // 1. Confirm Firebase Code
      await window.confirmationResult.confirm(phoneState.otp);

      // 2. Update Backend
      await api.patch("/api/update-phone", { newPhone: phoneState.newPhone });

      toast.success("Shield updated! Rebooting session...");
      localStorage.clear();
      setTimeout(() => window.location.href = "/login", 1500);
    } catch (err) {
      toast.error("Invalid verification code");
      setPhoneState(prev => ({ ...prev, loading: false }));
    }
  };

  // --- 🗑️ DELETION HANDLERS (FIREBASE) ---
  const handleDeleteRequest = async () => {
    if (deleteState.reason.length < 5) return toast.error("Mission debrief too short");
    setDeleteState(prev => ({ ...prev, loading: true }));
    try {
      // 1. Firebase Recaptcha
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }

      // 2. Send SMS to current number (volunteerInfo.phone is fetched on mount)
      const confirmationResult = await signInWithPhoneNumber(auth, volunteerInfo.phone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;

      toast.success("Termination OTP sent! 🔐");
      setDeleteState(prev => ({ ...prev, step: 2, loading: false }));
    } catch (err) {
      toast.error("Security handshake failed");
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
      setDeleteState(prev => ({ ...prev, loading: false }));
    }
  };

  const handleFinalDelete = async () => {
    try {
      setDeleteState(prev => ({ ...prev, loading: true }));
      // 1. Verify Firebase
      await window.confirmationResult.confirm(deleteState.otp);

      // 2. Final Purge
      await api.delete("/api/delete-account", { data: { reason: deleteState.reason } });

      toast.success("Identity purged. Mission terminated.");
      localStorage.clear();
      setTimeout(() => window.location.href = "/", 1500);
    } catch (err) {
      toast.error("Verification failed");
      setDeleteState(prev => ({ ...prev, loading: false }));
    }
  };



  // --- 🎯 CORE LOGIC: FILTERING ---
  const visibleTasks = tasks.filter(t => {
    const status = (t.status || "").toLowerCase();
    const isMine = t.assignedVolunteer && String(t.assignedVolunteer) === String(currentVolunteerId);
    const isFinished = ["completed", "resolved", "delivered", "success"].includes(status);
    const isPublicAvailable = !t.assignedVolunteer && !isFinished && (status === "verified" || status === "available" || !t.isPollution);

    // Sector filter
    if (sectorFilter === "Food Only" && !t.isFood) return false;
    if (sectorFilter === "Waste Only" && !t.isWaste) return false;
    if (sectorFilter === "Pollution Only" && !t.isPollution) return false;

    // Status filter
    if (statusFilter === "Completed") return isMine && isFinished;
    if (statusFilter === "Pending") return (isMine && !isFinished) || isPublicAvailable;

    return isMine || isPublicAvailable;
  });

  const myCompletedCount = tasks.filter(t => {
    const isMine = t.assignedVolunteer && String(t.assignedVolunteer) === String(currentVolunteerId);
    return isMine && ["completed", "resolved", "delivered", "success"].includes(t.status?.toLowerCase());
  }).length;

  const totalPages = Math.ceil(visibleTasks.length / itemsPerPage);
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = currentPage * itemsPerPage;
  const currentTasks = visibleTasks.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Nav />

      {/* ── SaaS SIDEBAR ── */}
      <div className="flex pt-[68px] min-h-screen w-full">
        <aside className="hidden lg:flex w-64 bg-white flex-col fixed top-0 left-0 h-screen overflow-y-auto no-scrollbar z-[150] border-r border-slate-200">
          {/* Logo Section */}
          <div className="h-[68px] flex items-center gap-2 px-6 border-b border-slate-200 cursor-pointer shrink-0" onClick={() => navigate("/")}>
            <img src={logo} className="w-8" alt="E-Karma Logo" />
            <span className="text-base font-black tracking-tighter uppercase text-slate-800">E-Karma</span>
          </div>

          <nav className="flex flex-col gap-1 p-4 flex-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Missions</p>
            {[
              { id: "All Sectors", icon: FaColumns, label: "All Missions", color: "text-emerald-500", bg: "bg-emerald-100/50" },
              { id: "Waste Only", icon: FaTrashAlt, label: "Waste Control", color: "text-emerald-600", bg: "bg-emerald-100/50" },
              { id: "Pollution Only", icon: FaExclamationTriangle, label: "Pollution Cases", color: "text-rose-500", bg: "bg-rose-100/50" },
              { id: "Food Only", icon: FaUtensils, label: "Food Rescues", color: "text-amber-500", bg: "bg-amber-100/50" }
            ].map(tab => {
              const isActive = sectorFilter === tab.id && activeTab === "missions";
              return (
                <button
                  key={tab.id}
                  onClick={() => { setSectorFilter(tab.id); setActiveTab("missions"); }}
                  className={`group flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-colors duration-200 flex items-center justify-center w-8 h-8 ${
                    isActive
                      ? "bg-white/20 text-white" 
                      : `bg-slate-100 text-slate-400 group-hover:${tab.bg} group-hover:${tab.color}`
                  }`}>
                    <tab.icon size={14} />
                  </div>
                  {tab.label}
                </button>
              );
            })}
            
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-6">History</p>
            <button
              onClick={() => navigate("/volunteer-history")}
              className="group flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
            >
              <div className="p-2 rounded-lg transition-colors duration-200 flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-400 group-hover:bg-emerald-100/50 group-hover:text-emerald-600">
                <FaCheckCircle size={14} />
              </div>
              Completed Log
            </button>

            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-6">Account</p>
            <button
              onClick={() => setActiveTab('profile')}
              className={`group flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${
                activeTab === 'profile'
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
              }`}
            >
              <div className={`p-2 rounded-lg transition-colors duration-200 flex items-center justify-center w-8 h-8 ${
                activeTab === 'profile'
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-400 group-hover:bg-indigo-100/50 group-hover:text-indigo-600"
              }`}>
                <FaUserShield size={14} />
              </div>
              Profile & Security
            </button>
          </nav>
          
          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Performance Score</p>
              <div className="flex items-center gap-2 mb-1">
                <FaStar className="text-amber-500 text-base" />
                <span className="text-lg font-black text-slate-800">{volunteerInfo.averageRating || "0.0"}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">From {volunteerInfo.reviewCount || 0} citizen reviews</p>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 lg:ml-64 w-full p-4 sm:p-6 lg:p-8 min-w-0 pb-36 sm:pb-32 lg:pb-12">

          {/* ===== CAMERA / GALLERY PICKER MODAL ===== */}
          {photoModal.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
                  <div>
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Proof of Delivery</p>
                    <h3 className="text-base font-black text-slate-900">Upload Delivery Photo</h3>
                  </div>
                  <button onClick={() => setPhotoModal({ open: false, taskId: null, preview: null, file: null, uploading: false })} className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all">
                    <FaTimes size={12} />
                  </button>
                </div>

                {/* Preview */}
                {photoModal.preview ? (
                  <div className="relative m-5 rounded-2xl overflow-hidden border-2 border-slate-200" style={{ height: '200px' }}>
                    <img src={photoModal.preview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPhotoModal(prev => ({ ...prev, preview: null, file: null }))}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-black transition-all"
                    >
                      <FaTimes size={10} />
                    </button>
                  </div>
                ) : (
                  /* Picker Buttons */
                  <div className="grid grid-cols-2 gap-3 p-5">
                    {/* Camera Option */}
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-5 bg-emerald-50/70 hover:bg-emerald-100 rounded-2xl border border-emerald-200 transition-all group"
                    >
                      <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                        <FaCamera size={18} />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-800 text-xs">Camera</p>
                        <p className="text-[9px] text-slate-400 font-medium">Take a photo</p>
                      </div>
                    </button>

                    {/* Gallery Option */}
                    <button
                      onClick={() => galleryInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 p-5 bg-indigo-50/70 hover:bg-indigo-100 rounded-2xl border border-indigo-200 transition-all group"
                    >
                      <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                        <FaImages size={18} />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-800 text-xs">Gallery</p>
                        <p className="text-[9px] text-slate-400 font-medium">Pick from files</p>
                      </div>
                    </button>
                  </div>
                )}

                {/* Hidden Inputs */}
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
                <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

                {/* Submit Button (shown after preview) */}
                {photoModal.preview && (
                  <div className="p-5 pt-0 space-y-2">
                    <button
                      onClick={submitDeliveryPhoto}
                      disabled={photoModal.uploading}
                      className="w-full py-3 bg-emerald-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-emerald-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:bg-slate-300"
                    >
                      {photoModal.uploading ? (
                        <><FaSync className="animate-spin" /> Uploading...</>
                      ) : (
                        <><FaUpload /> Confirm Delivery</>
                      )}
                    </button>
                    <button
                      onClick={() => setPhotoModal(prev => ({ ...prev, preview: null, file: null }))}
                      className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-all"
                    >
                      Retake Photo
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' ? (
            /* ── PROFILE & SECURITY TAB ── */
            <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl mb-12">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Volunteer <span className="text-emerald-600">Profile</span></h1>
                <p className="text-xs font-semibold text-slate-500 mt-1">Manage your registered phone number, verified metrics, and credentials.</p>
              </div>
              
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-3xl font-black shrink-0 border border-indigo-200">
                  {volunteerInfo.name?.charAt(0).toUpperCase() || "V"}
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="text-xl font-black text-slate-900">{volunteerInfo.name || "Volunteer Agent"}</h3>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-0.5">Volunteer ID: #{currentVolunteerId?.slice(-6) || "000000"}</p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-3">
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
                      <FaStar className="text-amber-500" /> {volunteerInfo.averageRating || "0.0"} Rating
                    </span>
                    <span className="bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200">
                      <FaPhoneAlt size={10} className="text-slate-400" /> {volunteerInfo.phone || "No Phone"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* ── CARD 1: UPDATE CONTACT NUMBER ACCORDION ── */}
                <div className={`bg-white border rounded-2xl shadow-xs transition-all overflow-hidden ${phoneState.show ? 'border-emerald-300 ring-2 ring-emerald-500/20' : 'border-slate-200'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneState(prev => ({ ...prev, show: !prev.show, step: 1 }));
                      if (deleteState.show) setDeleteState(prev => ({ ...prev, show: false }));
                    }}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center text-base shrink-0">
                        <FaSync className={phoneState.loading ? 'animate-spin' : ''} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Update Contact Number</h4>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">Change your registered phone number via OTP</p>
                      </div>
                    </div>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-transform ${phoneState.show ? 'bg-emerald-100 text-emerald-700 rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                      ▾
                    </div>
                  </button>

                  {/* Form directly inside Update Contact Card */}
                  {phoneState.show && (
                    <div className="px-4 sm:px-6 pb-5 pt-3 border-t border-slate-100 space-y-4 bg-slate-50/50 animate-in fade-in duration-200">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Enter New Mobile Number
                      </h4>
                      {phoneState.step === 1 ? (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="tel" placeholder="+91..."
                            value={phoneState.newPhone} onChange={(e) => setPhoneState({ ...phoneState, newPhone: e.target.value })}
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
                          />
                          <button
                            onClick={handleSendPhoneOtp} disabled={phoneState.loading}
                            className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {phoneState.loading ? "Sending..." : "Send OTP"}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-500 font-medium">Enter the 6-digit verification code sent to {phoneState.newPhone}:</p>
                          <div className="flex gap-2">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <input
                                key={i}
                                type="text"
                                maxLength="1"
                                value={phoneState.otp[i] || ""}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, "");
                                  let newOtp = phoneState.otp.split("");
                                  newOtp[i] = val;
                                  setPhoneState({ ...phoneState, otp: newOtp.join("") });
                                  if (val && e.target.nextSibling) e.target.nextSibling.focus();
                                }}
                                className="w-10 h-10 sm:w-11 sm:h-11 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-center outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                              />
                            ))}
                          </div>
                          <button
                            onClick={handleVerifyPhone} disabled={phoneState.loading}
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black transition-all shadow-sm disabled:opacity-50"
                          >
                            {phoneState.loading ? "Verifying..." : "Verify & Save"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── CARD 2: DELETE ACCOUNT ACCORDION ── */}
                <div className={`bg-white border rounded-2xl shadow-xs transition-all overflow-hidden ${deleteState.show ? 'border-rose-300 ring-2 ring-rose-500/20' : 'border-slate-200'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteState(prev => ({ ...prev, show: !prev.show }));
                      if (phoneState.show) setPhoneState(prev => ({ ...prev, show: false }));
                    }}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-base shrink-0">
                        <FaTrashAlt />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-rose-900">Delete Account</h4>
                        <p className="text-[10px] text-rose-600 font-medium mt-0.5">Permanently purge your volunteer account</p>
                      </div>
                    </div>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-transform ${deleteState.show ? 'bg-rose-100 text-rose-700 rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                      ▾
                    </div>
                  </button>

                  {/* Form directly inside Delete Account Card */}
                  {deleteState.show && (
                    <div className="px-4 sm:px-6 pb-5 pt-3 border-t border-rose-100 bg-rose-50/40 space-y-3 animate-in fade-in duration-200">
                      <p className="text-xs text-rose-600 font-medium">Mission data will be archived, identity will be permanently purged.</p>

                      {deleteState.step !== 2 ? (
                        <div className="space-y-3">
                          <textarea
                            placeholder="Reason for deletion..."
                            value={deleteState.reason} onChange={(e) => setDeleteState({ ...deleteState, reason: e.target.value })}
                            className="w-full bg-white border border-rose-200 rounded-xl p-3 text-xs font-medium outline-none focus:border-rose-500 min-h-[80px]"
                          />
                          <button
                            onClick={handleDeleteRequest} disabled={deleteState.loading}
                            className="bg-rose-600 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-700 transition-all shadow-sm disabled:opacity-50"
                          >
                            {deleteState.loading ? "Requesting OTP..." : "Request Deletion OTP"}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <input
                                key={i}
                                type="text"
                                maxLength="1"
                                value={deleteState.otp[i] || ""}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, "");
                                  let newOtp = deleteState.otp.split("");
                                  newOtp[i] = val;
                                  setDeleteState({ ...deleteState, otp: newOtp.join("") });
                                  if (val && e.target.nextSibling) e.target.nextSibling.focus();
                                }}
                                className="w-10 h-10 sm:w-11 sm:h-11 bg-white border border-rose-300 rounded-xl font-bold text-rose-900 text-center outline-none focus:border-rose-500 text-sm"
                              />
                            ))}
                          </div>
                          <button
                            onClick={handleFinalDelete} disabled={deleteState.loading}
                            className="bg-rose-700 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-800 transition-all shadow-sm disabled:opacity-50"
                          >
                            {deleteState.loading ? "Purging..." : "Confirm Permanent Deletion"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── MISSIONS OPERATIONS BOARD ── */
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Operations <span className="text-emerald-600">Board</span></h1>
                  <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-2">
                    {isSyncing ? <span className="text-emerald-600 flex items-center gap-1 font-bold"><FaSync className="animate-spin" size={10} /> Live Syncing...</span> : "GPS-Routed Volunteer Dispatch & Claim Hub"}
                  </p>
                </div>

                {/* Quick Metric Badges */}
                <div className="flex items-center gap-2.5">
                  <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 shadow-xs">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">In Sector</p>
                    <p className="text-sm font-black text-slate-800">{visibleTasks.length}</p>
                  </div>
                  <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 shadow-xs">
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Active</p>
                    <p className="text-sm font-black text-emerald-700">{activeTask ? "1" : "0"}</p>
                  </div>
                  <div className="bg-white border border-slate-200/80 rounded-xl px-3.5 py-2 shadow-xs">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Completed</p>
                    <p className="text-sm font-black text-slate-800">{myCompletedCount}</p>
                  </div>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs">
                {/* Sector Switcher on Mobile/Desktop */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-0.5 bg-slate-100 rounded-xl">
                  {["All Sectors", "Waste Only", "Pollution Only", "Food Only"].map(s => (
                    <button
                      key={s}
                      onClick={() => setSectorFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        sectorFilter === s
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {s.replace(" Only", "")}
                    </button>
                  ))}
                </div>

                {/* Status Switcher */}
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl">
                  {["All", "Pending", "Completed"].map(f => (
                    <button
                      key={f}
                      onClick={() => setStatusFilter(f)}
                      className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        statusFilter === f
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Missions Table */}
              <div className="hidden lg:block bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/80 border-b border-slate-200/80">
                      <tr>
                        <th className="py-3.5 px-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Sector</th>
                        <th className="py-3.5 px-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Mission Intelligence</th>
                        <th className="py-3.5 px-5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-center">Timestamp</th>
                        <th className="py-3.5 px-5 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Action & Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentTasks.length > 0 ? (
                        currentTasks.map((task) => {
                          const status = (task.status || "").toLowerCase();
                          const assignedToMe = task.assignedVolunteer && String(task.assignedVolunteer) === String(currentVolunteerId);
                          const isFinished = ["completed", "resolved", "delivered", "success"].includes(status);

                          return (
                            <tr key={task._id} className={`hover:bg-slate-50/60 transition-colors ${isFinished ? 'opacity-60 bg-slate-50/30' : assignedToMe ? 'bg-emerald-50/40' : ''}`}>
                              <td className="py-4 px-5">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base shadow-xs ${
                                  task.isFood ? 'bg-amber-100 text-amber-600' : task.isPollution ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {task.isFood ? <FaUtensils /> : task.isPollution ? <FaExclamationTriangle /> : <FaTrashAlt />}
                                </div>
                              </td>
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                    task.isFood ? "bg-amber-50 text-amber-700 border border-amber-200" : task.isPollution ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  }`}>
                                    {task.isFood ? "Food Rescue" : task.isPollution ? "Pollution Hazard" : "Waste Pickup"}
                                  </span>
                                  {task.isFood && !isFinished && <FoodTimer expiryTime={task.expiryTime} />}
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                  {task.isFood ? task.placeName : task.isPollution ? task.pollutionType : task.wasteType}
                                  {task.isFood && <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded border border-slate-200">{task.quantity} servings</span>}
                                </h3>
                                <div className="flex items-center gap-3 mt-1.5">
                                  <button onClick={() => handleNavigation(task)} className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:underline">
                                    <FaDirections /> GPS Navigation
                                  </button>
                                  {(task.userPhone || task.userId?.phone) && (
                                    <a href={`tel:${task.userPhone || task.userId?.phone}`} className="text-[10px] font-bold text-slate-500 flex items-center gap-1 hover:text-slate-800">
                                      <FaPhoneAlt size={9} /> Contact Citizen
                                    </a>
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-5 text-center">
                                <p className="text-xs font-bold text-slate-700">{new Date(task.createdAt).toLocaleDateString()}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </td>
                              <td className="py-4 px-5 text-right">
                                {isFinished ? (
                                  task.review ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold uppercase border border-slate-200">
                                      <FaCheckCircle size={10} className="text-emerald-500" /> Feedback Logged
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setReviewModal({ show: true, item: task, type: '', rating: 0, comment: "", isReport: false, reportReason: "", loading: false })}
                                      className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 hover:bg-emerald-600 hover:text-white transition-all shadow-xs active:scale-95"
                                    >
                                      <FaStar className="text-amber-500" /> Review Citizen
                                    </button>
                                  )
                                ) : (!assignedToMe && !task.assignedVolunteer) ? (
                                  <button
                                    onClick={() => handleClaim(task)}
                                    disabled={isVolunteerBusy}
                                    className={`px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
                                      isVolunteerBusy ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                                    }`}
                                  >
                                    {isVolunteerBusy ? "Occupied" : "Claim Mission"}
                                  </button>
                                ) : assignedToMe ? (
                                  <div className="flex flex-col items-end gap-1.5">
                                    {task.isPollution ? (
                                      <button onClick={() => handleAction(task._id, 'resolve')} className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-lg font-bold text-xs uppercase shadow-sm">Resolve Hazard</button>
                                    ) : task.isFood ? (
                                      status === "claimed" ? (
                                        <button onClick={() => handleAction(task._id, 'collect_food')} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs uppercase shadow-sm flex items-center gap-1.5">
                                          <FaTruckLoading /> Mark Collected
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => task.donorConfirmedCollection ? triggerPhotoUpload(task._id) : toast.error("Waiting for donor to confirm collection...")}
                                          className={`${task.donorConfirmedCollection ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed'} text-white px-4 py-1.5 rounded-lg font-bold text-xs uppercase shadow-sm flex items-center gap-1.5 transition-all`}
                                        >
                                          <FaCamera /> {task.donorConfirmedCollection ? "Deliver & Photo" : "Waiting Confirmation"}
                                        </button>
                                      )
                                    ) : status === "claimed" ? (
                                      <button onClick={() => handleAction(task._id, 'arrival')} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg font-bold text-xs uppercase shadow-sm flex items-center gap-1.5">
                                        <FaTruckLoading /> Arrived at Location
                                      </button>
                                    ) : (status === "arrived" && !task.isPaid) ? (
                                      <div className="text-amber-600 font-bold text-[10px] uppercase bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">Citizen Payment Pending</div>
                                    ) : (
                                      <button onClick={() => handleAction(task._id, 'complete')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg font-bold text-xs uppercase shadow-sm">Complete Mission</button>
                                    )}
                                    <div className="flex items-center gap-2">
                                      <button onClick={() => handleUnclaim(task._id, task.isPollution)} className="text-[10px] font-bold text-slate-400 hover:text-rose-600 hover:underline">Abort</button>
                                      <span className="text-slate-300">•</span>
                                      <button onClick={() => handleFlagReport(task._id)} className="text-[10px] font-bold text-rose-600 hover:underline">Flag Fraud</button>
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs font-medium text-slate-400 italic">Claimed by another</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="4" className="py-16 text-center text-slate-400">
                            <FaColumns size={24} className="mx-auto mb-2 text-slate-300" />
                            <p className="text-xs font-bold uppercase tracking-wider">No Missions Available</p>
                            <p className="text-[11px] text-slate-400 mt-1">Check back later or adjust your sector filter.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Desktop Table Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50/80 border-t border-slate-200/80">
                    <p className="text-xs font-medium text-slate-500">
                      Showing <span className="font-bold text-slate-800">{indexOfFirstItem + 1}</span> to{" "}
                      <span className="font-bold text-slate-800">{Math.min(indexOfLastItem, visibleTasks.length)}</span> of{" "}
                      <span className="font-bold text-slate-800">{visibleTasks.length}</span> missions
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
                      >
                        ← Previous
                      </button>
                      <span className="text-xs font-black text-slate-600 px-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Missions Cards */}
              <div className="lg:hidden space-y-3">
                {currentTasks.length > 0 ? (
                  currentTasks.map((task) => {
                    const status = (task.status || "").toLowerCase();
                    const assignedToMe = task.assignedVolunteer && String(task.assignedVolunteer) === String(currentVolunteerId);
                    const isFinished = ["completed", "resolved", "delivered", "success"].includes(status);

                    return (
                      <div key={task._id} className={`bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3 ${isFinished ? 'opacity-60' : assignedToMe ? 'border-emerald-300 bg-emerald-50/20' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shadow-xs ${
                              task.isFood ? 'bg-amber-100 text-amber-600' : task.isPollution ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {task.isFood ? <FaUtensils /> : task.isPollution ? <FaExclamationTriangle /> : <FaTrashAlt />}
                            </div>
                            <div>
                              <span className="text-[9px] font-black uppercase text-emerald-600">
                                {task.isFood ? "Food Rescue" : task.isPollution ? "Pollution" : "Waste Pickup"}
                              </span>
                              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                                {task.isFood ? task.placeName : task.isPollution ? task.pollutionType : task.wasteType}
                              </h3>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-400">{new Date(task.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <button onClick={() => handleNavigation(task)} className="font-bold text-emerald-600 flex items-center gap-1 hover:underline">
                            <FaDirections /> GPS
                          </button>
                          {(task.userPhone || task.userId?.phone) && (
                            <a href={`tel:${task.userPhone || task.userId?.phone}`} className="font-bold text-slate-500 flex items-center gap-1">
                              <FaPhoneAlt size={9} /> Call
                            </a>
                          )}
                        </div>

                        <div className="pt-1">
                          {isFinished ? (
                            <div className="text-center py-2 bg-slate-50 text-slate-500 rounded-xl text-xs font-bold border border-slate-200">
                              Mission Resolved
                            </div>
                          ) : (!assignedToMe && !task.assignedVolunteer) ? (
                            <button
                              onClick={() => handleClaim(task)}
                              disabled={isVolunteerBusy}
                              className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                                isVolunteerBusy ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm active:scale-95'
                              }`}
                            >
                              {isVolunteerBusy ? "Occupied" : "Claim Mission"}
                            </button>
                          ) : assignedToMe ? (
                            <div className="space-y-2">
                              {task.isPollution ? (
                                <button onClick={() => handleAction(task._id, 'resolve')} className="w-full bg-rose-600 text-white py-2.5 rounded-xl font-bold text-xs uppercase shadow-sm">Resolve Hazard</button>
                              ) : task.isFood ? (
                                status === "claimed" ? (
                                  <button onClick={() => handleAction(task._id, 'collect_food')} className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase shadow-sm flex items-center justify-center gap-1.5">
                                    <FaTruckLoading /> Mark Collected
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => task.donorConfirmedCollection ? triggerPhotoUpload(task._id) : toast.error("Waiting for donor confirmation...")}
                                    className={`w-full ${task.donorConfirmedCollection ? 'bg-emerald-600' : 'bg-slate-300'} text-white py-2.5 rounded-xl font-bold text-xs uppercase shadow-sm flex items-center justify-center gap-1.5`}
                                  >
                                    <FaCamera /> {task.donorConfirmedCollection ? "Deliver & Photo" : "Awaiting Verification"}
                                  </button>
                                )
                              ) : status === "claimed" ? (
                                <button onClick={() => handleAction(task._id, 'arrival')} className="w-full bg-orange-500 text-white py-2.5 rounded-xl font-bold text-xs uppercase shadow-sm flex items-center justify-center gap-1.5">
                                  <FaTruckLoading /> Arrived at Location
                                </button>
                              ) : (status === "arrived" && !task.isPaid) ? (
                                <div className="py-2 bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs text-center rounded-xl">Citizen Payment Pending</div>
                              ) : (
                                <button onClick={() => handleAction(task._id, 'complete')} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-xs uppercase shadow-sm">Complete Mission</button>
                              )}
                              <div className="flex justify-between text-xs pt-1">
                                <button onClick={() => handleUnclaim(task._id, task.isPollution)} className="text-slate-400 hover:text-rose-600 font-bold">Abort</button>
                                <button onClick={() => handleFlagReport(task._id)} className="text-rose-600 font-bold">Flag Fraud</button>
                              </div>
                            </div>
                          ) : (
                            <div className="py-2 text-center text-xs font-medium text-slate-400 bg-slate-50 rounded-xl">Claimed by another agent</div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                    <p className="text-xs font-bold uppercase">No Missions in Sector</p>
                  </div>
                )}

                {/* Mobile Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl mt-4">
                    <p className="text-xs font-medium text-slate-500">
                      Showing <span className="font-bold text-slate-800">{indexOfFirstItem + 1}</span> to{" "}
                      <span className="font-bold text-slate-800">{Math.min(indexOfLastItem, visibleTasks.length)}</span> of{" "}
                      <span className="font-bold text-slate-800">{visibleTasks.length}</span>
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 shadow-sm transition-all"
                      >
                        ← Prev
                      </button>
                      <span className="text-xs font-black text-slate-600 px-2">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 shadow-sm transition-all"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 🌟 VOLUNTEER -> USER REVIEW MODAL */}
          {reviewModal.show && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                <div className="bg-slate-50 p-5 flex justify-between items-center border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">Citizen Debrief</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Rate the citizen & report any issues</p>
                  </div>
                  <button
                    onClick={() => setReviewModal({ show: false, item: null, type: "", rating: 0, comment: "", isReport: false, reportReason: "", loading: false })}
                    className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {/* Star Rating */}
                  <div className="text-center space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Citizen Cooperation</p>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setReviewModal(prev => ({ ...prev, rating: s }))}
                          className={`text-2xl transition-all transform active:scale-90 ${reviewModal.rating >= s ? "text-amber-500 scale-110" : "text-slate-200 hover:text-amber-300"}`}
                        >
                          <FaStar />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Feedback Comment */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mission Notes</label>
                    <textarea
                      placeholder="Notes about this mission or citizen behavior..."
                      value={reviewModal.comment}
                      onChange={(e) => setReviewModal(prev => ({ ...prev, comment: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 transition-all min-h-[80px]"
                    />
                  </div>

                  {/* Report Issue Toggle */}
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setReviewModal(prev => ({ ...prev, isReport: !prev.isReport }))}
                      className={`w-full p-3 rounded-xl flex items-center justify-between transition-all border ${
                        reviewModal.isReport ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-xs font-bold flex items-center gap-2">
                        <FaExclamationTriangle className={reviewModal.isReport ? "text-rose-600" : "text-slate-400"} /> File Misconduct Report
                      </span>
                      <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${reviewModal.isReport ? "bg-rose-600 border-rose-600" : "border-slate-300"}`}></div>
                    </button>

                    {reviewModal.isReport && (
                      <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                        <textarea
                          placeholder="Describe the issue with the citizen..."
                          required
                          value={reviewModal.reportReason}
                          onChange={(e) => setReviewModal(prev => ({ ...prev, reportReason: e.target.value }))}
                          className="w-full bg-rose-50/50 border border-rose-200 rounded-xl p-3 text-xs font-medium text-rose-900 outline-none focus:border-rose-400 transition-all"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleReviewSubmit}
                    disabled={reviewModal.loading}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-sm disabled:opacity-50"
                  >
                    {reviewModal.loading ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 📱 MOBILE BOTTOM NAV 📱 */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 flex shadow-lg">
            <button onClick={() => setActiveTab('missions')} className={`flex-1 py-3 flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'missions' ? "text-emerald-600" : "text-slate-400"}`}>
              <FaColumns size={15} />
              Missions
            </button>
            <button onClick={() => navigate("/volunteer-history")} className="flex-1 py-3 flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-widest transition-all text-slate-400">
              <FaCheckCircle size={15} />
              Log
            </button>
            <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === 'profile' ? "text-indigo-600" : "text-slate-400"}`}>
              <FaUserShield size={15} />
              Profile
            </button>
          </div>

        </main>
      </div>

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default VolunteerPortal;
