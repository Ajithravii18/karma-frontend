import React, { useState, useEffect } from "react";
import {
  FaUser, FaRecycle, FaExclamationTriangle, FaUtensils,
  FaChevronRight, FaEdit, FaCheck, FaTimes, FaColumns,
  FaCreditCard, FaSpinner, FaClock, FaDownload, FaLeaf,
  FaFlag, FaStar, FaInfoCircle, FaCheckCircle, FaCheckDouble
} from "react-icons/fa";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { generateReceipt } from "../utils/ReceiptGenerator";
import Nav from "../Components/Nav";
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "../firebaseconfig";
import Counter from "../Components/Counter";


const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [processingPayment, setProcessingPayment] = useState(null);
  const [stats, setStats] = useState({ totalImpact: 0, breakdown: {} });
  const [data, setData] = useState({ pickups: [], pollution: [], food: [] });
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("");

  // --- SECURITY STATES ---
  const [phoneState, setPhoneState] = useState({ show: false, newPhone: "", otp: "", step: 1, loading: false });
  const [deleteState, setDeleteState] = useState({ show: false, reason: "", otp: "", loading: false });
  const [reviewModal, setReviewModal] = useState({ show: false, item: null, type: "", rating: 0, comment: "", isReport: false, reportReason: "", loading: false });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentName = localStorage.getItem("userName") || user.name || "User";

  // --- FIXED LOGIC HOOKS ---
  useEffect(() => {
    setNewName(currentName);
    fetchAllData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("txnid")) {
      toast.success("Payment Successful! The volunteer has been notified.");
      window.history.replaceState({}, document.title, "/dashboard");
      fetchAllData();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && activeTab !== "profile") {
        fetchAllData(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab, loading]);

  const fetchAllData = async (showLoader = true) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    try {
      if (showLoader) setLoading(true);
      const [statsRes, pickupsRes, pollutionRes, foodRes] = await Promise.all([
        api.get("/api/user-stats"),
        api.get("/api/my-pickups"),
        api.get("/api/my-pollution"),
        api.get("/api/my-food"),
      ]);
      setStats(statsRes.data);
      setData({ pickups: pickupsRes.data, pollution: pollutionRes.data, food: foodRes.data });
    } catch (err) {
      console.error("Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return toast.error("Name cannot be empty");
    try {
      const res = await api.put("/api/update-profile", { name: newName });
      localStorage.setItem("userName", res.data.name);
      window.dispatchEvent(new Event("storage"));
      toast.success("Profile updated!");
      setIsEditing(false);
    } catch (err) { toast.error("Update failed"); }
  };

  const handlePayment = async (pickupId) => {
    setProcessingPayment(pickupId);
    try {
      const response = await api.post("/api/payment/payu-order", { pickupId, amount: 50 });
      const pd = response.data;
      const form = document.createElement("form");
      form.method = "POST"; form.action = pd.action;
      Object.keys(pd).forEach(key => {
        const input = document.createElement("input");
        input.type = "hidden"; input.name = key; input.value = pd[key];
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err) { toast.error("Payment error"); }
    finally { setProcessingPayment(null); }
  };

  const handleConfirmCollection = async (foodId) => {
    try {
      await api.patch(`/api/food/donor-confirm/${foodId}`);
      toast.success("Collection confirmed! Thank you for your confirmation.");
      fetchAllData(false); // Refresh data
    } catch (err) {
      toast.error("Failed to confirm collection");
    }
  };

  const handleFlagVolunteer = async (item, type) => {
    const reason = window.prompt("⚠️ Report Issue: Describe the problem with this volunteer/mission (e.g., No show, rude behavior):");
    if (!reason || reason.trim().length < 5) {
      toast.error("Please provide a detailed reason (min 5 characters)");
      return;
    }

    // Fix: Use singular form for API
    const apiType = type === 'pickups' ? 'pickup' : type;

    try {
      await api.patch(`/api/user/flag-volunteer/${apiType}/${item._id}`, { reason });
      toast.success("Issue reported to Admin HQ");
      fetchAllData(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit report");
    }
  };

  const handleLiveHelp = async (item, type) => {
    const message = window.prompt("🆘 SOS: What issue are you experiencing? (e.g., Courier is not answering, payment stuck):");
    if (!message || message.trim().length < 5) {
      return toast.error("Please provide a brief description (min 5 characters)");
    }

    // Fix: Use singular form for API
    const apiType = type === 'pickups' ? 'pickup' : type;

    try {
      await api.post("/api/user/live-help", {
        requestId: item._id,
        requestType: apiType,
        message: message
      });
      toast.success("Help signal sent to HQ. Standby.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to signal HQ");
    }
  };

  const handleReviewSubmit = async () => {
    if (reviewModal.rating === 0 && !reviewModal.isReport) return toast.error("Select a rating or file a report");
    if (reviewModal.isReport && reviewModal.reportReason.length < 5) return toast.error("Provide a detailed report reason");

    setReviewModal(prev => ({ ...prev, loading: true }));
    try {
      await api.post("/api/user/submit-review", {
        requestId: reviewModal.item._id,
        requestType: reviewModal.type === 'pickups' ? 'pickup' : reviewModal.type,
        revieweeId: reviewModal.item.assignedVolunteer || reviewModal.item.claimedBy,
        rating: reviewModal.rating,
        comment: reviewModal.comment,
        isReport: reviewModal.isReport,
        reportReason: reviewModal.reportReason
      });
      toast.success("Feedback uploaded to mission logs");
      setReviewModal({ show: false, item: null, type: "", rating: 0, comment: "", isReport: false, reportReason: "", loading: false });
      fetchAllData(false);
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
        return toast.error("Number already registered ");
      }

      // 2. Firebase Recaptcha
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }

      // 3. Send SMS
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;

      toast.success("Security code sent! ");
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

  // --- DELETION HANDLERS (FIREBASE) ---
  const handleDeleteRequest = async () => {
    if (deleteState.reason.length < 5) return toast.error("Mission debrief too short");
    setDeleteState(prev => ({ ...prev, loading: true }));
    try {
      // 1. Firebase Recaptcha
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      }

      // 2. Send SMS to current number
      const confirmationResult = await signInWithPhoneNumber(auth, user.phone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;

      toast.success("Termination OTP sent! ");
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

      // 1. Verify Firebase OTP — this signs the user into Firebase Auth
      await window.confirmationResult.confirm(deleteState.otp);

      // 2. Delete the Firebase Auth user from the client side
      //    (auth.currentUser is now set after OTP confirmation above)
      try {
        if (auth.currentUser) {
          await auth.currentUser.delete();
          console.log("Firebase Auth user deleted successfully.");
        }
      } catch (firebaseErr) {
        // Log but don't block — the backend will also attempt Firebase Admin deletion
        console.warn("Firebase client-side deletion warning:", firebaseErr?.message);
      }

      // 3. Delete from MongoDB (backend also attempts Firebase Admin deletion as secondary safeguard)
      await api.delete("/api/delete-account", { data: { reason: deleteState.reason } });

      toast.success("Identity purged. Goodbye.");
      localStorage.clear();
      setTimeout(() => window.location.href = "/", 1500);
    } catch (err) {
      console.error("Account deletion error:", err);
      const msg = err?.response?.data?.message || err?.message || "Verification failed";
      toast.error(msg);
      setDeleteState(prev => ({ ...prev, loading: false }));
    }
  };



  const getFilteredData = () => {
    const list = data[activeTab] || [];
    return list.filter(item => {
      const status = (item.status || "Pending").toLowerCase();
      const matchesStatus = statusFilter === "all" ||
        (statusFilter === "pending" && ["pending", "reported", "available"].includes(status)) ||
        (statusFilter === "active" && ["verified", "claimed", "arrived", "collected", "paid", "success"].includes(status)) ||
        (statusFilter === "completed" && ["completed", "resolved", "delivered"].includes(status));

      let matchesMonth = true;
      if (monthFilter) {
        const itemDate = new Date(item.createdAt || item.reportedAt);
        const itemMonthStr = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
        matchesMonth = itemMonthStr === monthFilter;
      }
      return matchesStatus && matchesMonth;
    });
  };

  // --- STATUS THEMES ---
  const getStatusStyle = (status) => {
    const base = "px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 w-fit border";
    const s = status?.toLowerCase();
    switch (s) {
      case 'completed':
      case 'resolved':
      case 'collected':
        return `${base} bg-green-100 text-green-700 border-green-200`;

      case 'paid':
        return `${base} bg-blue-100 text-blue-700 border-blue-200`;

      case 'arrived':
      case 'awaiting payment':
        return `${base} bg-yellow-100 text-yellow-700 border-yellow-200 animate-pulse`;

      case 'claimed':
        return `${base} bg-sky-100 text-sky-700 border-sky-200`;

      case 'available':
        return `${base} bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm`;

      default:
        return `${base} bg-orange-50 text-orange-600 border-orange-100`;
    }
  }

  // --- UI COMPONENTS ---
  const TabButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 p-3 md:p-4 md:px-6 rounded-xl md:rounded-2xl transition-all duration-300 group whitespace-nowrap ${activeTab === id
        ? "bg-green-600 text-white shadow-lg md:shadow-xl md:shadow-green-900/10 md:translate-x-1"
        : "bg-white md:bg-white text-gray-500 hover:bg-green-50 hover:text-green-700"
        } ${id === 'profile' ? 'md:w-full' : 'md:w-full'}`}
    >
      <div className="flex items-center gap-2 md:gap-4 font-bold tracking-tight text-[11px] md:text-sm">
        <div className={`p-1.5 md:p-2 rounded-lg transition-colors ${activeTab === id ? "bg-white/20" : "bg-gray-50 group-hover:bg-green-100"}`}>
          <Icon size={14} className="md:w-4.5 md:h-4.5" />
        </div>
        {label}
      </div>
      <FaChevronRight className={`hidden md:block text-xs transition-transform duration-300 ${activeTab === id ? "translate-x-1" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`} />
    </button>
  );

  const renderMobileCard = (item, type) => {
    const status = item.status?.toLowerCase();
    const isFinished = ["completed", "resolved", "delivered", "success", "paid"].includes(status);
    const hasVolunteer = item.assignedVolunteer || item.claimedBy;
    const startDateTime = new Date(item.createdAt || item.reportedAt);

    return (
      <div key={item._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-4">
        <div className="flex justify-between items-start mb-4">
          <div className={getStatusStyle(item.status || "Pending")}>
             {status === 'completed' || status === 'paid' ? <FaCheck className="text-[8px]" /> : <FaClock className="text-[8px]" />}
             {item.status || "Pending"}
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {startDateTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        </div>

        <h4 className="text-base font-black text-gray-900 mb-1">
          {item.placeName || item.wasteType || item.pollutionType || "Service Request"}
        </h4>
        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-4 opacity-60">
           Mission ID: #{item._id?.slice(-8)}
        </p>

        <div className="flex flex-col gap-3">
          {(status === "arrived" || status === "awaiting payment") && type === "pickups" ? (
            <button onClick={() => handlePayment(item._id)} className="w-full bg-green-600 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95">
              <FaCreditCard /> Pay ₹50
            </button>
          ) : status === "collected" && type === "food" ? (
             !item.donorConfirmedCollection && (
              <button onClick={() => handleConfirmCollection(item._id)} className="w-full bg-amber-500 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95">
                <FaCheck /> Confirm Collection
              </button>
             )
          ) : status === "completed" && type === "pickups" ? (
            <button onClick={() => generateReceipt(item)} className="w-full bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg">
              <FaDownload size={10} /> Get Receipt
            </button>
          ) : null}

          {hasVolunteer && !isFinished && (
            <button
              onClick={() => handleLiveHelp(item, type)}
              className="w-full bg-sky-50 text-sky-600 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 border border-sky-100"
            >
              <FaInfoCircle /> {item.helpRequested ? "Signal Active" : "Request Help"}
            </button>
          )}

          {hasVolunteer && isFinished && !item.review && (
            <button
              onClick={() => setReviewModal({ show: true, item, type, rating: 0, comment: "", isReport: false, reportReason: "", loading: false })}
              className="w-full bg-amber-50 text-amber-600 border border-amber-100 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2"
            >
              <FaStar /> {type === 'pickups' ? 'Review Courier' : 'Review Agent'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderTable = (list, columns, type) => {
    if (loading && list.length === 0) return <div className="p-10 text-center"><FaSpinner className="animate-spin text-green-600 text-2xl mx-auto" /></div>;
    if (!list || list.length === 0) return (
      <div className="p-16 text-center bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
        <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No {type} records found</p>
      </div>
    );

    return (
      <>
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[11px] uppercase text-gray-400 font-black tracking-[0.2em] px-4">
                {columns.map(col => <th key={col} className="px-5 py-3">{col}</th>)}
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item, idx) => {
                const status = item.status?.toLowerCase();
                const isFinished = ["completed", "resolved", "delivered", "success", "paid"].includes(status);
                const hasVolunteer = item.assignedVolunteer || item.claimedBy;

                const startDateTime = new Date(item.createdAt || item.reportedAt);
                const endDateTime = isFinished ? new Date(item.completedAt || item.updatedAt) : null;

                return (
                  <tr key={item._id || idx} className="bg-white group hover:bg-green-50/20 transition-all duration-300 shadow-sm border border-gray-100 rounded-2xl overflow-hidden translate-y-0 hover:-translate-y-0.5">
                    {/* TIME SECTION (START & END) */}
                    <td className="px-5 py-4 text-sm font-bold text-gray-500 first:rounded-l-2xl">
                      <div className="space-y-2 min-w-[180px]">
                        {/* Start Time Row */}
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                          <div className="flex flex-col">
                            <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest leading-none mb-0.5">Start Time</span>
                            <span className="text-[11px] text-gray-800 font-extrabold flex items-center gap-1.5">
                              {startDateTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, {startDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>

                        {/* End Time Row */}
                        <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-1.5 rounded-full ${isFinished ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-gray-200'}`}></div>
                          <div className="flex flex-col">
                            <span className="text-[8px] text-gray-400 font-black uppercase tracking-widest leading-none mb-0.5">End Time</span>
                            {endDateTime ? (
                              <span className="text-[11px] text-emerald-600 font-extrabold">
                                {endDateTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, {endDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-300 italic font-medium tracking-tight">Active Mission...</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* DESCRIPTION */}
                    <td className="px-5 py-4 border-l border-gray-50">
                      <p className="text-sm text-gray-800 font-black tracking-tight line-clamp-1">
                        {item.placeName || item.wasteType || item.pollutionType || "Service Request"}
                      </p>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1 opacity-60 flex items-center gap-3">
                        <span className="flex items-center gap-1"><FaFlag size={8} /> Mission ID: {item._id?.slice(-8)}</span>
                        {item.weight > 0 && <span className="text-emerald-600 flex items-center gap-1"><FaRecycle size={8} /> {item.weight} KG</span>}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className={getStatusStyle(item.status || "Pending")}>
                        {status === 'completed' || status === 'paid' ? <FaCheck className="text-[8px]" /> : <FaClock className="text-[8px]" />}
                        {item.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4 last:rounded-r-2xl">
                      <div className="flex flex-col items-center gap-2">
                        {(status === "arrived" || status === "awaiting payment") && type === "pickups" ? (
                          <button onClick={() => handlePayment(item._id)} className="w-full bg-green-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg shadow-green-900/20 transition-all active:scale-95">
                            <FaCreditCard /> Pay ₹50
                          </button>
                        ) : status === "collected" && type === "food" ? (
                          item.donorConfirmedCollection ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase border border-emerald-100">
                              <FaCheck size={10} /> Fully Logged
                            </div>
                          ) : (
                            <button onClick={() => handleConfirmCollection(item._id)} className="w-full bg-amber-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-amber-600 shadow-lg shadow-amber-900/20 transition-all active:scale-95">
                              <FaCheck /> Confirm
                            </button>
                          )
                        ) : status === "completed" && type === "pickups" ? (
                          <button onClick={() => generateReceipt(item)} className="w-full bg-slate-50 text-blue-600 border border-slate-200 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                            <FaDownload size={10} /> Receipt
                          </button>
                        ) : <span className="text-[10px] font-bold text-gray-300 tracking-widest uppercase">Verified</span>}

                        {hasVolunteer && (
                          !isFinished ? (
                            item.helpRequested ? (
                              <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 text-sky-600 rounded-xl text-[10px] font-black uppercase border border-sky-100 animate-pulse">
                                <FaInfoCircle size={10} /> Signal Active
                              </div>
                            ) : (
                              <button
                                onClick={() => handleLiveHelp(item, type)}
                                className="w-full bg-sky-50 text-sky-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-sky-600 hover:text-white transition-all shadow-sm active:scale-95"
                              >
                                <FaInfoCircle /> Live Help
                              </button>
                            )
                          ) : (
                            item.review ? (
                              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase border border-slate-200 opacity-60">
                                <FaCheckDouble size={10} /> Feedback Logged
                              </div>
                            ) : (
                              <button
                                onClick={() => setReviewModal({ show: true, item, type, rating: 0, comment: "", isReport: false, reportReason: "", loading: false })}
                                className="w-full bg-amber-50 text-amber-600 border border-amber-100 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-amber-600 hover:text-white transition-all shadow-sm active:scale-95"
                              >
                                <FaStar /> Review & Report
                              </button>
                            )
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="md:hidden space-y-4">
          {list.map(item => renderMobileCard(item, type))}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100">
      <Nav />
      <div className="max-w-6xl mx-auto pt-20 md:pt-24 pb-8 px-4 md:px-6 grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        {/* LEFT COLUMN: Profile Navigation (Mobile: Horizontal, Desktop: Sidebar) */}
        <div className="lg:col-span-1 space-y-4 md:space-y-6">
          <div className="bg-white p-5 md:p-6 rounded-3xl md:rounded-[2rem] shadow-sm border border-gray-100 text-center group">
            <div className="relative w-16 h-16 md:w-24 md:h-24 mx-auto mb-4 md:mb-6">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-pulse group-hover:scale-110 transition-transform duration-500"></div>
              <div className="relative w-full h-full bg-green-600 rounded-full flex items-center justify-center text-2xl md:text-4xl text-white font-black shadow-xl shadow-green-900/20 transform group-hover:rotate-12 transition-transform">
                {currentName.charAt(0).toUpperCase()}
              </div>
            </div>
            <h2 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">{currentName}</h2>
            <div className="mt-2 md:mt-3 inline-flex px-3 md:px-4 py-1 md:py-1.5 bg-green-50 text-green-700 text-[8px] md:text-[10px] font-black uppercase rounded-full border border-green-100 italic">
              Citizen ID: <span className="ml-1 opacity-70">#{user._id?.slice(-6) || 'N/A'}</span>
            </div>
          </div>
          <nav className="flex md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            <TabButton id="profile" icon={FaUser} label="Profile" />
            <TabButton id="pickups" icon={FaRecycle} label="Waste" />
            <TabButton id="pollution" icon={FaExclamationTriangle} label="Pollution" />
            <TabButton id="food" icon={FaUtensils} label="Food" />
          </nav>
        </div>

        {/* RIGHT COLUMN: Tab Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden min-h-[500px]">
            {activeTab === "profile" ? (
               <div className="p-6 md:p-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-4">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Main Workspace</h3>
                    <p className="text-gray-400 font-bold text-xs md:sm">Managing your environmental contribution</p>
                  </div>
                  <button onClick={() => setIsEditing(!isEditing)} className={`w-full md:w-auto p-3 rounded-2xl transition-all duration-300 flex items-center justify-center md:justify-start gap-2 font-black text-[10px] uppercase shadow-sm ${isEditing ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-100"}`}>
                    {isEditing ? <><FaTimes /> Cancel</> : <><FaEdit /> Edit Profile</>}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-100/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-100 text-green-600 rounded-xl group-hover:scale-110 transition-transform">
                        <FaUser size={14} />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Legal Name</p>
                    </div>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-white border-2 border-green-500 rounded-2xl px-5 py-3 w-full font-black text-gray-700 outline-none shadow-inner" />
                        <button onClick={handleUpdateName} className="bg-green-600 text-white px-5 rounded-2xl hover:bg-green-700 transition-all font-black text-xs">SAVE</button>
                      </div>
                    ) : <p className="text-xl font-black text-gray-800 tracking-tight ml-1">{currentName}</p>}
                  </div>
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-100/50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                        <FaClock size={14} />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verified Contact</p>
                    </div>
                    <p className="text-xl font-black text-gray-800 tracking-tight ml-1">{user.phone || 'No phone set'}</p>
                  </div>
                </div>

                {/* 🔒 SECURITY SECTION */}
                {isEditing && (
                  <div className="mb-12 space-y-6 animate-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-lg">Security Settings</h4>
                      <div className="h-px bg-gray-100 flex-1"></div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <button
                        onClick={() => setPhoneState({ ...phoneState, show: !phoneState.show, step: 1 })}
                        className={`flex-1 min-w-[200px] px-6 md:px-8 py-4 border rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center md:justify-start gap-3 shadow-sm ${phoneState.show ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        <FaEdit size={14} className={phoneState.show ? "text-green-400" : "text-green-600"} /> Update Phone
                      </button>
                      <button
                        onClick={() => setDeleteState({ ...deleteState, show: !deleteState.show })}
                        className={`flex-1 min-w-[200px] px-6 md:px-8 py-4 border rounded-2xl text-[10px] font-black uppercase transition-all flex items-center justify-center md:justify-start gap-3 shadow-sm ${deleteState.show ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-rose-100 text-rose-600 hover:bg-rose-50'}`}
                      >
                        <FaTimes size={14} /> Account Termination
                      </button>
                    </div>

                    {/* Forms ... existing logic remains identical ... */}
                    {phoneState.show && (
                      <div className="p-8 bg-green-50 border border-green-100 rounded-[2.5rem] shadow-inner animate-in slide-in-from-top-4 duration-300">
                        {phoneState.step === 1 ? (
                          <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[240px]">
                              <label className="text-[10px] font-black text-green-700 uppercase mb-2 block tracking-widest ml-1">New Mobile Number</label>
                              <input
                                type="tel" placeholder="+91..."
                                value={phoneState.newPhone} onChange={(e) => setPhoneState({ ...phoneState, newPhone: e.target.value })}
                                className="w-full bg-white border-2 border-green-200 rounded-2xl px-6 py-4 font-black text-gray-700 outline-none focus:border-green-600 transition-all shadow-sm"
                              />
                            </div>
                            <button
                              onClick={handleSendPhoneOtp} disabled={phoneState.loading}
                              className="bg-green-600 text-white px-10 py-4.5 rounded-2xl text-[11px] font-black uppercase hover:bg-green-700 transition-all shadow-lg shadow-green-900/20"
                            >
                              {phoneState.loading ? "Requesting..." : "Send Verification Code"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-4 items-end">
                            <div className="flex-1 min-w-[240px]">
                              <label className="text-[10px] font-black text-green-700 uppercase mb-2 block tracking-widest ml-1 text-center">Verification Code (Sent to {phoneState.newPhone})</label>
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
                                    className="w-10 h-10 md:w-12 md:h-12 bg-white border-2 border-green-200 rounded-xl font-black text-gray-700 text-center outline-none focus:border-green-600 transition-all shadow-sm text-lg"
                                  />
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={handleVerifyPhone} disabled={phoneState.loading}
                              className="bg-green-900 text-white px-10 py-4.5 rounded-2xl text-[11px] font-black uppercase hover:bg-black transition-all shadow-lg shadow-gray-900/20"
                            >
                              {phoneState.loading ? "Verifying..." : "Confirm Protocol"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {deleteState.show && (
                      <div className="p-10 bg-rose-50 border border-rose-100 rounded-[3rem] shadow-inner animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-rose-200 text-rose-700 rounded-full flex items-center justify-center text-xl animate-pulse">⚠️</div>
                          <div>
                            <h4 className="text-xl font-black text-rose-900 tracking-tight">Termination Protocol</h4>
                            <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest">This action will permanently purge your data.</p>
                          </div>
                        </div>

                        {deleteState.step !== 2 ? (
                          <div className="space-y-5">
                            <textarea
                              placeholder="Reason for leaving (debrief)..."
                              value={deleteState.reason} onChange={(e) => setDeleteState({ ...deleteState, reason: e.target.value })}
                              className="w-full bg-white border-2 border-rose-200 rounded-3xl p-6 font-bold text-gray-700 outline-none focus:border-rose-500 transition-all min-h-[120px] shadow-sm"
                            />
                            <button
                              onClick={handleDeleteRequest} disabled={deleteState.loading}
                              className="w-full bg-rose-600 text-white py-5 rounded-2xl text-[11px] font-black uppercase hover:bg-rose-700 transition-all shadow-xl shadow-rose-900/20 active:scale-95"
                            >
                              {deleteState.loading ? "Processing..." : "Initiate Verification"}
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-5">
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
                                  className="w-10 h-10 md:w-12 md:h-12 bg-white border-2 border-rose-200 rounded-xl font-black text-gray-900 text-center outline-none focus:border-rose-900 transition-all shadow-sm text-lg"
                                />
                              ))}
                            </div>
                            <button
                              onClick={handleFinalDelete} disabled={deleteState.loading}
                              className="w-full bg-black text-white py-5 rounded-2xl text-[11px] font-black uppercase hover:bg-rose-900 transition-all shadow-2xl active:scale-95"
                            >
                              {deleteState.loading ? "Purging..." : "FINALIZE ACCOUNT DELETION"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 🌈 THE IMPACT CARD */}
                <div className="bg-gradient-to-br from-green-700 via-green-800 to-green-950 p-8 md:p-10 rounded-[2.5rem] text-white shadow-3xl relative overflow-hidden group border border-white/5">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 -mr-40 -mt-40 rounded-full blur-3xl transition-transform duration-1000 group-hover:scale-150"></div>
                  <FaLeaf className="absolute right-10 bottom-10 text-[180px] opacity-10 group-hover:rotate-12 group-hover:scale-125 transition-all duration-1000" />

                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 items-center gap-8 md:gap-10">
                    <div className="md:col-span-3 text-center md:text-left">
                      <h4 className="text-green-200 font-black text-[10px] md:text-xs uppercase tracking-[0.3em] mb-4">Contribution Excellence</h4>
                      <div className="flex flex-col md:flex-row items-center md:items-baseline gap-2 md:gap-4 mb-2">
                        <span className="text-6xl md:text-8xl font-black tracking-tighter">
                          <Counter end={stats.totalImpact} />
                        </span>
                        <div className="space-y-0.5 md:space-y-1">
                          <p className="text-xl md:text-2xl font-black text-green-400">CREDITS</p>
                          <p className="text-[9px] md:text-[10px] font-bold opacity-60 uppercase tracking-widest">Total Life Impact</p>
                        </div>
                      </div>
                      <div className="w-full h-1.5 md:h-2 bg-white/10 rounded-full mt-6 overflow-hidden">
                        <div className="h-full bg-green-400 w-[75%] rounded-full shadow-[0_0_15px_rgba(74,222,128,0.5)] animate-pulse"></div>
                      </div>
                    </div>

                    <div className="md:col-span-2 space-y-3 md:space-y-4">
                      {[
                        { icon: FaRecycle, color: "text-green-300", bg: "bg-white/10", label: "Waste Managed", val: stats.breakdown?.pickups, suffix: "+" },
                        { icon: FaExclamationTriangle, color: "text-red-300", bg: "bg-white/10", label: "Pollution Cases", val: stats.breakdown?.pollution, suffix: "!" },
                        { icon: FaUtensils, color: "text-orange-300", bg: "bg-white/10", label: "Food Donations", val: stats.breakdown?.food, suffix: "♡" }
                      ].map((item, i) => (
                        <div key={i} className={`${item.bg} backdrop-blur-xl px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl flex items-center gap-4 border border-white/10 hover:bg-white/20 transition-all cursor-default group/item`}>
                          <div className={`p-2 rounded-xl bg-white/10 ${item.color} group-hover/item:scale-110 transition-transform shadow-inner`}>
                            <item.icon size={14} className="md:w-4 md:h-4" />
                          </div>
                          <div>
                            <p className="text-[8px] md:text-[9px] uppercase font-black text-green-200/60 tracking-widest">{item.label}</p>
                            <p className="text-lg md:text-xl font-bold flex items-center gap-1">
                              <Counter end={item.val || 0} />
                              <span className="text-[12px] md:text-[14px] opacity-40">{item.suffix}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 md:p-12 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight capitalize">{activeTab} Activity Log</h3>
                    <p className="text-gray-400 font-bold text-sm tracking-tight">Monitoring your environmental mission history</p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {/* Status Filter */}
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {["all", "pending", "active", "completed"].map((s) => (
                        <button
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${statusFilter === s ? "bg-white text-green-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    {/* Month Filter */}
                    <div className="flex bg-slate-100 p-1 rounded-xl items-center">
                      <input
                        type="month"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        className="bg-transparent text-[10px] font-black uppercase text-gray-500 outline-none px-3 py-1 border-none w-[110px] cursor-pointer"
                      />
                      {monthFilter && (
                        <button onClick={() => setMonthFilter("")} className="px-2 text-rose-500 hover:text-rose-700 transition-all">
                          <FaTimes size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {renderTable(getFilteredData(), ["Service Period", "Description"], activeTab)}
              </div>
            )}
          </div>
        </div>
      </div>
      <div id="recaptcha-container"></div>

      {/* 🌟 REVIEW & REPORT MODAL */}
      {reviewModal.show && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-3xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <div className="bg-amber-50 p-8 flex justify-between items-center border-b border-amber-100">
              <div>
                <h3 className="text-xl font-black text-amber-900 tracking-tight">Mission Debrief</h3>
                <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Rate your volunteer & Report issues</p>
              </div>
              <button
                onClick={() => setReviewModal({ show: false, item: null, type: "", rating: 0, comment: "", isReport: false, reportReason: "", loading: false })}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-amber-900 hover:rotate-90 transition-transform shadow-sm"
              >
                <FaTimes />
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Star Rating */}
              <div className="text-center space-y-4">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Volunteer Performance</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setReviewModal(prev => ({ ...prev, rating: s }))}
                      className={`text-3xl transition-all transform active:scale-75 ${reviewModal.rating >= s ? "text-amber-500 scale-110" : "text-slate-200 hover:text-amber-200"}`}
                    >
                      <FaStar />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Comment */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Optional Feedback</label>
                <textarea
                  placeholder="Share your experience with this service..."
                  value={reviewModal.comment}
                  onChange={(e) => setReviewModal(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-amber-400 transition-all min-h-[100px]"
                />
              </div>

              {/* Report Issue Toggle */}
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => setReviewModal(prev => ({ ...prev, isReport: !prev.isReport }))}
                  className={`w-full p-4 rounded-xl flex items-center justify-between transition-all ${reviewModal.isReport ? "bg-red-50 text-red-700 shadow-inner" : "bg-gray-50 text-gray-400 hover:bg-gray-100"}`}
                >
                  <span className="text-[11px] font-black uppercase flex items-center gap-2">
                    <FaExclamationTriangle /> Add Issue Report
                  </span>
                  <div className={`w-4 h-4 rounded-full border-2 transition-all ${reviewModal.isReport ? "bg-red-500 border-red-500" : "border-gray-300"}`}></div>
                </button>

                {reviewModal.isReport && (
                  <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                    <textarea
                      placeholder="Describe the problem in detail (required)..."
                      required
                      value={reviewModal.reportReason}
                      onChange={(e) => setReviewModal(prev => ({ ...prev, reportReason: e.target.value }))}
                      className="w-full bg-red-50/50 border-2 border-red-100 rounded-2xl p-4 font-bold text-red-900 outline-none focus:border-red-400 transition-all"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleReviewSubmit}
                disabled={reviewModal.loading}
                className="w-full bg-green-600 text-white py-5 rounded-2xl text-[11px] font-black uppercase hover:bg-green-700 transition-all shadow-xl shadow-green-900/20 active:scale-95 disabled:opacity-50"
              >
                {reviewModal.loading ? "Uploading Data..." : "Finalize Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles for Dashboard */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default Dashboard;