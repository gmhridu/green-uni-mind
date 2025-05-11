import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const FeaturesSection = () => {
  return (
    <section className="py-10 sm:py-12 md:py-16 bg-white overflow-hidden">
      <div className="responsive-container">
        <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8 md:gap-10 relative">
          {/* Left Side Text */}
          <div className="md:w-1/2 z-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-semibold leading-tight">
              All the cool{" "}
              <span className="relative inline-block">
                <span className="relative z-10">features</span>
                <img
                  src="/images/vector14.png"
                  alt="vector underline"
                  className="absolute left-0 -bottom-1 w-full z-0"
                />
              </span>
            </h2>
            <p className="text-gray-700 mt-3 sm:mt-4 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
              Mauris consequat, cursus pharetra et, habitasse rhoncus quis odio
              ac. In et dolor eu donec maecenas nulla. Cum sed orci, sit
              pellentesque quisque feugiat cras ullamcorper. Ultrices in amet,
              ullamcorper non viverra a, neque orci.
            </p>
            <Button
              variant="link"
              className="text-sm sm:text-base font-medium text-[#2563EB]"
            >
              Explore Features
              <ArrowRight className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Right Side Content */}
          <div className="md:w-1/2 relative flex justify-center items-center min-h-[350px] sm:min-h-[400px] md:min-h-[500px] mt-8 md:mt-0">
            {/* Blob Background */}
            <img
              src="/images/blob.png"
              alt="Blob background"
              className="absolute top-0 left-0 w-full h-full object-contain z-0 pointer-events-none"
            />

            {/* Floating sparkles */}
            <span className="absolute top-6 left-[60%] w-1.5 sm:w-2 h-1.5 sm:h-2 bg-yellow-300 rounded-full z-20"></span>
            <span className="absolute top-12 right-8 w-1 sm:w-1.5 h-1 sm:h-1.5 bg-yellow-400 rounded-full z-20"></span>

            {/* Floating Feature Card */}
            <div className="absolute top-[45px] left-0 sm:left-[10px] md:-left-[27px] xl:left-[73px] bg-white rounded-2xl shadow-xl p-3 sm:p-4 md:p-5 w-[180px] sm:w-[210px] md:w-[240px] z-30">
              <p className="text-[10px] sm:text-xs text-blue-700 bg-blue-100 px-2 py-0.5 sm:py-1 rounded-full inline-block mb-1 sm:mb-2">
                Popular
              </p>
              <h3 className="text-base sm:text-lg font-semibold leading-tight">
                Design for how people think
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2 mb-2 sm:mb-4">
                Aliquam et euismod condimentum elementum ultrices volutpat sit
                non.
              </p>
              <Button
                variant="outline"
                className="text-blue-600 border-blue-600 w-full text-xs sm:text-sm py-1 h-auto sm:h-9"
              >
                Take Lesson
              </Button>
            </div>

            {/* Image Stack */}
            <div className="relative z-10 flex flex-col gap-3 sm:gap-4 scale-75 sm:scale-90 md:scale-100">
              {/* Main Image with Avatar */}
              <div className="relative w-[320px] h-[250px]">
                <img
                  src="/images/image16.png"
                  alt="Main Feature"
                  className="absolute top-[71px] left-[233px] w-[160px] h-[130px] shadow-xl object-cover z-10 border-4 border-white rounded-lg"
                />
                <img
                  src="/images/impact1.png"
                  alt="Avatar"
                  className="w-16 h-16 rounded-full absolute bottom-[3.7rem] -right-[6.1rem] border-4 border-[#90EE90] shadow-md z-20"
                />
              </div>

              {/* Bottom Two Images */}
              <div className="grid grid-cols-2 gap-4 w-[430px] mt-6 sm:mt-8">
                <img
                  src="/images/image15.png"
                  alt="Feature 3"
                  className="rounded-xl shadow-md w-full h-[178px] object-cover border-4 border-white"
                />
                <img
                  src="/images/image14.png"
                  alt="Feature 4"
                  className="rounded-xl shadow-md w-full h-[178px] object-cover border-4 border-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
