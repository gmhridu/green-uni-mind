import { Star } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface TeacherCardProps {
  name: string;
  expertise: string;
  rating: number;
  imageSrc: string;
}

const TeacherCard = ({
  name,
  expertise,
  rating,
  imageSrc,
}: TeacherCardProps) => (
  <Card className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-white p-3 border border-[#D0D0D0] rounded-xl shadow-sm hover:shadow-md transition-shadow">
    <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 mb-3 sm:mb-0">
      <img
        src={imageSrc}
        alt={name}
        className="w-full h-full object-cover rounded-lg"
      />
    </div>
    <div className="flex flex-col justify-between w-full text-center sm:text-left">
      <h3 className="font-semibold text-base sm:text-lg text-gray-900">{name}</h3>
      <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2 sm:line-clamp-3">{expertise}</p>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={14}
              className={
                i < Math.floor(rating)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }
            />
          ))}
          <span className="ml-1 text-xs sm:text-sm text-gray-600 text-nowrap inline-flex gap-x-0.5 items-center">
            {rating.toFixed(1)}
            <span className="text-xs hidden sm:inline">(357,914)</span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs sm:text-sm font-medium text-green-600 border border-green-600 rounded-md hover:bg-green-50 transition w-full sm:w-auto"
        >
          View Profile
        </Button>
      </div>
    </div>
  </Card>
);

const TopTeachersSection = () => {
  const teachers = [
    {
      name: "John Smith",
      expertise:
        "Expert mathematics tutor helping students simplify tough concepts, improve problem-solving, and excel in exams with clear, personalized coaching.",
      rating: 5,
      imageSrc: "/images/teacher1.png",
    },
    {
      name: "John Smith",
      expertise:
        "Fluent English trainer specializing in spoken and written communication, helping learners build confidence and achieve language mastery.",
      rating: 4.8,
      imageSrc: "/images/teacher2.png",
    },
    {
      name: "John Smith",
      expertise:
        "Science educator making physics, chemistry, and biology easy to grasp with real-world examples and interactive learning sessions.",
      rating: 5,
      imageSrc: "/images/teacher3.png",
    },
    {
      name: "John Smith",
      expertise:
        "Programming mentor guiding beginners through coding basics to advanced skills with practical projects and clear, hands-on support.",
      rating: 4.7,
      imageSrc: "/images/teacher4.png",
    },
  ];

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-white">
      <div className="responsive-container">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-center mb-6 sm:mb-8 md:mb-12">
          Top-Rated Teachers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
