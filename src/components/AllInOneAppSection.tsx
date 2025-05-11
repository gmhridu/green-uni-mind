const AllInOneAppSection = () => {
  return (
    <section className="bg-green-50 relative overflow-hidden h-full md:h-[650px] flex items-center">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-around gap-4 py-10 relative">
        {/* Text content */}
        <div className="w-full md:w-1/2 lg:w-5/12 inline-flex flex-col items-center justify-center md:items-start mb-8 md:mb-0 order-1">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-8">
            An all-in-one app that makes it easier
          </h2>
          <ul className="space-y-5">
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-600 mr-3 mt-1 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-700">
                Est et in pharetra magna adipiscing ornare aliquam.
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-600 mr-3 mt-1 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-700">
                Tellus arcu sed consequat ac velit ut eu blandit.
              </span>
            </li>
            <li className="flex items-start">
              <svg
                className="h-5 w-5 text-green-600 mr-3 mt-1 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-gray-700">
                Ullamcorper ornare in et egestas dolor orci.
              </span>
            </li>
          </ul>
        </div>

        {/* Image Section */}
        <div className="w-full md:w-1/2 lg:w-7/12 flex justify-center md:justify-end relative order-2 mt-8 md:mt-0">
          {/* Background blob */}
          <div className="absolute right-0 md:-right-[16px] top-[33px] md:top-[-20px] lg:top-[42px] z-0">
            <img
              src="/images/blob.png"
              alt=""
              className="w-[336px] sm:w-[450px] md:w-[332px] lg:w-[388px] h-auto"
              style={{ objectPosition: "center" }}
            />
          </div>

          {/* Mobile image */}
          <img
            src="/images/mobiles.png"
            alt="Mobile app interface"
            className="w-[230px] sm:w-[320px] md:w-[233px] lg:w-[287px] h-auto object-contain relative z-10"
          />
        </div>
      </div>
    </section>
  );
};

export default AllInOneAppSection;
