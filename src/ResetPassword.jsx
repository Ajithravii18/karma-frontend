import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaKey, FaShieldAlt, FaCheckCircle, FaCircle } from "react-icons/fa";
import api from "./utils/api";
import toast from "react-hot-toast";
import hero from "./assets/hero.jpg";

const ResetPassword = () => {
  const location = useLocation();
  const nav = useNavigate();
  const phone = location.state?.phone;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRefs = useRef([]);

  useEffect(() => {
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

      // 1. Verify the Firebase OTP
      if (!window.confirmationResult) {
        toast.error("Session expired. Please request a new OTP.");
        nav("/forgot-password");
        return;
      }

      await window.confirmationResult.confirm(finalOtp);

      // 2. Firebase verification passed — now update the password in our backend
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
    <div className={`flex items-center gap-2 text-[11px] font-semibold transition-colors ${valid ? "text-green-600" : "text-gray-400"}`}>
      {valid ? <FaCheckCircle /> : <FaCircle className="text-[6px]" />}
      {label}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 font-sans">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <img
          src={hero}
          alt="background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <div className="relative z-10 w-full max-w-md my-8">
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl">
          <button
            onClick={() => nav("/forgot-password")}
            className="flex items-center gap-2 text-gray-500 hover:text-green-600 mb-6 transition-all font-medium text-sm group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
              <FaShieldAlt size={28} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">New Password</h2>
            <p className="text-gray-500 mt-2 text-sm italic">
              Resetting for: <span className="text-green-600 font-bold">{phone}</span>
            </p>
          </div>

          <form onSubmit={handleReset} className="space-y-6">
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  ref={(el) => (inputRefs.current[index] = el)}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-full h-12 text-center text-xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 outline-none transition-all"
                />
              ))}
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <FaKey size={14} />
                </span>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 outline-none transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <Requirement label="8+ Chars" valid={checks.length} />
                <Requirement label="Uppercase" valid={checks.uppercase} />
                <Requirement label="Lowercase" valid={checks.lowercase} />
                <Requirement label="Number" valid={checks.number} />
                <div className="col-span-2"><Requirement label="Special Char" valid={checks.special} /></div>
              </div>

              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 outline-none transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg"
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;