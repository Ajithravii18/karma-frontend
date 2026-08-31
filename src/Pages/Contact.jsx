import React, { forwardRef } from 'react'

const Contact = forwardRef((props, ref) => {
  const contacts = [
    {
      emoji: "👷",
      title: "Volunteer Support",
      phone: "+91 98765 43210",
      email: "volunteer@wastemanage.in",
      desc: "For joining programs, training details, and community initiatives.",
      accentColor: "bg-emerald-50 border-emerald-100",
      iconBg: "bg-emerald-50 border-emerald-100",
      accent: "bg-emerald-500"
    },
    {
      emoji: "🚛",
      title: "Waste Collection Agent",
      phone: "+91 91234 56789",
      email: "collection@wastemanage.in",
      desc: "For pickup scheduling, complaints, and collection services.",
      accentColor: "bg-white border-slate-100",
      iconBg: "bg-blue-50 border-blue-100",
      accent: "bg-blue-500"
    },
    {
      emoji: "🏢",
      title: "Administrator",
      phone: "+91 90000 11122",
      email: "admin@wastemanage.in",
      desc: "For official inquiries, policy matters, and partnerships.",
      accentColor: "bg-white border-slate-100",
      iconBg: "bg-purple-50 border-purple-100",
      accent: "bg-purple-500"
    }
  ];

  return (
    <div ref={ref}>
      <section className="bg-white py-20 md:py-28 px-6 md:px-20">
        <div className="max-w-6xl mx-auto">

          {/* Heading */}
          <div className="text-center mb-14">
            <span className="text-xs font-black text-green-600 uppercase tracking-widest" data-aos="fade-up">
              Get In Touch
            </span>
            <h2
              data-aos="fade-up"
              data-aos-delay="100"
              className="text-3xl md:text-5xl font-black text-green-900 mt-3 mb-4 tracking-tight"
            >
              Contact Us
            </h2>
            <div className="w-12 h-0.5 bg-green-600 mx-auto rounded-full mb-6" data-aos="fade-up" data-aos-delay="100" />
            <p
              data-aos="fade-up"
              data-aos-delay="200"
              className="text-gray-400 mt-2 text-base md:text-lg leading-relaxed max-w-xl mx-auto"
            >
              Reach out to the right department for faster assistance.
            </p>
          </div>

          {/* Contact cards */}
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {contacts.map((c, i) => (
              <div
                key={i}
                data-aos="fade-up"
                data-aos-delay={i * 120}
                className="bg-white border border-slate-100 p-7 md:p-8 rounded-3xl shadow-lg shadow-slate-100/60 hover:-translate-y-2 transition-all duration-300 group flex flex-col"
              >
                {/* Icon badge */}
                <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {c.emoji}
                </div>

                <h3 className="text-base font-black text-green-900 mb-3 tracking-tight">
                  {c.title}
                </h3>
                <div className="w-8 h-0.5 bg-green-500 mb-5 rounded-full group-hover:w-16 transition-all duration-500" />

                <div className="space-y-2 flex-grow">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <span className="text-base">📞</span>
                    <span className="font-semibold">{c.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <span className="text-base">📧</span>
                    <span className="font-semibold truncate">{c.email}</span>
                  </div>
                </div>

                <p className="text-gray-400 text-xs leading-relaxed mt-5 pt-5 border-t border-slate-100">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>
    </div>
  )
});

export default Contact
