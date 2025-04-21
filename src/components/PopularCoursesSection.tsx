import { Button } from "@/components/ui/button";

interface CourseCardProps {
  title: string;
  description: string;
  imageSrc: string;
}

const CourseCard = ({ title, description, imageSrc }: CourseCardProps) => (
  <div className="rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow hover-scale border border-[#B9CAD0] cursor-pointer">
    <div className="relative h-48 overflow-hidden p-2">
      <img
        src={imageSrc}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-300 rounded-lg"
      />
    </div>
    <div className="p-2">
      <h3 className="font-semibold text-lg mb-1">{title}</h3>
      <p className="text-gray-600 text-sm mb-3">{description}</p>
      <div className="flex justify-end">
        <Button
          size="sm"
          className="bg-green-500 hover:bg-green-600 text-white"
        >
          Enroll Now
        </Button>
      </div>
    </div>
  </div>
);

const PopularCoursesSection = () => {
  const courses = [
    {
      title: "Beginner's Python Programming",
      description:
        "Master Python from scratch with hands-on projects, clear guidance, and real-world coding exercises tailored for absolute beginners.",
      imageSrc: "/images/image10.png",
    },
    {
      title: "Spoken English Masterclass",
      description:
        "Boost your confidence and fluency with practical speaking drills, grammar tips, and conversation practice led by expert trainers.",
      imageSrc: "/images/image11.png",
    },
    {
      title: "Mathematics for High School Success",
      description:
        "Understand core math concepts with simplified lessons, problem-solving strategies, and exam-focused practice sessions.",
      imageSrc: "/images/image12.png",
    },
    {
      title: "Web Development Essentials",
      description:
        "Learn to build modern websites using HTML, CSS, and JavaScript with step-by-step tutorials and real-time project experience.",
      imageSrc: "/images/image13.png",
    },
  ];

  return (
    <section className="py-16 bg-green-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-display font-semibold text-center mb-12">
          Popular Courses
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2  gap-6">
          {courses.map((course, index) => (
            <CourseCard
              key={index}
              title={course.title}
              description={course.description}
              imageSrc={course.imageSrc}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularCoursesSection;
