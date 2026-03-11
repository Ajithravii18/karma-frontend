import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaDownload, FaArrowLeft } from "react-icons/fa";
import { generateReceipt } from "../utils/ReceiptGenerator";
import toast from "react-hot-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Extracting from your URL: ?txnid=TXN_...
  const txnId = searchParams.get("txnid") || "N/A";
  const userName = localStorage.getItem("userName") || "Valued Citizen";

  const handleDownload = () => {
    generateReceipt({
      txnId: txnId,
      amount: "50.00",
      userName: userName,
      serviceName: "Waste Pickup Service",
      date: new Date().toLocaleDateString()
    });
    toast.success("Receipt Saved!");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 text-center border border-green-50">
        <FaCheckCircle className="text-green-500 text-7xl mx-auto mb-6" />
        
        <h1 className="text-3xl font-black text-gray-900 mb-2">Payment Received!</h1>
        <p className="text-gray-500 font-medium mb-8">
          Your transaction was successful. Your pickup is now confirmed.
        </p>

        <div className="bg-slate-50 rounded-2xl p-4 mb-8 text-left border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Transaction ID</p>
          <p className="text-xs font-mono font-bold text-green-700 break-all">{txnId}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={handleDownload}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg"
          >
            <FaDownload /> Download Receipt
          </button>

          <button 
            onClick={() => navigate("/dashboard")}
            className="w-full bg-white border border-gray-100 text-gray-500 font-bold py-4 rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <FaArrowLeft size={12} /> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;