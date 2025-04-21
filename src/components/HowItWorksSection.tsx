const HowItWorksSection = () => {
  const steps = [
    {
      image: "/images/image19.png",
      title: "Personalized Learning",
      description:
        "Get tailor-made lessons designed around your unique learning pace, goals, and interests – because no two learners are the same.",
    },
    {
      image: "/images/image18.png",
      title: "Real-World Action",
      description:
        "Receive instant, actionable feedback from expert instructors to improve quickly and stay on the right track every step of the way.",
    },
    {
      image: "/images/image17.png",
      title: "Receive instant, actionable ",
      description:
        "Monitor your learning journey with clear, visual progress indicators that keep you motivated and focused on your goals.",
    },
  ];

  return (
    <section className="py-16 bg-green-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-display font-semibold text-center mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center border border-[#B9CAD0] p-2 rounded-lg"
            >
              <div className="w-full aspect-video rounded-lg overflow-hidden mb-4">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {index + 1}. {step.title}
              </h3>
              <p className="text-gray-600 text-center">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
