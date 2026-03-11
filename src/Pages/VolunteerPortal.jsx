import React, { useState, useEffect, useRef } from "react";
import {
  FaCheck, FaClock, FaPhoneAlt, FaLeaf, FaTrashAlt,
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
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [sectorFilter, setSectorFilter] = useState("All Sectors");
  const [volunteerInfo, setVolunteerInfo] = useState({ name: "", phone: "" });
  const [photoModal, setPhotoModal] = useState({ open: false, taskId: null, preview: null, file: null, uploading: false });
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

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

    switch (actionType) {
      case 'arrival':
        endpoint = task.isPollution ? `pollution/arrival/${taskId}` : `confirm-arrival/${taskId}`;
        break;
      case 'complete':
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
          const payload = { deliveryPhoto: extraData.photoUrl };
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
      const payload = actionType === 'deliver_food' ? { deliveryPhoto: extraData.photoUrl } : {};
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20">
      <Nav />

      {/* ===== CAMERA / GALLERY PICKER MODAL ===== */}
      {photoModal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Proof of Delivery</p>
                <h3 className="text-xl font-black text-slate-900">Upload Photo</h3>
              </div>
              <button onClick={() => setPhotoModal({ open: false, taskId: null, preview: null, file: null, uploading: false })} className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all">
                <FaTimes size={14} />
              </button>
            </div>

            {/* Preview */}
            {photoModal.preview ? (
              <div className="relative mx-6 mt-6 rounded-2xl overflow-hidden border-4 border-slate-100 shadow-inner" style={{ height: '200px' }}>
                <img src={photoModal.preview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  onClick={() => setPhotoModal(prev => ({ ...prev, preview: null, file: null }))}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-all"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            ) : (
              /* Picker Buttons */
              <div className="grid grid-cols-2 gap-4 p-6">
                {/* Camera Option */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 bg-emerald-50 hover:bg-emerald-100 rounded-2xl border-2 border-emerald-100 hover:border-emerald-300 transition-all group"
                >
                  <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <FaCamera size={22} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-800 text-sm">Camera</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Take a live photo</p>
                  </div>
                </button>

                {/* Gallery Option */}
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 bg-indigo-50 hover:bg-indigo-100 rounded-2xl border-2 border-indigo-100 hover:border-indigo-300 transition-all group"
                >
                  <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <FaImages size={22} />
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-800 text-sm">Gallery</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Pick from library</p>
                  </div>
                </button>
              </div>
            )}

            {/* Hidden Inputs */}
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
            <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

            {/* Submit Button (shown after preview) */}
            {photoModal.preview && (
              <div className="p-6">
                <button
                  onClick={submitDeliveryPhoto}
                  disabled={photoModal.uploading}
                  className="w-full py-4 bg-emerald-600 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-slate-900 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 disabled:bg-slate-300"
                >
                  {photoModal.uploading ? (
                    <><FaSync className="animate-spin" /> Uploading...</>
                  ) : (
                    <><FaUpload /> Confirm Delivery</>
                  )}
                </button>
                <button
                  onClick={() => setPhotoModal(prev => ({ ...prev, preview: null, file: null }))}
                  className="w-full mt-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-all"
                >
                  Retake Photo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto pt-32 px-6">

        {/* STATS OVERVIEW */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          <div className="flex-1 bg-white border border-slate-200 p-8 rounded-[3rem] shadow-sm flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-3xl shadow-lg">
              <FaUserShield />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Active Agent</p>
              <h2 className="text-3xl font-black text-slate-900 leading-none mb-1">{volunteerInfo.name || "Agent"}</h2>

              <div className="flex items-center gap-2 mb-3 ml-1">
                <div className="flex items-center gap-1 text-amber-500">
                  <FaStar size={10} />
                  <span className="text-sm font-black text-slate-700">{volunteerInfo.averageRating || "0.0"}</span>
                </div>
                <div className="h-4 w-px bg-slate-200"></div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">({volunteerInfo.reviewCount || 0} reviews)</span>
                <div className="h-4 w-px bg-slate-200"></div>
                <span className="text-[10px] text-slate-400 font-bold tracking-tight uppercase">{volunteerInfo.phone}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase ${isVolunteerBusy ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {isVolunteerBusy ? "• In Mission" : "• Standby"}
                </span>
                <button
                  onClick={() => setShowSecurity(!showSecurity)}
                  className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 ${showSecurity ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  <FaUserShield /> {showSecurity ? "Hide Security" : "Account Security"}
                </button>
              </div>
              {showSecurity && (
                <div className="flex items-center gap-3 mt-3 animate-in fade-in slide-in-from-left-2 duration-300">
                  <button
                    onClick={() => setPhoneState({ ...phoneState, show: !phoneState.show, step: 1 })}
                    className={`text-[9px] font-black uppercase ${phoneState.show ? 'text-indigo-600 underline' : 'text-slate-400 hover:text-indigo-500'}`}
                  >
                    • Update Phone
                  </button>
                  <button
                    onClick={() => setDeleteState({ ...deleteState, show: !deleteState.show })}
                    className={`text-[9px] font-black uppercase ${deleteState.show ? 'text-rose-600 underline' : 'text-slate-400 hover:text-rose-500'}`}
                  >
                    • Delete Mission
                  </button>
                </div>
              )}

            </div>
          </div>

          <div onClick={() => navigate("/volunteer-history")} className="cursor-pointer bg-slate-900 px-10 py-8 rounded-[3rem] shadow-xl flex items-center gap-8 group hover:bg-slate-800 transition-all text-white">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl"><FaCheckCircle /></div>
            <div>
              <p className="text-3xl font-black">{myCompletedCount}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Successful Missions</p>
            </div>
            <FaArrowRight className="ml-auto group-hover:translate-x-2 transition-transform" />
          </div>
        </div>

        {/* 🔒 SECURITY MODALS (INLINE) */}
        {phoneState.show && (
          <div className="mb-8 p-8 bg-white border border-indigo-100 rounded-[3rem] shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <h4 className="text-xl font-black text-indigo-900 mb-4 flex items-center gap-3">
              <FaSync className={phoneState.loading ? 'animate-spin' : ''} /> Update Contact Number
            </h4>
            {phoneState.step === 1 ? (
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">New Phone Number (+91...)</label>
                  <input
                    type="tel" placeholder="+91..."
                    value={phoneState.newPhone} onChange={(e) => setPhoneState({ ...phoneState, newPhone: e.target.value })}
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={handleSendPhoneOtp} disabled={phoneState.loading}
                  className="bg-indigo-600 text-white px-10 py-4.5 rounded-2xl text-[11px] font-black uppercase hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  {phoneState.loading ? "Processing..." : "Dispatch OTP"}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Verification Code (sent to {phoneState.newPhone})</label>
                  <div className="flex justify-between gap-2 max-w-[320px] mx-auto">
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
                        className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 border-2 border-indigo-100 rounded-xl font-black text-slate-800 text-center outline-none focus:border-indigo-500 transition-all shadow-sm text-lg"
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleVerifyPhone} disabled={phoneState.loading}
                  className="bg-slate-900 text-white px-10 py-4.5 rounded-2xl text-[11px] font-black uppercase hover:bg-indigo-600 transition-all shadow-lg disabled:opacity-50"
                >
                  {phoneState.loading ? "Verifying..." : "Confirm Identity"}
                </button>
              </div>
            )}
          </div>
        )}

        {deleteState.show && (
          <div className="mb-8 p-8 bg-rose-50 border border-rose-100 rounded-[3rem] shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <h4 className="text-xl font-black text-rose-900 mb-2">Account Deletion Protocol</h4>
            <p className="text-rose-500 font-bold text-[10px] uppercase tracking-widest mb-6">Mission data will be archived, identity will be purged.</p>

            {deleteState.step !== 2 ? (
              <div className="space-y-4">
                <textarea
                  placeholder="Reason for deletion... (Mission Debrief)"
                  value={deleteState.reason} onChange={(e) => setDeleteState({ ...deleteState, reason: e.target.value })}
                  className="w-full bg-white border-none rounded-3xl p-6 font-medium outline-none focus:ring-2 focus:ring-rose-500 min-h-[120px] shadow-inner"
                />
                <button
                  onClick={handleDeleteRequest} disabled={deleteState.loading}
                  className="w-full bg-rose-600 text-white py-5 rounded-2xl text-[11px] font-black uppercase hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 disabled:opacity-50"
                >
                  {deleteState.loading ? "Authenticating..." : "Request Deletion OTP"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between gap-2 max-w-[350px] mx-auto">
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
                      className="w-10 h-10 md:w-12 md:h-12 bg-white border-2 border-rose-200 rounded-xl font-black text-rose-900 text-center outline-none focus:border-rose-900 transition-all shadow-sm text-lg"
                    />
                  ))}
                </div>
                <button
                  onClick={handleFinalDelete} disabled={deleteState.loading}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl text-[11px] font-black uppercase hover:bg-black transition-all shadow-lg disabled:opacity-50"
                >
                  {deleteState.loading ? "Purging..." : "CONFIRM PERMANENT DELETION"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* MISSION CONTROL */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">Operations <span className="text-emerald-500 font-thin italic">Board</span></h1>
            <p className="text-slate-400 font-bold text-xs mt-2 uppercase tracking-widest flex items-center gap-2">
              {isSyncing ? <><FaSync className="animate-spin" /> Live Syncing...</> : "Sector Optimized"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white p-2.5 rounded-[2.2rem] border border-slate-200 shadow-sm">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {["All Sectors", "Food Only", "Waste Only", "Pollution Only"].map(s => (
                <button key={s} onClick={() => setSectorFilter(s)} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${sectorFilter === s ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>{s.split(' ')[0]}</button>
              ))}
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              {["All", "Pending", "Completed"].map(f => (
                <button key={f} onClick={() => setStatusFilter(f)} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${statusFilter === f ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>{f}</button>
              ))}
            </div>
          </div>
        </div>

        {/* MISSIONS TABLE */}
        <div className="bg-white border border-slate-200 rounded-[3.5rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-8 text-[11px] font-black uppercase text-slate-400">Sector</th>
                <th className="p-8 text-[11px] font-black uppercase text-slate-400">Intelligence</th>
                <th className="p-8 text-[11px] font-black uppercase text-slate-400 text-center">Time</th>
                <th className="p-8 text-[11px] font-black uppercase text-slate-400 text-right">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visibleTasks.length > 0 ? visibleTasks.map((task) => {
                const status = (task.status || "").toLowerCase();
                const assignedToMe = task.assignedVolunteer && String(task.assignedVolunteer) === String(currentVolunteerId);
                const isFinished = ["completed", "resolved", "delivered", "success"].includes(status);

                return (
                  <tr key={task._id} className={`group transition-all ${isFinished ? 'opacity-50' : assignedToMe ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="p-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-sm ${task.isFood ? 'bg-emerald-100 text-emerald-600' : task.isPollution ? 'bg-rose-100 text-rose-600' : 'bg-slate-900 text-white'}`}>
                        {task.isFood ? <FaUtensils /> : task.isPollution ? <FaExclamationTriangle /> : <FaTrashAlt />}
                      </div>
                    </td>
                    <td className="p-8">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                          {task.isFood ? "Food Bank" : task.isPollution ? "Environment" : "Logistics"}
                        </span>
                        {task.isFood && !isFinished && <FoodTimer expiryTime={task.expiryTime} />}
                      </div>
                      <h3 className="text-xl font-black text-slate-900 leading-tight">
                        {task.isFood ? task.placeName : task.isPollution ? task.pollutionType : task.wasteType}
                        {task.isFood && <span className="ml-2 text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">{task.quantity} ppl</span>}
                      </h3>
                      <div className="flex items-center gap-4 mt-2">
                        <button onClick={() => handleNavigation(task)} className="text-[10px] font-black text-indigo-500 flex items-center gap-1 uppercase hover:underline"><FaDirections /> GPS</button>
                        <a href={`tel:${task.userPhone || task.userId?.phone}`} className="text-[10px] font-black text-slate-400 flex items-center gap-1 uppercase hover:text-slate-600"><FaPhoneAlt size={9} /> Contact</a>
                      </div>
                    </td>
                    <td className="p-8 text-center">
                      <div className="text-[9px] font-black text-slate-500 uppercase">
                        {new Date(task.createdAt).toLocaleDateString()} <br />
                        <span className="text-slate-400">{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="p-8 text-right">
                      {isFinished ? (
                        task.review ? (
                          <div className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase border border-slate-200 opacity-60">
                            <FaCheckCircle size={10} /> Feedback Logged
                          </div>
                        ) : (
                          <button
                            onClick={() => setReviewModal({ show: true, item: task, type: '', rating: 0, comment: "", isReport: false, reportReason: "", loading: false })}
                            className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-6 py-3 rounded-2xl font-black text-[10px] uppercase inline-flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95"
                          >
                            <FaStar /> Review Citizen
                          </button>
                        )
                      ) : (!assignedToMe && !task.assignedVolunteer) ? (
                        <button
                          onClick={() => handleClaim(task)}
                          disabled={isVolunteerBusy}
                          className={`px-8 py-4 rounded-2xl font-black text-[11px] uppercase transition-all ${isVolunteerBusy ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white hover:scale-105 shadow-lg'}`}
                        >
                          {isVolunteerBusy ? "Occupied" : "Claim Mission"}
                        </button>
                      ) : assignedToMe ? (
                        <div className="flex flex-col items-end gap-2">
                          {task.isPollution ? (
                            <button onClick={() => handleAction(task._id, 'resolve')} className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase shadow-lg hover:bg-rose-700">Resolve Issue</button>
                          ) : task.isFood ? (
                            status === "claimed" ? (
                              <button onClick={() => handleAction(task._id, 'collect_food')} className="bg-amber-500 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase shadow-lg hover:bg-amber-600 flex items-center gap-2">
                                <FaTruckLoading className="inline mr-2" /> Mark Collected
                              </button>
                            ) : (
                              <button
                                onClick={() => task.donorConfirmedCollection ? triggerPhotoUpload(task._id) : toast.error("Waiting for donor to confirm collection...")}
                                className={`${task.donorConfirmedCollection ? 'bg-emerald-600 hover:bg-slate-900' : 'bg-slate-300 cursor-not-allowed'} text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase shadow-lg flex items-center gap-2 transition-all`}
                              >
                                <FaCamera /> {task.donorConfirmedCollection ? "Mark Delivered" : "Waiting Verification"}
                              </button>
                            )
                          ) : status === "claimed" ? (
                            <button onClick={() => handleAction(task._id, 'arrival')} className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase shadow-lg"><FaTruckLoading className="inline mr-2" /> Arrived</button>
                          ) : (status === "arrived" && !task.isPaid) ? (
                            <div className="text-amber-500 font-black text-[10px] uppercase animate-pulse">Payment Verification Required</div>
                          ) : (
                            <button onClick={() => handleAction(task._id, 'complete')} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase shadow-lg">Complete Mission</button>
                          )}
                          <button onClick={() => handleUnclaim(task._id, task.isPollution)} className="text-[9px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest hover:underline px-2">Abort Mission</button>
                          <button onClick={() => handleFlagReport(task._id)} className="text-[9px] font-black text-rose-600 hover:text-rose-700 uppercase tracking-widest hover:underline px-2 border-l border-slate-200">🚩 Fraudulent Report</button>
                        </div>

                      ) : (
                        <span className="text-[10px] font-black text-slate-400 uppercase italic">Claimed by another agent</span>
                      )}
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan="4" className="p-20 text-center">
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No active missions in this sector</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🌟 VOLUNTEER -> USER REVIEW MODAL */}
      {reviewModal.show && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-3xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <div className="bg-emerald-50 p-8 flex justify-between items-center border-b border-emerald-100">
              <div>
                <h3 className="text-xl font-black text-emerald-900 tracking-tight">Citizen Debrief</h3>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Rate the citizen & Report issues</p>
              </div>
              <button
                onClick={() => setReviewModal({ show: false, item: null, type: "", rating: 0, comment: "", isReport: false, reportReason: "", loading: false })}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-900 hover:rotate-90 transition-transform shadow-sm"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Star Rating */}
              <div className="text-center space-y-4">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Citizen Cooperation</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setReviewModal(prev => ({ ...prev, rating: s }))}
                      className={`text-3xl transition-all transform active:scale-75 ${reviewModal.rating >= s ? "text-emerald-500 scale-110" : "text-slate-200 hover:text-emerald-200"}`}
                    >
                      <FaStar />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Comment */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mission Notes</label>
                <textarea
                  placeholder="Notes about this mission or citizen behavior..."
                  value={reviewModal.comment}
                  onChange={(e) => setReviewModal(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-emerald-400 transition-all min-h-[100px]"
                />
              </div>

              {/* Report Issue Toggle */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => setReviewModal(prev => ({ ...prev, isReport: !prev.isReport }))}
                  className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${reviewModal.isReport ? "bg-rose-50 text-rose-700 shadow-inner" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                >
                  <span className="text-[11px] font-black uppercase flex items-center gap-2">
                    <FaExclamationTriangle /> Citizen Misconduct Report
                  </span>
                  <div className={`w-4 h-4 rounded-full border-2 transition-all ${reviewModal.isReport ? "bg-rose-500 border-rose-500" : "border-slate-300"}`}></div>
                </button>

                {reviewModal.isReport && (
                  <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                    <textarea
                      placeholder="Describe the problem with the citizen (required)..."
                      required
                      value={reviewModal.reportReason}
                      onChange={(e) => setReviewModal(prev => ({ ...prev, reportReason: e.target.value }))}
                      className="w-full bg-rose-50/50 border-2 border-rose-100 rounded-2xl p-4 font-bold text-rose-900 outline-none focus:border-rose-400 transition-all"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleReviewSubmit}
                disabled={reviewModal.loading}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl text-[11px] font-black uppercase hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/20 active:scale-95 disabled:opacity-50"
              >
                {reviewModal.loading ? "Processing..." : "Submit Identity Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="recaptcha-container"></div>
    </div>
  );
};

export default VolunteerPortal;