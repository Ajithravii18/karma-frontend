import React, { useState, useEffect } from "react";
import hero from "../assets/hero.jpg";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";
import AOS from "aos";
import "aos/dist/aos.css";

import { FaArrowLeft } from "react-icons/fa";

const Login = () => {
  const nav = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });

    const token = localStorage.getItem("authToken");
    if (token) {
      nav("/");
    }
  }, [nav]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!/^\d{10}$/.test(phone)) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    if (!password) {
      toast.error("Enter your password");
      return;
    }

    try {
      setLoading(true);

      // Sending phone and password to backend
      const response = await api.post("/login", {
        phone,
        password,
      });

      // The backend now sends the actual database role in 'user.role'
      const { token, user } = response.data;

      // 1. Clear old data to prevent role-clashing
      localStorage.clear();

      // 2. Store session data
      // We store user.role directly from the DB response
      localStorage.setItem("authToken", token);
      localStorage.setItem("userName", user.name);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("user", JSON.stringify(user));

      // 3. Dispatch storage event for Navbar update

      window.dispatchEvent(new CustomEvent("local-auth-update"));

      toast.success(`Welcome back, ${user.name}!`);

      nav("/");

    } catch (error) {
      console.error("Login Error:", error);
      const responseData = error.response?.data;
      const errorMsg =
        (typeof responseData === "string" ? responseData : responseData?.message) ||
        "Invalid phone or password";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/90 flex items-center justify-center relative overflow-hidden font-sans">
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

      <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center px-4 md:px-6 py-12 md:py-0">

        {/* LEFT SIDE Content */}
        <div className="hidden md:block space-y-8">
          <div data-aos="fade-right">
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter">
              E-KARMA <br />
              <span className="text-green-400">ECO-PORTAL</span>
            </h1>
            <div className="h-1.5 w-24 bg-green-500 mt-4 rounded-full"></div>
          </div>

          <p data-aos="fade-right" data-aos-delay="100" className="text-green-50 text-lg md:text-xl max-w-md leading-relaxed opacity-90 font-medium">
            Join the movement. Log in to track your environmental contributions,
            schedule waste pickups, and report pollution.
          </p>
        </div>

        {/* RIGHT SIDE Form */}
        <div data-aos="zoom-in" className="bg-white/95 backdrop-blur-lg p-8 md:p-14 rounded-[32px] md:rounded-[40px] shadow-2xl border border-white/20 max-w-md mx-auto w-full">
          <div className="md:hidden mb-8 text-center" data-aos="fade-down">
             <h1 className="text-4xl font-black text-green-950 leading-none">E-KARMA</h1>
             <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.3em] mt-2">Eco-Portal Initiative</p>
             <div className="h-1 w-12 bg-green-500 mx-auto mt-4 rounded-full"></div>
          </div>
          <div className="mb-8 md:mb-10 text-center md:text-left">
            <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-green-600 hover:text-green-700 transition mb-4">
              <FaArrowLeft /> Back to Home
            </Link>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Login</h2>
            <p className="text-gray-500 mt-2 font-semibold text-sm italic md:not-italic">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">+91</span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="00000 00000"
                  className="w-full pl-14 pr-5 py-4 bg-gray-100/50 border-2 border-transparent rounded-2xl focus:border-green-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Password</label>
                <Link to="/forgot-password" size="sm" className="text-xs text-green-600 font-black hover:text-green-700 transition">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-4 bg-gray-100/50 border-2 border-transparent rounded-2xl focus:border-green-500 focus:bg-white outline-none transition-all font-bold text-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-gray-400 hover:text-green-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black text-lg transition-all transform active:scale-95 shadow-xl shadow-green-200 flex items-center justify-center gap-3 ${loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
            >
              {loading ? "Verifying Access..." : "Sign In"}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-100">
            <p className="text-center text-gray-500 font-bold text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-green-600 hover:underline underline-offset-4 decoration-2">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;