import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CourseNavigation from "@/components/Course/CourseNavigation";
import VideoPlayers from "@/components/Course/VideoPlayers";
import LectureNotes from "@/components/Course/LectureNotes";
import LectureInteractions from "@/components/Course/LectureInteraction";
import LectureContent from "@/components/Course/LectureContent";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useGetLectureByIdQuery } from "@/redux/features/lecture/lectureApi";
import {
  canAccessLecture,
  getLectureProgress,
  getNextLectureId,
  getPreviousLectureId,
  mockCourse,
  mockUserProgress,
} from "@/lib/mockData";

const CourseLayout = () => {
  const { courseId, lectureId } = useParams<{
    lectureId: string;
    courseId: string;
  }>();

  console.log(courseId, lectureId);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Local state for user progress
  const [userProgress, setUserProgress] = useState(mockUserProgress);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);

  // Fetch lecture data using the hook
  const {
    data: currentLecture,
    error,
    isLoading,
  } = useGetLectureByIdQuery(lectureId || "");

  console.log(currentLecture?.data);

  // Ensure we have a valid lecture ID
  const currentLectureId = lectureId || mockCourse.lectures[0].id;

  // Get progress information for the current lecture
  const lectureProgress = getLectureProgress(currentLectureId, userProgress);

  // Navigation functions
  const nextLectureId = getNextLectureId(currentLectureId, mockCourse);
  const prevLectureId = getPreviousLectureId(currentLectureId, mockCourse);

  useEffect(() => {
    // Check if user can access this lecture
    if (
      currentLecture &&
      !canAccessLecture(currentLecture?.data?.id, mockCourse, userProgress)
    ) {
      toast({
        title: "Access Restricted",
        description: "You need to complete the previous lecture first.",
        variant: "destructive",
      });

      // Redirect to the last accessible lecture
      navigate(
        `/student/course/${mockCourse.id}/lecture/${userProgress.lastAccessedLectureId}`
      );
    } else if (currentLecture) {
      // Update last accessed lecture
      setUserProgress((prev) => ({
        ...prev,
        lastAccessedLectureId: currentLecture.data.id,
      }));
    }
  }, [currentLectureId]);

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8">Error loading lecture</div>;
  }

  if (!currentLecture) {
    return <div className="p-8">Lecture not found</div>;
  }

  const handleMarkComplete = (lectureId: string, completed: boolean) => {
    setUserProgress((prev) => ({
      ...prev,
      lectureProgress: prev.lectureProgress.map((p) =>
        p.lectureId === lectureId ? { ...p, completed } : p
      ),
    }));

    if (completed && nextLectureId) {
      toast({
        title: "Lecture completed",
        description: "Great job! Moving to the next lecture.",
      });
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
    setUserProgress((prev) => ({
      ...prev,
      lectureProgress: prev.lectureProgress.map((p) =>
        p.lectureId === currentLectureId ? { ...p, lastPosition: time } : p
      ),
    }));
  };

  const handleVideoComplete = () => {
    handleMarkComplete(currentLectureId, true);
  };

  const handleSaveNotes = (lectureId: string, notes: string) => {
    setUserProgress((prev) => ({
      ...prev,
      lectureProgress: prev.lectureProgress.map((p) =>
        p.lectureId === lectureId ? { ...p, notes } : p
      ),
    }));
  };

  const handleVideoDuration = (duration: number) => {
    setVideoDuration(duration);
  };

  const handleSeek = (time: number) => {
    // This function will be passed to the LectureInteractions component
    // to allow seeking to bookmarked timestamps
    const videoElement = document.querySelector("video");
    if (videoElement) {
      videoElement.currentTime = time;
    }
  };

  const handleNavigate = (lectureId: string | null) => {
    if (lectureId && canAccessLecture(lectureId, mockCourse, userProgress)) {
      // Auto-mark current lecture as complete when moving to next lecture
      if (nextLectureId === lectureId) {
        handleMarkComplete(currentLectureId, true);
      }
      navigate(`/course/${mockCourse.id}/lecture/${lectureId}`);
    } else if (lectureId) {
      toast({
        title: "Access Restricted",
        description: "Please complete the current lecture first.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with course navigation */}
        <div className="lg:col-span-1">
          <CourseNavigation
            course={mockCourse}
            userProgress={userProgress}
            currentLectureId={currentLectureId}
          />
        </div>

        {/* Main content area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Video player */}
          <VideoPlayers
            src={currentLecture.data.videoUrl}
            initialPosition={lectureProgress?.lastPosition || 0}
            onTimeUpdate={handleTimeUpdate}
            onComplete={handleVideoComplete}
            onDurationChange={handleVideoDuration}
            className="rounded-xl shadow-md overflow-hidden"
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
              disabled={
                !nextLectureId ||
                !canAccessLecture(nextLectureId, mockCourse, userProgress)
              }
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Lecture content and notes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <LectureContent
                lecture={currentLecture.data}
                lectureProgress={lectureProgress}
                onMarkComplete={handleMarkComplete}
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
                initialNotes={lectureProgress?.notes || ""}
                onSaveNotes={handleSaveNotes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseLayout;
