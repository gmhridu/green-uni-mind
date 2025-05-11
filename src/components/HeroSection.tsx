import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative w-full min-h-[500px] md:min-h-[600px] lg:min-h-[700px] xl:min-h-[800px] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/heroImg.png')",
        }}
      />

      {/* Text Content Positioned at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-6 sm:pb-8 md:pb-10">
        <div
          className="max-w-[90%] sm:max-w-[85%] md:max-w-4xl mx-auto text-center px-4 sm:px-6 py-6 sm:py-8 md:py-10"
          style={{
            borderRadius: "18px",
            border: "2px solid rgba(255, 255, 255, 0.66)",
            background:
              "linear-gradient(90deg, rgba(0, 0, 0, 0.35) 0%, rgba(102, 102, 102, 0.35) 100%)",
            backdropFilter: "blur(1px)",
          }}
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-4 text-white leading-tight">
            GreenUniMind AI.
            <br />
            <span>Discover the Right Teacher for You</span>
          </h1>
          <p className="text-white text-sm sm:text-base md:text-lg mt-2 sm:mt-4 max-w-3xl mx-auto">
            Unlock limitless opportunities by learning directly from globally
            acclaimed experts, and take your skills, knowledge, and career to
            extraordinary new heights with our premium online courses.
          </p>
          {/* <div className="mt-6 sm:mt-8">
            <Button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 text-sm sm:text-base md:px-8 md:py-3">
              Get Started
            </Button>
          </div> */}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
