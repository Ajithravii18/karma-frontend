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
import { FaArrowUp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"

const Main = forwardRef((props, ref) => {
  const navigate = useNavigate()

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
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
    const userRole = localStorage.getItem("userRole"); // Assuming you store "user", "volunteer", or "admin"

    if (!token) {
      toast.error("Please login to continue");
      setTimeout(() => navigate("/login"), 1000);
      return;
    }

    // Check if the user is a regular "user"
    if (userRole === "user") {
      navigate("/pick-up");
    } else {
      // If they are Admin or Volunteer, block the action
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

            // Get Weather from Open-Meteo (Free, No Key)
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const weatherJson = await weatherRes.json();

            if (weatherJson.current_weather) {
              setWeather({
                temp: Math.round(weatherJson.current_weather.temperature),
                code: weatherJson.current_weather.weathercode,
                condition: getWeatherLabel(weatherJson.current_weather.weathercode)
              });
            }

            // Get City Name from BigDataCloud (Free, No Key required for basic reverse geocoding)
            const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
            const geoJson = await geoRes.json();
            if (geoJson.city || geoJson.locality) {
              setLocInfo(`${geoJson.city || geoJson.locality}, ${geoJson.principalSubdivisionCode?.split('-').pop() || "Kerala"}`);
            }
            setIsLiveLoading(false);
          }, () => {
            setIsLiveLoading(false); // Silent fail uses defaults
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

  return (
    <div className="bg-slate-50 overflow-x-hidden">
      <Nav
        onHomeClick={scrollToHome}
        onAboutClick={scrollToAbout}
        onServiceClick={scrollToService}
        onContactClick={scrollToContact}
        onGalleryClick={scrollToGallery}
      />

      {/* --- HERO SECTION --- */}
      <section
        ref={homeRef}
        className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-green-950 pt-24 md:pt-32 pb-12 md:pb-20"
      >
        {/* Background Image with improved visibility */}
        <div
          className="absolute inset-0 z-0 opacity-55"
          style={{
            backgroundImage: `url(${hero})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>

        {/* Adjusted Gradient Overlay for better image visibility */}
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-green-950 via-green-950/70 to-green-900/30"></div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 text-white space-y-6 pl-2">
            <div data-aos="fade-down" className="inline-flex items-center gap-2.5 px-4 py-1.5 bg-white/5 backdrop-blur-md rounded-lg text-green-400 text-[10px] font-medium tracking-[0.25em] uppercase border border-white/5 shadow-inner">
              <span className="relative flex h-2 w-2 mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Sustainable Future Initiative
            </div>

            <h1 data-aos="fade-right" data-aos-delay="100" className="text-3xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tighter">
              മാലിന്യം കുറയ്ക്കാം<br />
              <span className="text-green-500">പ്രകൃതിയെ സംരക്ഷിക്കാം.</span>
            </h1>

            <p data-aos="fade-right" data-aos-delay="200" className="text-base md:text-lg text-gray-300 max-w-xl leading-relaxed font-medium">
              Building a cleaner, greener tomorrow through community-driven waste management. Our mission is to restore Kerala's natural beauty.
            </p>

            <div data-aos="fade-right" data-aos-delay="300" className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={handleScheduleClick}
                className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-900/40 hover:-translate-y-1 active:scale-95 flex items-center gap-2 text-sm"
              >
                Schedule Pickup
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <button
                onClick={scrollToAbout}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-bold transition-all text-sm"
              >
                Learn More
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 mt-10 lg:mt-0" data-aos="fade-left" data-aos-delay="400">
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl space-y-6 relative overflow-hidden max-w-sm mx-auto lg:ml-auto lg:mr-0">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 -mr-12 -mt-12 rounded-full"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl shadow-inner group">
                      <span className="group-hover:rotate-12 transition-transform">{weather.temp > 30 ? "☀️" : weather.temp > 20 ? "⛅" : "🌧️"}</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-green-900 text-lg leading-none">{weather.temp}°C</h4>
                      <p className="text-green-600 font-bold text-[10px] uppercase tracking-widest mt-1.5">{weather.condition}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end text-green-900 font-black text-[10px] uppercase tracking-tighter">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      Live: {locInfo}
                    </div>
                    <p className="text-gray-400 font-bold text-[9px] mt-1">Air Quality: <span className="text-emerald-500">Good</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-sm shadow-sm">📊</div>
                  <div>
                    <h5 className="font-black text-gray-800 text-sm tracking-tight">Mission Stats</h5>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Real-time Impacts</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {[
                    { label: "Eco Points", end: 2400, suffix: "+", color: "text-green-600", bg: "bg-green-50" },
                    { label: "Volunteers", end: 850, suffix: "+", color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Trash Clear", end: 12, suffix: "t", color: "text-green-700", bg: "bg-green-50" },
                    { label: "Trees Saved", end: 420, suffix: "", color: "text-emerald-700", bg: "bg-emerald-50" }
                  ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} p-3 md:p-4 rounded-xl border border-transparent`}>
                      <p className="text-gray-500 text-[8px] md:text-[9px] font-black mb-1 uppercase tracking-widest">{stat.label}</p>
                      <h5 className={`text-base md:text-lg font-black ${stat.color}`}>
                        <Counter end={stat.end} suffix={stat.suffix} />
                      </h5>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-600 font-bold uppercase">Progress</span>
                    <span className="text-green-600 font-black">
                      <Counter end={84} suffix="%" />
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full bg-green-600 rounded-full shadow-lg transition-all duration-[2000ms] ease-out"
                      style={{
                        width: '0%',
                        animation: 'loadProgress 2s ease-out forwards'
                      }}
                    ></div>
                    <style>{`
                      @keyframes loadProgress {
                        from { width: 0%; }
                        to { width: 84%; }
                      }
                      @keyframes bounce-subtle {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-3px); }
                      }
                      .animate-bounce-subtle {
                        animation: bounce-subtle 1.5s infinite;
                      }
                    `}</style>
                  </div>
                </div>
              </div>
            </div>

            {/* --- CONDENSED MARQUEE --- */}
            <div className="mt-8 overflow-hidden max-w-sm mx-auto lg:ml-auto lg:mr-0">
              <div className="animate-marquee whitespace-nowrap flex items-center gap-12 text-white/60 text-[9px] font-thin uppercase tracking-[.5em] select-none">
                <span>Clean Kerala • Life Impact • Zero Waste • Restore Nature • Bio-Management • Future Focus • </span>
                <span aria-hidden="true">Clean Kerala • Life Impact • Zero Waste • Restore Nature • Bio-Management • Future Focus • </span>
              </div>
            </div>
          </div>
        </div>


        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 animate-bounce cursor-pointer opacity-70 hover:opacity-100 transition-opacity" onClick={scrollToAbout}>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      </section>

      {/* --- RESPONSIBILITY SECTION --- */}
      <section className="py-16 md:py-24 px-6 md:px-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 md:gap-20 items-center">
          <div data-aos="fade-right">
            <span className="text-green-600 font-bold tracking-widest uppercase text-xs md:text-sm">Our Philosophy</span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-green-900 mt-4 mb-6 leading-tight">
              Waste Management is Not a Choice — It’s a Responsibility
            </h2>
            <div className="w-16 md:w-20 h-1.5 bg-green-600 mb-8 rounded-full"></div>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-6">
              Effective waste management protects our environment, improves public health, and promotes sustainable development.
            </p>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed">
              Proper segregation and recycling reduce landfill waste and create livelihood opportunities for communities.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {[
              { val: "2.24B+", desc: "Annual Global Waste" },
              { val: "40%", desc: "Improperly Managed" },
              { val: "70%", desc: "Recyclable Potential" },
              { val: "100%", desc: "Cleaner Cities Goal" }
            ].map((stat, i) => (
              <div key={i} data-aos="zoom-in" data-aos-delay={i * 100} className="bg-white p-5 md:p-8 rounded-3xl shadow-xl shadow-green-100/30 border border-gray-50 hover:-translate-y-2 transition-all">
                <h3 className="text-xl md:text-2xl font-black text-green-600 mb-1">{stat.val}</h3>
                <p className="text-gray-500 text-[10px] md:text-sm font-medium">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- IMPACT COUNTER SECTION --- */}
      <section className="relative bg-green-950 py-16 md:py-24 text-white overflow-hidden">
        {/* Background Image integration */}
        <div
          className="absolute inset-0 z-0 opacity-40"
          style={{
            backgroundImage: `url(${hero})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        ></div>

        {/* Hero-style Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-green-950/90 via-green-900/80 to-green-950/90"></div>

        <div className="relative z-20 max-w-7xl mx-auto px-6">
          <div className="text-center mb-12 md:text-center md:mb-16">
            <h2 className="text-3xl md:text-5xl font-bold">Our Environmental Impact</h2>
            <p className="text-green-200 mt-4 text-base md:text-lg">Measuring our commitment towards sustainability.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {[
              { icon: "♻️", label: "Waste Collected", end: 12450 },
              { icon: "🔄", label: "Waste Recycled", end: 8320 },
              { icon: "🌍", label: "CO₂ Reduced", end: 5200 },
              { icon: "🏘️", label: "Communities", end: 120 }
            ].map((item, i) => (
              <div 
                key={i} 
                data-aos="fade-up" 
                data-aos-delay={i * 100}
                className="bg-white/10 backdrop-blur-md p-6 md:p-10 rounded-2xl md:rounded-3xl border border-white/10 text-center"
              >
                <div className="text-3xl md:text-4xl mb-3 md:mb-4">{item.icon}</div>
                <h3 className="text-2xl md:text-4xl font-black"><Counter end={item.end} suffix="+" /></h3>
                <p className="text-green-300 text-xs md:text-lg font-medium mt-2">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURE SECTIONS (HKS) --- */}
      <section className="py-16 md:py-24 px-6 md:px-20 space-y-20 md:space-y-32">
        {/* Section 1 */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="w-full md:w-1/2" data-aos="fade-right">
            <div className="relative group">
              <div className="absolute -inset-4 bg-green-100 rounded-3xl group-hover:bg-green-200 transition-all"></div>
              <img
                src="https://haritham.kerala.gov.in/upload/news/1718772802-hks.jpg"
                alt="Haritha Karma Sena members collecting waste"
                loading="lazy"
                className="relative w-full rounded-2xl shadow-2xl transform transition duration-500"
              />
            </div>
          </div>
          <div className="w-full md:w-1/2" data-aos="fade-left">
            <h3 className="text-2xl md:text-4xl font-bold text-green-900 mb-6">Empowering Waste Warriors</h3>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed">
              The Haritha Karma Sena (HKS) are frontline waste management workers actively engaged in scientific waste collection and segregation across Kerala.
            </p>
            <p className="mt-4 text-gray-600 text-base md:text-lg leading-relaxed">
              Supported by local self-government initiatives, these dedicated teams ensure door-to-door waste collection while creating livelihood opportunities.
            </p>
          </div>
        </div>

        {/* Section 2 */}
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center gap-10 md:gap-16">
          <div className="w-full md:w-1/2" data-aos="fade-left">
            <div className="relative group">
              <div className="absolute -inset-4 bg-yellow-100 rounded-3xl group-hover:bg-yellow-200 transition-all"></div>
              <img
                src="https://th-i.thgim.com/public/news/national/kerala/waqs07/article68560214.ece/alternates/LANDSCAPE_1200/Haritha%20Karma%20Sena.jpg"
                alt="Kerala local bodies showing waste management models"
                loading="lazy"
                className="relative w-full rounded-2xl shadow-2xl transform transition duration-500"
              />
            </div>
          </div>
          <div className="w-full md:w-1/2" data-aos="fade-right">
            <h3 className="text-2xl md:text-4xl font-bold text-green-900 mb-6">Economic Empowerment</h3>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed mb-4">
              In Amballur Panchayat, improved plastic waste segregation has significantly enhanced the earning potential of Haritha Karma Sena volunteers.
            </p>
            <p className="text-gray-600 text-base md:text-lg leading-relaxed">
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
        className={`fixed bottom-24 right-8 z-[100] p-4 bg-green-600 text-white rounded-2xl shadow-2xl transition-all duration-500 transform hover:-translate-y-2 active:scale-90 border border-white/20 hover:bg-slate-900 group ${showScroll ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20 pointer-events-none"}`}
      >
        <FaArrowUp className="text-xl group-hover:animate-bounce-subtle" />
      </button>

      {/* --- CHATBOT --- */}
      <Chatbot />
    </div >
  );
});

export default Main;