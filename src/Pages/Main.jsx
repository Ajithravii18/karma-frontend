import React, { forwardRef, useEffect, useRef, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Nav from "../Components/Nav.jsx";
import hero from '../assets/hero.jpg'
import Counter from "../Components/Counter.jsx";
import Service from "./Service.jsx";
import About from "./About.jsx"
import Contact from "./Contact.jsx";
import Gallery from "./Gallery.jsx";
import Footer from "../Components/Footer.jsx";
import Chatbot from "../Components/Chatbot.jsx";
import { FaArrowUp, FaRecycle, FaLeaf, FaGlobeAsia, FaUsers, FaThermometerHalf, FaWind, FaMapMarkerAlt, FaTruck, FaSeedling } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"

const Main = forwardRef((props, ref) => {
  const navigate = useNavigate()

  useEffect(() => {
    AOS.init({ duration: 800, once: true, easing: "ease-out-cubic", offset: 60 });
  }, []);

  const homeRef = useRef(null);
  const aboutRef = useRef(null);
  const serviceRef = useRef(null);
  const ContactRef = useRef(null);
  const GalleryRef = useRef(null);

  const scrollToHome = () => homeRef.current.scrollIntoView({ behavior: "smooth" });
  const scrollToAbout = () => aboutRef.current.scrollIntoView({ behavior: "smooth" });
  const scrollToService = () => serviceRef.current.scrollIntoView({ behavior: "smooth" });
  const scrollToContact = () => ContactRef.current.scrollIntoView({ behavior: "smooth" });
  const scrollToGallery = () => GalleryRef.current.scrollIntoView({ behavior: "smooth" });

  const handleScheduleClick = () => {
    const token = localStorage.getItem("authToken");
    const userRole = localStorage.getItem("userRole");

    if (!token) {
      toast.error("Please login to continue");
      setTimeout(() => navigate("/login"), 1000);
      return;
    }

    if (userRole === "user") {
      navigate("/pick-up");
    } else {
      toast.error(`Access Denied: ${userRole}s cannot schedule pickups.`);
    }
  };

  // --- LIVE DATA: WEATHER & LOCATION ---
  const [weather, setWeather] = useState({ temp: 28, condition: "Partly Cloudy", code: 2 });
  const [locInfo, setLocInfo] = useState("Kochi, Kerala");
  const [isLiveLoading, setIsLiveLoading] = useState(true);

  useEffect(() => {
    const fetchLiveData = async () => {
      try {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude: lat, longitude: lon } = pos.coords;

            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const weatherJson = await weatherRes.json();

            if (weatherJson.current_weather) {
              setWeather({
                temp: Math.round(weatherJson.current_weather.temperature),
                code: weatherJson.current_weather.weathercode,
                condition: getWeatherLabel(weatherJson.current_weather.weathercode)
              });
            }

            const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            const geoJson = await geoRes.json();
            if (geoJson.city || geoJson.locality) {
              setLocInfo(`${geoJson.city || geoJson.locality}, ${geoJson.principalSubdivisionCode?.split('-').pop() || "Kerala"}`);
            }
            setIsLiveLoading(false);
          }, () => {
            setIsLiveLoading(false);
          });
        }
      } catch (err) {
        console.error("Live data fetch failed:", err);
        setIsLiveLoading(false);
      }
    };

    const getWeatherLabel = (code) => {
      if (code === 0) return "Clear Sky";
      if (code <= 3) return "Partly Cloudy";
      if (code <= 48) return "Foggy";
      if (code <= 57) return "Drizzle";
      if (code <= 67) return "Rainy";
      return "Cloudy";
    };

    fetchLiveData();
  }, []);

  // --- SCROLL TO TOP LOGIC ---
  const [showScroll, setShowScroll] = useState(false);
  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.pageYOffset > 400) {
        setShowScroll(true);
      } else if (showScroll && window.pageYOffset <= 400) {
        setShowScroll(false);
      }
    };
    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, [showScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- LIVE TIMESTAMP for Impact Section ---
  const [lastUpdated, setLastUpdated] = useState(new Date());
  useEffect(() => {
    const tick = setInterval(() => setLastUpdated(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);
  const formatTime = (d) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="bg-white overflow-x-hidden">
      <Nav
        onHomeClick={scrollToHome}
        onAboutClick={scrollToAbout}
        onServiceClick={scrollToService}
        onContactClick={scrollToContact}
        onGalleryClick={scrollToGallery}
      />

      {/* ═══════════════════════════════════════════
          HERO SECTION — Dark anchor
      ═══════════════════════════════════════════ */}
      <section
        ref={homeRef}
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-green-950 pt-20 pb-12 md:pt-24 md:pb-16"
      >
        {/* Background image */}
        <div
          className="absolute inset-0 z-0 opacity-75"
          style={{
            backgroundImage: `url(${hero})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Gradient overlay — solid dark behind text (left), fading to clear in center/right */}
        <div className="absolute inset-0 z-10 bg-green-950/80 lg:bg-transparent lg:bg-gradient-to-r lg:from-green-950 lg:from-40% lg:via-green-950/30 lg:to-transparent" />

        <div className="relative z-20 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">

          {/* ── Left: Text ── */}
          <div className="text-white space-y-6">

            {/* Badge */}
            <div data-aos="fade-up" data-aos-delay="0"
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-green-900/80 backdrop-blur-sm text-green-300 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Sustainable Future Initiative
            </div>

            {/* Headline */}
            <div data-aos="fade-up" data-aos-delay="100">
              <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-black leading-[1.05] tracking-tight">
                <span className="block text-white">മാലിന്യം കുറയ്ക്കാം</span>
                <span className="block text-green-400 mt-2">പ്രകൃതിയെ സംരക്ഷിക്കാം.</span>
              </h1>
              <p className="mt-4 text-xs text-white/50 font-black tracking-[0.25em] uppercase">
                Reduce Waste · Protect Nature
              </p>
            </div>

            <p data-aos="fade-up" data-aos-delay="200" className="text-base md:text-lg text-white/80 max-w-xl leading-relaxed">
              Building a cleaner, greener tomorrow through community-driven waste management. Restoring Kerala's natural beauty — one pickup at a time.
            </p>

            {/* CTAs */}
            <div data-aos="fade-up" data-aos-delay="300" className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={handleScheduleClick}
                className="px-8 py-4 bg-green-500 hover:bg-green-400 text-white rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-green-500/25 hover:-translate-y-0.5 flex items-center gap-2.5 text-sm uppercase tracking-wide"
              >
                Schedule Pickup
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              <button
                onClick={scrollToAbout}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors text-sm backdrop-blur-sm"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* ── Right: Professional White UI Card ── */}
          <div data-aos="fade-up" data-aos-delay="200" className="w-full max-w-[420px] lg:ml-auto relative z-10">
            <div className="bg-white rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-100">

              {/* Weather header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-xl">
                    {weather.temp > 30 ? "☀️" : weather.temp > 20 ? "⛅" : "🌧️"}
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-900 leading-none">{weather.temp}°C</div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">{weather.condition}</div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <FaMapMarkerAlt className="text-slate-400 text-[9px]" />
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{locInfo}</span>
                  </div>
                </div>
              </div>

              {/* Stat label */}
              <div className="px-5 pt-5 pb-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mission Statistics</h3>
              </div>

              {/* 4 stat tiles — Clean grid */}
              <div className="grid grid-cols-2 gap-px bg-slate-100 border-y border-slate-100">
                {[
                  { label: "Eco Points", end: 2400, suffix: "+", icon: <FaSeedling className="text-sm" />, color: "text-green-600", bg: "bg-green-50" },
                  { label: "Volunteers", end: 850, suffix: "+", icon: <FaUsers className="text-sm" />, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "Trash Cleared", end: 12, suffix: "t", icon: <FaRecycle className="text-sm" />, color: "text-emerald-600", bg: "bg-emerald-50" },
                  { label: "Trees Saved", end: 420, suffix: "", icon: <FaLeaf className="text-sm" />, color: "text-teal-600", bg: "bg-teal-50" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white px-5 py-5 hover:bg-slate-50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${stat.bg} ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-black text-slate-900 leading-none tracking-tight">
                      <Counter end={stat.end} suffix={stat.suffix} />
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1.5">{stat.label}</div>
                  </div>
                ))}
              </div>
              
              {/* Progress footer */}
              <div className="px-5 py-5 bg-slate-50/80">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Annual Target Progress</span>
                  <span className="text-xs font-black text-green-600"><Counter end={84} suffix="%" /></span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ animation: 'loadProgress 2.5s ease-out forwards', width: '0%' }} />
                </div>
                <p className="text-[10px] text-slate-500 font-medium mt-2.5">Target: 15,000 kg by Dec 2025</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 animate-bounce cursor-pointer opacity-50 hover:opacity-100 transition-opacity" onClick={scrollToAbout}>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2 shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <div className="w-1 h-2 bg-white/60 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PHILOSOPHY SECTION — Light
      ═══════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-6 md:px-20 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">

          <div data-aos="fade-up">
            <span className="text-xs font-black text-green-600 uppercase tracking-widest">Our Philosophy</span>
            <h2 className="text-3xl md:text-5xl font-black text-green-900 mt-3 mb-5 leading-tight tracking-tight drop-shadow-sm">
              Waste Management is Not a Choice —{" "}
              <span className="text-green-600">It's a Responsibility</span>
            </h2>
            <div className="w-10 h-0.5 bg-green-600 mb-7 rounded-full shadow-sm" />
            <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-4">
              Effective waste management protects our environment, improves public health, and promotes sustainable development.
            </p>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed">
              Proper segregation and recycling reduce landfill waste and create livelihood opportunities for communities.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { val: "2.24B+", desc: "Annual Global Waste", icon: "🌍" },
              { val: "40%", desc: "Improperly Managed", icon: "⚠️" },
              { val: "70%", desc: "Recyclable Potential", icon: "♻️" },
              { val: "100%", desc: "Cleaner Cities Goal", icon: "🏙️" }
            ].map((stat, i) => (
              <div
                key={i}
                data-aos="fade-up"
                data-aos-delay={i * 80}
                className="bg-white border border-slate-100 p-6 rounded-2xl shadow-lg hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:-translate-y-2 transition-all duration-300"
              >
                <div className="text-xl mb-3 drop-shadow-sm">{stat.icon}</div>
                <h3 className="text-2xl md:text-3xl font-black text-green-600 mb-1 tracking-tight drop-shadow-sm">{stat.val}</h3>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ENVIRONMENTAL IMPACT — Solid Dark Green
      ═══════════════════════════════════════════ */}
      <section className="py-20 md:py-24 px-6 md:px-20 bg-[#062c16]">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12" data-aos="fade-up">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#104325] rounded-full mb-4 shadow-[0_4px_14px_0_rgba(16,67,37,0.39)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Statewide Impact</span>
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-[2.75rem] font-black text-white tracking-tight leading-tight drop-shadow-lg">
                Our Environmental Impact
              </h2>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 bg-[#21432f] rounded-full self-start md:self-auto shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              <FaGlobeAsia className="text-emerald-400 text-sm animate-[spin_10s_linear_infinite] drop-shadow-sm" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                Live Data - {formatTime(lastUpdated)}
              </span>
            </div>
          </div>

          {/* 4 metric cards — Solid Dashboard style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <FaRecycle className="text-xl" />,
                label: "Waste Collected",
                end: 12450, suffix: "+", unit: "KG",
                desc: "Total across all panchayats",
                color: "text-emerald-500",
                bg: "bg-emerald-50",
                trend: "↑ 8.2%",
                trendColor: "text-emerald-600 bg-emerald-100/60",
              },
              {
                icon: <FaTruck className="text-xl" />,
                label: "Waste Recycled",
                end: 8320, suffix: "+", unit: "KG",
                desc: "Successfully processed material",
                color: "text-blue-500",
                bg: "bg-blue-50",
                trend: "↑ 12.4%",
                trendColor: "text-blue-600 bg-blue-100/60",
              },
              {
                icon: <FaGlobeAsia className="text-xl" />,
                label: "CO₂ Reduced",
                end: 5200, suffix: "+", unit: "KG",
                desc: "Carbon emissions prevented",
                color: "text-teal-500",
                bg: "bg-teal-50",
                trend: "↑ 5.1%",
                trendColor: "text-teal-600 bg-teal-100/60",
              },
              {
                icon: <FaUsers className="text-xl" />,
                label: "Communities",
                end: 120, suffix: "+", unit: "",
                desc: "Active participating panchayats",
                color: "text-indigo-500",
                bg: "bg-indigo-50",
                trend: "+3 this month",
                trendColor: "text-indigo-600 bg-indigo-100/60",
              },
            ].map((item, i) => (
              <div
                key={i}
                data-aos="fade-up"
                data-aos-delay={i * 100}
                className="group bg-white rounded-2xl p-6 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.4)] flex flex-col hover:-translate-y-2 hover:shadow-[0_30px_60px_-10px_rgba(0,0,0,0.6)] transition-all duration-300"
              >
                {/* Icon + trend */}
                <div className="flex items-start justify-between mb-8">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.bg} ${item.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                    {item.icon}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full ${item.trendColor} shadow-sm`}>
                    {item.trend}
                  </span>
                </div>

                {/* Big number */}
                <div className="mb-5">
                  <div className="text-3xl lg:text-[2rem] font-black text-[#101828] leading-none tracking-tight group-hover:text-emerald-700 transition-colors duration-300">
                    <Counter end={item.end} suffix={item.suffix} />
                  </div>
                  {item.unit && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 block">
                      {item.unit}
                    </span>
                  )}
                </div>

                {/* Label + desc */}
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <p className="text-xs font-bold text-[#101828] mb-1">{item.label}</p>
                  <p className="text-[11px] text-slate-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar — Solid Dark Container */}
          <div className="mt-8 p-7 md:p-8 bg-[#183925] rounded-2xl flex flex-col md:flex-row md:items-center gap-8 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)] hover:-translate-y-1 transition-all duration-300" data-aos="fade-up">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest drop-shadow-sm">2025 State-wide Target Progress</span>
                <span className="text-[11px] font-bold text-white drop-shadow-sm">84% Complete</span>
              </div>
              <div className="w-full h-2.5 bg-[#062c16] rounded-full overflow-hidden shadow-inner relative">
                <div className="absolute top-0 left-0 h-full bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.6)]" style={{ animation: 'loadProgress 2.5s ease-out forwards', width: '0%' }}>
                  <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]" />
                </div>
              </div>
              <div className="flex justify-between mt-3">
                <span className="text-[10px] text-emerald-100/70 font-semibold">12,450 kg collected</span>
                <span className="text-[10px] text-emerald-100/70 font-semibold">Goal: 15,000 kg</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 md:border-l md:border-[#21432f] md:pl-8">
              <div className="w-12 h-12 bg-[#21432f] rounded-xl flex items-center justify-center border border-[#2a553c] shadow-inner group cursor-default">
                <FaSeedling className="text-emerald-400 text-xl animate-[pulse_3s_ease-in-out_infinite] group-hover:scale-110 transition-transform drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
              </div>
              <div>
                <p className="text-lg font-black text-white drop-shadow-md">420 Trees Saved</p>
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5 drop-shadow-sm">Equivalent Impact</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HKS FEATURE SECTIONS — Light
      ═══════════════════════════════════════════ */}
      <section className="py-20 md:py-28 px-6 md:px-20 bg-slate-50 space-y-20 md:space-y-28">

        {/* Section label */}
        <div className="max-w-7xl mx-auto text-center" data-aos="fade-up">
          <span className="text-xs font-black text-green-600 uppercase tracking-widest">Our Workforce</span>
          <h2 className="text-3xl md:text-4xl font-black text-green-900 mt-3 tracking-tight drop-shadow-sm">
            The Haritha Karma Sena
          </h2>
          <div className="w-12 h-0.5 bg-green-600 mx-auto mt-4 rounded-full shadow-sm" />
        </div>

        {/* Feature 1 */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="w-full md:w-1/2" data-aos="fade-up">
            <div className="relative group">
              <div className="absolute -inset-3 bg-green-50 rounded-3xl group-hover:bg-green-100 transition-all duration-500 shadow-inner" />
              <img
                src="https://haritham.kerala.gov.in/upload/news/1718772802-hks.jpg"
                alt="Haritha Karma Sena members collecting waste"
                loading="lazy"
                className="relative w-full rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] group-hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] group-hover:-translate-y-2 transition-all duration-500"
              />
            </div>
          </div>
          <div className="w-full md:w-1/2" data-aos="fade-up" data-aos-delay="100">
            <span className="text-xs font-black text-green-600 uppercase tracking-widest">Community First</span>
            <h3 className="text-2xl md:text-4xl font-black text-green-900 mb-4 mt-3 tracking-tight leading-tight">
              Empowering Waste Warriors
            </h3>
            <div className="w-10 h-0.5 bg-green-500 mb-6 rounded-full shadow-sm" />
            <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-4">
              The Haritha Karma Sena (HKS) are frontline waste management workers actively engaged in scientific waste collection and segregation across Kerala.
            </p>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed">
              Supported by local self-government initiatives, these dedicated teams ensure door-to-door waste collection while creating livelihood opportunities.
            </p>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center gap-10 md:gap-16">
          <div className="w-full md:w-1/2" data-aos="fade-up">
            <div className="relative group">
              <div className="absolute -inset-3 bg-amber-50 rounded-3xl group-hover:bg-amber-100 transition-all duration-500 shadow-inner" />
              <img
                src="https://th-i.thgim.com/public/news/national/kerala/waqs07/article68560214.ece/alternates/LANDSCAPE_1200/Haritha%20Karma%20Sena.jpg"
                alt="Kerala local bodies showing waste management models"
                loading="lazy"
                className="relative w-full rounded-2xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] group-hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] group-hover:-translate-y-2 transition-all duration-500"
              />
            </div>
          </div>
          <div className="w-full md:w-1/2" data-aos="fade-up" data-aos-delay="100">
            <span className="text-xs font-black text-green-600 uppercase tracking-widest">Economic Impact</span>
            <h3 className="text-2xl md:text-4xl font-black text-green-900 mb-4 mt-3 tracking-tight leading-tight">
              Economic Empowerment
            </h3>
            <div className="w-10 h-0.5 bg-green-500 mb-6 rounded-full" />
            <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-4">
              In Amballur Panchayat, improved plastic waste segregation has significantly enhanced the earning potential of Haritha Karma Sena volunteers.
            </p>
            <p className="text-gray-400 text-base md:text-lg leading-relaxed">
              By ensuring cleaner and better-sorted materials, workers sell recyclables at higher values, strengthening both the environment and the economy.
            </p>
          </div>
        </div>
      </section>

      {/* --- SUB-COMPONENTS --- */}
      <About ref={aboutRef} />
      <Service ref={serviceRef} />
      <Gallery ref={GalleryRef} />
      <Contact ref={ContactRef} />
      <Footer />

      {/* --- SCROLL TO TOP BUTTON --- */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-24 right-6 z-[100] p-3.5 bg-green-600 text-white rounded-2xl shadow-2xl transition-all duration-500 transform hover:-translate-y-1 active:scale-90 border border-white/20 hover:bg-green-700 group ${showScroll ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20 pointer-events-none"}`}
      >
        <FaArrowUp className="text-lg" />
      </button>

      {/* --- CHATBOT --- */}
      <Chatbot />

      {/* Progress bar and particle animations */}
      <style>{`
        @keyframes loadProgress {
          from { width: 0%; }
          to { width: 84%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
});

export default Main;
