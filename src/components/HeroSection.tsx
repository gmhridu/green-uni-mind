
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="pt-28 pb-16 bg-gradient-to-b from-green-50 to-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-center animate-fade-in">
            <span className="text-purple-400">Greenthy</span>
            <span className="text-black">Mind AI</span>
          </h1>
          <h2 className="text-2xl md:text-3xl font-display mb-6 animate-fade-in animation-delay-200">Discover the Right Teacher for You</h2>
          <p className="text-gray-700 mb-8 max-w-2xl mx-auto animate-fade-in animation-delay-400">
            With our AI-powered learning platform, find the perfect art teacher who matches your style, pace, and aspirations. Learn from experts around the world.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-4">
            <Button className="bg-purple-500 hover:bg-purple-400 text-white px-8 py-6 text-lg">
              Find a Teacher
            </Button>
            <Button variant="outline" className="border-purple-500 text-purple-500 hover:bg-purple-50 px-8 py-6 text-lg">
              Become a Teacher
            </Button>
          </div>
        </div>
      </div>
      
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07" 
          alt="Background design" 
          className="absolute top-10 left-10 w-32 h-32 object-cover rounded-full"
        />
        <img 
          src="https://images.unsplash.com/photo-1433086966358-54859d0ed716" 
          alt="Background design" 
          className="absolute bottom-10 right-10 w-48 h-48 object-cover rounded-full"
        />
      </div>
    </section>
  );
};

export default HeroSection;
