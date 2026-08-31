import React from "react";

const Footer = () => {
  const year = new Date().getFullYear();

  const services = [
    { icon: "♻️", label: "Door-to-Door Waste Collection" },
    { icon: "🗂️", label: "Plastic Waste Segregation" },
    { icon: "🔄", label: "Recycling Support" },
    { icon: "🧹", label: "Clean Drive Campaigns" },
    { icon: "📢", label: "Community Awareness Programs" },
  ];

  return (
    <footer className="bg-green-950 text-white pt-16 pb-8 px-6 md:px-20">

      <div className="grid md:grid-cols-4 gap-10 max-w-7xl mx-auto">

        {/* Brand */}
        <div className="flex flex-col md:col-span-1">
          <div className="mb-5">
            <h2 className="text-xl font-black tracking-tight uppercase">E-Karma</h2>
            <p className="text-green-400 text-[10px] font-black uppercase tracking-widest mt-1">
              Waste Management System
            </p>
          </div>
          <div className="w-10 h-0.5 bg-green-500 mb-5 rounded-full" />
          <p className="text-white/50 text-sm leading-relaxed">
            Dedicated to sustainable waste management, recycling initiatives,
            and community cleanliness programs across Kerala. Together we
            build a greener tomorrow.
          </p>
        </div>

        {/* Spacer on md+ */}
        <div className="hidden md:block" />

        {/* Services */}
        <div className="flex flex-col">
          <h4 className="text-xs font-black uppercase tracking-widest text-white/60 mb-5">Our Services</h4>
          <ul className="space-y-3">
            {services.map((s, i) => (
              <li key={i} className="flex items-center gap-2.5 text-white/60 text-sm hover:text-white transition-colors cursor-default">
                <span className="text-base">{s.icon}</span>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="flex flex-col">
          <h4 className="text-xs font-black uppercase tracking-widest text-white/60 mb-5">Contact Us</h4>
          <ul className="space-y-3 text-white/60 text-sm">
            <li className="flex items-center gap-2.5">
              <span>📧</span>
              <span>support@harithakarmasena.in</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span>📞</span>
              <span>+91 98765 43210</span>
            </li>
            <li className="flex items-center gap-2.5">
              <span>📍</span>
              <span>Kerala, India</span>
            </li>
          </ul>

          {/* Social links */}
          <div className="flex gap-3 mt-6">
            {[
              { label: "FB", href: "#" },
              { label: "IG", href: "#" },
              { label: "TW", href: "#" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="w-8 h-8 bg-white/8 hover:bg-green-600 border border-white/10 rounded-xl flex items-center justify-center text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all duration-300"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 mt-14 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-white/35 text-xs font-semibold">
        <span>© {year} E-Karma. All rights reserved.</span>
        <span className="text-white/20">Built for a cleaner Kerala 🌿</span>
      </div>

    </footer>
  );
};

export default Footer;
