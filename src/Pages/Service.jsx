import { forwardRef } from "react";
import { FaRecycle, FaLeaf, FaMapMarkedAlt, FaUtensils, FaChartBar, FaBell } from "react-icons/fa";
import hero from '../assets/hero.jpg'

const Services = forwardRef((props, ref) => {
  const services = [
    {
      icon: <FaRecycle />,
      title: "Smart Waste Collection",
      desc: "Schedule door-to-door waste pickup, track collection status in real-time, and make secure online payments with full transparency.",
    },
    {
      icon: <FaLeaf />,
      title: "Waste Segregation",
      desc: "Categorize waste into biodegradable, non-biodegradable, plastic, and e-waste to promote responsible disposal and sustainability.",
    },
    {
      icon: <FaMapMarkedAlt />,
      title: "Pollution Reporting",
      desc: "Report illegal dumping or polluted areas with image and live location for faster action by authorities.",
    },
    {
      icon: <FaUtensils />,
      title: "Food Sharing Platform",
      desc: "List surplus edible food and allow NGOs or volunteers to collect and distribute it to the needy.",
    },
    {
      icon: <FaChartBar />,
      title: "Admin Dashboard",
      desc: "Comprehensive dashboard to manage users, workers, complaints, payments, and monitor service efficiency.",
    },
    {
      icon: <FaBell />,
      title: "Real-Time Notifications",
      desc: "Automated alerts for pickup schedules, complaint updates, and food availability.",
    },
  ];

  return (
    <section className="relative py-20 md:py-28 bg-green-950 overflow-hidden" ref={ref}>
      {/* Background image */}
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `url(${hero})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-green-950 via-green-950/90 to-green-950" />

      <div className="relative z-20 max-w-7xl mx-auto px-6">

        {/* Section heading */}
        <div className="text-center mb-16 md:mb-20">
          <span className="text-xs font-black text-green-400 uppercase tracking-widest" data-aos="fade-up">
            What We Offer
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white mt-3 mb-6 tracking-tight" data-aos="fade-up" data-aos-delay="100">
            Our Services
          </h2>
          <div className="w-16 h-1 bg-green-500 mx-auto rounded-full mb-8" data-aos="fade-up" data-aos-delay="100" />
          <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium" data-aos="fade-up" data-aos-delay="200">
            Intelligent, technology-driven solutions for modern waste management,
            environmental protection, and community welfare.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-3xl overflow-hidden border border-white/8">
          {services.map((service, index) => (
            <div
              key={index}
              className="group p-7 md:p-8 transition-all duration-500 flex flex-col bg-green-950 hover:bg-white/5"
              data-aos="fade-up"
              data-aos-delay={index * 80}
            >
              {/* Icon */}
              <div className="text-2xl md:text-3xl text-green-400 mb-5 group-hover:scale-110 group-hover:text-green-300 transition-all duration-400 w-fit">
                {service.icon}
              </div>

              <h3 className="text-lg md:text-xl font-black text-white mb-3 tracking-tight group-hover:text-green-100 transition-colors">
                {service.title}
              </h3>

              <p className="text-white/45 text-sm md:text-base leading-relaxed mb-6 flex-grow">
                {service.desc}
              </p>

              {/* Animated accent line */}
              <div className="w-10 h-0.5 bg-green-500/30 group-hover:w-full group-hover:bg-green-500/60 transition-all duration-700 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default Services;
