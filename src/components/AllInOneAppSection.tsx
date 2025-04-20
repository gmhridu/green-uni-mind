
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const AllInOneAppSection = () => {
  const features = [
    "Find perfect matches with our AI algorithm",
    "Schedule and manage all your classes",
    "Track your progress with detailed insights",
    "Access learning materials anytime, anywhere"
  ];

  return (
    <section className="py-16 bg-green-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:w-1/2">
            <h2 className="text-3xl font-display font-semibold mb-6">
              An all-in-one app that makes it easier
            </h2>
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="mt-1 bg-purple-400 rounded-full p-0.5 text-white">
                    <Check size={16} />
                  </div>
                  <p>{feature}</p>
                </div>
              ))}
            </div>
            <Button className="bg-purple-500 hover:bg-purple-400 text-white px-6">
              Download App
            </Button>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <div className="relative">
              <div className="w-64 h-96 bg-white rounded-3xl shadow-xl overflow-hidden border-8 border-gray-100">
                <div className="w-full h-full bg-gradient-to-b from-purple-400 to-purple-500 p-4">
                  <div className="h-full w-full bg-white rounded-xl overflow-hidden flex flex-col">
                    <div className="bg-purple-400 text-white p-4 text-center">
                      <h3 className="text-lg font-medium">Find Your Teacher</h3>
                    </div>
                    <div className="flex-1 p-4 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                        <img 
                          src="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9" 
                          alt="Art" 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-center text-gray-600 mb-4">
                        We found 8 teachers matching your criteria
                      </p>
                      <Button size="sm" className="bg-purple-500 text-white w-full">
                        View Matches
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AllInOneAppSection;
