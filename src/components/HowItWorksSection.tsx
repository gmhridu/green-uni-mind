
const HowItWorksSection = () => {
  const steps = [
    {
      image: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07",
      title: "Create Your Profile",
      description: "Tell us about your interests, goals, and preferences to help our AI find your perfect match."
    },
    {
      image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9",
      title: "Get Personalized Matches",
      description: "Our AI analyzes your profile and recommends teachers who match your learning style."
    },
    {
      image: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86",
      title: "Start Learning",
      description: "Choose your teacher, schedule sessions, and begin your artistic journey with personalized guidance."
    }
  ];

  return (
    <section className="py-16 bg-green-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-display font-semibold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-full aspect-video rounded-lg overflow-hidden mb-4">
                <img 
                  src={step.image} 
                  alt={step.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">{index + 1}. {step.title}</h3>
              <p className="text-gray-600 text-center">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
