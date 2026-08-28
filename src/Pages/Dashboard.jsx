import React, { useState, useEffect } from "react";
import {
  FaUser, FaRecycle, FaExclamationTriangle, FaUtensils,
  FaChevronRight, FaEdit, FaCheck, FaTimes, FaColumns,
  FaCreditCard, FaSpinner, FaClock, FaDownload, FaLeaf,
  FaFlag, FaStar, FaInfoCircle, FaCheckCircle, FaCheckDouble, FaHeart
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- SECURITY STATES ---
  const [phoneState, setPhoneState] = useState({ show: false, newPhone: "", otp: "", step: 1, loading: false });
  const [deleteState, setDeleteState] = useState({ show: false, reason: "", otp: "", loading: false });
  const [reviewModal, setReviewModal] = useState({ show: false, item: null, type: "", rating: 0, comment: "", isReport: false, reportReason: "", loading: false });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentName = localStorage.getItem("userName") || user.name || "User";





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

  const handlePayment = async (pickupId) => {
    setProcessingPayment(pickupId);
    try {
      // Dynamically load Razorpay SDK
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
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
            name: "Karma",
            description: "Waste Pickup Fee",
            image: "https://cdn-icons-png.flaticon.com/512/3299/3299935.png",
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
              contact: user.phone || ""
            },
            theme: {
              color: "#16a34a"
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.on("payment.failed", function (response) {
            window.location.href = `/payment-failure?error=${response.error.description || "payment_failed"}&pickupId=${pickupId}`;
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
              {list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, idx) => {
                const status = item.status?.toLowerCase();
                const isFinished = ["completed", "resolved", "delivered", "success", "paid"].includes(status);
                const hasVolunteer = item.assignedVolunteer || item.claimedBy;

                const startDateTime = new Date(item.createdAt || item.reportedAt);
                const endDateTime = isFinished ? new Date(item.completedAt || item.updatedAt) : null;

                return (
                  <tr key={item._id || idx} className="bg-white group hover:bg-slate-50 transition-all duration-300 shadow-sm border border-slate-100 rounded-2xl overflow-hidden translate-y-0 hover:-translate-y-0.5">
                    {/* TIME SECTION (START & END) */}
                    <td className="px-5 py-4 text-sm font-bold text-slate-500 first:rounded-l-2xl">
                      <div className="space-y-2 min-w-[180px]">
                        {/* Start Time Row */}
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]"></div>
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
                            <FaCreditCard /> Pay Γé╣50
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
          {list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(item => renderMobileCard(item, type))}
        </div>
        
        {/* Pagination Controls */}
        {list.length > itemsPerPage && (
          <div className="flex justify-center items-center gap-4 py-8">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border-2 border-slate-100 text-slate-500 hover:border-green-200 hover:text-green-600 disabled:opacity-50 disabled:hover:border-slate-100 disabled:hover:text-slate-500 transition-all shadow-sm"
            >
              <span className="font-black">&lt;</span>
            </button>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              Page <span className="text-green-600 text-sm mx-1">{currentPage}</span> of {Math.ceil(list.length / itemsPerPage)}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(list.length / itemsPerPage), p + 1))}
              disabled={currentPage === Math.ceil(list.length / itemsPerPage)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border-2 border-slate-100 text-slate-500 hover:border-green-200 hover:text-green-600 disabled:opacity-50 disabled:hover:border-slate-100 disabled:hover:text-slate-500 transition-all shadow-sm"
            >
              <span className="font-black">&gt;</span>
            </button>
          </div>
        )}
      </>
    );
  };

  const TabButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-4 px-6 py-4 transition-all duration-300 w-full text-left font-bold text-sm ${
        activeTab === id 
          ? "bg-white text-emerald-600 shadow-sm border border-emerald-100 rounded-2xl" 
          : "text-slate-500 hover:bg-white/50 hover:text-slate-700 rounded-2xl"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );

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

  

  const renderMobileCard = (item, type) => {
    const status = item.status?.toLowerCase();
    const isFinished = ["completed", "resolved", "delivered", "success", "paid"].includes(status);
    const hasVolunteer = item.assignedVolunteer || item.claimedBy;
    const startDateTime = new Date(item.createdAt || item.reportedAt);

    return (
      <div key={item._id} className="bg-white shadow-sm border border-slate-100 p-5 rounded-2xl border border-white/60 shadow-sm mb-4">
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
              <FaCreditCard /> Pay Γé╣50
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

  

  const handleConfirmCollection = async (foodId) => {
    try {
      await api.patch(`/api/food/donor-confirm/${foodId}`);
      toast.success("Collection confirmed! Thank you for your confirmation.");
      fetchAllData(false); // Refresh data
    } catch (err) {
      toast.error("Failed to confirm collection");
    }
  };

  

  const handleLiveHelp = async (item, type) => {
    const message = window.prompt("≡ƒåÿ SOS: What issue are you experiencing? (e.g., Courier is not answering, payment stuck):");
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
    
    const retryId = params.get("retry");
    if (retryId) {
      window.history.replaceState({}, document.title, "/dashboard");
      // Delay slightly to ensure component is mounted and data is fetched if needed
      setTimeout(() => {
        handlePayment(retryId);
      }, 500);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && activeTab !== "profile") {
        fetchAllData(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [loading, activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-emerald-100 font-sans text-slate-900 flex flex-col relative overflow-hidden">
      <Nav />
      <div className="flex flex-1 pt-[72px] min-h-[100vh]">
        {/* SIDEBAR */}
        <aside className="hidden lg:flex w-[260px] bg-transparent border-none flex-col pt-6 px-4 h-[calc(100vh-72px)] sticky top-[72px] border-r border-gray-200 shadow-sm z-10">
          <div className="mb-6 px-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-slate-200 rounded-md flex items-center justify-center text-[10px]">??</div>
              <span className="text-xs font-black tracking-widest uppercase text-slate-800">Sustainability</span>
            </div>
            <p className="text-[9px] text-gray-500 font-bold ml-8 tracking-widest uppercase">Impact Dashboard</p>
          </div>
          
          <nav className="flex flex-col gap-2">
            <TabButton id="profile" icon={FaUser} label="Profile" />
            <TabButton id="pickups" icon={FaRecycle} label="Waste" />
            <TabButton id="pollution" icon={FaExclamationTriangle} label="Pollution" />
            <TabButton id="food" icon={FaUtensils} label="Food" />
          </nav>
          
          <div className="mt-auto pb-8 pt-4">
            <button onClick={() => window.location.href="/donations"} className="w-full bg-[#0B7A30] text-white py-3 rounded-full text-xs font-bold flex items-center justify-center gap-2 hover:bg-green-800 transition shadow-[0_4px_15px_rgb(11,122,48,0.4)]">
              <FaHeart size={12} /> Donate Now
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
          {activeTab === "profile" ? (
            <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
              <div className="mb-10">
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Main Workspace</h3>
                <p className="text-gray-500 font-medium text-sm mt-1">Managing your environmental contribution</p>
              </div>

              {/* Cards Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 items-start">
                {/* Profile Avatar Card */}
                <div className="bg-white/30 backdrop-blur-md p-8 rounded-[2.5rem] text-center flex flex-col items-center justify-center min-h-[220px] lg:col-span-1 hidden">
                   {/* Removed from display to match mockup layout precisely, which shows Legal Name and Verified Contact stretching. The original had 3 boxes here. Mockup has 2 wide ones. */}
                </div>

                {/* Info Cards - MATCHING MOCKUP */}
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/50 flex flex-col justify-center min-h-[140px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-[#E9F5EC] text-[#0B7A30] rounded-full">
                        <FaUser size={12} />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Legal Name</p>
                    </div>
                    {isEditing ? (
                      <div className="flex gap-2 mt-2">
                        <input value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 w-full font-bold text-slate-700 outline-none text-sm" />
                        <button onClick={handleUpdateName} className="bg-slate-900 text-white px-4 rounded-xl hover:bg-slate-800 transition font-black text-[10px]">SAVE</button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center mt-1 pl-2">
                        <p className="text-2xl font-black text-slate-900">{currentName}</p>
                        <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-bold uppercase hover:bg-gray-100 border border-gray-200 flex items-center gap-1"><FaEdit /> Edit</button>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/50 flex flex-col justify-center min-h-[140px]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-[#E9F5EC] text-[#0B7A30] rounded-full">
                        <FaClock size={12} />
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verified Contact</p>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-1 pl-2">{user.phone || '+911111111111'}</p>
                  </div>
                </div>
              </div>

              {/* Contribution Excellence Block */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#0B7A30] rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[360px]">
                  <div>
                    <h4 className="text-white/80 font-black text-[11px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <FaLeaf /> Contribution Excellence
                    </h4>
                    <div className="flex items-baseline gap-3 mb-4 mt-2">
                      <span className="text-7xl md:text-8xl font-black tracking-tighter text-white drop-shadow-md leading-none">
                        <Counter end={stats.totalImpact} />
                      </span>
                      <span className="text-white font-black text-4xl tracking-tight leading-none drop-shadow-sm">CREDITS</span>
                    </div>
                    <p className="text-white/90 text-sm max-w-sm leading-relaxed font-medium mt-6">
                      Your cumulative eco-actions have generated significant positive impact. Keep contributing to earn more credits.
                    </p>
                  </div>

                  <div className="mt-12 flex gap-4">
                    <button className="bg-white text-[#0B7A30] px-6 py-3 rounded-full text-xs font-black shadow-lg hover:shadow-xl transition-all">
                      View Details
                    </button>
                    <button className="bg-transparent border border-white/40 text-white px-8 py-3 rounded-full text-xs font-black hover:bg-white/10 transition-all">
                      Redeem
                    </button>
                  </div>
                </div>

                {/* Vertical Stats Column */}
                <div className="space-y-4">
                  {[
                    { icon: FaRecycle, color: "text-[#0B7A30]", bg: "bg-[#E9F5EC]", label: "Waste Managed", val: stats.breakdown?.pickups, suffix: "+" },
                    { icon: FaExclamationTriangle, color: "text-rose-600", bg: "bg-rose-100", label: "Pollution Cases", val: stats.breakdown?.pollution, suffix: "!" },
                    { icon: FaHeart, color: "text-rose-600", bg: "bg-rose-100", label: "Food Donations", val: stats.breakdown?.food, suffix: "" }
                  ].map((item, i) => (
                    <div key={i} className="bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/50 flex flex-col items-center justify-center text-center group cursor-default hover:border-gray-300 transition-colors min-h-[140px]">
                      <div className={`p-2 rounded-full ${item.bg} ${item.color} group-hover:scale-110 transition-transform mb-3`}>
                        <item.icon size={16} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-3xl font-black text-slate-900 flex items-baseline justify-center gap-1 mt-1">
                          <Counter end={item.val || 0} />
                          {item.suffix && <span className="text-2xl font-black">{item.suffix}</span>}
                          {i === 2 && <FaHeart className="text-[10px] text-rose-600 ml-1" />}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-6xl mx-auto p-2 md:p-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                <div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tight capitalize">{activeTab} Activity Log</h3>
                  <p className="text-gray-400 font-bold text-sm tracking-tight mt-1">Monitoring your environmental mission history</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                    {["all", "pending", "active", "completed"].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className="px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/50">
                {renderTable(getFilteredData(), ["Service Period", "Description"], activeTab)}
              </div>
            </div>
          )}
        </main>
      </div>
      <div id="recaptcha-container"></div>

      {/* 🌟 REVIEW & REPORT MODAL */}
      {reviewModal.show && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white/80 backdrop-blur-xl w-full max-w-lg border border-white/50 rounded-[3rem] shadow-3xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
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
                  className="w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 border-2 border-slate-100 rounded-2xl p-4 font-bold text-gray-700 outline-none focus:border-amber-400 transition-all min-h-[100px]"
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
