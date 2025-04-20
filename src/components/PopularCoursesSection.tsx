
import { Button } from "@/components/ui/button";

interface CourseCardProps {
  title: string;
  instructor: string;
  price: number;
  imageSrc: string;
  category: string;
}

const CourseCard = ({ title, instructor, price, imageSrc, category }: CourseCardProps) => (
  <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow hover-scale">
    <div className="relative h-48 overflow-hidden">
      <img 
        src={imageSrc} 
        alt={title} 
        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
      />
      <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
        {category}
      </div>
    </div>
    <div className="p-5">
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-gray-600 text-sm mb-3">By {instructor}</p>
      <div className="flex justify-between items-center">
        <span className="font-bold text-green-600">${price.toFixed(2)}</span>
        <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
          Enroll Now
        </Button>
      </div>
    </div>
  </div>
);

const PopularCoursesSection = () => {
  const courses = [
    {
      title: "Beginner's Landscape Photography",
      instructor: "James Wilson",
      price: 49.99,
      imageSrc: "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
      category: "Photography"
    },
    {
      title: "Digital Portrait Masterclass",
      instructor: "Elena Rodriguez",
      price: 59.99,
      imageSrc: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb",
      category: "Digital Art"
    },
    {
      title: "Watercolor Ocean Scenes",
      instructor: "Sarah Johnson",
      price: 39.99,
      imageSrc: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21",
      category: "Watercolor"
    },
    {
      title: "Oil Painting Fundamentals",
      instructor: "Michael Chen",
      price: 44.99,
      imageSrc: "https://images.unsplash.com/photo-1458668383970-8ddd3927deed",
      category: "Oil Painting"
    }
  ];

  return (
    <section className="py-16 bg-green-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-display font-semibold text-center mb-12">Popular Courses</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course, index) => (
            <CourseCard 
              key={index}
              title={course.title}
              instructor={course.instructor}
              price={course.price}
              imageSrc={course.imageSrc}
              category={course.category}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularCoursesSection;
