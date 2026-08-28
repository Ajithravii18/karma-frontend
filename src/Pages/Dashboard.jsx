import React, { useState, useEffect } from "react";
import logo from "../assets/logo.png";
import {
  FaUser, FaRecycle, FaExclamationTriangle, FaUtensils,
  FaChevronRight, FaEdit, FaCheck, FaTimes, FaColumns,
  FaCreditCard, FaSpinner, FaClock, FaDownload, FaLeaf,
  FaFlag, FaStar, FaInfoCircle, FaCheckCircle, FaCheckDouble
} from"react-icons/fa";
import api from"../utils/api";
import { useNavigate } from"react-router-dom";
import toast from"react-hot-toast";
import { generateReceipt } from"../utils/ReceiptGenerator";
import Nav from"../Components/Nav";
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from"../firebaseconfig";
import Counter from"../Components/Counter";


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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- SECURITY STATES ---
  const [phoneState, setPhoneState] = useState({ show: false, newPhone:"", otp:"", step: 1, loading: false });
  const [deleteState, setDeleteState] = useState({ show: false, reason:"", otp:"", loading: false });
  const [reviewModal, setReviewModal] = useState({ show: false, item: null, type:"", rating: 0, comment:"", isReport: false, reportReason:"", loading: false });

  const user = JSON.parse(localStorage.getItem("user") ||"{}");
  const currentName = localStorage.getItem("userName") || user.name ||"User";

  // --- FIXED LOGIC HOOKS ---
  useEffect(() => {
    setNewName(currentName);
    fetchAllData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("txnid")) {
      toast.success("Payment Successful! The volunteer has been notified.");
      window.history.replaceState({}, document.title,"/dashboard");
      fetchAllData();
    }
    
    const retryId = params.get("retry");
    if (retryId) {
      window.history.replaceState({}, document.title,"/dashboard");
      // Delay slightly to ensure component is mounted and data is fetched if needed
      setTimeout(() => {
        handlePayment(retryId);
      }, 500);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && activeTab !=="profile") {
        fetchAllData(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab, loading]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, monthFilter]);

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
      // Dynamically load Razorpay SDK
      const script = document.createElement("script");
      script.src ="https://checkout.razorpay.com/v1/checkout.js";
      script.onerror = () => {
        toast.error("Razorpay SDK failed to load. Are you online?");
        setProcessingPayment(null);
      };
      script.onload = async () => {
        try {
          const res = await api.post("/api/payment/razorpay-order", { pickupId, amount: 50 });
          const orderData = res.data;

          const options = {
            key: orderData.key,
            amount: orderData.amount,
            currency: orderData.currency,
            name:"Karma",
            description:"Waste Pickup Fee",
            image:"https://cdn-icons-png.flaticon.com/512/3299/3299935.png",
            order_id: orderData.orderId,
            handler: async function (response) {
              try {
                await api.post("/api/payment/razorpay-verify", {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                window.location.href = `/payment-success?txnid=${response.razorpay_payment_id}`;
              } catch (verifyErr) {
                window.location.href = `/payment-failure?error=verification_failed&pickupId=${pickupId}`;
              }
            },
            prefill: {
              name: currentName,
              contact: user.phone ||""
            },
            theme: {
              color:"#16a34a"
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.on("payment.failed", function (response) {
            window.location.href = `/payment-failure?error=${response.error.description ||"payment_failed"}&pickupId=${pickupId}`;
          });
          rzp.open();
        } catch (apiErr) {
          window.location.href = `/payment-failure?error=initialization_failed&pickupId=${pickupId}`;
        } finally {
          setProcessingPayment(null);
        }
      };
      document.body.appendChild(script);
    } catch (err) {
      window.location.href = `/payment-failure?error=server_error&pickupId=${pickupId}`;
      setProcessingPayment(null);
    }
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
    const reason = window.prompt("G��n+� Report Issue: Describe the problem with this volunteer/mission (e.g., No show, rude behavior):");
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
      toast.error(err.response?.data?.message ||"Failed to submit report");
    }
  };

  const handleLiveHelp = async (item, type) => {
    const message = window.prompt("=��� SOS: What issue are you experiencing? (e.g., Courier is not answering, payment stuck):");
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
      toast.error(err.response?.data?.message ||"Failed to signal HQ");
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
      setReviewModal({ show: false, item: null, type:"", rating: 0, comment:"", isReport: false, reportReason:"", loading: false });
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
        return toast.error("Number already registered");
      }

      // 2. Firebase Recaptcha
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth,"recaptcha-container", { size:"invisible" });
      }

      // 3. Send SMS
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;

      toast.success("Security code sent!");
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
      setTimeout(() => window.location.href ="/login", 1500);
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
        window.recaptchaVerifier = new RecaptchaVerifier(auth,"recaptcha-container", { size:"invisible" });
      }

      // 2. Send SMS to current number
      const confirmationResult = await signInWithPhoneNumber(auth, user.phone, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;

      toast.success("Termination OTP sent!");
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

      // 1. Verify Firebase OTP G�� this signs the user into Firebase Auth
      await window.confirmationResult.confirm(deleteState.otp);

      // 2. Delete the Firebase Auth user from the client side
      //    (auth.currentUser is now set after OTP confirmation above)
      try {
        if (auth.currentUser) {
          await auth.currentUser.delete();
          console.log("Firebase Auth user deleted successfully.");
        }
      } catch (firebaseErr) {
        // Log but don't block G�� the backend will also attempt Firebase Admin deletion
        console.warn("Firebase client-side deletion warning:", firebaseErr?.message);
      }

      // 3. Delete from MongoDB (backend also attempts Firebase Admin deletion as secondary safeguard)
      await api.delete("/api/delete-account", { data: { reason: deleteState.reason } });

      toast.success("Identity purged. Goodbye.");
      localStorage.clear();
      setTimeout(() => window.location.href ="/", 1500);
    } catch (err) {
      console.error("Account deletion error:", err);
      const msg = err?.response?.data?.message || err?.message ||"Verification failed";
      toast.error(msg);
      setDeleteState(prev => ({ ...prev, loading: false }));
    }
  };



  const getFilteredData = () => {
    const list = data[activeTab] || [];
    return list.filter(item => {
      const status = (item.status ||"Pending").toLowerCase();
      const matchesStatus = statusFilter ==="all" ||
        (statusFilter ==="pending" && ["pending","reported","available"].includes(status)) ||
        (statusFilter ==="active" && ["verified","claimed","arrived","collected","paid","success"].includes(status)) ||
        (statusFilter ==="completed" && ["completed","resolved","delivered"].includes(status));

      let matchesMonth = true;
      if (monthFilter) {
        const itemDate = new Date(item.createdAt || item.reportedAt);
        const itemMonthStr = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}`;
        matchesMonth = itemMonthStr === monthFilter;
      }
      return matchesStatus && matchesMonth;
    });
  };

  const getStatusStyle = (status) => {
    const base = "px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 w-fit border";
    const s = status?.toLowerCase();
    switch (s) {
      case 'completed': case 'resolved': case 'collected':
        return `${base} bg-green-100 text-green-700 border-green-200`;
      case 'paid':
        return `${base} bg-blue-100 text-blue-700 border-blue-200`;
      case 'arrived': case 'awaiting payment':
        return `${base} bg-yellow-100 text-yellow-700 border-yellow-200 animate-pulse`;
      case 'claimed':
        return `${base} bg-sky-100 text-sky-700 border-sky-200`;
      case 'available':
        return `${base} bg-emerald-100 text-emerald-700 border-emerald-200`;
      default:
        return `${base} bg-orange-50 text-orange-600 border-orange-100`;
    }
  }

  const TabButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm ${
        activeTab === id
          ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
          : "text-slate-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      <div className={`p-2 rounded-lg ${activeTab === id ? "bg-green-200/50 text-green-600" : "bg-slate-100 text-slate-400"}`}>
        <Icon size={14} />
      </div>
      {label}
    </button>
  );

  const renderMobileCard = (item, type) => {
    const status = item.status?.toLowerCase();
    const isFinished = ["completed","resolved","delivered","success","paid"].includes(status);
    const hasVolunteer = item.assignedVolunteer || item.claimedBy;
    const startDateTime = new Date(item.createdAt || item.reportedAt);

    return (
      <div key={item._id} className="bg-white border border-slate-100 p-5 rounded-2xl mb-4 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className={getStatusStyle(item.status || "Pending")}>
             {status === 'completed' || status === 'paid' ? <FaCheck className="text-[8px]" /> : <FaClock className="text-[8px]" />}
             {item.status || "Pending"}
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {startDateTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        </div>
        <h4 className="text-base font-bold text-slate-800 mb-1">
          {item.placeName || item.wasteType || item.pollutionType || "Service Request"}
        </h4>
        <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest mb-4">Mission ID: #{item._id?.slice(-8)}</p>
        <div className="flex flex-col gap-2">
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
            <button onClick={() => generateReceipt(item)} className="w-full bg-slate-800 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg">
              <FaDownload size={10} /> Get Receipt
            </button>
          ) : null}
          {hasVolunteer && !isFinished && (
            <button onClick={() => handleLiveHelp(item, type)} className="w-full bg-sky-50 text-sky-600 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 border border-sky-100">
              <FaInfoCircle /> {item.helpRequested ? "Signal Active" : "Request Help"}
            </button>
          )}
          {hasVolunteer && isFinished && !item.review && (
            <button onClick={() => setReviewModal({ show: true, item, type, rating: 0, comment: "", isReport: false, reportReason: "", loading: false })} className="w-full bg-amber-50 text-amber-600 border border-amber-100 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2">
              <FaStar /> {type === 'pickups' ? 'Review Courier' : 'Review Agent'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderTable = (list, columns, type) => {
    if (loading && list.length === 0) return <div className="p-16 text-center"><FaSpinner className="animate-spin text-green-500 text-2xl mx-auto" /></div>;
    if (!list || list.length === 0) return (
      <div className="p-16 text-center rounded-2xl border-2 border-dashed border-slate-200">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaLeaf className="text-slate-400" />
        </div>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No {type} records found</p>
      </div>
    );
    return (
      <>
        <div className="hidden md:block overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-y-1.5">
            <thead>
              <tr className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
                {columns.map(col => <th key={col} className="px-5 py-3">{col}</th>)}
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, idx) => {
                const status = item.status?.toLowerCase();
                const isFinished = ["completed","resolved","delivered","success","paid"].includes(status);
                const hasVolunteer = item.assignedVolunteer || item.claimedBy;
                const startDateTime = new Date(item.createdAt || item.reportedAt);
                const endDateTime = isFinished ? new Date(item.completedAt || item.updatedAt) : null;
                return (
                  <tr key={item._id || idx} className="bg-white hover:bg-slate-50 transition-all duration-200 border border-slate-100 rounded-xl">
                    <td className="px-5 py-4 text-sm font-medium text-slate-500 first:rounded-l-xl">
                      <div className="space-y-1.5 min-w-[180px]">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          <div className="flex flex-col">
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Start</span>
                            <span className="text-[11px] text-slate-700 font-bold">
                              {startDateTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, {startDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${isFinished ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
                          <div className="flex flex-col">
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">End</span>
                            {endDateTime ? (
                              <span className="text-[11px] text-emerald-600 font-bold">
                                {endDateTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, {endDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            ) : <span className="text-[10px] text-slate-300 italic">In progress...</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 border-l border-slate-50">
                      <p className="text-sm text-slate-800 font-bold line-clamp-1">
                        {item.placeName || item.wasteType || item.pollutionType || "Service Request"}
                      </p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><FaFlag size={8} /> ID: {item._id?.slice(-8)}</span>
                        {item.weight > 0 && <span className="text-emerald-600 flex items-center gap-1"><FaRecycle size={8} /> {item.weight} KG</span>}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={getStatusStyle(item.status || "Pending")}>
                        {status === 'completed' || status === 'paid' ? <FaCheck className="text-[8px]" /> : <FaClock className="text-[8px]" />}
                        {item.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4 last:rounded-r-xl">
                      <div className="flex flex-col items-center gap-2">
                        {(status === "arrived" || status === "awaiting payment") && type === "pickups" ? (
                          <button onClick={() => handlePayment(item._id)} className="w-full bg-green-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-green-700 transition-all active:scale-95">
                            <FaCreditCard /> Pay ₹50
                          </button>
                        ) : status === "collected" && type === "food" ? (
                          item.donorConfirmedCollection ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase border border-emerald-100">
                              <FaCheck size={10} /> Logged
                            </div>
                          ) : (
                            <button onClick={() => handleConfirmCollection(item._id)} className="w-full bg-amber-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-amber-600 transition-all active:scale-95">
                              <FaCheck /> Confirm
                            </button>
                          )
                        ) : status === "completed" && type === "pickups" ? (
                          <button onClick={() => generateReceipt(item)} className="w-full bg-slate-100 text-slate-600 border border-slate-200 px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-slate-800 hover:text-white transition-all">
                            <FaDownload size={10} /> Receipt
                          </button>
                        ) : <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">—</span>}
                        {hasVolunteer && (
                          !isFinished ? (
                            item.helpRequested ? (
                              <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 text-sky-600 rounded-lg text-[10px] font-black uppercase border border-sky-100 animate-pulse">
                                <FaInfoCircle size={10} /> Active
                              </div>
                            ) : (
                              <button onClick={() => handleLiveHelp(item, type)} className="w-full bg-sky-50 text-sky-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-sky-600 hover:text-white transition-all active:scale-95">
                                <FaInfoCircle /> Help
                              </button>
                            )
                          ) : (
                            item.review ? (
                              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-black uppercase border border-slate-200">
                                <FaCheckDouble size={10} /> Reviewed
                              </div>
                            ) : (
                              <button onClick={() => setReviewModal({ show: true, item, type, rating: 0, comment: "", isReport: false, reportReason: "", loading: false })} className="w-full bg-amber-50 text-amber-600 border border-amber-100 px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-amber-600 hover:text-white transition-all active:scale-95">
                                <FaStar /> Review
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
          {list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(item => renderMobileCard(item, type))}
        </div>
        {list.length > itemsPerPage && (
          <div className="flex justify-center items-center gap-3 py-8">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:border-green-400 hover:text-green-600 disabled:opacity-30 transition-all text-sm font-bold">‹</button>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span className="text-slate-800">{currentPage}</span> / {Math.ceil(list.length / itemsPerPage)}
            </span>
            <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(list.length / itemsPerPage), p + 1))} disabled={currentPage === Math.ceil(list.length / itemsPerPage)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:border-green-400 hover:text-green-600 disabled:opacity-30 transition-all text-sm font-bold">›</button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Nav />
      <div className="flex pt-[68px] min-h-screen">

        {/* ── LIGHT SIDEBAR ── */}
        <aside className="hidden lg:flex w-64 bg-white flex-col fixed top-[68px] left-0 h-[calc(100vh-68px)] overflow-y-auto z-40 border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] rounded-tr-[2rem] rounded-br-[2rem]">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-green-500/30">
                {currentName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-slate-800 font-bold text-sm truncate">{currentName}</p>
                <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-widest">Eco Citizen</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ID #{(user._id || user.id || 'XXXXXX').toString().slice(-6)}</span>
            </div>
          </div>
          <nav className="flex flex-col gap-1 p-4 flex-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Navigation</p>
            <TabButton id="profile" icon={FaUser} label="My Profile" />
            <TabButton id="pickups" icon={FaRecycle} label="Waste Pickups" />
            <TabButton id="pollution" icon={FaExclamationTriangle} label="Pollution Reports" />
            <TabButton id="food" icon={FaUtensils} label="Food Sharing" />
          </nav>
          <div className="p-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">Impact Score</p>
              <p className="text-3xl font-black text-slate-800"><Counter end={stats.totalImpact} /></p>
              <p className="text-[10px] text-green-600 font-bold mt-1">Credits Earned</p>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-green-500 w-3/4 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MOBILE BOTTOM NAV ── */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          {[
            { id: "profile", icon: FaUser, label: "Profile" },
            { id: "pickups", icon: FaRecycle, label: "Waste" },
            { id: "pollution", icon: FaExclamationTriangle, label: "Pollution" },
            { id: "food", icon: FaUtensils, label: "Food" },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === id ? "text-green-600" : "text-slate-400"}`}>
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 lg:ml-64 pb-24 lg:pb-8">
          {activeTab === "profile" ? (
            <div className="p-6 md:p-8 xl:p-10 max-w-[1200px] mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                
                {/* ── PROFILE COLUMN (Right on Desktop, Top on Mobile) ── */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-6 lg:order-last">
                  
                  {/* Hero Card */}
                  <div className="bg-gradient-to-b from-green-50 to-white border border-green-100 shadow-sm rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-green-500/30 mb-4 shrink-0">
                      {currentName.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-slate-800 font-black text-xl leading-tight">{currentName}</p>
                    <p className="text-slate-500 text-xs font-medium mt-1">Eco Citizen · ID #{(user._id || user.id || 'XXXXXX').toString().slice(-6)}</p>
                    
                    <div className="flex items-center justify-center gap-1.5 mt-3 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-green-600 text-[10px] font-bold uppercase tracking-widest">Active Member</span>
                    </div>

                    <button onClick={() => setIsEditing(!isEditing)}
                      className={`mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        isEditing ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm"
                      }`}>
                      {isEditing ? <><FaTimes size={12} /> Cancel Edit</> : <><FaEdit size={12} /> Edit Profile</>}
                    </button>
                  </div>

                  {/* Account Details */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Account Details</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      <div className="px-6 py-4 flex flex-col gap-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Full Name</p>
                        {isEditing ? (
                          <div className="flex gap-2 mt-1">
                            <input value={newName} onChange={(e) => setNewName(e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-slate-700 outline-none focus:border-green-500 transition-all text-sm w-full" />
                            <button onClick={handleUpdateName} className="bg-green-600 text-white px-3 py-1.5 rounded-lg font-black text-xs hover:bg-green-700 transition-all">Save</button>
                          </div>
                        ) : <p className="text-slate-800 font-bold text-sm mt-0.5">{currentName}</p>}
                      </div>
                      <div className="px-6 py-4 flex flex-col gap-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Phone Number</p>
                        <div className="flex items-center justify-between mt-0.5">
                          <p className="text-slate-800 font-bold text-sm">{user.phone || 'Not set'}</p>
                          <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black uppercase rounded-full border border-green-100">Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security */}
                  {isEditing && (
                    <div className="space-y-4 animate-in slide-in-from-top-4 duration-300">
                      <div className="flex flex-col gap-3">
                        <button onClick={() => setPhoneState({ ...phoneState, show: !phoneState.show, step: 1 })}
                          className={`w-full px-5 py-3 border rounded-xl text-[11px] font-black uppercase transition-all flex items-center justify-center gap-2 ${phoneState.show ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                          <FaEdit size={13} className="text-green-500" /> Update Phone
                        </button>
                        <button onClick={() => setDeleteState({ ...deleteState, show: !deleteState.show })}
                          className={`w-full px-5 py-3 border rounded-xl text-[11px] font-black uppercase transition-all flex items-center justify-center gap-2 ${deleteState.show ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50'}`}>
                          <FaTimes size={13} /> Account Termination
                        </button>
                      </div>

                      {phoneState.show && (
                        <div className="p-5 bg-green-50 border border-green-100 rounded-xl animate-in slide-in-from-top-4 duration-300">
                          {phoneState.step === 1 ? (
                            <div className="flex flex-col gap-3">
                              <div>
                                <label className="text-[10px] font-black text-green-700 uppercase mb-2 block tracking-widest">New Mobile Number</label>
                                <input type="tel" placeholder="+91..." value={phoneState.newPhone} onChange={(e) => setPhoneState({ ...phoneState, newPhone: e.target.value })}
                                  className="w-full bg-white border border-green-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-green-600 transition-all" />
                              </div>
                              <button onClick={handleSendPhoneOtp} disabled={phoneState.loading} className="w-full bg-green-600 text-white px-8 py-3 rounded-xl text-[11px] font-black uppercase hover:bg-green-700 transition-all">
                                {phoneState.loading ? "Sending..." : "Send Code"}
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              <div>
                                <label className="text-[10px] font-black text-green-700 uppercase mb-2 block tracking-widest text-center">Code sent to {phoneState.newPhone}</label>
                                <div className="flex justify-center gap-1.5">
                                  {[0,1,2,3,4,5].map((i) => (
                                    <input key={i} type="text" maxLength="1" value={phoneState.otp[i] || ""}
                                      onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g,""); let o = phoneState.otp.split(""); o[i]=val; setPhoneState({...phoneState,otp:o.join("")}); if(val&&e.target.nextSibling)e.target.nextSibling.focus(); }}
                                      className="w-8 h-10 bg-white border border-green-200 rounded-lg font-black text-slate-700 text-center outline-none focus:border-green-600 transition-all text-base" />
                                  ))}
                                </div>
                              </div>
                              <button onClick={handleVerifyPhone} disabled={phoneState.loading} className="w-full bg-slate-800 text-white px-8 py-3 rounded-xl text-[11px] font-black uppercase hover:bg-slate-900 transition-all">
                                {phoneState.loading ? "Verifying..." : "Confirm"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {deleteState.show && (
                        <div className="p-5 bg-rose-50 border border-rose-100 rounded-xl animate-in slide-in-from-top-4 duration-300">
                          <div className="flex flex-col items-center text-center mb-4">
                            <div className="w-10 h-10 bg-rose-200 text-rose-700 rounded-full flex items-center justify-center text-lg animate-pulse mb-2">⚠</div>
                            <h4 className="text-base font-black text-rose-900 leading-tight">Termination Protocol</h4>
                            <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest mt-1">This permanently deletes your account.</p>
                          </div>
                          {deleteState.step !== 2 ? (
                            <div className="space-y-3">
                              <textarea placeholder="Reason for leaving..." value={deleteState.reason} onChange={(e) => setDeleteState({ ...deleteState, reason: e.target.value })}
                                className="w-full bg-white border-2 border-rose-200 rounded-xl p-3 font-medium text-gray-700 outline-none focus:border-rose-500 transition-all min-h-[80px] text-sm" />
                              <button onClick={handleDeleteRequest} disabled={deleteState.loading} className="w-full bg-rose-600 text-white py-3 rounded-xl text-[11px] font-black uppercase hover:bg-rose-700 transition-all active:scale-95">
                                {deleteState.loading ? "Processing..." : "Initiate Verification"}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex justify-center gap-1.5">
                                {[0,1,2,3,4,5].map((i) => (
                                  <input key={i} type="text" maxLength="1" value={deleteState.otp[i] || ""}
                                    onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g,""); let o = deleteState.otp.split(""); o[i]=val; setDeleteState({...deleteState,otp:o.join("")}); if(val&&e.target.nextSibling)e.target.nextSibling.focus(); }}
                                    className="w-8 h-10 bg-white border-2 border-rose-200 rounded-lg font-black text-slate-800 text-center outline-none focus:border-rose-900 transition-all text-base" />
                                ))}
                              </div>
                              <button onClick={handleFinalDelete} disabled={deleteState.loading} className="w-full bg-slate-900 text-white py-3 rounded-xl text-[11px] font-black uppercase hover:bg-rose-900 transition-all active:scale-95">
                                {deleteState.loading ? "Purging..." : "Finalize Deletion"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── STATS COLUMN (Left on Desktop, Bottom on Mobile) ── */}
                <div className="lg:col-span-7 xl:col-span-8 space-y-6 lg:order-first">
                  
                  {/* Stats Strip */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { icon: FaRecycle, label: "Waste Pickups", val: stats.breakdown?.pickups, accent: "border-l-emerald-500 text-emerald-600" },
                      { icon: FaExclamationTriangle, label: "Pollution Reports", val: stats.breakdown?.pollution, accent: "border-l-rose-500 text-rose-600" },
                      { icon: FaUtensils, label: "Food Shared", val: stats.breakdown?.food, accent: "border-l-amber-500 text-amber-600" },
                    ].map((s, i) => (
                      <div key={i} className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 border-l-4 ${s.accent.split(' ')[0]}`}>
                        <s.icon size={16} className="text-slate-400 mb-3" />
                        <p className={`text-3xl font-black ${s.accent.split(' ')[1]}`}><Counter end={s.val || 0} /></p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Impact Banner */}
                  <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-xl shadow-green-900/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
                    <div className="relative z-10 flex flex-col xl:flex-row gap-8 xl:items-center justify-between">
                      <div className="flex-1">
                        <p className="text-green-100 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                          <FaLeaf /> Contribution Excellence
                        </p>
                        <div className="flex items-baseline gap-3 mt-4">
                          <span className="text-7xl font-black text-white"><Counter end={stats.totalImpact} /></span>
                          <span className="text-2xl font-black text-green-200">CREDITS</span>
                        </div>
                        <p className="text-green-50/80 text-sm font-medium mt-3 max-w-sm">
                          Your total environmental impact score. Keep completing missions to earn more credits and unlock exclusive eco-rewards.
                        </p>
                        <div className="w-full max-w-sm h-3 bg-black/20 rounded-full mt-6 overflow-hidden">
                          <div className="h-full bg-white w-3/4 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 w-full xl:w-64 shrink-0">
                        {[
                          { icon: FaRecycle, label: "Waste Managed", val: stats.breakdown?.pickups, color: "text-emerald-300" },
                          { icon: FaExclamationTriangle, label: "Pollution Cases", val: stats.breakdown?.pollution, color: "text-rose-300" },
                          { icon: FaUtensils, label: "Food Donations", val: stats.breakdown?.food, color: "text-amber-300" },
                        ].map((s, i) => (
                          <div key={i} className="flex items-center gap-4 bg-black/10 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/5 hover:bg-black/20 transition-all">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                              <s.icon size={14} className={s.color} />
                            </div>
                            <div>
                              <p className="text-[9px] font-bold text-green-100/70 uppercase tracking-widest">{s.label}</p>
                              <p className="text-lg font-black text-white"><Counter end={s.val || 0} /></p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 md:p-10 max-w-6xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight capitalize">{activeTab} Activity</h2>
                  <p className="text-slate-400 text-sm font-medium mt-1">Your environmental mission history</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                    {["all","pending","active","completed"].map((s) => (
                      <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${statusFilter === s ? "bg-green-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-700"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm items-center px-2">
                    <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}
                      className="bg-transparent text-[10px] font-bold text-slate-500 outline-none w-[110px] cursor-pointer" />
                    {monthFilter && (
                      <button onClick={() => setMonthFilter("")} className="ml-1 text-rose-400 hover:text-rose-600 transition-all"><FaTimes size={9} /></button>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
                {renderTable(getFilteredData(), ["Service Period", "Description"], activeTab)}
              </div>
            </div>
          )}
        </main>
      </div>

      <div id="recaptcha-container"></div>

      {/* ── REVIEW MODAL ── */}
      {reviewModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-white">Mission Debrief</h3>
                <p className="text-[10px] text-amber-100 font-bold uppercase tracking-widest">Rate your volunteer & report issues</p>
              </div>
              <button onClick={() => setReviewModal({ show: false, item: null, type: "", rating: 0, comment: "", isReport: false, reportReason: "", loading: false })}
                className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all hover:rotate-90">
                <FaTimes size={13} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volunteer Performance</p>
                <div className="flex justify-center gap-2">
                  {[1,2,3,4,5].map((s) => (
                    <button key={s} onClick={() => setReviewModal(prev => ({ ...prev, rating: s }))}
                      className={`text-3xl transition-all active:scale-75 ${reviewModal.rating >= s ? "text-amber-400 scale-110" : "text-slate-200 hover:text-amber-200"}`}>
                      <FaStar />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Feedback (optional)</label>
                <textarea placeholder="Share your experience..." value={reviewModal.comment}
                  onChange={(e) => setReviewModal(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-medium text-slate-700 outline-none focus:border-amber-400 transition-all min-h-[90px] resize-none" />
              </div>
              <div className="border-t border-slate-100 pt-4">
                <button onClick={() => setReviewModal(prev => ({ ...prev, isReport: !prev.isReport }))}
                  className={`w-full p-3.5 rounded-xl flex items-center justify-between transition-all ${reviewModal.isReport ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                  <span className="text-[11px] font-black uppercase flex items-center gap-2"><FaExclamationTriangle /> Report an Issue</span>
                  <div className={`w-4 h-4 rounded-full border-2 transition-all ${reviewModal.isReport ? "bg-red-500 border-red-500" : "border-slate-300"}`}></div>
                </button>
                {reviewModal.isReport && (
                  <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                    <textarea placeholder="Describe the problem (required)..." required value={reviewModal.reportReason}
                      onChange={(e) => setReviewModal(prev => ({ ...prev, reportReason: e.target.value }))}
                      className="w-full bg-red-50 border border-red-200 rounded-xl p-4 font-medium text-red-900 outline-none focus:border-red-400 transition-all resize-none" />
                  </div>
                )}
              </div>
              <button onClick={handleReviewSubmit} disabled={reviewModal.loading}
                className="w-full bg-green-600 text-white py-4 rounded-xl text-[11px] font-black uppercase hover:bg-green-700 transition-all shadow-lg shadow-green-600/30 active:scale-95 disabled:opacity-50">
                {reviewModal.loading ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}

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
