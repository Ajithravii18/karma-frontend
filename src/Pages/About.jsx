import React, { forwardRef } from 'react'

const About = forwardRef((props, ref) => {
  return (
    <div ref={ref}>
      <section className="bg-white py-20 md:py-28 px-6 md:px-20">
        <div className="max-w-6xl mx-auto">

          {/* Section heading */}
          <div className="text-center mb-14" data-aos="fade-up">
            <span className="text-xs font-black text-green-600 uppercase tracking-widest">Who We Are</span>
            <h2 className="text-3xl md:text-5xl font-black text-green-900 mt-3 mb-6 tracking-tight">
              About Us
            </h2>
            <div className="w-12 h-0.5 bg-green-600 mx-auto mb-8 rounded-full" />
            <p
              data-aos="fade-up"
              data-aos-delay="100"
              className="text-gray-500 max-w-3xl mx-auto text-base md:text-lg leading-relaxed"
            >
              We are committed to building cleaner and greener communities through
              efficient, sustainable, and technology-driven waste management solutions.
              Our mission is to promote responsible waste segregation, recycling,
              and environmental awareness while empowering local workers and
              strengthening community participation.
            </p>
          </div>

          {/* Cards grid */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">

            {/* Mission */}
            <div
              data-aos="fade-up"
              data-aos-delay="0"
              className="bg-white border border-slate-100 p-8 rounded-3xl shadow-lg shadow-slate-100/60 hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                🎯
              </div>
              <h3 className="text-lg font-black text-green-900 mb-3 tracking-tight">
                Our Mission
              </h3>
              <div className="w-8 h-0.5 bg-green-500 mb-4 rounded-full group-hover:w-16 transition-all duration-500" />
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                To ensure scientific waste collection, proper segregation,
                and sustainable disposal methods that reduce environmental impact.
              </p>
            </div>

            {/* Vision */}
            <div
              data-aos="fade-up"
              data-aos-delay="150"
              className="bg-white border border-slate-100 p-8 rounded-3xl shadow-lg shadow-slate-100/60 hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                🌍
              </div>
              <h3 className="text-lg font-black text-green-900 mb-3 tracking-tight">
                Our Vision
              </h3>
              <div className="w-8 h-0.5 bg-emerald-500 mb-4 rounded-full group-hover:w-16 transition-all duration-500" />
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                To create zero-waste communities where recycling,
                reuse, and environmental responsibility become everyday habits.
              </p>
            </div>

            {/* Commitment */}
            <div
              data-aos="fade-up"
              data-aos-delay="300"
              className="bg-white border border-slate-100 p-8 rounded-3xl shadow-lg shadow-slate-100/60 hover:-translate-y-2 transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-300">
                🤝
              </div>
              <h3 className="text-lg font-black text-green-900 mb-3 tracking-tight">
                Our Commitment
              </h3>
              <div className="w-8 h-0.5 bg-teal-500 mb-4 rounded-full group-hover:w-16 transition-all duration-500" />
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">
                We work closely with communities, local authorities,
                and environmental workers to ensure transparency,
                accountability, and long-term sustainability.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
});

export default About
