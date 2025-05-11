import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ILecture } from "@/types/course";

interface LectureContentProps {
  lecture: ILecture; // The lecture data
  isCompleted?: boolean; // Whether the lecture is completed
  onMarkComplete?: () => void; // Function to mark the lecture as complete
}

const LectureContent = ({
  lecture,
  isCompleted = false,
  onMarkComplete,
}: LectureContentProps) => {
  const { toast } = useToast();

  const handleMarkComplete = () => {
    if (onMarkComplete) {
      try {
        // Show toast before calling the function
        toast({
          title: "Marking lecture as complete",
          description: "Your progress is being updated...",
        });

        // Call the onMarkComplete function
        onMarkComplete();
      } catch (error) {
        console.error("Error in LectureContent handleMarkComplete:", error);
        toast({
          title: "Error",
          description: "Failed to mark lecture as complete",
          variant: "destructive",
        });
      }
    }
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
          onClick={handleMarkComplete}
          disabled={isCompleted}
          className={isCompleted ? "border-green-500 text-green-600" : ""}
        >
          <CheckCircle
            className={`h-4 w-4 mr-1 ${isCompleted ? "text-green-500" : ""}`}
          />
          {isCompleted ? "Completed" : "Mark as Complete"}
        </Button>
      </div>

      <p className="text-gray-600 mb-6">{lecture.instruction || "No description available for this lecture."}</p>

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
