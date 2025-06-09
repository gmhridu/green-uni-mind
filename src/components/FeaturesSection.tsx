import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const FeaturesSection = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-10 lg:gap-16 xl:gap-20 relative">
          {/* Left Side Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="w-full lg:w-[45%] z-10 pt-4"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-gray-900">
              All the cool{" "}
              <span className="relative inline-block">
                <span className="relative z-10">features</span>
                <svg className="absolute -bottom-2 left-0 w-full z-0" width="100%" height="8" viewBox="0 0 100 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5.5C20 -0.5 50 -0.5 99 5.5" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </span>
            </h2>
            <p className="text-gray-700 mt-4 sm:mt-5 mb-6 sm:mb-8 leading-relaxed text-base sm:text-lg max-w-lg">
              Mauris consequat, cursus pharetra et, habitasse rhoncus quis odio
              ac. In et dolor eu donec maecenas nulla. Cum sed orci, sit
              pellentesque quisque feugiat cras ullamcorper. Ultrices in amet,
              ullamcorper non viverra a, neque orci.
            </p>
            <motion.div
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Button
                variant="link"
                className="text-base sm:text-lg font-medium text-blue-600 p-0 h-auto flex items-center gap-2 hover:text-blue-700 transition-colors"
              >
                <span>View all the features</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Side Content */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="w-full lg:w-[55%] relative min-h-[400px] sm:min-h-[450px] md:min-h-[500px] mt-10 lg:mt-0"
          >
            {/* Blob Background */}
            <div className="absolute inset-0 z-0">
              <svg className="w-full h-full" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M480.5 180.5C522.5 230.5 543.5 299.5 525.5 360.5C507.5 421.5 450.5 474.5 383.5 501.5C316.5 528.5 239.5 529.5 175.5 501.5C111.5 473.5 60.5 416.5 41.5 350.5C22.5 284.5 35.5 209.5 80.5 154.5C125.5 99.5 202.5 64.5 276.5 71.5C350.5 78.5 438.5 130.5 480.5 180.5Z" fill="#4ADE80" fillOpacity="0.3"/>
              </svg>
            </div>

            {/* Floating sparkles */}
            <motion.span
              animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 right-20 w-2 h-2 bg-yellow-300 rounded-full z-20"
            ></motion.span>
            <motion.span
              animate={{ y: [0, 5, 0], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute top-24 right-40 w-1.5 h-1.5 bg-yellow-400 rounded-full z-20"
            ></motion.span>

            {/* Floating Feature Card */}
            <motion.div
              initial={{ y: 10 }}
              animate={{ y: [10, -10, 10] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[5%] left-[5%] sm:left-[10%] md:left-[15%] bg-white rounded-2xl shadow-xl p-4 sm:p-5 w-[220px] sm:w-[240px] z-30"
            >
              <p className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full inline-block mb-2">
                Popular
              </p>
              <h3 className="text-base sm:text-lg font-semibold leading-tight">
                Design for how people think
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 mb-3">
                Aliquam et euismod condimentum elementum ultrices volutpat sit
                non.
              </p>
              <Button
                variant="outline"
                className="text-blue-600 border-blue-600 w-full text-sm py-1 h-auto hover:bg-blue-50 transition-colors"
              >
                Take Lesson
              </Button>
            </motion.div>

            {/* Image Stack */}
            <div className="relative z-10 flex flex-col gap-5 sm:gap-6 w-full h-full">
              {/* Main Image */}
              <div className="relative w-full flex justify-end pr-[5%] pt-[15%]">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <img
                    src="/images/image16.png"
                    alt="Main Feature"
                    className="w-[180px] sm:w-[200px] h-auto rounded-lg shadow-lg object-cover border-4 border-white"
                  />
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    viewport={{ once: true }}
                    className="absolute -bottom-4 -right-4"
                  >
                    <img
                      src="/images/impact1.png"
                      alt="Avatar"
                      className="w-14 h-14 rounded-full border-4 border-green-300 shadow-md"
                    />
                  </motion.div>
                </motion.div>
              </div>

              {/* Bottom Two Images */}
              <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-[500px] mx-auto mt-4">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <img
                    src="/images/image15.png"
                    alt="Feature 3"
                    className="rounded-xl shadow-md w-full aspect-[4/3] object-cover border-4 border-white"
                  />
                </motion.div>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  <img
                    src="/images/image14.png"
                    alt="Feature 4"
                    className="rounded-xl shadow-md w-full aspect-[4/3] object-cover border-4 border-white"
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
