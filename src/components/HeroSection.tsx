import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative w-full min-h-[500px] md:min-h-[600px] lg:min-h-[700px] xl:min-h-[800px] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/image21.png')",
        }}
      />

      {/* Text Content Positioned at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-10">
        <div className="max-w-4xl mx-auto text-center border border-white rounded-lg bg-white/30 backdrop-blur-sm px-6 py-10">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 text-white">
            GreenUniMind AI.
            <br />
            <span>Discover the Right Teacher for You</span>
          </h1>
          <p className="text-white text-base md:text-lg mt-4">
            Unlock limitless opportunities by learning directly from globally acclaimed experts,
            and take your skills, knowledge, and career to extraordinary new heights with our premium
            online courses.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
