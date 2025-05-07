import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bookmark, HelpCircle, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface LectureBookmark {
  id: string;
  title: string;
  timestamp: number;
  lectureId: string;
}

interface LectureQuestion {
  id: string;
  question: string;
  timestamp: number;
  lectureId: string;
  answered: boolean;
}

interface LectureInteractionsProps {
  lectureId: string;
  currentTime: number;
  formatTime: (time: number) => string;
  onSeek: (time: number) => void;
}

const LectureInteractions = ({
  lectureId,
  currentTime,
  formatTime,
  onSeek,
}: LectureInteractionsProps) => {
  const [bookmarks, setBookmarks] = useState<LectureBookmark[]>([]);
  const [questions, setQuestions] = useState<LectureQuestion[]>([]);
  const [bookmarkTitle, setBookmarkTitle] = useState("");
  const [questionText, setQuestionText] = useState("");
  const { toast } = useToast();

  const handleAddBookmark = () => {
    const newBookmark: LectureBookmark = {
      id: Date.now().toString(),
      title: bookmarkTitle || `Bookmark at ${formatTime(currentTime)}`,
      timestamp: currentTime,
      lectureId,
    };

    setBookmarks([...bookmarks, newBookmark]);
    setBookmarkTitle("");

    toast({
      title: "Bookmark added",
      description: `Bookmark created at ${formatTime(currentTime)}`,
    });
  };

  const handleAddQuestion = () => {
    if (!questionText.trim()) {
      toast({
        title: "Question required",
        description: "Please enter your question before submitting",
        variant: "destructive",
      });
      return;
    }

    const newQuestion: LectureQuestion = {
      id: Date.now().toString(),
      question: questionText,
      timestamp: currentTime,
      lectureId,
      answered: false,
    };

    setQuestions([...questions, newQuestion]);
    setQuestionText("");

    toast({
      title: "Question submitted",
      description: "Your question has been submitted successfully",
    });
  };

  return (
    <div className="space-y-6">
      {/* Bookmarks Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-edu-purple" />
          Bookmarks
        </h3>

        <div className="mb-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                Add Bookmark at {formatTime(currentTime)}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Bookmark</DialogTitle>
                <DialogDescription>
                  Create a bookmark at {formatTime(currentTime)} to revisit this
                  part later.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Bookmark title (optional)"
                  value={bookmarkTitle}
                  onChange={(e) => setBookmarkTitle(e.target.value)}
                  className="mb-2"
                />
              </div>
              <DialogFooter>
                <Button onClick={handleAddBookmark}>Save Bookmark</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {bookmarks.length === 0 ? (
          <p className="text-sm text-gray-500">No bookmarks added yet.</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {bookmarks
              .filter((b) => b.lectureId === lectureId)
              .map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                  onClick={() => onSeek(bookmark.timestamp)}
                >
                  <span className="font-medium">{bookmark.title}</span>
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(bookmark.timestamp)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Questions Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-edu-purple" />
          Questions
        </h3>

        <div className="mb-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                Ask a Question at {formatTime(currentTime)}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ask a Question</DialogTitle>
                <DialogDescription>
                  Your question will be linked to timestamp{" "}
                  {formatTime(currentTime)}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Type your question here..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="mb-2"
                />
              </div>
              <DialogFooter>
                <Button onClick={handleAddQuestion}>Submit Question</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {questions.length === 0 ? (
          <p className="text-sm text-gray-500">No questions asked yet.</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {questions
              .filter((q) => q.lectureId === lectureId)
              .map((question) => (
                <div key={question.id} className="p-2 border rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{question.question}</span>
                    <span
                      className="text-sm text-blue-600 hover:underline cursor-pointer"
                      onClick={() => onSeek(question.timestamp)}
                    >
                      {formatTime(question.timestamp)}
                    </span>
                  </div>
                  {!question.answered && (
                    <div className="text-xs text-gray-500 mt-1">
                      Waiting for instructor response
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LectureInteractions;
