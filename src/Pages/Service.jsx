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
    <section className="relative py-24 bg-green-950 overflow-hidden" ref={ref}>
      {/* Background Image integration */}
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `url(${hero})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      ></div>

      {/* Hero-style Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-green-950 via-green-950/90 to-green-950"></div>

      <div className="relative z-20 max-w-7xl mx-auto px-6">
        {/* Section Heading */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6" data-aos="fade-up">
            Our Premium Services
          </h2>
          <div className="w-20 h-1.5 bg-green-500 mx-auto rounded-full mb-8" data-aos="fade-up" data-aos-delay="100"></div>
          <p className="mt-4 text-green-200/70 text-base md:text-lg max-w-2xl mx-auto leading-relaxed" data-aos="fade-up" data-aos-delay="200">
            Intelligent, technology-driven solutions for modern waste management, 
            environmental protection, and community welfare.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {services.map((service, index) => (
            <div
              key={index}
              className="group bg-white/5 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-white/10 hover:bg-white/10 hover:border-green-500/30 transition-all duration-500 flex flex-col"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="text-3xl md:text-4xl text-green-400 mb-6 group-hover:scale-110 group-hover:text-green-300 transition-all duration-500">
                {service.icon}
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight group-hover:text-green-100 transition-colors">
                {service.title}
              </h3>
              <p className="text-green-100/60 text-sm md:text-base leading-relaxed mb-8 flex-grow">
                {service.desc}
              </p>
              <div className="w-12 h-1.5 bg-green-500/20 group-hover:w-full group-hover:bg-green-500/40 transition-all duration-700 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default Services;
