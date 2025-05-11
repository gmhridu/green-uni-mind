import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/ProgressBar";
import { BookOpen, Check, Clock, PlayCircle } from "lucide-react";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useGetCourseByIdQuery } from "@/redux/features/course/course.api";
import { useGetCourseProgressQuery, useGetEnrolledCoursesQuery } from "@/redux/features/student/studentApi";
import { useGetLectureByCourseIdQuery } from "@/redux/features/lecture/lectureApi";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { ICourse, ILecture } from "@/types/course";
import { formatDuration } from "@/utils/formatTime";

const CoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const studentId = userData?.data?._id;

  const {
    data: courseData,
    isLoading: isCourseLoading,
    isError: isCourseError
  } = useGetCourseByIdQuery(courseId || "", { skip: !courseId });

  const {
    data: lecturesData,
    isLoading: isLecturesLoading,
    isError: isLecturesError
  } = useGetLectureByCourseIdQuery({ id: courseId || "" }, { skip: !courseId });

  const {
    data: progressData,
    isLoading: isProgressLoading,
    isError: isProgressError
  } = useGetCourseProgressQuery(
    { studentId: studentId || "", courseId: courseId || "" },
    { skip: !studentId || !courseId }
  );

  const {
    data: enrolledCoursesData,
    isLoading: isEnrolledLoading,
    error: enrolledCoursesError
  } = useGetEnrolledCoursesQuery(
    { studentId: studentId || "" },
    { skip: !studentId }
  );

  const [completedLectures, setCompletedLectures] = useState(0);
  const [totalLectures, setTotalLectures] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [totalDurationFormatted, setTotalDurationFormatted] = useState("--");
  const [lastAccessedLectureId, setLastAccessedLectureId] = useState("");
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (progressData?.data) {
      console.log("Progress Data:", progressData.data);

      // Check if completedLectures is an array or a number
      if (typeof progressData.data.completedLectures === 'number') {
        // If it's a number, use it directly
        setCompletedLectures(progressData.data.completedLectures);
        console.log("Completed Lectures (number):", progressData.data.completedLectures);
      } else {
        // If it's an array or something else, handle accordingly
        const completedLectures = progressData.data.completedLectures || [];
        console.log("Completed Lectures:", completedLectures);
        console.log("Is Array:", Array.isArray(completedLectures));
        setCompletedLectures(Array.isArray(completedLectures) ? completedLectures.length : 0);
      }

      // Set completion percentage
      setCompletionPercentage(progressData.data.percentage || 0);

      // Log lecture progress if available
      if (progressData.data.lectureProgress) {
        console.log("Lecture Progress:", progressData.data.lectureProgress);
      }
    }

    if (lecturesData?.data) {
      const lectures = lecturesData.data;
      setTotalLectures(lectures.length || 0);

      // Calculate total duration from actual lecture durations
      // If duration is not available, use a default of 10 minutes per lecture
      let totalDuration = 0;
      lectures.forEach((lecture: ILecture) => {
        // Use lecture.duration if available, otherwise default to 10 minutes (600 seconds)
        totalDuration += lecture.duration || 600;
      });

      setTotalDurationFormatted(formatDuration(totalDuration, 'compact'));

      // Set the last accessed lecture or the first lecture if none
      if (lectures.length > 0) {
        let firstIncompleteLectureId = lectures[0]._id;

        // If we have lecture progress data, use it to find the first incomplete lecture
        if (progressData?.data?.lectureProgress && Array.isArray(progressData.data.lectureProgress)) {
          console.log("Using lecture progress to find first incomplete lecture");
          const incompleteProgress = progressData.data.lectureProgress.find(
            (lp: { lectureId: string; isCompleted: boolean }) => !lp.isCompleted
          );
          if (incompleteProgress) {
            firstIncompleteLectureId = incompleteProgress.lectureId;
            console.log("Found incomplete lecture:", incompleteProgress);
          }
        } else {
          // Fallback to the old method
          console.log("Falling back to old method to find first incomplete lecture");
          const completedLectures = progressData?.data?.completedLectures || [];
          const isArray = Array.isArray(completedLectures);

          // Find the first incomplete lecture or use the first lecture
          const firstIncompleteLecture = lectures.find((lecture: ILecture) =>
            isArray ? !completedLectures.includes(lecture._id) : true
          );

          if (firstIncompleteLecture) {
            firstIncompleteLectureId = firstIncompleteLecture._id;
          }
        }

        console.log("Setting last accessed lecture ID:", firstIncompleteLectureId);
        setLastAccessedLectureId(firstIncompleteLectureId);
      }
    }

    // Check if student is enrolled in the course
    if (enrolledCoursesData?.data) {
      const isEnrolledInCourse = enrolledCoursesData.data.some(
        (course: ICourse) => course._id === courseId
      );
      setIsEnrolled(isEnrolledInCourse);

      if (!isEnrolledInCourse) {
        toast({
          title: "Access Restricted",
          description: "You need to enroll in this course to access its content.",
          variant: "destructive",
        });
        navigate("/courses");
      }
    }
  }, [progressData, lecturesData, enrolledCoursesData, courseId, navigate, toast]);

  // Loading state
  if (isUserLoading || isCourseLoading || isLecturesLoading || isProgressLoading || isEnrolledLoading) {
    return (
      <div className="bg-white">
        <div className="bg-gradient-to-r from-edu-light to-white py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <div className="flex items-center text-gray-600 space-x-6">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="pt-4">
                  <Skeleton className="h-12 w-40" />
                </div>
              </div>
              <div className="relative">
                <Skeleton className="w-full h-72 rounded-lg" />
                <div className="mt-4">
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isCourseError || isLecturesError || isProgressError || enrolledCoursesError || !courseData?.data || !lecturesData?.data) {
    // Log the error for debugging
    if (enrolledCoursesError) {
      console.error("Enrolled courses error:", enrolledCoursesError);
    }

    return (
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Course</h2>
          <p className="text-gray-600 mb-6">We couldn't load the course data. Please try again later.</p>
          <Button onClick={() => window.location.reload()}>Refresh Page</Button>
        </div>
      </div>
    );
  }

  // If not enrolled, don't render the course content
  if (!isEnrolled) {
    return null;
  }

  const course = courseData.data;
  const lectures = lecturesData.data;

  // If there are no lectures, show a message
  if (lectures.length === 0) {
    return (
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Lectures Available</h2>
          <p className="text-gray-600 mb-6">This course doesn't have any lectures yet. Please check back later.</p>
          <Button onClick={() => navigate("/courses")}>Back to Courses</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-edu-light to-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold">{course.title}</h1>
              <p className="text-lg text-gray-700">{course.description || "No description available"}</p>

              <div className="flex items-center text-gray-600 space-x-6">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{totalDurationFormatted}</span>
                </div>
                <div className="flex items-center">
                  <PlayCircle className="w-4 h-4 mr-1" />
                  <span>{totalLectures} Lectures</span>
                </div>
              </div>

              <div className="pt-4">
                <Button size="lg" asChild>
                  <Link
                    to={`/student/course/${courseId}/lecture/${lastAccessedLectureId}`}
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Continue Learning
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <img
                src={course.courseThumbnail || "/images/default-course.jpg"}
                alt={course.title}
                className="w-full h-72 object-cover rounded-lg shadow-lg"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Your Progress:</span>
                  <span className="font-semibold text-edu-purple">
                    {Math.min(100, Math.max(0, completionPercentage)).toFixed(0)}%
                  </span>
                </div>
                <ProgressBar
                  percentage={completionPercentage}
                  size="lg"
                  showPercentageInBar={true}
                />
                <div className="mt-2 text-xs text-gray-500 flex items-center justify-end">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {Math.min(completedLectures, totalLectures)} of {totalLectures} lectures completed
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course content */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8">Course Content</h2>

        <div className="space-y-4">
          {lectures.map((lecture: ILecture, index: number) => {
            let isCompleted = false;

            // First check if we have lecture progress data
            if (progressData?.data?.lectureProgress && Array.isArray(progressData.data.lectureProgress)) {
              // Find this lecture in the progress data
              const lectureProgress = progressData.data.lectureProgress.find(
                (lp: { lectureId: string }) => lp.lectureId === lecture._id
              );
              isCompleted = lectureProgress?.isCompleted || false;
            } else {
              // Fall back to the old method
              const completedLectures = progressData?.data?.completedLectures || [];
              const isArray = Array.isArray(completedLectures);
              isCompleted = isArray ? completedLectures.includes(lecture._id) : false;
            }

            // Previous lecture is completed if it's the first lecture or if the previous lecture is marked as completed
            const isPreviousCompleted = index === 0 ||
              (index > 0 && lectures[index - 1] &&
                (progressData?.data?.lectureProgress?.find(
                  (lp: { lectureId: string }) => lp.lectureId === lectures[index - 1]._id
                )?.isCompleted || false));

            return (
              <div key={lecture._id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full mr-3 bg-gray-100 text-gray-700">
                      {isCompleted ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{lecture.lectureTitle}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatDuration(lecture.duration || 600, 'compact')}</span> {/* Use actual duration or default to 10 minutes */}

                        {lecture.isPreviewFree && (
                          <span className="ml-3 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                            Preview
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/student/course/${courseId}/lecture/${lecture._id}`}
                    className={`text-edu-purple hover:underline text-sm ${
                      !isCompleted && !isPreviousCompleted && !lecture.isPreviewFree ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    {isCompleted
                      ? "Review"
                      : lecture.isPreviewFree
                      ? "Preview"
                      : isPreviousCompleted
                      ? "Start"
                      : "Locked"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link
              to={`/student/course/${courseId}/lecture/${lastAccessedLectureId}`}
            >
              Continue Learning
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
