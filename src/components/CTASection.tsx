import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section
      className="py-20 my-16 bg-cover bg-center relative"
      style={{
        backgroundImage: `url('/images/image10.png')`,
      }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-display font-semibold mb-6">
            Join a World of Learning
          </h2>
          <p className="text-lg mb-3">Join GreenUniMind today</p>

          <p className="text-base font-normal text-muted mb-8">
            Be part of a global movement for a greener, smarter future
          </p>
          <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg">
            Start Your Journey
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
