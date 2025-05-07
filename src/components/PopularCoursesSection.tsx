import { Button } from "@/components/ui/button";
import { useGetPublishedCoursesQuery } from "@/redux/features/course/courseApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDispatch } from "@/redux/hooks";
import { addToCart } from "@/redux/features/cart/cartSlice";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { IEnrolledCourse } from "@/types";

interface CourseCardProps {
  title: string;
  description: string;
  imageSrc: string;
  course: any;
}

const CourseCard = ({ title, description, imageSrc, course }: CourseCardProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: userData } = useGetMeQuery(undefined);

  const handleEnroll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userData?.data?._id) {
      toast.error("Please login to enroll in this course");
      navigate("/login");
      return;
    }

    // Check if student is already enrolled in this course
    const isAlreadyEnrolled = userData?.data?.enrolledCourses?.some(
      (enrolledCourse: IEnrolledCourse) => enrolledCourse.courseId === course._id
    );

    if (isAlreadyEnrolled) {
      toast.error("You are already enrolled in this course");
      return;
    }

    dispatch(addToCart({ course, userId: userData.data._id }));
    toast.success("Course added to cart");
  };

  const handleCardClick = () => {
    navigate(`/courses/${course._id}`);
  };

  return (
    <div
      className="rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow hover-scale border border-[#B9CAD0] cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative h-48 overflow-hidden p-2">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 rounded-lg"
        />
      </div>
      <div className="p-2">
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-gray-600 text-sm mb-3">{description}</p>
        <div className="flex justify-end">
          <Button
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={handleEnroll}
          >
            Enroll Now
          </Button>
        </div>
      </div>
    </div>
  );
};

const CourseCardSkeleton = () => (
  <div className="rounded-lg overflow-hidden shadow-sm border border-[#B9CAD0]">
    <div className="relative h-48 overflow-hidden p-2">
      <Skeleton className="w-full h-full rounded-lg" />
    </div>
    <div className="p-2">
      <Skeleton className="h-6 w-3/4 mb-1" />
      <Skeleton className="h-4 w-full mb-3" />
      <div className="flex justify-end">
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  </div>
);

const PopularCoursesSection = () => {
  const { data: courses, isLoading, isError } = useGetPublishedCoursesQuery(undefined);

  if (isError) {
    return (
      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-semibold text-center mb-12">
            Popular Courses
          </h2>
          <div className="text-center text-red-500">
            Error loading courses. Please try again later.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-green-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-display font-semibold text-center mb-12">
          Popular Courses
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {isLoading ? (
            // Show skeleton loading state
            Array(4).fill(0).map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))
          ) : courses && courses.length > 0 ? (
            // Show actual courses
            courses.map((course: any) => (
              <CourseCard
                key={course._id}
                title={course.title}
                description={course.description || "No description available"}
                imageSrc={course.courseThumbnail || "/images/default-course.jpg"}
                course={course}
              />
            ))
          ) : (
            <div className="col-span-2 text-center text-gray-500">
              No published courses available at the moment.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PopularCoursesSection;
