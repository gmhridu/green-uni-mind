import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TestimonialProps {
  quote: string;
  name: string;
  avatarSrc: string;
}

const Testimonial = ({ quote, name, avatarSrc }: TestimonialProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
    className="bg-white p-6 rounded-lg shadow-md flex flex-col h-full"
  >
    <p className="text-gray-700 mb-6 text-sm leading-relaxed flex-grow">
      {quote}
    </p>
    <div className="flex items-center mt-auto">
      <img
        src={avatarSrc}
        alt={name}
        className="w-10 h-10 rounded-full mr-3 object-cover border-2 border-green-100"
      />
      <p className="font-medium text-sm">{name}</p>
    </div>
  </motion.div>
);

const TestimonialsSection = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [width, setWidth] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Update width on window resize
  useEffect(() => {
    const handleResize = () => {
      if (carouselRef.current) {
        setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const testimonials = [
    {
      quote:
        "Lorem ipsum dolor sit amet, consectetur adipiscing. Nulla non mauris elit aliquam mi maecenas elit aliquot est sed consectetur. Vitae quis orci vitae praesent morbi adipiscing purus consectetur mi.",
      name: "Helen Jimmy",
      avatarSrc: "/images/teacher1.png",
    },
    {
      quote:
        "Ordo furiosa ornare gravem. Maleate vel duis non consequatur. Maleate vel duis non viverra sagittis ultricis nisi, nec tortor. Vestibulum, aliquet diam ex neque, hac ultricis nibh.",
      name: "Ralph Edwards",
      avatarSrc: "/images/teacher2.png",
    },
    {
      quote:
        "Sagittis nunc egestas leo et malesuada tincidunt. Morbi nunc et non viverra pharetra. Diam tellus, amet, hac imperdiet. Tellus mi volutpat tellus, congue malesuada sit nisi donec a.",
      name: "Helena John",
      avatarSrc: "/images/teacher3.png",
    },
    {
      quote:
        "Sagittis nunc egestas leo et malesuada tincidunt. Morbi nunc et non viverra pharetra. Diam tellus, amet, hac imperdiet. Tellus mi volutpat tellus.",
      name: "Michael Brown",
      avatarSrc: "/images/teacher4.png",
    },
  ];

  const nextPage = () => {
    setCurrentPage((prev) =>
      prev === Math.ceil(testimonials.length / 3) - 1 ? 0 : prev + 1
    );
  };

  const prevPage = () => {
    setCurrentPage((prev) =>
      prev === 0 ? Math.ceil(testimonials.length / 3) - 1 : prev - 1
    );
  };

  // Calculate visible testimonials based on screen size
  const getVisibleCount = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 1;
      if (window.innerWidth < 1024) return 2;
      return 3;
    }
    return 3; // Default for SSR
  };

  const visibleCount = getVisibleCount();
  const startIndex = currentPage * visibleCount;
  const visibleTestimonials = testimonials.slice(
    startIndex,
    startIndex + visibleCount
  );

  return (
    <section
      className="py-12 sm:py-16 md:py-20 relative overflow-hidden my-16"
      style={{ backgroundColor: "#4A7A4A66" }}
    >
      <div className="responsive-container">
        <div className="flex justify-between items-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl text-white font-display font-semibold">
            What Students Say
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={prevPage}
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-white text-white hover:bg-white/10 hover:text-white"
              aria-label="Previous testimonials"
              style={{ backgroundColor: "transparent", borderColor: "white" }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={nextPage}
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full border-white text-white hover:bg-white/10 hover:text-white"
              aria-label="Next testimonials"
              style={{ backgroundColor: "transparent", borderColor: "white" }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div
          ref={carouselRef}
          className="overflow-hidden"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              {visibleTestimonials.map((testimonial, index) => (
                <Testimonial
                  key={`${currentPage}-${index}`}
                  quote={testimonial.quote}
                  name={testimonial.name}
                  avatarSrc={testimonial.avatarSrc}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
