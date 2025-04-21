import { Button } from "@/components/ui/button";

const StudentsInActionSection = () => {
  return (
    <section className="py-16 bg-green-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="rounded-3xl overflow-hidden relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="577"
              height="498"
              viewBox="0 0 577 498"
              fill="none"
              className="w-96 h-auto"
            >
              <path
                d="M92.2818 19.8498C198.646 -14.9519 437.023 -1.31328 538.21 49.2431C639.397 99.7995 515.855 409.017 439.376 453.695C362.898 498.373 202.881 528.942 92.2818 441.938C-18.3177 354.933 -40.673 63.3519 92.2818 19.8498Z"
                fill="#D8F6B5"
              />
            </svg>
            <img
              src="/images/studentAction.png"
              alt="Students in a workshop"
              className="w-96 h-auto object-cover absolute inset-0"
            />
          </div>
          <div className="md:flex-1">
            <h2 className="text-3xl font-display font-semibold mb-6">
              Students in Action
            </h2>
            <p className="text-gray-700 mb-4">
              It is a long established fact that a reader will be distracted by
              the readable content of a page when looking at its layout. The
              point of using Lorem Ipsum is that it has a more-or-less normal
              distribution of letters, as opposed to using 'Content here, It is
              a long established fact that a reader will be distracted by the
              readable content of a page when looking at its layout. The point
              of using Lorem Ipsum is that it has a more-or-less normal
              distribution of letters, as opposed to using 'Content here,
            </p>
            <Button className="bg-green-500 hover:bg-green-600 text-white">
              Explore Projects
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentsInActionSection;
