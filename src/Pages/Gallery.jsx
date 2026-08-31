import React, { forwardRef } from "react";
import { FaExternalLinkAlt } from "react-icons/fa";

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
    <section ref={ref} className="bg-slate-50 py-20 md:py-28 px-6 md:px-20">
      <div className="max-w-7xl mx-auto">

        {/* Section heading */}
        <div className="text-center mb-14">
          <span className="text-xs font-black text-green-600 uppercase tracking-widest" data-aos="fade-up">
            In the Field
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-green-900 mt-3 mb-4 tracking-tight" data-aos="fade-up" data-aos-delay="100">
            Highlights in Action
          </h2>
          <div className="w-12 h-0.5 bg-green-600 mx-auto rounded-full mb-6" data-aos="fade-up" data-aos-delay="100" />
          <p className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed" data-aos="fade-up" data-aos-delay="200">
            Real examples of how waste collection, segregation, and recycling are transforming communities across Kerala.
          </p>
        </div>

        {/* Photo grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col"
              data-aos="fade-up"
              data-aos-delay={index * 80}
            >
              {/* Image */}
              <div className="relative overflow-hidden h-56">
                <img
                  src={photo.src}
                  alt={`${photo.title} - Haritha Karma Sena in Kerala`}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-green-950/0 group-hover:bg-green-950/20 transition-all duration-300" />
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-base font-black text-green-900 mb-2 tracking-tight">{photo.title}</h3>
                <div className="w-8 h-0.5 bg-green-500 mb-3 rounded-full group-hover:w-16 transition-all duration-500" />
                <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-grow">
                  {photo.desc}
                </p>
                {photo.links !== "#" && (
                  <a
                    href={photo.links}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-800 font-black text-xs uppercase tracking-wider transition-colors group/link"
                  >
                    Read More
                    <FaExternalLinkAlt className="text-[10px] group-hover/link:translate-x-0.5 transition-transform" />
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
