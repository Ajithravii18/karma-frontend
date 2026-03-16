import React, { forwardRef, useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaExternalLinkAlt } from "react-icons/fa";

const Gallery = forwardRef((props, ref) => {
  const photos = [
    {
      src: "https://static.toiimg.com/photo/123222225.cms",
      title: "Model Management",
      desc: "Haritha Karma Sena members in Edakkattuvayal Panchayat become a model for waste management.",
      links: "https://timesofindia.indiatimes.com/city/kochi/haritha-karma-sena-of-edakkattuvayal-panchayat-becomes-a-model-in-solid-waste-management/articleshow/123222225.cms"
    },
    {
      src: "https://haritham.kerala.gov.in/upload/news/1718772802-hks.jpg",
      title: "Livelihood Efforts",
      desc: "Several panchayats support livelihood efforts for workers through systematic collection.",
      links: "https://prdlive.kerala.gov.in/news/378454"
    },
    {
      src: "https://sbmgramin.wordpress.com/wp-content/uploads/2022/09/kerala-water4.jpg",
      title: "Income Growth",
      desc: "Proper sorting boosts recyclability and income for workers across Kerala panchayats.",
      links: "https://keralacalling.kerala.gov.in/unique-yet-universal/"
    },
    {
      src: "https://images.unsplash.com/photo-1604187351574-c75ca79f5807",
      title: "Smart Systems",
      desc: "HKS work connects households with recycling systems, reducing landfill waste significantly.",
      links: "https://timesofindia.indiatimes.com/city/kochi/local-bodies-in-kochi-show-the-way-in-solid-waste-management/articleshow/80679981.cms"
    },
    {
      src: "https://sbmgramin.wordpress.com/wp-content/uploads/2022/09/image-3.png",
      title: "Clean Drives",
      desc: "Active participation in community clean drives supported by dedicated HKS volunteers.",
      links: "#"
    },
    {
      src: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9",
      title: "Zero-Waste Goals",
      desc: "Continued efforts in recycling help strengthen zero-waste goals across the state.",
      links: "#"
    }
  ];

  return (
    <section ref={ref} className="bg-white py-20 px-6 md:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-green-900 mb-4" data-aos="fade-up">
            Highlights in Action
          </h2>
          <div className="w-20 h-1.5 bg-green-600 mx-auto rounded-full mb-6" data-aos="fade-up"></div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
            Real examples of how waste collection, segregation, and recycling are transforming communities across Kerala.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {photos.map((photo, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl shadow-lg overflow-hidden border-t-4 border-green-600 hover:shadow-2xl transition-all duration-300 group flex flex-col"
              data-aos="zoom-in"
              data-aos-delay={index * 100}
            >
              <div className="relative overflow-hidden h-64">
                <img
                  src={photo.src}
                  alt={`${photo.title} - Haritha Karma Sena in Kerala`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow text-center">
                <h3 className="text-xl font-bold text-green-900 mb-2">{photo.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-grow">
                  {photo.desc}
                </p>
                {photo.links !== "#" && (
                  <a
                    href={photo.links}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 underline font-semibold text-sm hover:text-green-800 transition-colors"
                  >
                    Read More
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

export default Gallery;
