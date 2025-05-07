import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LectureContentProps {
  lecture: any; // Update the type according to your lecture model
  lectureProgress?: any; // Update the type according to your progress model
  onMarkComplete: (lectureId: string, completed: boolean) => void;
}

const LectureContent = ({
  lecture,
  lectureProgress,
  onMarkComplete,
}: LectureContentProps) => {
  const [isCompleted, setIsCompleted] = useState(
    lectureProgress?.completed || false
  );
  const { toast } = useToast();

  const handleToggleComplete = () => {
    const newStatus = !isCompleted;
    setIsCompleted(newStatus);
    onMarkComplete(lecture.id, newStatus);

    toast({
      title: newStatus ? "Lecture completed" : "Lecture marked incomplete",
      description: newStatus
        ? "Great job! You've completed this lecture."
        : "The lecture has been marked as incomplete.",
    });
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">{lecture.lectureTitle}</h1>
          {lecture.isPreviewFree && (
            <span className="inline-block text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full mb-2">
              Preview Lecture
            </span>
          )}
        </div>

        <Button
          variant={isCompleted ? "outline" : "default"}
          size="sm"
          onClick={handleToggleComplete}
          className={isCompleted ? "border-green-500 text-green-600" : ""}
        >
          <CheckCircle
            className={`h-4 w-4 mr-1 ${isCompleted ? "text-green-500" : ""}`}
          />
          {isCompleted ? "Completed" : "Mark as Complete"}
        </Button>
      </div>

      <p className="text-gray-600 mb-6">{lecture.instruction}</p>

      {lecture.pdfUrl && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="text-lg font-medium mb-3">Lecture Materials</h3>
          <div className="overflow-hidden rounded-md border">
            <iframe
              src={lecture.pdfUrl}
              className="w-full h-80"
              title="Lecture PDF"
            />
          </div>
        </div>
      )}
    </Card>
  );
};

export default LectureContent;
