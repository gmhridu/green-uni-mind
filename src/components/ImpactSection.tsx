import { LucideIcon, BookOpen, Globe, MessageCircle } from "lucide-react";

interface ImpactStatProps {
  icon: LucideIcon;
  value: string;
  label: string;
  description: string;
}

const ImpactStat = ({
  icon: Icon,
  value,
  label,
  description,
}: ImpactStatProps) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 p-6 text-center">
    {/* Icon */}
    <div className="mb-6">
      <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center">
        <Icon className="w-8 h-8 text-green-600" />
      </div>
    </div>

    {/* Content */}
    <div className="space-y-3">
      <h3 className="text-3xl md:text-4xl font-bold text-gray-900">
        {value}
      </h3>
      <h4 className="text-lg font-semibold text-gray-800 leading-tight">
        {label}
      </h4>
      <p className="text-sm text-gray-600 leading-relaxed">
        {description}
      </p>
    </div>
  </div>
);

const ImpactSection = () => {
  const stats = [
    {
      icon: BookOpen,
      value: "500k",
      label: "Green Educators Reached",
      description: "Teachers engaged in eco-friendly learning worldwide",
    },
    {
      icon: Globe,
      value: "300k",
      label: "Eco Projects Launched",
      description: "Sustainability projects initiated this month",
    },
    {
      icon: MessageCircle,
      value: "< 2h",
      label: "Avg Support Response",
      description: "Average response time for learner support",
    },
  ];

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-white">
      <div className="responsive-container">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl">🌱</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900">
              Our Impact This Month
            </h2>
          </div>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Real change begins with one learner, one project, one planet at a time.
          </p>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <ImpactStat
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              description={stat.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
