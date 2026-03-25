import React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FaTimesCircle, FaArrowLeft, FaRedo } from "react-icons/fa";

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const error = searchParams.get("error") || "Transaction Failed";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl p-10 text-center border border-red-50">
        <FaTimesCircle className="text-red-500 text-7xl mx-auto mb-6" />
        
        <h1 className="text-3xl font-black text-gray-900 mb-2">Payment Failed!</h1>
        <p className="text-gray-500 font-medium mb-8">
          Something went wrong with your transaction. Please try again or contact support if the issue persists.
        </p>

        <div className="bg-red-50 rounded-2xl p-4 mb-8 text-left border border-red-100">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Error Details</p>
          <p className="text-xs font-mono font-bold text-red-700 break-all">{error.replace(/_/g, " ").toUpperCase()}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => navigate("/dashboard")}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg"
          >
            <FaRedo /> Retry from Dashboard
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

export default PaymentFailure;
