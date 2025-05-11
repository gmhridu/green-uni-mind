import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bookmark, HelpCircle, Clock, Trash2, Tag, FolderOpen, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatTimeDisplay, formatTimestamp } from "@/utils/formatTime";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import {
  useCreateBookmarkMutation,
  useGetBookmarksByLectureAndStudentQuery,
  useDeleteBookmarkMutation,
  useUpdateBookmarkMutation,
  useShareBookmarkMutation,
  useGetBookmarksByCategoryQuery
} from "@/redux/features/bookmark/bookmarkApi";
import {
  useCreateQuestionMutation,
  useGetQuestionsByLectureAndStudentQuery,
  useDeleteQuestionMutation
} from "@/redux/features/question/questionApi";
import { IBookmark } from "@/redux/features/bookmark/bookmarkSlice";
import { IQuestion } from "@/redux/features/question/questionSlice";
import {
  selectBookmarksByLecture,
  selectBookmarksByCategory
} from "@/redux/features/bookmark/bookmarkSlice";
import { selectQuestionsByLecture } from "@/redux/features/question/questionSlice";
import { useSelector } from "react-redux";

// We're using the Redux interfaces now

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
  // Local state for form inputs
  const [bookmarkTitle, setBookmarkTitle] = useState("");
  const [bookmarkCategory, setBookmarkCategory] = useState("");
  const [bookmarkTags, setBookmarkTags] = useState<string[]>([]);
  const [bookmarkNotes, setBookmarkNotes] = useState("");
  const [newTag, setNewTag] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [editingBookmark, setEditingBookmark] = useState<IBookmark | null>(null);
  const { toast } = useToast();

  // Get current user data
  const { data: userData } = useGetMeQuery(undefined);
  const studentId = userData?.data?._id;

  // Redux selectors for bookmarks and questions
  const bookmarks = useSelector((state: any) => {
    // Check if bookmark slice exists in state
    if (!state.bookmark) return [];
    return selectBookmarksByLecture(state, lectureId);
  });

  const questions = useSelector((state: any) => {
    // Check if question slice exists in state
    if (!state.question) return [];
    return selectQuestionsByLecture(state, lectureId);
  });

  const categoryBookmarks = useSelector((state: any) => {
    // Check if bookmark slice exists in state
    if (!state.bookmark) return [];
    return selectedCategory ? selectBookmarksByCategory(state, selectedCategory) : [];
  });

  // API mutations and queries
  const [createBookmark] = useCreateBookmarkMutation();
  const [updateBookmark] = useUpdateBookmarkMutation();
  const [deleteBookmark] = useDeleteBookmarkMutation();
  const [shareBookmark] = useShareBookmarkMutation();
  const [createQuestion] = useCreateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();

  // Get bookmarks by category if a category is selected
  useGetBookmarksByCategoryQuery(
    { studentId: studentId || "", category: selectedCategory },
    { skip: !studentId || !selectedCategory }
  );

  // Fetch bookmarks and questions when component mounts or lectureId/studentId changes
  useGetBookmarksByLectureAndStudentQuery(
    { lectureId, studentId: studentId || "" },
    { skip: !lectureId || !studentId }
  );

  useGetQuestionsByLectureAndStudentQuery(
    { lectureId, studentId: studentId || "" },
    { skip: !lectureId || !studentId }
  );

  const handleAddBookmark = async () => {
    if (!studentId) {
      toast({
        title: "Authentication required",
        description: "Please log in to add bookmarks",
        variant: "destructive",
      });
      return;
    }

    try {
      await createBookmark({
        studentId,
        data: {
          title: bookmarkTitle || `Bookmark at ${formatTime(currentTime)}`,
          timestamp: currentTime,
          lectureId,
          category: bookmarkCategory || "Uncategorized",
          tags: bookmarkTags,
          notes: bookmarkNotes,
        },
      });

      // Reset form fields
      setBookmarkTitle("");
      setBookmarkCategory("");
      setBookmarkTags([]);
      setBookmarkNotes("");
      setNewTag("");

      toast({
        title: "Bookmark added",
        description: `Bookmark created at ${formatTime(currentTime)}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add bookmark",
        variant: "destructive",
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !bookmarkTags.includes(newTag.trim())) {
      setBookmarkTags([...bookmarkTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setBookmarkTags(bookmarkTags.filter(tag => tag !== tagToRemove));
  };

  const handleShareBookmark = async (bookmarkId: string) => {
    if (!studentId || !bookmarkId) return;

    try {
      await shareBookmark({
        bookmarkId,
        studentIds: shareEmail ? [shareEmail] : [], // Empty array means share with all
      });

      // Reset share email
      setShareEmail("");

      toast({
        title: "Bookmark shared",
        description: "Your bookmark has been shared successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share bookmark",
        variant: "destructive",
      });
    }
  };

  const handleEditBookmark = (bookmark: IBookmark) => {
    setEditingBookmark(bookmark);
    setBookmarkTitle(bookmark.title || "");
    setBookmarkCategory(bookmark.category || "");
    setBookmarkTags(bookmark.tags || []);
    setBookmarkNotes(bookmark.notes || "");
  };

  const handleUpdateBookmark = async () => {
    if (!editingBookmark?._id) return;

    try {
      await updateBookmark({
        id: editingBookmark._id,
        data: {
          title: bookmarkTitle,
          category: bookmarkCategory,
          tags: bookmarkTags,
          notes: bookmarkNotes,
        },
      });

      // Reset form and editing state
      setBookmarkTitle("");
      setBookmarkCategory("");
      setBookmarkTags([]);
      setBookmarkNotes("");
      setEditingBookmark(null);

      toast({
        title: "Bookmark updated",
        description: "Your bookmark has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    }
  };

  const handleAddQuestion = async () => {
    if (!studentId) {
      toast({
        title: "Authentication required",
        description: "Please log in to ask questions",
        variant: "destructive",
      });
      return;
    }

    if (!questionText.trim()) {
      toast({
        title: "Question required",
        description: "Please enter your question before submitting",
        variant: "destructive",
      });
      return;
    }

    try {
      await createQuestion({
        studentId,
        data: {
          question: questionText,
          timestamp: currentTime,
          lectureId,
          answered: false,
        },
      });

      setQuestionText("");

      toast({
        title: "Question submitted",
        description: "Your question has been submitted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit question",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Bookmarks Section */}
      <div className="border rounded-lg p-4">
        <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
          <Bookmark className="h-5 w-5 text-edu-purple" />
          Bookmarks
        </h3>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-end mb-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0">
          <div className="mb-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" title={formatTimestamp(currentTime)}>
                  Add Bookmark
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add Bookmark</DialogTitle>
                  <DialogDescription>
                    Create a bookmark at {formatTime(currentTime)} ({formatTimestamp(currentTime)}) to revisit this
                    part later.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div>
                    <label htmlFor="title" className="text-sm font-medium mb-1 block">
                      Title
                    </label>
                    <Input
                      id="title"
                      placeholder="Bookmark title"
                      value={bookmarkTitle}
                      onChange={(e) => setBookmarkTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="text-sm font-medium mb-1 block">
                      Category
                    </label>
                    <Select
                      value={bookmarkCategory}
                      onValueChange={setBookmarkCategory}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Important">Important</SelectItem>
                        <SelectItem value="Review">Review</SelectItem>
                        <SelectItem value="Question">Question</SelectItem>
                        <SelectItem value="Concept">Concept</SelectItem>
                        <SelectItem value="Example">Example</SelectItem>
                        <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label htmlFor="tags" className="text-sm font-medium mb-1 block">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        id="tags"
                        placeholder="Add a tag"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddTag} size="sm">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {bookmarkTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-xs hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes" className="text-sm font-medium mb-1 block">
                      Notes
                    </label>
                    <Textarea
                      id="notes"
                      placeholder="Add notes about this bookmark"
                      value={bookmarkNotes}
                      onChange={(e) => setBookmarkNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  {editingBookmark ? (
                    <div className="flex gap-2 w-full justify-end">
                      <Button variant="outline" onClick={() => {
                        setEditingBookmark(null);
                        setBookmarkTitle("");
                        setBookmarkCategory("");
                        setBookmarkTags([]);
                        setBookmarkNotes("");
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateBookmark}>
                        Update Bookmark
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleAddBookmark}>Save Bookmark</Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {bookmarks.length === 0 ? (
            <p className="text-sm text-gray-500">No bookmarks added yet.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark._id}
                  className="border rounded-md p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onSeek(bookmark.timestamp)}
                    >
                      <div className="font-medium">{bookmark.title}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        <span title={formatTimestamp(bookmark.timestamp)}>
                          {formatTime(bookmark.timestamp)}
                        </span>
                        {bookmark.category && (
                          <span className="ml-2 flex items-center gap-1">
                            <FolderOpen className="w-3 h-3" />
                            {bookmark.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => handleEditBookmark(bookmark)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-500 hover:text-green-700"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Share Bookmark</DialogTitle>
                            <DialogDescription>
                              Share this bookmark with other students
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Input
                              placeholder="Student email (optional)"
                              value={shareEmail}
                              onChange={(e) => setShareEmail(e.target.value)}
                              className="mb-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Leave empty to share with all students in this course
                            </p>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => handleShareBookmark(bookmark._id || "")}>
                              Share
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={async () => {
                          if (bookmark._id) {
                            try {
                              await deleteBookmark(bookmark._id);
                              toast({
                                title: "Bookmark deleted",
                                description: "Bookmark has been removed",
                              });
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to delete bookmark",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {bookmark.tags && bookmark.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {bookmark.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {bookmark.notes && (
                    <div className="mt-2 text-sm text-gray-700 border-t pt-2">
                      {bookmark.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          <div className="mb-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Important">Important</SelectItem>
                <SelectItem value="Review">Review</SelectItem>
                <SelectItem value="Question">Question</SelectItem>
                <SelectItem value="Concept">Concept</SelectItem>
                <SelectItem value="Example">Example</SelectItem>
                <SelectItem value="Uncategorized">Uncategorized</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!selectedCategory ? (
            <p className="text-sm text-gray-500">Select a category to view bookmarks</p>
          ) : categoryBookmarks.length === 0 ? (
            <p className="text-sm text-gray-500">No bookmarks in this category</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {categoryBookmarks.map((bookmark) => (
                <div
                  key={bookmark._id}
                  className="border rounded-md p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => onSeek(bookmark.timestamp)}
                    >
                      <div className="font-medium">{bookmark.title}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        <span title={formatTimestamp(bookmark.timestamp)}>
                          {formatTime(bookmark.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {bookmark.tags && bookmark.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {bookmark.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {bookmark.notes && (
                    <div className="mt-2 text-sm text-gray-700 border-t pt-2">
                      {bookmark.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        </Tabs>
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
              <Button size="sm" title={formatTimestamp(currentTime)}>
                Ask a Question
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ask a Question</DialogTitle>
                <DialogDescription>
                  Your question will be linked to timestamp{" "}
                  {formatTime(currentTime)} ({formatTimestamp(currentTime)})
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
            {questions.map((question) => (
              <div key={question._id} className="p-2 border rounded-md">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <span className="font-medium">{question.question}</span>
                    <div className="flex justify-between items-center mt-1">
                      <span
                        className="text-sm text-blue-600 hover:underline cursor-pointer"
                        onClick={() => onSeek(question.timestamp)}
                        title={formatTimestamp(question.timestamp)}
                      >
                        {formatTime(question.timestamp)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={async () => {
                          if (question._id) {
                            try {
                              await deleteQuestion(question._id);
                              toast({
                                title: "Question deleted",
                                description: "Question has been removed",
                              });
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to delete question",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                {!question.answered && (
                  <div className="text-xs text-gray-500 mt-1">
                    Waiting for instructor response
                  </div>
                )}
                {question.answered && question.answer && (
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    <div className="text-xs font-medium text-gray-700">Instructor Response:</div>
                    <div className="text-sm mt-1">{question.answer}</div>
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
