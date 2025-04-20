
import { Button } from "@/components/ui/button";

const FeaturesSection = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-display font-semibold mb-6">All the cool features you need</h2>
            <p className="text-gray-700 mb-6">
              Our platform combines cutting-edge AI technology with a user-friendly interface to provide the most 
              comprehensive art learning experience. Whether you're a beginner or advanced artist, we have the tools 
              and resources to help you reach your creative potential.
            </p>
            <Button className="bg-purple-500 hover:bg-purple-400 text-white">
              Explore Features
            </Button>
          </div>
          <div className="md:w-1/2">
            <div className="relative">
              <div className="bg-purple-100 rounded-xl p-4 shadow-md mb-4 ml-10">
                <img 
                  src="https://images.unsplash.com/photo-1487958449943-2429e8be8625" 
                  alt="Feature" 
                  className="rounded-lg w-full h-40 object-cover"
                />
                <p className="mt-2 text-sm">AI-Powered Teacher Matching</p>
              </div>
              <div className="bg-green-100 rounded-xl p-4 shadow-md mb-4 ml-20">
                <img 
                  src="https://images.unsplash.com/photo-1518005020951-eccb494ad742" 
                  alt="Feature" 
                  className="rounded-lg w-full h-40 object-cover"
                />
                <p className="mt-2 text-sm">Interactive Learning Tools</p>
              </div>
              <div className="bg-blue-100 rounded-xl p-4 shadow-md ml-5">
                <img 
                  src="https://images.unsplash.com/photo-1496307653780-42ee777d4833" 
                  alt="Feature" 
                  className="rounded-lg w-full h-40 object-cover"
                />
                <p className="mt-2 text-sm">Progress Tracking Analytics</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
