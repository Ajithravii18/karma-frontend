import React, { forwardRef } from "react";

const Gallery = forwardRef((props, ref) => {
  return (
    <div>
      <section ref={ref} className="bg-white py-20 px-6 md:px-20">
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h2
            className="text-4xl font-bold text-[#1B5E20] mb-4"
            data-aos="fade-up"
          >
            Highlights of Haritha Karma Sena in Action
          </h2>
          <p
            className="text-gray-600 text-lg"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            Real examples of how waste collection, segregation, and recycling
            are transforming communities across Kerala.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {/* Photo 1 */}
          <div data-aos="zoom-in" className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src="https://static.toiimg.com/photo/123222225.cms"
              alt="Haritha Karma Sena working in a panchayat"
              className="w-full h-64 object-cover hover:scale-110 transition duration-500"
            />
            <p className="text-sm text-gray-500 mt-2 text-center px-3 pb-4">
              Haritha Karma Sena members in Edakkattuvayal Panchayat become a
              model for waste management.{" "}
              <a
                href="https://timesofindia.indiatimes.com/city/kochi/haritha-karma-sena-of-edakkattuvayal-panchayat-becomes-a-model-in-solid-waste-management/articleshow/123222225.cms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1B5E20] underline"
              >
                Read More
              </a>
            </p>
          </div>

          {/* Photo 2 */}
          <div
            data-aos="zoom-in"
            data-aos-delay="100"
            className="rounded-2xl overflow-hidden shadow-lg"
          >
            <img
              src="https://haritham.kerala.gov.in/upload/news/1718772802-hks.jpg"
              alt="HKS members working in community"
              className="w-full h-64 object-cover hover:scale-110 transition duration-500"
            />
            <p className="text-sm text-gray-500 mt-2 text-center px-3 pb-4">
              Haritha Karma Sena volunteers collecting and sorting waste.
              Several panchayats support livelihood efforts for workers.{" "}
              <a
                href="https://prdlive.kerala.gov.in/news/378454"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1B5E20] underline"
              >
                Press Release
              </a>
            </p>
          </div>

          {/* Photo 3 */}
          <div
            data-aos="zoom-in"
            data-aos-delay="200"
            className="rounded-2xl overflow-hidden shadow-lg"
          >
            <img
              src="https://sbmgramin.wordpress.com/wp-content/uploads/2022/09/kerala-water4.jpg"
              alt="Plastic waste sorting"
              className="w-full h-64 object-cover hover:scale-110 transition duration-500"
            />
            <p className="text-sm text-gray-500 mt-2 text-center px-3 pb-4">
              Proper sorting boosts recyclability and income for workers, as
              seen in many Kerala panchayats.{" "}
              <a
                href="https://keralacalling.kerala.gov.in/unique-yet-universal/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1B5E20] underline"
              >
                Learn More
              </a>
            </p>
          </div>

          {/* Photo 4 */}
          <div
            data-aos="zoom-in"
            data-aos-delay="300"
            className="rounded-2xl overflow-hidden shadow-lg"
          >
            <img
              src="https://images.unsplash.com/photo-1604187351574-c75ca79f5807"
              alt="Recycling materials"
              className="w-full h-64 object-cover hover:scale-110 transition duration-500"
            />
            <p className="text-sm text-gray-500 mt-2 text-center px-3 pb-4">
              HKS work connects households with recycling systems, reducing
              landfill waste.{" "}
              <a
                href="https://timesofindia.indiatimes.com/city/kochi/local-bodies-in-kochi-show-the-way-in-solid-waste-management/articleshow/80679981.cms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1B5E20] underline"
              >
                Case Study
              </a>
            </p>
          </div>

          {/* Photo 5 */}
          <div
            data-aos="zoom-in"
            data-aos-delay="400"
            className="rounded-2xl overflow-hidden shadow-lg"
          >
            <img
              src="https://sbmgramin.wordpress.com/wp-content/uploads/2022/09/image-3.png"
              alt="Community clean drive"
              className="w-full h-64 object-cover hover:scale-110 transition duration-500"
            />
            <p className="text-sm text-gray-500 mt-2 text-center px-3 pb-4">
              Communities participate in clean drives supported by HKS
              volunteers. (Representative image)
            </p>
          </div>

          {/* Photo 6 */}
          <div
            data-aos="zoom-in"
            data-aos-delay="500"
            className="rounded-2xl overflow-hidden shadow-lg"
          >
            <img
              src="https://images.unsplash.com/photo-1611284446314-60a58ac0deb9"
              alt="Sustainable recycling"
              className="w-full h-64 object-cover hover:scale-110 transition duration-500"
            />
            <p className="text-sm text-gray-500 mt-2 text-center px-3 pb-4">
              Continued efforts in recycling help strengthen zero-waste goals
              across Kerala. (Representative image)
            </p>
          </div>
        </div>
      </section>
    </div>
  );
});

export default Gallery;
