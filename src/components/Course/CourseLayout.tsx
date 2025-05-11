import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import CourseNavigation from "@/components/Course/CourseNavigation";
import CloudinaryVideoPlayer from "@/components/Course/CloudinaryVideoPlayer";
import LectureNotes from "@/components/Course/LectureNotes";
import LectureInteractions from "@/components/Course/LectureInteraction";
import LectureContent from "@/components/Course/LectureContent";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { formatTimeDisplay } from "@/utils/formatTime";

import {
  useGetLectureByIdQuery,
  useGetLectureByCourseIdQuery,
} from "@/redux/features/lecture/lectureApi";
import { useGetCourseByIdQuery } from "@/redux/features/course/course.api";
import { useGetCourseProgressQuery } from "@/redux/features/student/studentApi";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { Skeleton } from "@/components/ui/skeleton";
import { ICourse, ILecture } from "@/types/course";
import { useToast } from "@/hooks/use-toast";
import { useAppSelector } from "@/redux/hooks";
import { selectLastPosition } from "@/redux/features/player/playerSlice";
import Navbar from "../Navbar";

interface CourseLayoutProps {
  onMarkComplete?: () => void;
  isMarkingComplete?: boolean;
  isCompleted?: boolean;
}

const CourseLayout = ({
  onMarkComplete,
  isMarkingComplete = false,
  isCompleted = false,
}: CourseLayoutProps) => {
  const { courseId, lectureId } = useParams<{
    lectureId: string;
    courseId: string;
  }>();

  const navigate = useNavigate();
  const { toast } = useToast();

  // State for video player
  const [currentTime, setCurrentTime] = useState(0);

  // Get user data
  const { data: userData } = useGetMeQuery(undefined);
  const studentId = userData?.data?._id;

  // Get the last position from Redux store for the current lecture
  const currentLectureId = lectureId || "";
  const lastPosition = useAppSelector((state) =>
    selectLastPosition(state, currentLectureId)
  );

  // Fetch course data
  const { data: courseData } = useGetCourseByIdQuery(courseId || "", {
    skip: !courseId,
  });

  // Fetch all lectures for the course
  const { data: lecturesData, isLoading: isLecturesLoading } =
    useGetLectureByCourseIdQuery({ id: courseId || "" }, { skip: !courseId });

  // Fetch current lecture data
  const {
    data: currentLectureData,
    error,
    isLoading,
  } = useGetLectureByIdQuery({ id: lectureId || "" }, { skip: !lectureId });

  const { data: progressData } = useGetCourseProgressQuery(
    { studentId: studentId || "", courseId: courseId || "" },
    { skip: !studentId || !courseId }
  );

  const lectures: ILecture[] = lecturesData?.data || [];

  const currentLectureIndex = lectures.findIndex(
    (lecture: ILecture) => lecture._id === currentLectureId
  );

  const nextLectureId =
    currentLectureIndex < lectures.length - 1
      ? lectures[currentLectureIndex + 1]?._id
      : null;

  const prevLectureId =
    currentLectureIndex > 0 ? lectures[currentLectureIndex - 1]?._id : null;

  if (isLoading || isLecturesLoading) {
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

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">
          Error Loading Lecture
        </h2>
        <p className="text-gray-600">
          We couldn't load the lecture content. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Refresh Page
        </Button>
      </div>
    );
  }

  if (!currentLectureData?.data) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Lecture Not Found
        </h2>
        <p className="text-gray-600">
          The lecture you're looking for doesn't exist or has been removed.
        </p>
        <Button
          onClick={() => navigate(`/student/course/${courseId}`)}
          className="mt-4"
        >
          Back to Course
        </Button>
      </div>
    );
  }

  const currentLecture = currentLectureData.data;

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleVideoComplete = () => {
    console.log('CourseLayout: handleVideoComplete called, isCompleted:', isCompleted);

    if (onMarkComplete && !isCompleted) {
      console.log('CourseLayout: Calling onMarkComplete');
      // Call the onMarkComplete function which will handle navigation
      onMarkComplete();
    } else if (isCompleted && nextLectureId) {
      console.log('CourseLayout: Lecture already completed, navigating to next lecture');
      toast({
        title: "Moving to Next Lecture",
        description: "You've already completed this lecture. Moving to the next one...",
      });

      // Use React Router navigation for a smoother experience
      navigate(`/student/course/${courseId}/lecture/${nextLectureId}`);
    } else {
      console.log('CourseLayout: No action taken on video completion');
    }
  };

  const handleSeek = (time: number) => {
    // Find the video element and seek to the specified time
    const videoElement = document.querySelector("video");
    if (videoElement) {
      videoElement.currentTime = time;
    }
  };

  const handleNavigate = async (lectureId: string | null) => {
    if (!lectureId) return;

    if (nextLectureId === lectureId && !isCompleted) {
      const videoElement = document.querySelector("video");
      const currentProgress = videoElement
        ? videoElement.currentTime / videoElement.duration
        : 0;

      console.log("Current video progress:", currentProgress);

      if (currentProgress < 0.5) {
        toast({
          title: "Watch More to Continue",
          description:
            "Please watch at least 50% of this lecture before moving to the next one.",
          variant: "destructive",
        });
        return;
      } else if (onMarkComplete) {
        toast({
          title: "Marking Lecture Complete",
          description: "Marking lecture as complete...",
        });

        try {
          // Call onMarkComplete which will handle navigation
          onMarkComplete();
          return;
        } catch (error) {
          console.error(
            "Error in handleNavigate while marking complete:",
            error
          );
        }
      }
    } else if (isCompleted || prevLectureId === lectureId) {
      if (prevLectureId === lectureId) {
        toast({
          title: "Going to Previous Lecture",
          description: "Navigating to the previous lecture...",
        });
      } else {
        toast({
          title: "Navigating",
          description: "Moving to the selected lecture...",
        });
      }

      navigate(`/student/course/${courseId}/lecture/${lectureId}`);
    } else {
      toast({
        title: "Navigating",
        description: "Moving to the selected lecture...",
      });

      navigate(`/student/course/${courseId}/lecture/${lectureId}`);
    }
  };

  const formatTime = (time: number) => {
    return formatTimeDisplay(time);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div>
        <Link to={"/student/dashboard"}>
          <Button>
            <ArrowLeft />
            Back to Dashboard
          </Button>
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 py-8">
          {/* Sidebar with course navigation */}
          <div className="lg:col-span-1">
            <CourseNavigation
              course={
                (courseData?.data
                  ? {
                      ...courseData.data,
                      lectures: lectures,
                    }
                  : {
                      _id: "",
                      title: "Loading...",
                      category: "",
                      courseLevel: "",
                      creator: "",
                      isPublished: false,
                      status: "",
                    }) as ICourse
              }
              currentLectureId={currentLectureId}
              completedLectures={progressData?.data?.lectureProgress || []}
            />
          </div>

          {/* Main content area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video player */}
            <CloudinaryVideoPlayer
              key={currentLectureId} // Add key prop to force re-render when lecture changes
              src={currentLecture.videoUrl}
              initialPosition={lastPosition || 0}
              onTimeUpdate={handleTimeUpdate}
              onComplete={handleVideoComplete}
              className="rounded-xl shadow-md overflow-hidden"
              poster={currentLecture.thumbnailUrl}
              videoId={currentLectureId}
              onReady={() => console.log('Cloudinary player ready')}
            />

            {/* Navigation buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => handleNavigate(prevLectureId)}
                disabled={!prevLectureId}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              <Button
                onClick={() => handleNavigate(nextLectureId)}
                disabled={!nextLectureId || isMarkingComplete}
                className={
                  isMarkingComplete ? "opacity-50 cursor-not-allowed" : ""
                }
              >
                {isMarkingComplete ? "Marking Complete..." : "Next"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Lecture content and notes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LectureContent
                  lecture={currentLecture}
                  isCompleted={isCompleted}
                  onMarkComplete={onMarkComplete}
                />

                {/* Lecture Interactions (Bookmarks and Questions) */}
                <div className="mt-6">
                  <LectureInteractions
                    lectureId={currentLectureId}
                    currentTime={currentTime}
                    formatTime={formatTime}
                    onSeek={handleSeek}
                  />
                </div>
              </div>

              <div className="lg:col-span-1">
                <LectureNotes
                  lectureId={currentLectureId}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseLayout;
