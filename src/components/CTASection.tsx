
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-20 bg-cover bg-center relative" style={{
      backgroundImage: `url('https://images.unsplash.com/photo-1504893524553-b855bce32c67')`,
    }}>
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-display font-semibold mb-6">
            Join a world of learning
          </h2>
          <p className="text-lg mb-8">
            Start your artistic journey today with personalized guidance from expert teachers.
            Our AI-powered platform helps you find the perfect match for your learning style.
          </p>
          <Button className="bg-green-500 hover:bg-green-600 text-white px-8 py-6 text-lg">
            Get Started Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
