import React from "react";

const Footer = () => {
  return (
    <footer className="bg-[#0F3D2E] text-white pt-16 pb-8 px-6 md:px-20">
      
      <div className="grid md:grid-cols-4 gap-10 max-w-7xl mx-auto">
        
        {/* About */}
        <div className="flex flex-col">
          <h3 className="text-2xl font-bold mb-1">E - Karma</h3>
          <h1 className="text-xl font-bold mb-4">Waste Management System</h1>
          <p className="text-gray-300 text-sm leading-relaxed">
            Dedicated to sustainable waste management, recycling initiatives,
            and community cleanliness programs across Kerala. Together we
            build a greener tomorrow.
          </p>
        </div>

        {/* Empty space for better alignment on larger screens */}
        <div className="hidden md:block"></div>

        {/* Services */}
        <div className="flex flex-col">
          <h4 className="text-lg font-semibold mb-4">Our Services</h4>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>Door-to-Door Waste Collection</li>
            <li>Plastic Waste Segregation</li>
            <li>Recycling Support</li>
            <li>Clean Drive Campaigns</li>
            <li>Community Awareness Programs</li>
          </ul>
        </div>

        {/* Contact */}
        <div className="flex flex-col">
          <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>Email: support@harithakarmasena.in</li>
            <li>Phone: +91 98765 43210</li>
            <li>Kerala, India</li>
          </ul>

          {/* Social Icons */}
          <div className="flex gap-4 mt-4">
            <a href="#" className="hover:text-green-400 transition">Facebook</a>
            <a href="#" className="hover:text-green-400 transition">Instagram</a>
            <a href="#" className="hover:text-green-400 transition">Twitter</a>
          </div>
        </div>

      </div>

      {/* Bottom Line */}
      <div className="border-t border-gray-600 mt-12 pt-6 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} E - Karma. All rights reserved.
      </div>

    </footer>
  );
};

export default Footer;
