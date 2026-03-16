import React, { forwardRef, useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaExternalLinkAlt } from "react-icons/fa";

const Gallery = forwardRef((props, ref) => {
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  // Helper to get visible photos for infinite effect
  const getVisiblePhotos = () => {
    const total = photos.length;
    const items = [];
    for (let i = 0; i < total + 3; i++) {
      items.push(photos[(currentIndex + i) % total]);
    }
    return items;
  };

  return (
    <section ref={ref} className="bg-gray-50 py-20 px-6 md:px-20 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-green-900 mb-4" data-aos="fade-up">
            Highlights in Action
          </h2>
          <div className="w-20 h-1.5 bg-green-600 mx-auto rounded-full mb-6" data-aos="fade-up"></div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="100">
            Showcasing the transformative impact of waste management across Kerala's communities.
          </p>
        </div>

        <div className="relative group/carousel">
          {/* Main Carousel Wrapper */}
          <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(0%)` }}>
            {getVisiblePhotos().map((photo, index) => (
              <div 
                key={`${currentIndex}-${index}`}
                className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-4"
              >
                <div 
                  className="bg-white rounded-2xl shadow-xl overflow-hidden border-t-4 border-green-600 hover:shadow-2xl transition-all duration-300 group h-full flex flex-col"
                  data-aos="fade-up"
                  data-aos-delay={(index % 3) * 100}
                >
                  <div className="relative overflow-hidden h-60">
                    <img
                      src={photo.src}
                      alt={`${photo.title} - Haritha Karma Sena in Kerala`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-green-900/10 group-hover:bg-transparent transition-colors"></div>
                  </div>
                  <div className="p-8 flex flex-col flex-grow">
                    <h3 className="text-xl font-bold text-green-900 mb-3">{photo.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-grow">
                      {photo.desc}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <a
                        href={photo.links}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 flex items-center gap-2 font-bold text-xs hover:text-green-700 transition-colors"
                      >
                        LEARN MORE <FaExternalLinkAlt size={10} />
                      </a>
                      <span className="text-gray-300 font-black text-xl">0{index + 1}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Controls */}
          <button
            onClick={prevSlide}
            className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-green-700 hover:bg-green-600 hover:text-white transition-all z-30 border border-gray-100"
          >
            <FaChevronLeft />
          </button>
          <button
            onClick={nextSlide}
            className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-green-700 hover:bg-green-600 hover:text-white transition-all z-30 border border-gray-100"
          >
            <FaChevronRight />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-12">
            {photos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-green-600' : 'w-2 bg-gray-200'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
});

export default Gallery;
