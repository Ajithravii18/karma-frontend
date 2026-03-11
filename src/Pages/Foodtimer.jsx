import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const FoodTimer = ({ reportedAt }) => {
  const [status, setStatus] = useState({ text: "", expired: false });

  useEffect(() => {
    const calculateTime = () => {
      const expiryTime = new Date(reportedAt).getTime() + 12 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setStatus({ text: "Expired", expired: true });
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setStatus({ text: `${h}h ${m}m left`, expired: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000); // Update every minute
    return () => clearInterval(timer);
  }, [reportedAt]);

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors ${
      status.expired ? "bg-red-50 text-red-500 border border-red-100" : "bg-orange-50 text-orange-600 border border-orange-100 animate-pulse"
    }`}>
      <Clock size={12} />
      {status.text}
    </div>
  );
};

export default FoodTimer;