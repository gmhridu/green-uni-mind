import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Medal, Home, BookOpen, Award } from "lucide-react";

interface CourseCompletionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  percentage: number;
}

const CourseCompletionModal = ({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  percentage,
}: CourseCompletionModalProps) => {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    onOpenChange(false);
    navigate("/student/dashboard");
  };

  const handleViewCourse = () => {
    onOpenChange(false);
    navigate(`/student/course/${courseId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-4">
            <Medal className="h-10 w-10 text-green-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            Congratulations!
          </DialogTitle>
          <DialogDescription className="text-center pt-2 text-base">
            You've successfully completed{" "}
            <span className="font-semibold">{courseTitle}</span>!
            {percentage >= 100 ? (
              <div className="mt-2 flex items-center justify-center gap-1 text-green-600">
                <Award className="h-4 w-4" />
                <span>100% Complete</span>
              </div>
            ) : (
              <div className="mt-2">
                You've completed {Math.min(100, Math.max(0, percentage))}% of
                the course.
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-slate-50 p-4 rounded-lg my-4">
          <p className="text-center text-sm text-slate-700">
            Your progress has been saved and you can now access your certificate
            from your dashboard. Continue your learning journey with more
            courses!
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleViewCourse}
          >
            <BookOpen className="h-4 w-4" />
            View Course
          </Button>
          <Button className="flex-1 gap-2" onClick={handleGoToDashboard}>
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseCompletionModal;
