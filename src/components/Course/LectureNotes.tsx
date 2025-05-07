import { useState, useEffect } from "react";
import { UserProgress } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SaveIcon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface LectureNotesProps {
  lectureId: string;
  initialNotes: string;
  onSaveNotes: (lectureId: string, notes: string) => void;
}

const LectureNotes = ({
  lectureId,
  initialNotes,
  onSaveNotes,
}: LectureNotesProps) => {
  const [notes, setNotes] = useState(initialNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Update notes when lectureId changes
  useEffect(() => {
    setNotes(initialNotes || "");
  }, [lectureId, initialNotes]);

  // Auto-save debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notes !== initialNotes) {
        handleSave();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [notes]);

  const handleSave = async () => {
    if (notes === initialNotes) return;

    setIsSaving(true);

    try {
      // In a real app, this would be an API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      onSaveNotes(lectureId, notes);

      toast({
        title: "Notes saved",
        description: "Your lecture notes have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error saving notes",
        description: "There was a problem saving your notes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="lecture-notes flex flex-col h-full bg-white rounded-lg shadow-sm border p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Lecture Notes</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={isSaving || notes === initialNotes}
        >
          <SaveIcon className="h-4 w-4 mr-1" />
          Save
        </Button>
      </div>

      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Take notes for this lecture..."
        className="flex-1 resize-none"
      />
    </div>
  );
};

export default LectureNotes;
