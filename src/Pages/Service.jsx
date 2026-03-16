import { forwardRef } from "react";
import { FaRecycle, FaLeaf, FaMapMarkedAlt, FaUtensils, FaChartBar, FaBell } from "react-icons/fa";

const Services = forwardRef((props, ref) => {
  const services = [
    {
      icon: <FaRecycle size={40} />,
      title: "Smart Waste Collection",
      desc: "Schedule door-to-door waste pickup, track collection status in real-time, and make secure online payments with full transparency.",
    },
    {
      icon: <FaLeaf size={40} />,
      title: "Waste Segregation",
      desc: "Categorize waste into biodegradable, non-biodegradable, plastic, and e-waste to promote responsible disposal and sustainability.",
    },
    {
      icon: <FaMapMarkedAlt size={40} />,
      title: "Pollution Reporting",
      desc: "Report illegal dumping or polluted areas with image and live location for faster action by authorities.",
    },
    {
      icon: <FaUtensils size={40} />,
      title: "Food Sharing Platform",
      desc: "List surplus edible food and allow NGOs or volunteers to collect and distribute it to the needy.",
    },
    {
      icon: <FaChartBar size={40} />,
      title: "Admin Dashboard",
      desc: "Comprehensive dashboard to manage users, workers, complaints, payments, and monitor service efficiency.",
    },
    {
      icon: <FaBell size={40} />,
      title: "Real-Time Notifications",
      desc: "Automated alerts for pickup schedules, complaint updates, and food availability.",
    },
  ];

  return (
    <section className="py-20 bg-gray-50" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-800">Our Services</h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Smart solutions for waste management, pollution control, and food sharing
            to build a cleaner and more sustainable community.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-t-4 border-green-600 group flex flex-col"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="text-green-700 mb-6 group-hover:scale-110 transition-transform duration-300">{service.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">{service.title}</h3>
              <p className="text-gray-600 leading-relaxed mb-6 flex-grow">{service.desc}</p>
              <div className="w-10 h-1 bg-green-100 group-hover:w-full transition-all duration-500 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default Services;
