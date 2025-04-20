import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
  imageSrc: string;
  title: string;
  description: string;
}

const FeatureCard = ({ imageSrc, title, description }: FeatureCardProps) => (
  <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow hover-scale cursor-pointer">
    <div className="h-52 overflow-hidden p-2">
      <img
        src={imageSrc}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-300 rounded-md"
      />
    </div>
    <CardContent className="pl-2 pt-2 pb-4">
      <h3 className="text-[#050B20] text-xl font-semibold not-italic mb-2">
        {title}
      </h3>
      <p className="text-[#0000008C] font-figtree font-normal text-[17.279px]">
        {description}
      </p>
    </CardContent>
  </Card>
);

const WhyChooseSection = () => {
  const features = [
    {
      imageSrc: "/images/image2.png",
      title: "Personalized Lessons",
      description:
        "Get tailor-made lessons designed around your unique learning pace, goals, and interests – because no two learners are the same.",
    },
    {
      imageSrc: "/images/image3.png",
      title: "Real-Time Feedback",
      description:
        "Receive instant, actionable feedback from expert instructors to improve quickly and stay on the right track every step of the way.",
    },
    {
      imageSrc: "/images/image4.png",
      title: "Trackable Progress",
      description:
        "Monitor your learning journey with clear, visual progress indicators that keep you motivated and focused on your goals.",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-[#333333]">
          Why Choose AI-Powered Learning?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              imageSrc={feature.imageSrc}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;
