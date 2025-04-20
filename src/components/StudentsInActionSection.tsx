
import { Button } from "@/components/ui/button";

const StudentsInActionSection = () => {
  return (
    <section className="py-16 bg-green-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="md:w-1/2">
            <div className="rounded-3xl overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81" 
                alt="Students in a workshop" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl font-display font-semibold mb-6">Students in Action</h2>
            <p className="text-gray-700 mb-4">
              Our vibrant community of artists comes together in live workshops, virtual meetups, and collaborative projects. 
              Experience the power of learning together and draw inspiration from fellow artists on the same journey.
            </p>
            <p className="text-gray-700 mb-6">
              Regular community events, art challenges, and feedback sessions help you grow your skills faster 
              and build meaningful connections in the art world.
            </p>
            <Button className="bg-green-500 hover:bg-green-600 text-white">
              Join a Workshop
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentsInActionSection;
