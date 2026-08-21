import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaCircle } from "react-icons/fa";
import api from "./utils/api";
import toast from "react-hot-toast";
import hero from "./assets/hero.jpg";
import AOS from "aos";
import "aos/dist/aos.css";

const ResetPassword = () => {
  const location = useLocation();
  const nav = useNavigate();
  const phone = location.state?.phone;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
    
    if (!phone) {
      nav("/forgot-password");
    }
  }, [phone, nav]);

  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const checks = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[@$!%*?&#^()_+=\-]/.test(newPassword),
  };

  const isStrongPassword = Object.values(checks).every(Boolean);

  const handleReset = async (e) => {
    e.preventDefault();
    const finalOtp = otp.join("");

    if (finalOtp.length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    if (!isStrongPassword) {
      toast.error("Password is too weak");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      if (!window.confirmationResult) {
        toast.error("Session expired. Please request a new OTP.");
        nav("/forgot-password");
        return;
      }

      await window.confirmationResult.confirm(finalOtp);

      await api.post("/reset-password", {
        phone,
        newPassword,
      });

      toast.success("Password reset successfully! 🎉");
      nav("/login");
    } catch (error) {
      console.error("Reset error:", error);
      if (error.code === "auth/invalid-verification-code") {
        toast.error("Invalid OTP code. Please try again.");
      } else {
        toast.error(error.response?.data?.message || "Reset failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const Requirement = ({ label, valid }) => (
    <div className={`flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-colors ${valid ? "text-green-600" : "text-gray-400"}`}>
      {valid ? <FaCheckCircle size={12} /> : <FaCircle size={8} className="ml-[2px] mr-[2px]" />}
      {label}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/90 flex items-center justify-center relative overflow-hidden font-sans py-6">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${hero})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-linear-to-r from-green-950/90 via-green-900/70 to-black/50"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center px-4 md:px-6">
        
        {/* LEFT SIDE Content */}
        <div className="hidden md:block space-y-6">
          <div data-aos="fade-right">
            <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tighter">
              E-KARMA <br />
              <span className="text-green-400">ECO-PORTAL</span>
            </h1>
            <div className="h-1 w-16 bg-green-500 mt-4 rounded-full"></div>
          </div>

          <p data-aos="fade-right" data-aos-delay="100" className="text-green-50 text-base md:text-lg max-w-sm leading-relaxed opacity-90 font-medium">
            Create a new secure password for your account. Protect your profile and continue contributing to a greener tomorrow.
          </p>
        </div>

        {/* RIGHT SIDE Form (Made more compact) */}
        <div data-aos="zoom-in" className="bg-white/95 backdrop-blur-lg p-6 md:p-8 rounded-3xl shadow-2xl border border-white/20 max-w-sm mx-auto w-full">
          <div className="md:hidden mb-6 text-center" data-aos="fade-down">
             <h1 className="text-3xl font-black text-green-950 leading-none">E-KARMA</h1>
             <div className="h-1 w-10 bg-green-500 mx-auto mt-2 rounded-full"></div>
          </div>

          <div className="mb-6 text-center md:text-left">
            <button
              onClick={() => nav("/forgot-password")}
              className="flex items-center justify-center md:justify-start gap-1.5 text-[10px] font-black uppercase text-green-600 hover:text-green-700 transition mb-3 mx-auto md:mx-0 w-max"
            >
              <FaArrowLeft /> Cancel
            </button>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">New Password</h2>
            <p className="text-gray-500 mt-1 text-xs font-semibold">
              Resetting for: <span className="text-green-600">{phone}</span>
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            
            {/* OTP Code Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">6-Digit Code</label>
              <div className="flex justify-between gap-1.5">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength="1"
                    value={digit}
                    ref={(el) => (inputRefs.current[index] = el)}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-full h-10 md:h-12 text-center text-lg font-black bg-gray-100/60 border-2 border-transparent rounded-xl focus:bg-white focus:border-green-500 outline-none transition-all text-gray-800"
                  />
                ))}
              </div>
            </div>

            {/* New Password Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create new password"
                  className="w-full px-4 py-2.5 bg-gray-100/60 border-2 border-transparent rounded-xl focus:border-green-500 focus:bg-white outline-none transition-all font-bold text-gray-800 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-gray-400 hover:text-green-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Password Requirements Grid - Tighter padding */}
            <div className="grid grid-cols-2 gap-2 bg-gray-100/60 p-3 rounded-xl border-2 border-transparent">
              <Requirement label="8+ Chars" valid={checks.length} />
              <Requirement label="Uppercase" valid={checks.uppercase} />
              <Requirement label="Lowercase" valid={checks.lowercase} />
              <Requirement label="Number" valid={checks.number} />
              <div className="col-span-2"><Requirement label="Special Character" valid={checks.special} /></div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-2.5 bg-gray-100/60 border-2 border-transparent rounded-xl focus:border-green-500 focus:bg-white outline-none transition-all font-bold text-gray-800 text-sm"
                />
              </div>
            </div>

            {/* Submit Button - Reduced height */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 mt-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-sm md:text-base transition-all transform active:scale-95 shadow-lg shadow-green-200 flex items-center justify-center gap-2 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
