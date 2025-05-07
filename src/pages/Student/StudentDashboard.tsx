
import { Link } from "react-router-dom";
import { 
  mockCourse, 
  mockUserProgress, 
  getCompletedLecturesCount,
  getTotalLecturesCount, 
  getCompletionPercentage,
  getEstimatedTimeLeft,
  formatTime
} from "@/lib/mockData";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/ProgressBar";
import { BookOpen, Clock, Medal, PlayCircle } from "lucide-react";

const Dashboard = () => {
  const completedLectures = getCompletedLecturesCount(mockUserProgress);
  const totalLectures = getTotalLecturesCount(mockCourse);
  const completionPercentage = getCompletionPercentage(mockUserProgress, mockCourse);
  const timeLeftSeconds = getEstimatedTimeLeft(mockUserProgress, mockCourse);
  const timeLeftFormatted = formatTime(timeLeftSeconds);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Student Dashboard</h1>
          <p className="text-gray-600">Track your learning progress</p>
        </div>
        
        <Button asChild>
          <Link to={`/student/course/${mockCourse.id}/lecture/${mockUserProgress.lastAccessedLectureId}`}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Continue Learning
          </Link>
        </Button>
      </div>
      
      {/* Course progress summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Course Progress</CardTitle>
            <CardDescription>Your learning journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-edu-purple mb-2">
              {completionPercentage}%
            </div>
            <ProgressBar percentage={completionPercentage} size="lg" />
          </CardContent>
          <CardFooter className="pt-2">
            <div className="text-sm text-gray-500 flex items-center">
              <BookOpen className="h-4 w-4 mr-1" />
              {completedLectures} of {totalLectures} lectures completed
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
              {timeLeftFormatted}
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <div className="text-sm text-gray-500 flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              To complete this course
            </div>
          </CardFooter>
        </Card>
        
        <Card className={completionPercentage === 100 ? "" : "opacity-50"}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Course Certificate</CardTitle>
            <CardDescription>Your achievement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`flex justify-center items-center h-16 ${completionPercentage === 100 ? "text-edu-purple" : "text-gray-400"}`}>
              <Medal className="h-12 w-12" />
            </div>
          </CardContent>
          <CardFooter className="pt-2">
            <Button 
              className="w-full" 
              disabled={completionPercentage < 100}
              variant={completionPercentage === 100 ? "default" : "outline"}
            >
              {completionPercentage === 100 ? "Download Certificate" : "Complete the course first"}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Enrolled course */}
      <h2 className="text-2xl font-semibold mb-4">Your Enrolled Course</h2>
      <Card className="mb-8">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3">
            <img 
              src={mockCourse.thumbnail} 
              alt={mockCourse.title}
              className="w-full h-48 md:h-full object-cover"
            />
          </div>
          <div className="p-6 md:w-2/3">
            <CardTitle className="mb-2">{mockCourse.title}</CardTitle>
            <CardDescription className="mb-4">{mockCourse.description}</CardDescription>
            
            <div className="flex items-center mb-4">
              <span className="text-sm text-gray-500">Instructor: {mockCourse.instructor}</span>
              <span className="mx-2">•</span>
              <span className="text-sm text-gray-500">{totalLectures} lectures</span>
            </div>
            
            <ProgressBar percentage={completionPercentage} className="mb-6" />
            
            <div className="flex gap-4">
              <Button asChild>
                <Link to={`/student/course/${mockCourse.id}/lecture/${mockUserProgress.lastAccessedLectureId}`}>
                  Continue Learning
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link to={`/student/course/${mockCourse.id}`}>
                  Course Details
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
