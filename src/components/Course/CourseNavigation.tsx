
import { useState } from "react";
import { Link } from "react-router-dom";
import { Course, UserCourseProgress, canAccessLecture } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { CheckCircle, Lock, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseNavigationProps {
  course: Course;
  userProgress: UserCourseProgress;
  currentLectureId: string;
}

const CourseNavigation = ({
  course,
  userProgress,
  currentLectureId,
}: CourseNavigationProps) => {
  const [expanded, setExpanded] = useState(true);

  const toggleExpanded = () => setExpanded(!expanded);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Course Content</h2>
        <Button variant="ghost" size="sm" onClick={toggleExpanded}>
          {expanded ? "Collapse" : "Expand"}
        </Button>
      </div>

      {expanded && (
        <div className="space-y-2 flex-1 overflow-y-auto">
          {course.lectures.map((lecture, index) => {
            const isActive = lecture.id === currentLectureId;
            const lectureProgress = userProgress.lectureProgress.find(
              (p) => p.lectureId === lecture.id
            );
            const isCompleted = lectureProgress?.completed || false;
            const canAccess = canAccessLecture(lecture.id, course, userProgress);
            
            return (
              <Link
                key={lecture.id}
                to={canAccess ? `/course/${course.id}/lecture/${lecture.id}` : "#"}
                className={cn(
                  "block p-3 rounded-md transition-colors",
                  isActive
                    ? "bg-edu-light border-l-4 border-edu-purple"
                    : "hover:bg-gray-50",
                  !canAccess && "opacity-60 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : canAccess ? (
                      <PlayCircle className="h-5 w-5 text-edu-purple" />
                    ) : (
                      <Lock className="h-5 w-5 text-gray-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {lecture.title}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {Math.floor(lecture.duration / 60)}m
                      </span>
                    </div>

                    {lecture.isPreview && (
                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                        Preview
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseNavigation;
