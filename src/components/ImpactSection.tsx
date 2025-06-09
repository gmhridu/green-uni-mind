interface ImpactStatProps {
  id: number;
  imageUrl: string;
  imageClassName: string;
  value: string;
  label: string;
}

const ImpactStat = ({
  value,
  label,
  id,
  imageUrl,
  imageClassName,
}: ImpactStatProps) => (
  <div className="flex flex-col items-center">
    <div className="size-20 sm:size-24 md:size-28 relative">
      <div
        className="absolute bg-[#2E3192] rounded-full left-[1.8rem] sm:left-[2.2rem] md:left-[2.5rem] -top-[0.8rem] sm:-top-[0.9rem] md:-top-[1rem]
        w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6 z-20 flex items-center justify-center"
      >
        <p className="text-[10px] sm:text-xs text-white">{id}</p>
      </div>

      <div className="absolute inset-0 rounded-full border-3 sm:border-4 border-[#53AC8F] flex items-center justify-center" />
      <img src={imageUrl} alt={label} className={imageClassName} />
    </div>
    <h2 className="text-xs sm:text-sm font-semibold mt-1 sm:mt-2">{label}</h2>
    <p className="text-lg sm:text-xl text-[#333] font-semibold capitalize">{value}</p>
  </div>
);

const DashedConnector = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="241"
    height="36"
    viewBox="0 0 241 36"
    fill="none"
    className="hidden md:block "
  >
    <path
      d="M1.164 14.2479C38.578 -0.621807 61.1547 -5.6243 96.138 14.2479C177.202 60.2959 200.226 14.2479 239.079 10.4105"
      stroke="#3EB3E3"
      strokeWidth="1.91867"
      strokeLinecap="round"
      strokeDasharray="5.76 5.76"
    />
  </svg>
);

const ImpactSection = () => {
  const stats = [
    {
      id: 1,
      imageUrl: "/images/impact1.png",
      imageClassName: "absolute bottom-[4px] -left-[1px]",
      label: "Wait two hours",
      value: "10k",
    },
    {
      id: 2,
      imageUrl: "/images/impact2.png",
      imageClassName: "absolute top-[4px]",
      label: "Teachers",
      value: "500k",
    },
    {
      id: 3,
      imageUrl: "/images/impact3.png",
      imageClassName: "absolute bottom-[4px] -right-[1px]",
      label: "Projects",
      value: "300k",
    },
  ];

  return (
    <section className="py-10 sm:py-12 md:py-16 bg-white">
      <div className="responsive-container">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center mb-1 sm:mb-2">
          Our Monthly Impact
        </h2>
        <p className="text-center text-gray-500 text-sm sm:text-base mb-8 sm:mb-10 md:mb-12">
          Real-time results from a global community of learners and
          changemakers.
        </p>

        <div className="flex flex-col gap-6 sm:gap-8 items-center md:flex-row md:justify-center md:gap-0">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center justify-around">
              <ImpactStat
                imageUrl={stat.imageUrl}
                imageClassName={stat.imageClassName}
                id={stat.id}
                value={stat.value}
                label={stat.label}
              />
              {index < stats.length - 1 && <DashedConnector />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImpactSection;
