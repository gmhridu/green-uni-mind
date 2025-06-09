import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <section className="w-full h-[500px] sm:h-[550px] md:h-[650px] relative overflow-hidden my-10 sm:my-16 md:my-20">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/journeyImage.png')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40"></div>
      </div>

      {/* Content Container */}
      <div className="responsive-container relative z-10 h-full flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto text-center text-white"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4 sm:mb-5 md:mb-6 text-white drop-shadow-md">
            Join a World of Learning
          </h2>

          <p className="text-lg sm:text-xl md:text-2xl font-medium mb-2 sm:mb-3 md:mb-4 text-white drop-shadow">
            Join GreenUniMind today
          </p>

          <p className="text-sm sm:text-base md:text-lg font-normal text-white/90 mb-6 sm:mb-8 md:mb-10 max-w-xl mx-auto drop-shadow">
            Be part of a global movement for a greener, smarter future
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-base sm:text-lg rounded-md font-medium shadow-lg transition-all duration-300 hover:shadow-xl">
              Start Your Journey
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
