import React, { forwardRef } from 'react'

const About = forwardRef((props, ref) => {
  return (
    <div ref={ref}>
        <section className="bg-white py-20 px-6 md:px-20">
  <div className="max-w-6xl mx-auto text-center">

    {/* Section Heading */}
    <h2 
      data-aos="fade-up"
      className="text-4xl font-bold text-[#1B5E20] mb-6"
    >
      About Us
    </h2>

    <p 
      data-aos="fade-up"
      data-aos-delay="200"
      className="text-gray-600 max-w-3xl mx-auto text-lg leading-relaxed"
    >
      We are committed to building cleaner and greener communities through
      efficient, sustainable, and technology-driven waste management solutions.
      Our mission is to promote responsible waste segregation, recycling,
      and environmental awareness while empowering local workers and
      strengthening community participation.
    </p>

  </div>

  {/* Content Grid */}
  <div className="grid md:grid-cols-3 gap-10 mt-16 max-w-6xl mx-auto">

    {/* Mission */}
    <div 
      data-aos="fade-up"
      className="bg-[#F5F7F8] p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300"
    >
      <div className="text-4xl mb-4">🎯</div>
      <h3 className="text-xl font-semibold text-[#1B5E20] mb-3">
        Our Mission
      </h3>
      <p className="text-gray-600">
        To ensure scientific waste collection, proper segregation,
        and sustainable disposal methods that reduce environmental impact.
      </p>
    </div>

    {/* Vision */}
    <div 
      data-aos="fade-up"
      data-aos-delay="200"
      className="bg-[#F5F7F8] p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300"
    >
      <div className="text-4xl mb-4">🌍</div>
      <h3 className="text-xl font-semibold text-[#1B5E20] mb-3">
        Our Vision
      </h3>
      <p className="text-gray-600">
        To create zero-waste communities where recycling,
        reuse, and environmental responsibility become everyday habits.
      </p>
    </div>

    {/* Commitment */}
    <div 
      data-aos="fade-up"
      data-aos-delay="400"
      className="bg-[#F5F7F8] p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300"
    >
      <div className="text-4xl mb-4">🤝</div>
      <h3 className="text-xl font-semibold text-[#1B5E20] mb-3">
        Our Commitment
      </h3>
      <p className="text-gray-600">
        We work closely with communities, local authorities,
        and environmental workers to ensure transparency,
        accountability, and long-term sustainability.
      </p>
    </div>

  </div>
</section>

    </div>
  )
});

export default About