
import { Star } from "lucide-react";

interface TeacherCardProps {
  name: string;
  expertise: string;
  rating: number;
  imageSrc: string;
}

const TeacherCard = ({ name, expertise, rating, imageSrc }: TeacherCardProps) => (
  <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-md hover-scale">
    <img src={imageSrc} alt={name} className="w-16 h-16 rounded-lg object-cover" />
    <div>
      <h3 className="font-semibold">{name}</h3>
      <p className="text-sm text-gray-600">{expertise}</p>
      <div className="flex items-center mt-1">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={14}
            className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    </div>
  </div>
);

const TopTeachersSection = () => {
  const teachers = [
    {
      name: "Sarah Johnson",
      expertise: "Expert mathematics tutor helping students simplify tough concepts, improve problem-solving, and excel in exams with clear, personalized coaching.",
      rating: 4.9,
      imageSrc: "https://images.unsplash.com/photo-1494891848038-7bd202a2afeb"
    },
    {
      name: "Michael Chen",
      expertise: "Digital Art",
      rating: 4.8,
      imageSrc: "https://images.unsplash.com/photo-1487252665478-49b61b47f302"
    },
    {
      name: "Elena Rodriguez",
      expertise: "Oil Painting",
      rating: 4.9,
      imageSrc: "https://images.unsplash.com/photo-1551038247-3d9af20df552"
    },
    {
      name: "James Wilson",
      expertise: "Landscape Art",
      rating: 4.7,
      imageSrc: "https://images.unsplash.com/photo-1524230572899-a752b3835840"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-display font-semibold text-center mb-12">Top-Rated Teachers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {teachers.map((teacher, index) => (
            <TeacherCard 
              key={index}
              name={teacher.name}
              expertise={teacher.expertise}
              rating={teacher.rating}
              imageSrc={teacher.imageSrc}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopTeachersSection;
