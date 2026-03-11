import React, { useState, useEffect } from "react";
import hero from "../assets/hero.jpg";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../utils/api";
import { auth, RecaptchaVerifier, signInWithPhoneNumber } from "../firebaseconfig";
import AOS from "aos";
import "aos/dist/aos.css";

const Register = () => {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const isValidPassword = (pwd) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+=[\]{};':"\\|,.<>/?~-]).{8,}$/.test(pwd);
  const isValidName = (n) => /^[a-zA-Z ]{3,}$/.test(n.trim());

  useEffect(() => {
    setIsFormValid(isValidName(name) && /^\d{10}$/.test(phone) && isValidPassword(password));
  }, [name, phone, password]);

  const passwordStrengthMessage = () => {
    if (!password) return "";
    if (password.length < 8) return "Too short (min 8)";
    if (!isValidPassword(password)) return "Mix upper, lower, numbers & symbols";
    return "Strong password ✅";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    try {
      setLoading(true);
      const formattedPhone = `+91${phone}`;
      const response = await api.get(`/api/check-phone`, { params: { phone: formattedPhone } });

      if (response.data.exists) {
        toast.error("Phone number already exists ❌");
        return;
      }

      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      window.confirmationResult = confirmationResult;

      toast.success("OTP sent successfully 📱");
      nav("/otp", { state: { name, phone: formattedPhone, password } });
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to send OTP");
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden">
      {/* Background with Dark Nature Overlay */}
      <div className="absolute inset-0 z-0" style={{ backgroundImage: `url(${hero})`, backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-linear-to-r from-green-950/90 via-green-900/60 to-black/40"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center px-6 py-12">
        
        {/* LEFT SIDE: Brand Message */}
        <div className="hidden md:block space-y-6">
          <h1 data-aos="fade-right" className="text-6xl font-extrabold text-white leading-tight">
            Join the <br/>
            <span className="text-green-400">Green Movement.</span>
          </h1>
          <p data-aos="fade-right" data-aos-delay="100" className="text-green-50 text-xl max-w-md opacity-90 leading-relaxed">
            Create an account to start contributing to a cleaner, more sustainable future for Kerala.
          </p>
        </div>

        {/* RIGHT SIDE: Register Card */}
        <div data-aos="fade-left" className="bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-white/20 max-w-md mx-auto w-full">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
          <p className="text-gray-500 mb-8 font-medium text-sm italic">Secure registration via Phone OTP</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 ml-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="User name"
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all font-medium text-gray-800"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 ml-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit mobile"
                className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all font-medium text-gray-800"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create strong password"
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-green-500 transition-all font-medium text-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase hover:text-green-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className={`mt-1.5 text-[11px] font-bold ${isValidPassword(password) ? "text-green-600" : "text-gray-400"}`}>
                {passwordStrengthMessage()}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className={`w-full py-4 mt-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-lg transition-all transform hover:-translate-y-1 shadow-xl shadow-green-200 flex items-center justify-center gap-2 ${
                !isFormValid || loading ? "opacity-50 cursor-not-allowed translate-y-0 shadow-none" : ""
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2 italic">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending OTP...
                </span>
              ) : (
                "Verify & Send OTP"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600 font-medium">
              Already have an account?{" "}
              <Link to="/login" className="text-green-600 font-bold hover:underline underline-offset-4">Login here</Link>
            </p>
            <Link to="/" className="inline-block mt-4 text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-tighter">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Register;