
import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
  imageSrc: string;
  title: string;
  description: string;
}

const FeatureCard = ({ imageSrc, title, description }: FeatureCardProps) => (
  <Card className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow hover-scale">
    <div className="h-48 overflow-hidden">
      <img 
        src={imageSrc} 
        alt={title} 
        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300" 
      />
    </div>
    <CardContent className="p-5">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </CardContent>
  </Card>
);

const WhyChooseSection = () => {
  const features = [
    {
      imageSrc: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9",
      title: "Personalized Learning Path",
      description: "Our AI matches you with teachers who can help you achieve your unique artistic goals."
    },
    {
      imageSrc: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9",
      title: "Learn at Your Own Pace",
      description: "Flexible scheduling and customized lessons that adapt to your skill level and availability."
    },
    {
      imageSrc: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86",
      title: "Global Art Community",
      description: "Connect with artists worldwide, share your work, and get inspired by diverse styles."
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-display font-semibold text-center mb-12">Why Choose AI-Powered Learning?</h2>
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
