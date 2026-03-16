import React, { useState, useRef, useEffect } from "react";
import hero from "../assets/hero.jpg";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { FaArrowLeft, FaShieldAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../utils/api";
import AOS from "aos";
import "aos/dist/aos.css";

const OTPPage = () => {
  const nav = useNavigate();
  const location = useLocation();
  const { name, phone, password } = location.state || {};

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(30);
  const inputsRef = useRef([]);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    if (!name || !phone || !password) {
      toast.error("No user data found. Please register again.");
      nav("/register");
    }
  }, [name, phone, password, nav]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputsRef.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }

    try {
      setLoading(true);
      await window.confirmationResult.confirm(code);

      await api.post("/register", {
        name,
        phone,
        password,
      });

      toast.success("Account created successfully!");
      nav("/login");
    } catch (error) {
      console.error("OTP Error:", error);
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    toast.success("New OTP sent!");
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  return (
    <div className="min-h-screen bg-slate-50/90 flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Image with Overlay - Matches Login */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${hero})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-linear-to-r from-green-950/90 via-green-900/60 to-black/40"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-6">
        
        {/* LEFT SIDE Content - Matches Login */}
        <div className="hidden md:block space-y-8">
          <div data-aos="fade-right">
            <h1 className="text-7xl font-black text-white leading-[1.1] tracking-tighter">
              SECURE <br/>
              <span className="text-green-400">VERIFY</span>
            </h1>
            <div className="h-1.5 w-24 bg-green-500 mt-4 rounded-full"></div>
          </div>
          
          <p data-aos="fade-right" data-aos-delay="100" className="text-green-50 text-xl max-w-md leading-relaxed opacity-90 font-medium">
            One last step to protect your account. We've sent a code to your device to ensure it's really you.
          </p>
        </div>

        {/* RIGHT SIDE Form - Matches Login Form Style */}
        <div data-aos="zoom-in" className="bg-white/95 backdrop-blur-lg p-10 md:p-14 rounded-[40px] shadow-2xl border border-white/20 max-w-md mx-auto w-full">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Verify</h2>
            <p className="text-gray-500 mt-2 font-semibold italic text-sm">
              Code sent to <span className="text-green-600">+91 {phone?.slice(-10)}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">6-Digit Code</label>
              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputsRef.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 sm:w-14 h-12 sm:h-14 text-center text-xl font-black bg-white border-2 border-gray-200 rounded-2xl shadow-sm outline-none transition-all text-gray-900 focus:border-green-500 focus:ring-4 focus:ring-green-500/15"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-lg transition-all transform active:scale-95 shadow-xl shadow-green-200 flex items-center justify-center gap-3 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading ? "Verifying..." : "Verify & Join"}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-100">
            <p className="text-center text-gray-500 font-bold text-sm">
              Didn't receive the code?{" "}
              <button 
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className={`text-green-600 hover:underline underline-offset-4 decoration-2 ${resendCooldown > 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend SMS"}
              </button>
            </p>
            <div className="mt-6 flex justify-center">
              <button 
                onClick={() => nav("/register")}
                className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
              >
                ← Change Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPPage;
