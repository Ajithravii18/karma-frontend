import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPhoneAlt, FaArrowLeft, FaUnlockAlt } from "react-icons/fa";
import hero from "../assets/hero.jpg";
import api from "../utils/api";
import toast from "react-hot-toast";
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "../firebaseconfig";

const ForgotPassword = () => {
  const nav = useNavigate();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!/^\d{10}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      setLoading(true);
      const formattedPhone = `+91${phone}`;

      // 1. First check if this phone number exists in our database
      const checkRes = await api.post("/send-reset-otp", { phone: formattedPhone });

      // 2. If phone exists, send Firebase OTP
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      window.confirmationResult = confirmationResult;

      toast.success("Verification code sent! 📱");
      nav("/reset-password", { state: { phone: formattedPhone } });
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error(error.response?.data?.message || "Failed to send OTP. Please try again.");
      // Clean up recaptcha on error
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 font-sans">
      {/* Background Layer - Exactly like Login */}
      <div className="absolute inset-0 z-0">
        <img
          src={hero}
          alt="background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Solid Reset Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl">
          <button
            onClick={() => nav("/login")}
            className="flex items-center gap-2 text-gray-500 hover:text-green-600 mb-6 transition-colors font-medium text-sm"
          >
            <FaArrowLeft />
            <span>Back to Login</span>
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
              <FaUnlockAlt size={28} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Forgot Password?</h2>
            <p className="text-gray-500 mt-2 text-sm">
              Enter your number to receive an OTP code.
            </p>
          </div>

          <form onSubmit={handleSendOTP} className="space-y-5">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <FaPhoneAlt />
              </span>
              <input
                type="text"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                maxLength="10"
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-gray-700 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-green-200 transition-all active:scale-[0.98] disabled:bg-gray-400"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending OTP...</span>
                </div>
              ) : "Send Reset Code"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            Wait, I remember my password.{" "}
            <button
              onClick={() => nav("/login")}
              className="text-green-600 font-bold hover:underline"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default ForgotPassword;