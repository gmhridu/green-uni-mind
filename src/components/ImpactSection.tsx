
interface ImpactStatProps {
  value: string;
  label: string;
  icon: string;
}

const ImpactStat = ({ value, label, icon }: ImpactStatProps) => (
  <div className="flex flex-col items-center">
    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
      <img src={icon} alt={label} className="w-10 h-10 object-contain" />
    </div>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-gray-600 text-center">{label}</div>
  </div>
);

const ImpactSection = () => {
  const stats = [
    {
      value: "50k+",
      label: "Active Students",
      icon: "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b"
    },
    {
      value: "500+",
      label: "Expert Teachers",
      icon: "https://images.unsplash.com/photo-1498936178812-4b2e558d2937"
    },
    {
      value: "100k+",
      label: "Completed Courses",
      icon: "https://images.unsplash.com/photo-1452960962994-acf4fd70b632"
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-display font-semibold text-center mb-12">OUR MONTHLY IMPACT</h2>
        <div className="flex flex-wrap justify-center gap-16">
          {stats.map((stat, index) => (
            <ImpactStat 
              key={index}
              value={stat.value}
              label={stat.label}
              icon={stat.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
