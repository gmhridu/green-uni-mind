import React, { useState, useEffect } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import CourseLayout from "@/components/Course/CourseLayout";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useGetCourseByIdQuery } from "@/redux/features/course/course.api";
import {
  useGetLectureByCourseIdQuery,
  useGetLectureByIdQuery,
} from "@/redux/features/lecture/lectureApi";
import {
  useGetCourseProgressQuery,
  useMarkLectureCompleteMutation,
  useGetEnrolledCoursesQuery,
} from "@/redux/features/student/studentApi";
import { Skeleton } from "@/components/ui/skeleton";
import { ICourse, ILecture } from "@/types/course";
import CourseCompletionModal from "@/components/Course/CourseCompletionModal";

const LecturePage = () => {
  const { courseId, lectureId } = useParams<{
    courseId: string;
    lectureId: string;
  }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Get user data
  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const studentId = userData?.data?._id;

  // Get course data
  const { data: courseData, isLoading: isCourseLoading } =
    useGetCourseByIdQuery(courseId || "", { skip: !courseId });

  // Get all lectures for the course
  const { data: lecturesData, isLoading: isLecturesLoading } =
    useGetLectureByCourseIdQuery({ id: courseId || "" }, { skip: !courseId });

  // Get current lecture data
  const {
    data: currentLectureData,
    isLoading: isCurrentLectureLoading,
    error: currentLectureError,
    refetch: refetchCurrentLecture,
  } = useGetLectureByIdQuery({ id: lectureId || "" }, { skip: !lectureId });

  // Get course progress
  const {
    data: progressData,
    isLoading: isProgressLoading,
    refetch: refetchProgress,
  } = useGetCourseProgressQuery(
    { studentId: studentId || "", courseId: courseId || "" },
    { skip: !studentId || !courseId }
  );

  const {
    data: enrolledCoursesData,
    isLoading: isEnrolledLoading,
    error: enrolledCoursesError,
  } = useGetEnrolledCoursesQuery(
    { studentId: studentId || "" },
    { skip: !studentId }
  );

  const [markLectureComplete, { isLoading: isMarkingComplete }] =
    useMarkLectureCompleteMutation();

  // Reset state when lectureId changes
  useEffect(() => {
    setAccessGranted(null);

    if (lectureId && courseId && studentId) {
      refetchCurrentLecture();
      refetchProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureId, courseId, studentId]);

  // Check if the user can access this lecture
  useEffect(() => {
    if (
      !isUserLoading &&
      !isCourseLoading &&
      !isLecturesLoading &&
      !isCurrentLectureLoading &&
      !isProgressLoading &&
      !isEnrolledLoading
    ) {
      if (!lectureId || !courseId || !studentId) {
        console.error("Missing required IDs for access check:", {
          lectureId,
          courseId,
          studentId,
        });
        setAccessGranted(false);
        return;
      }

      const currentLecture = currentLectureData?.data;
      const lectures = lecturesData?.data;
      const progress = progressData?.data;
      const enrolledCourses = enrolledCoursesData?.data;

      if (!currentLecture || !lectures || !progress || !enrolledCourses) {
        console.error("Missing required data for access check:", {
          hasCurrentLecture: !!currentLecture,
          hasLectures: !!lectures,
          hasProgress: !!progress,
          hasEnrolledCourses: !!enrolledCourses,
        });
        setAccessGranted(false);
        return;
      }

      // Check if student is enrolled in the course
      const isEnrolledInCourse = enrolledCourses.some(
        (course: ICourse) => course._id === courseId
      );

      if (!isEnrolledInCourse) {
        toast({
          title: "Access Restricted",
          description:
            "You need to enroll in this course to access its content.",
          variant: "destructive",
        });
        navigate("/courses");
        setAccessGranted(false);
        return;
      }

      // For preview lectures, always grant access
      if (currentLecture.isPreviewFree) {
        setAccessGranted(true);
        return;
      }

      // Find the index of the current lecture
      const currentLectureIndex = lectures.findIndex(
        (lecture: ILecture) => lecture._id === lectureId
      );

      if (currentLectureIndex === 0) {
        // First lecture is always accessible
        setAccessGranted(true);
        return;
      }

      // Check if the current lecture is already completed
      const completedLectures =
        progress.lectureProgress
          ?.filter((lp) => lp.isCompleted)
          .map((lp) => lp.lectureId) || [];

      // If the current lecture is already completed, grant access
      if (completedLectures.includes(lectureId)) {
        setAccessGranted(true);
        return;
      }

      // Check if the previous lecture is completed
      const previousLectureId = lectures[currentLectureIndex - 1]?._id;
      const isPreviousLectureCompleted =
        completedLectures.includes(previousLectureId);

      if (isPreviousLectureCompleted) {
        setAccessGranted(true);
      } else {
        setAccessGranted(false);
        toast({
          title: "Access Restricted",
          description: "You need to complete the previous lectures first.",
          variant: "destructive",
        });
      }
    }
  }, [
    lectureId,
    courseId,
    studentId,
    isUserLoading,
    isCourseLoading,
    isLecturesLoading,
    isCurrentLectureLoading,
    isProgressLoading,
    isEnrolledLoading,
    currentLectureData,
    lecturesData,
    progressData,
    enrolledCoursesData,
    toast,
    navigate,
  ]);

  // Handle marking lecture as complete
  const handleMarkComplete = async () => {
    console.log("LecturePage: handleMarkComplete called");

    if (!studentId || !courseId || !lectureId) {
      console.error("Missing required IDs:", {
        studentId,
        courseId,
        lectureId,
      });
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if lecture is already completed
      const isAlreadyCompleted = progressData?.data?.lectureProgress?.some(
        (lp: { lectureId: string; isCompleted: boolean }) =>
          lp.lectureId === lectureId && lp.isCompleted
      );

      console.log("LecturePage: isAlreadyCompleted:", isAlreadyCompleted);

      if (isAlreadyCompleted) {
        console.log("LecturePage: Lecture already completed, returning");
        toast({
          title: "Already Completed",
          description: "This lecture is already marked as complete.",
        });
        return;
      }

      // Find the next lecture to navigate to before making the API call
      const lectures = lecturesData?.data;
      if (!lectures || !Array.isArray(lectures)) {
        console.error("Lectures data is missing or invalid:", lecturesData);
        return;
      }

      // Find the current lecture index
      const currentLectureIndex = lectures.findIndex(
        (lecture: ILecture) => lecture._id === lectureId
      );

      // Determine the next lecture ID or course page
      let nextUrl = "";
      let nextLectureId = "";

      if (
        currentLectureIndex >= 0 &&
        currentLectureIndex < lectures.length - 1
      ) {
        // Get the next lecture ID
        nextLectureId = lectures[currentLectureIndex + 1]._id;
        nextUrl = `/student/course/${courseId}/lecture/${nextLectureId}`;
      } else if (currentLectureIndex === lectures.length - 1) {
        nextUrl = `/student/course/${courseId}`;
      } else {
        console.error("Invalid lecture index:", currentLectureIndex);
        toast({
          title: "Error",
          description: "Could not determine the next lecture",
          variant: "destructive",
        });
        return;
      }

      // Check if this was the last lecture in the course
      const isLastLecture = currentLectureIndex === lectures.length - 1;
      console.log("LecturePage: isLastLecture:", isLastLecture);

      // Show loading toast
      toast({
        title: "Updating Progress",
        description: "Marking lecture as complete...",
      });

      // Call the API to mark the lecture as complete
      console.log("LecturePage: Calling markLectureComplete API with:", {
        studentId,
        courseId,
        lectureId,
      });

      const result = await markLectureComplete({
        studentId,
        courseId,
        lectureId,
      }).unwrap();

      console.log("LecturePage: API call result:", result);

      // Update with success message
      if (!isLastLecture) {
        console.log("LecturePage: Navigating to next lecture:", nextUrl);
        toast({
          title: "Success",
          description: "Lecture completed! Moving to next lecture...",
        });

        // Use React Router navigation instead of page reload
        // This provides a smoother user experience
        setTimeout(() => {
          // Refetch progress data before navigating
          refetchProgress();
          // Navigate to the next lecture
          navigate(nextUrl);
        }, 500);
      } else {
        // This was the last lecture, show the completion modal
        console.log("LecturePage: Showing course completion modal");
        toast({
          title: "Course Complete!",
          description: "Congratulations! You've completed the entire course.",
        });

        // Refetch progress data before showing the modal
        await refetchProgress();

        // Show the completion modal instead of navigating
        setShowCompletionModal(true);
      }
    } catch (error) {
      console.error("Error marking lecture as complete:", error);
      toast({
        title: "Error",
        description: "Failed to mark lecture as complete",
        variant: "destructive",
      });
    }
  };

  if (
    isUserLoading ||
    isCourseLoading ||
    isLecturesLoading ||
    isCurrentLectureLoading ||
    isProgressLoading ||
    isEnrolledLoading
  ) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4 h-full">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-8 w-20" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex flex-col space-y-1">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main content skeleton */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video player skeleton */}
            <Skeleton className="w-full aspect-video rounded-xl" />

            {/* Navigation buttons skeleton */}
            <div className="flex justify-between">
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-28" />
            </div>

            {/* Lecture content and notes skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {/* Lecture content skeleton */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <Skeleton className="h-8 w-64 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-9 w-36" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Lecture Interactions skeleton */}
                <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <div className="flex space-x-4 border-b mb-4">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-6 w-24 mb-2" />
                  </div>
                  <Skeleton className="h-8 w-32 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                </div>
              </div>

              <div className="lg:col-span-1">
                {/* Notes section skeleton */}
                <div className="bg-white rounded-lg shadow-sm border p-6 h-full">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <Skeleton className="h-64 w-full mb-4" />
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Handle errors
  if (enrolledCoursesError) {
    console.error("Enrolled courses error:", enrolledCoursesError);
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Error Loading Enrolled Courses
        </h2>
        <p className="text-gray-600 mb-6">
          We couldn't load your enrolled courses. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    );
  }

  // Handle lecture error
  if (currentLectureError) {
    console.error("Lecture error:", currentLectureError);

    // Check if it's an access error (403)
    const errorStatus = (currentLectureError as { status?: number })?.status;
    if (errorStatus === 403) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Restricted
          </h2>
          <p className="text-gray-600 mb-6">
            You must be enrolled in this course to access this lecture.
          </p>
          <Button onClick={() => navigate(`/courses/${courseId}`)}>
            View Course
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Error Loading Lecture
        </h2>
        <p className="text-gray-600 mb-6">
          We couldn't load the lecture content. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()}>Refresh Page</Button>
      </div>
    );
  }

  // If no lectureId is provided, redirect to the first lecture
  if (!lectureId && lecturesData?.data && lecturesData.data.length > 0) {
    return (
      <Navigate
        to={`/student/course/${courseId}/lecture/${lecturesData.data[0]._id}`}
        replace
      />
    );
  }

  // If access check is still in progress, show loading state
  if (accessGranted === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-edu-purple mb-4"></div>
        <p className="text-gray-600">Checking access...</p>
      </div>
    );
  }

  // If access is denied, redirect to the last accessible lecture
  if (accessGranted === false && progressData?.data) {
    // Find the last completed lecture or the first lecture
    const lectures = lecturesData?.data || [];
    let lastAccessibleLectureId = lectures[0]?._id;

    // Find the last completed lecture
    const completedLectures =
      progressData.data.lectureProgress
        ?.filter(
          (lp: { lectureId: string; isCompleted: boolean }) => lp.isCompleted
        )
        ?.map(
          (lp: { lectureId: string; isCompleted: boolean }) => lp.lectureId
        ) || [];

    if (completedLectures.length > 0) {
      // Get the last completed lecture that exists in the course
      for (let i = lectures.length - 1; i >= 0; i--) {
        if (completedLectures.includes(lectures[i]._id)) {
          lastAccessibleLectureId = lectures[i]._id;
          break;
        }
      }
    }

    return (
      <Navigate
        to={`/student/course/${courseId}/lecture/${lastAccessibleLectureId}`}
        replace
      />
    );
  }

  return (
    <>
      <CourseLayout
        onMarkComplete={handleMarkComplete}
        isMarkingComplete={isMarkingComplete}
        isCompleted={
          progressData?.data?.lectureProgress?.some(
            (lp: { lectureId: string; isCompleted: boolean }) =>
              lp.lectureId === lectureId && lp.isCompleted
          ) || false
        }
      />

      {/* Course Completion Modal */}
      <CourseCompletionModal
        open={showCompletionModal}
        onOpenChange={setShowCompletionModal}
        courseId={courseId || ""}
        courseTitle={courseData?.data?.title || "this course"}
        percentage={progressData?.data?.percentage || 0}
      />
    </>
  );
};

export default LecturePage;
