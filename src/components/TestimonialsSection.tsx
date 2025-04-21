import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";

interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  avatarSrc: string;
  rating: number;
}

const Testimonial = ({
  quote,
  name,
  role,
  avatarSrc,
  rating,
}: TestimonialProps) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center mb-4">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          size={16}
          className={
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          }
        />
      ))}
    </div>
    <p className="text-gray-700 mb-4">"{quote}"</p>
    <div className="flex items-center">
      <img src={avatarSrc} alt={name} className="w-10 h-10 rounded-full mr-3" />
      <div>
        <p className="font-semibold">{name}</p>
        <p className="text-gray-600 text-sm">{role}</p>
      </div>
    </div>
  </div>
);

const TestimonialsSection = () => {
  const [currentPage, setCurrentPage] = useState(0);

  const testimonials = [
    {
      quote:
        "The AI matched me with the perfect teacher for my style. I've improved more in 3 months than in years of trying to learn on my own.",
      name: "Emma Thompson",
      role: "Beginner Artist",
      avatarSrc: "https://images.unsplash.com/photo-1517022812141-23620dba5c23",
      rating: 5,
    },
    {
      quote:
        "As someone who travels frequently, the flexibility of scheduling lessons with teachers across time zones has been incredible.",
      name: "David Chen",
      role: "Intermediate Artist",
      avatarSrc: "https://images.unsplash.com/photo-1582562124811-c09040d0a901",
      rating: 5,
    },
    {
      quote:
        "The community aspect of GreenthyMind has exposed me to so many different styles and approaches. It's expanded my artistic horizons.",
      name: "Sophia Rodriguez",
      role: "Advanced Artist",
      avatarSrc: "https://images.unsplash.com/photo-1535268647677-300dbf3d78d1",
      rating: 4,
    },
    {
      quote:
        "I was skeptical about learning art online, but the platform makes it so engaging and effective. My teacher is amazing!",
      name: "Michael Johnson",
      role: "Hobby Artist",
      avatarSrc: "https://images.unsplash.com/photo-1498936178812-4b2e558d2937",
      rating: 5,
    },
  ];

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % Math.ceil(testimonials.length / 3));
  };

  const prevPage = () => {
    setCurrentPage((prev) =>
      prev === 0 ? Math.ceil(testimonials.length / 3) - 1 : prev - 1
    );
  };

  const visibleTestimonials = testimonials.slice(
    currentPage * 3,
    (currentPage + 1) * 3
  );

  return (
    <section
      className="py-16 my-16"
      style={{ backgroundColor: "rgba(74, 122, 74, 0.40)" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl text-white font-display font-semibold">
            What Students Say
          </h2>
          <div className="flex gap-2">
            <button
              onClick={prevPage}
              className="p-2 border text-white border-white rounded-full"
              aria-label="Previous testimonials"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onClick={nextPage}
              className="p-2 border text-white border-white rounded-full"
              aria-label="Next testimonials"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleTestimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              quote={testimonial.quote}
              name={testimonial.name}
              role={testimonial.role}
              avatarSrc={testimonial.avatarSrc}
              rating={testimonial.rating}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
