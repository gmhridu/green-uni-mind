import { Link, useParams } from "react-router-dom";
import {
  mockCourse,
  mockUserProgress,
  getCompletedLecturesCount,
  getTotalLecturesCount,
  getCompletionPercentage,
  formatTime,
} from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/ProgressBar";
import { Check, Clock, PlayCircle } from "lucide-react";

const CoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();

  const completedLectures = getCompletedLecturesCount(mockUserProgress);
  const totalLectures = getTotalLecturesCount(mockCourse);
  const completionPercentage = getCompletionPercentage(
    mockUserProgress,
    mockCourse
  );

  const totalDuration = mockCourse.lectures.reduce(
    (acc, lecture) => acc + lecture.duration,
    0
  );
  const totalDurationFormatted = formatTime(totalDuration);

  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="bg-gradient-to-r from-edu-light to-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold">{mockCourse.title}</h1>
              <p className="text-lg text-gray-700">{mockCourse.description}</p>

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
                    to={`/student/course/${mockCourse.id}/lecture/${mockUserProgress.lastAccessedLectureId}`}
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Continue Learning
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <img
                src={mockCourse.thumbnail}
                alt={mockCourse.title}
                className="w-full h-72 object-cover rounded-lg shadow-lg"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-md">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">Your Progress:</span>
                  <span className="font-semibold text-edu-purple">
                    {completionPercentage}%
                  </span>
                </div>
                <ProgressBar percentage={completionPercentage} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course content */}
      <div className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-8">Course Content</h2>

        <div className="space-y-4">
          {mockCourse.lectures.map((lecture, index) => {
            const lectureProgress = mockUserProgress.lectureProgress.find(
              (p) => p.lectureId === lecture.id
            );
            const isCompleted = lectureProgress?.completed || false;

            return (
              <div key={lecture.id} className="border rounded-lg p-4">
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
                      <h3 className="font-medium">{lecture.title}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{formatTime(lecture.duration)}</span>

                        {lecture.isPreview && (
                          <span className="ml-3 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                            Preview
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/student/course/${mockCourse.id}/lecture/${lecture.id}`}
                    className="text-edu-purple hover:underline text-sm"
                  >
                    {isCompleted
                      ? "Review"
                      : lecture.isPreview
                      ? "Preview"
                      : "Start"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Button size="lg" asChild>
            <Link
              to={`/student/course/${mockCourse.id}/lecture/${mockUserProgress.lastAccessedLectureId}`}
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
