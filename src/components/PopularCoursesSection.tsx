import { Button } from "@/components/ui/button";
import { useGetPublishedCoursesQuery } from "@/redux/features/course/courseApi";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDispatch } from "@/redux/hooks";
import { addToCart } from "@/redux/features/cart/cartSlice";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { IEnrolledCourse } from "@/types";
import { Card, CardContent } from "./ui/card";
import { ICourse } from "@/types/course";

interface CourseCardProps {
  title: string;
  description: string;
  imageSrc: string;
  course: any;
}

const CourseCard = ({
  title,
  description,
  imageSrc,
  course,
}: CourseCardProps) => {
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
      (enrolledCourse: IEnrolledCourse) =>
        enrolledCourse.courseId === course._id
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
      <div className="relative h-40 sm:h-44 md:h-48 overflow-hidden p-2">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 rounded-lg"
        />
      </div>
      <div className="p-2 sm:p-3">
        <h3 className="font-semibold text-base sm:text-lg mb-1 line-clamp-1">
          {title}
        </h3>
        <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
          {description}
        </p>
        <div className="flex justify-end">
          <Button
            size="sm"
            className="bg-green-500 hover:bg-green-600 text-white text-xs sm:text-sm"
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
  const {
    data: courses,
    isLoading,
    isError,
  } = useGetPublishedCoursesQuery(undefined);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: userData } = useGetMeQuery(undefined);
  // Handle error state
  if (isError) {
    console.error("Error in PopularCoursesSection:", isError);
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

  // Handle empty courses
  if (!isLoading && (!courses || !courses.data || courses.data.length === 0)) {
    return (
      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-semibold text-center mb-12">
            Popular Courses
          </h2>
          <div className="text-center text-gray-500">
            No courses available at the moment. Check back later!
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-10 sm:py-16 md:py-20 bg-[#f1f8e9]">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 className="text-center text-2xl sm:text-3xl md:text-[38px] font-bold [font-family:'DM_Sans',Helvetica] text-[#333333] mb-6 sm:mb-8 md:mb-12">
          Popular Courses
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {isLoading
            ? // Show skeleton loading state
              Array(4)
                .fill(0)
                .map((_, index) => (
                  <Card
                    key={index}
                    className="overflow-hidden border-[1.01px] border-solid border-[#b8cad0] rounded-xl bg-[#f1f8e9] flex flex-col h-full transition-transform duration-300 hover:shadow-lg"
                  >
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="p-3 sm:p-4 md:p-5 flex flex-col h-full">
                        <Skeleton className="w-full h-[160px] sm:h-[180px] md:h-[220px] rounded-[10px] mb-3 sm:mb-4 md:mb-5" />
                        <Skeleton className="h-6 sm:h-7 md:h-8 w-3/4 mb-2 sm:mb-3" />
                        <Skeleton className="h-16 sm:h-18 md:h-20 w-full mb-2 sm:mb-3" />
                        <div className="flex justify-end mt-auto pt-2 sm:pt-3">
                          <Skeleton className="h-9 sm:h-10 md:h-11 w-24 sm:w-28 md:w-32" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            : courses?.data?.map((course: ICourse) => (
                <Card
                  key={course._id}
                  className="overflow-hidden border-[1.01px] border-solid border-[#b8cad0] rounded-xl bg-[#f1f8e9] cursor-pointer flex flex-col h-full transition-transform duration-300 hover:scale-[1.02] hover:shadow-lg"
                  onClick={() => navigate(`/courses/${course._id}`)}
                >
                  <CardContent className="p-0 flex flex-col h-full">
                    <div className="p-3 sm:p-4 md:p-5 flex flex-col h-full">
                      <div
                        className="w-full h-[160px] sm:h-[180px] md:h-[220px] rounded-[10px] mb-3 sm:mb-4 md:mb-5 bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${
                            course.courseThumbnail ||
                            "/images/default-course.jpg"
                          })`,
                        }}
                      />

                      <h3 className="[font-family:'DM_Sans',Helvetica] font-bold text-[#333333] text-lg sm:text-xl md:text-[25px] mb-2 sm:mb-3 line-clamp-1">
                        {course.title}
                      </h3>

                      <p className="[font-family:'Open_Sans',Helvetica] font-normal text-[#0000008c] text-xs sm:text-sm leading-[20px] sm:leading-[23px] mb-2 sm:mb-3 line-clamp-3 flex-grow">
                        {course.description || "No description available"}
                      </p>

                      <div className="flex justify-end mt-auto pt-2 sm:pt-3">
                        <Button
                          className="bg-[#90ee90] text-black hover:bg-[#7dcc7d] h-9 sm:h-10 md:h-11 px-3 sm:px-4 md:px-5 text-sm sm:text-base"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!userData?.data?._id) {
                              toast.error(
                                "Please login to enroll in this course"
                              );
                              navigate("/login");
                              return;
                            }

                            // Check if student is already enrolled in this course
                            const isAlreadyEnrolled =
                              userData?.data?.enrolledCourses?.some(
                                (enrolledCourse: IEnrolledCourse) =>
                                  enrolledCourse.courseId === course._id
                              );

                            if (isAlreadyEnrolled) {
                              toast.error(
                                "You are already enrolled in this course"
                              );
                              return;
                            }

                            dispatch(
                              addToCart({ course, userId: userData.data._id })
                            );
                            toast.success("Course added to cart");
                          }}
                        >
                          Enroll Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>
      </div>
    </section>
    // <section className="py-10 sm:py-12 md:py-16 bg-green-50">
    //   <div className="responsive-container">
    //     <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-semibold text-center mb-6 sm:mb-8 md:mb-12">
    //       Popular Courses
    //     </h2>
    //     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
    //       {isLoading ? (
    //         // Show skeleton loading state
    //         Array(4).fill(0).map((_, index) => (
    //           <CourseCardSkeleton key={index} />
    //         ))
    //       ) : courses && courses.length > 0 ? (
    //         // Show actual courses
    //         courses.map((course: any) => (
    //           <CourseCard
    //             key={course._id}
    //             title={course.title}
    //             description={course.description || "No description available"}
    //             imageSrc={course.courseThumbnail || "/images/default-course.jpg"}
    //             course={course}
    //           />
    //         ))
    //       ) : (
    //         <div className="col-span-full text-center text-gray-500">
    //           No published courses available at the moment.
    //         </div>
    //       )}
    //     </div>
    //   </div>
    // </section>
  );
};

export default PopularCoursesSection;
