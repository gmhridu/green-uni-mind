import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section
      className="py-12 sm:py-16 md:py-20 my-10 sm:my-12 md:my-16 bg-cover bg-center relative"
      style={{
        backgroundImage: `url('/images/image10.png')`,
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="responsive-container relative z-10">
        <div className="max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto text-center text-white">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold mb-3 sm:mb-4 md:mb-6">
            Join a World of Learning
          </h2>
          <p className="text-base sm:text-lg mb-2 sm:mb-3">Join GreenUniMind today</p>

          <p className="text-sm sm:text-base font-normal text-muted mb-4 sm:mb-6 md:mb-8">
            Be part of a global movement for a greener, smarter future
          </p>
          <Button className="bg-green-500 hover:bg-green-600 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg">
            Start Your Journey
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
