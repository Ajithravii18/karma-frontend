import React, { forwardRef } from 'react'

const Contact = forwardRef((props, ref) => {
  return (
    <div ref={ref}>
        <section className="bg-[#F5F7F8] py-20 px-6 md:px-20">
  <div className="max-w-6xl mx-auto">

    {/* Heading */}
    <div className="text-center mb-16">
      <h2 
        data-aos="fade-up"
        className="text-4xl font-bold text-[#1B5E20]"
      >
        Contact Us
      </h2>
      <p 
        data-aos="fade-up"
        data-aos-delay="200"
        className="text-gray-600 mt-4 text-lg"
      >
        Reach out to the right department for faster assistance.
      </p>
    </div>

    {/* Contact Cards */}
    <div className="grid md:grid-cols-3 gap-10">

      {/* Volunteer Contact */}
      <div 
        data-aos="fade-up"
        className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300"
      >
        <div className="text-4xl mb-4">👷</div>
        <h3 className="text-xl font-semibold text-[#1B5E20] mb-4">
          Volunteer Support
        </h3>
        <p className="text-gray-600 mb-2">
          📞 +91 98765 43210
        </p>
        <p className="text-gray-600 mb-2">
          📧 volunteer@wastemanage.in
        </p>
        <p className="text-gray-500 text-sm">
          For joining programs, training details, and community initiatives.
        </p>
      </div>

      {/* Waste Collection Agent */}
      <div 
        data-aos="fade-up"
        data-aos-delay="200"
        className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300"
      >
        <div className="text-4xl mb-4">🚛</div>
        <h3 className="text-xl font-semibold text-[#1B5E20] mb-4">
          Waste Collection Agent
        </h3>
        <p className="text-gray-600 mb-2">
          📞 +91 91234 56789
        </p>
        <p className="text-gray-600 mb-2">
          📧 collection@wastemanage.in
        </p>
        <p className="text-gray-500 text-sm">
          For pickup scheduling, complaints, and collection services.
        </p>
      </div>

      {/* Administrator */}
      <div 
        data-aos="fade-up"
        data-aos-delay="400"
        className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition duration-300"
      >
        <div className="text-4xl mb-4">🏢</div>
        <h3 className="text-xl font-semibold text-[#1B5E20] mb-4">
          Administrator
        </h3>
        <p className="text-gray-600 mb-2">
          📞 +91 90000 11122
        </p>
        <p className="text-gray-600 mb-2">
          📧 admin@wastemanage.in
        </p>
        <p className="text-gray-500 text-sm">
          For official inquiries, policy matters, and partnerships.
        </p>
      </div>

    </div>

  </div>
</section>

    </div>
  )
});

export default Contact 