import { Link } from "react-router-dom";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import {
  useGetEnrolledCoursesQuery,
  useGetCourseProgressQuery,
} from "@/redux/features/student/studentApi";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/ProgressBar";
import { BookOpen, Clock, Medal, PlayCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ICourse } from "@/types/course";
import { formatDuration } from "@/utils/formatTime";

// Define a type for the creator object
interface ICreator {
  _id: string;
  name: {
    firstName: string;
    middleName: string;
    lastName: string;
  };
  [key: string]: any;
}

const Dashboard = () => {
  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const studentId = userData?.data?._id;
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const {
    data: enrolledCoursesData,
    isLoading: isCoursesLoading,
    isFetching,
  } = useGetEnrolledCoursesQuery(
    {
      studentId: studentId || "",
    },
    {
      skip: !studentId,
    }
  );

  // Get enrolled courses data with progress
  const enrolledCourses = enrolledCoursesData?.data || [];
  console.log(enrolledCourses);

  // Get the most recently accessed course (first course for now)
  const recentCourse = enrolledCourses.length > 0 ? enrolledCourses[0] : null;

  // Set the selected course ID when recent course is available
  useEffect(() => {
    if (recentCourse) {
      setSelectedCourseId(recentCourse._id);
    }
  }, [recentCourse]);

  // Get detailed course progress for the selected course
  const { data: courseProgressData, isLoading: isProgressLoading } =
    useGetCourseProgressQuery(
      {
        studentId: studentId || "",
        courseId: selectedCourseId,
      },
      {
        skip: !studentId || !selectedCourseId,
      }
    );

  // Combine loading states to ensure we show loading state during initial load
  const isLoading = isUserLoading || isCoursesLoading || isProgressLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
              <CardFooter className="pt-2">
                <Skeleton className="h-4 w-32" />
              </CardFooter>
            </Card>
          ))}
        </div>

        <Skeleton className="h-8 w-48 mb-4" />
        <Card className="mb-8">
          <div className="flex flex-col md:flex-row">
            <Skeleton className="w-full md:w-1/3 h-48" />
            <div className="p-6 md:w-2/3">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-4 w-1/2 mb-6" />
              <Skeleton className="h-4 w-full mb-6" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (studentId && !isLoading && !isFetching && enrolledCourses.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Welcome to Your Dashboard</h1>
          <p className="text-gray-600 mb-8">
            You haven't enrolled in any courses yet.
          </p>
          <Button asChild>
            <Link to="/courses">Browse Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show main content when data is available or still loading/fetching
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
          <p className="text-gray-600">Track your learning progress</p>
        </div>

        {/* Only show continue learning button when we have course data */}
        {!isFetching && recentCourse && (
          <Button asChild>
            <Link to={`/student/course/${recentCourse._id}`}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Continue Learning
            </Link>
          </Button>
        )}
      </div>

      {/* Course progress summary - only show if we have enrolled courses */}
      {(isFetching || enrolledCourses.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {isFetching ? (
            // Loading state for progress cards
            <>
              <Card>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
                <CardFooter className="pt-2">
                  <Skeleton className="h-4 w-32" />
                </CardFooter>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
                <CardFooter className="pt-2">
                  <Skeleton className="h-4 w-32" />
                </CardFooter>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
                <CardFooter className="pt-2">
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            </>
          ) : recentCourse ? (
            // Actual progress cards when data is loaded and we have a recent course
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Course Progress</CardTitle>
                  <CardDescription>Your learning journey</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Ensure percentage is clamped between 0-100 */}
                  <div className="text-3xl font-bold text-edu-purple mb-2">
                    {Math.min(100, Math.max(0,
                      courseProgressData?.data?.percentage ||
                      recentCourse?.progress ||
                      0
                    )).toFixed(0)}
                    %
                  </div>
                  <ProgressBar
                    percentage={
                      courseProgressData?.data?.percentage ||
                      recentCourse?.progress ||
                      0
                    }
                    size="lg"
                    showPercentageInBar={true}
                  />
                </CardContent>
                <CardFooter className="pt-2">
                  <div className="text-sm text-gray-500 flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {/* Display completed lectures count */}
                    {courseProgressData?.data?.completedLectures !== undefined
                      ? courseProgressData?.data?.completedLectures
                      : recentCourse?.completedLectures || 0}{" "}
                    of{" "}
                    {courseProgressData?.data?.totalLectures !== undefined
                      ? courseProgressData?.data?.totalLectures
                      : recentCourse?.totalLectures || 0}{" "}
                    lectures completed
                  </div>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Time Remaining</CardTitle>
                  <CardDescription>Estimated study time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {courseProgressData?.data?.percentage === 100 || recentCourse?.progress === 100
                      ? "0m"
                      : formatDuration(
                          // Calculate remaining time in seconds (assuming average 10 minutes per lecture)
                          ((courseProgressData?.data?.remainingLectures ||
                            Math.max(0, (recentCourse?.totalLectures || 0) -
                              (recentCourse?.completedLectures || 0))) *
                            600), // 600 seconds = 10 minutes
                          'compact'
                        )
                    }
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <div className="text-sm text-gray-500 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    To complete this course
                  </div>
                </CardFooter>
              </Card>

              <Card
                className={
                  // Only show active styling if percentage is EXACTLY 100%
                  (courseProgressData?.data?.percentage === 100) ||
                  (recentCourse?.progress === 100)
                    ? ""
                    : "opacity-50"
                }
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Course Certificate</CardTitle>
                  <CardDescription>Your achievement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`flex justify-center items-center h-16 ${
                      // Only show active styling if percentage is EXACTLY 100%
                      (courseProgressData?.data?.percentage === 100) ||
                      (recentCourse?.progress === 100)
                        ? "text-edu-purple"
                        : "text-gray-400"
                    }`}
                  >
                    <Medal className="h-12 w-12" />
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button
                    className="w-full"
                    disabled={
                      // Only enable if percentage is EXACTLY 100%
                      !(
                        (courseProgressData?.data?.percentage === 100) ||
                        (recentCourse?.progress === 100)
                      )
                    }
                    variant={
                      // Only show active styling if percentage is EXACTLY 100%
                      (courseProgressData?.data?.percentage === 100) ||
                      (recentCourse?.progress === 100)
                        ? "default"
                        : "outline"
                    }
                  >
                    {(courseProgressData?.data?.percentage === 100) ||
                     (recentCourse?.progress === 100)
                      ? "Download Certificate"
                      : "Complete the course first"}
                  </Button>
                </CardFooter>
              </Card>
            </>
          ) : (
            // Fallback if somehow we have enrolled courses but no recent course
            <div className="col-span-3 text-center py-4">
              <p className="text-gray-500">
                Course progress information is not available
              </p>
            </div>
          )}
        </div>
      )}

      {/* Enrolled courses - only show if we have enrolled courses or are fetching */}
      {(isFetching || enrolledCourses.length > 0) && (
        <>
          <h2 className="text-2xl font-semibold mb-4">Your Enrolled Courses</h2>
          <div className="space-y-6">
            {/* Show loading indicators if still fetching data */}
            {isFetching
              ? // Loading state for course cards
                [1, 2].map((i) => (
                  <Card key={`loading-${i}`} className="mb-8">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3">
                        <Skeleton className="w-full h-48 md:h-full" />
                      </div>
                      <div className="p-6 md:w-2/3">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-4" />
                        <Skeleton className="h-4 w-1/2 mb-6" />
                        <div className="flex gap-4">
                          <Skeleton className="h-10 w-32" />
                          <Skeleton className="h-10 w-32" />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              : // Actual course cards when data is loaded
                enrolledCourses.map((course: ICourse) => (
                  <Card key={course._id} className="mb-8">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3 p-2">
                        <img
                          src={course.courseThumbnail}
                          alt={course.title}
                          className="w-full h-48 md:h-full object-cover rounded-md"
                        />
                      </div>
                      <div className="p-6 md:w-2/3">
                        <CardTitle className="mb-2">{course.title}</CardTitle>
                        <CardDescription className="mb-4">
                          {course.description}
                        </CardDescription>

                        <div className="flex items-center mb-4">
                          <span className="text-sm text-gray-500">
                            Instructor:{" "}
                            {typeof course.creator === "object" &&
                            course.creator &&
                            "name" in course.creator
                              ? `${
                                  (course.creator as unknown as ICreator).name
                                    .firstName
                                } ${
                                  (course.creator as unknown as ICreator).name
                                    .lastName
                                }`
                              : "Unknown"}
                          </span>
                          <span className="mx-2">•</span>
                          <span className="text-sm text-gray-500">
                            {course.lectures?.length || 0} lectures
                          </span>
                        </div>

                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-500">Your Progress:</span>
                          <span className="text-sm font-semibold text-edu-purple">
                            {Math.min(100, Math.max(0, course.progress ?? 0)).toFixed(0)}%
                          </span>
                        </div>
                        <ProgressBar
                          percentage={course.progress ?? 0}
                          className="mb-6"
                          size="md"
                        />

                        <div className="flex gap-4">
                          <Button asChild>
                            <Link to={`/student/course/${course._id}`}>
                              Continue Learning
                            </Link>
                          </Button>

                          <Button variant="outline" asChild>
                            <Link to={`/student/course/${course._id}`}>
                              Course Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
