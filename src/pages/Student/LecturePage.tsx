import React, { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import {
  mockCourse,
  mockUserProgress,
  getLectureProgress,
  canAccessLecture,
  getCompletionPercentage,
} from "@/lib/mockData";
import { useToast } from "@/components/ui/use-toast";
import { Bookmark, HelpCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import CourseLayout from "@/components/Course/CourseLayout";

const LecturePage = () => {
  const { lectureId } = useParams<{ lectureId: string }>();
  const { toast } = useToast();
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);

  // Get the current lecture from the mockCourse data
  const currentLecture = lectureId
    ? mockCourse.lectures.find((l) => l.id === lectureId)
    : null;

  // Check if the user can access this lecture
  useEffect(() => {
    if (currentLecture) {
      // For preview lectures, always grant access
      if (currentLecture.isPreview) {
        setAccessGranted(true);
        return;
      }

      // Otherwise check if user has completed prerequisite lectures
      const userCanAccess = canAccessLecture(
        currentLecture.id,
        mockCourse,
        mockUserProgress
      );
      setAccessGranted(userCanAccess);

      if (!userCanAccess) {
        toast({
          title: "Access Restricted",
          description: "You need to complete the previous lectures first.",
          variant: "destructive",
        });
      }
    }
  }, [lectureId]);

  // If no lectureId is provided, redirect to the first lecture
  if (!lectureId) {
    return (
      <Navigate
        to={`/course/${mockCourse.id}/lecture/${mockCourse.lectures[0].id}`}
        replace
      />
    );
  }

  // If access check is still in progress, show loading state
  if (accessGranted === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  // If access is denied, redirect to the last accessible lecture
  if (accessGranted === false) {
    return (
      <Navigate
        to={`/course/${mockCourse.id}/lecture/${mockUserProgress.lastAccessedLectureId}`}
        replace
      />
    );
  }

  return <CourseLayout />;
};

export default LecturePage;
