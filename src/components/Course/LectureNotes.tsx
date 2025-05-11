/* eslint-disable no-unsafe-optional-chaining */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SaveIcon, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import {
  useCreateOrUpdateNoteMutation,
  useGetNoteByLectureAndStudentQuery,
  useShareNoteMutation,
  useGetSharedNotesQuery,
} from "@/redux/features/note/noteApi";
import {
  INote,
  selectNoteByLecture,
  selectSharedNotesByLecture,
} from "@/redux/features/note/noteSlice";
import { useAppSelector } from "@/redux/hooks";
import RichTextEditor from "./RichTextEditor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LectureNotesProps {
  lectureId: string;
  initialNotes?: string;
}

const LectureNotes = ({ lectureId }: LectureNotesProps) => {
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("plain");
  const { toast } = useToast();

  // Get current user data
  const { data: userData } = useGetMeQuery(undefined);
  const studentId = userData?.data?._id;

  // Get note from Redux
  const savedNote = useAppSelector((state) => {
    // Check if note slice exists in state
    if (!state.note) return null;
    return selectNoteByLecture(state, lectureId);
  });

  const sharedNotes = useAppSelector((state) => {
    // Check if note slice exists in state
    if (!state.note) return [];
    return selectSharedNotesByLecture(state, lectureId);
  });

  // API mutations and queries
  const [createOrUpdateNote] = useCreateOrUpdateNoteMutation();
  const [shareNote] = useShareNoteMutation();

  // Fetch note when component mounts or lectureId/studentId changes
  const { data: noteData } = useGetNoteByLectureAndStudentQuery(
    { lectureId, studentId: studentId || "" },
    { skip: !lectureId || !studentId }
  );

  // Fetch shared notes
  useGetSharedNotesQuery(lectureId, { skip: !lectureId });

  // Update notes when note data changes
  useEffect(() => {
    if (noteData?.data?.content) {
      setNotes(noteData.data.content);

      // If the note is rich text, switch to rich text editor
      if (noteData.data.isRichText) {
        setActiveTab("rich");
      }
    } else {
      setNotes("");
    }
  }, [noteData, lectureId]);

  // Auto-save debounce for plain text editor
  useEffect(() => {
    if (!studentId || !lectureId || activeTab !== "plain") return;

    // Only auto-save if the user has made changes to the notes
    // This prevents auto-saving (and showing a toast) when the component first loads
    if (notes !== savedNote?.content && notes !== "") {
      const timer = setTimeout(() => {
        // Using an inline function to avoid dependency issues
        const saveNotes = async () => {
          if (!studentId || !lectureId || notes === savedNote?.content) return;

          setIsSaving(true);

          try {
            await createOrUpdateNote({
              studentId,
              data: {
                content: notes,
                lectureId,
                isRichText: false,
              },
            });

            // Only show toast if there was actual content saved (not on initial load)
            if (notes.trim().length > 0) {
              toast({
                title: "Notes saved",
                description: "Your lecture notes have been saved.",
              });
            }
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

        saveNotes();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [
    notes,
    savedNote,
    studentId,
    lectureId,
    activeTab,
    createOrUpdateNote,
    toast,
  ]);

  const handleSave = async () => {
    if (!studentId || !lectureId || notes === savedNote?.content) return;

    setIsSaving(true);

    try {
      await createOrUpdateNote({
        studentId,
        data: {
          content: notes,
          lectureId,
          isRichText: false,
        },
      });

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

  const handleRichTextSave = async (
    content: string,
    isRichText: boolean,
    tags: string[]
  ) => {
    if (!studentId || !lectureId) return;

    setIsSaving(true);

    try {
      await createOrUpdateNote({
        studentId,
        data: {
          content,
          lectureId,
          isRichText,
          tags,
        },
      });

      toast({
        title: "Rich text notes saved",
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

  const handleShareNote = async () => {
    if (!studentId || !lectureId || !savedNote?._id) return;

    try {
      await shareNote({
        noteId: savedNote._id,
        studentIds: [], // Empty array means share with all students
      });

      toast({
        title: "Notes shared",
        description: "Your notes have been shared with other students.",
      });
    } catch (error) {
      toast({
        title: "Error sharing notes",
        description: "There was a problem sharing your notes.",
        variant: "destructive",
      });
    }
  };

  function isStudentWithName(obj: unknown): obj is { name: string } {
    return (
      obj !== null &&
      typeof obj === "object" &&
      "name" in obj &&
      typeof (obj as any).name === "string"
    );
  }

  function getStudentName(note: INote): string {
    if (isStudentWithName(note.studentId)) {
      return note.studentId.name;
    }
    return "Anonymous";
  }

  return (
    <div className="lecture-notes flex flex-col h-full bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-lg font-semibold mb-2">Lecture Notes</h3>
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <TabsList className="mb-2">
          <TabsTrigger value="plain">Plain Text</TabsTrigger>
          <TabsTrigger value="rich">Rich Text</TabsTrigger>
          <TabsTrigger value="shared">Shared Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="plain" className="flex-1 flex flex-col mt-0 pt-0">
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || notes === savedNote?.content || !studentId}
            >
              <SaveIcon className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
          <Textarea
            placeholder="Take notes for this lecture..."
            className="flex-1 resize-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </TabsContent>

        <TabsContent
          value="rich"
          className="flex-1 flex flex-col mt-0 pt-0 h-full"
        >
          <RichTextEditor
            initialContent={savedNote?.isRichText ? savedNote.content : ""}
            lectureId={lectureId}
            onSave={handleRichTextSave}
            onShare={handleShareNote}
            isShared={savedNote?.isShared || false}
          />
        </TabsContent>

        <TabsContent
          value="shared"
          className="flex-1 overflow-hidden items-center justify-center mt-0 pt-0"
        >
          <div className="grid grid-cols-1 gap-4">
            {sharedNotes.length > 0 ? (
              sharedNotes.map((note: INote) => {
                const studentName = getStudentName(note);

                return (
                  <Card key={note._id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-md">
                        Notes by {studentName}
                      </CardTitle>
                      <CardDescription>
                        Last updated:{" "}
                        {note.updatedAt
                          ? new Date(note.updatedAt.toString()).toLocaleString()
                          : "Recently"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {note.isRichText ? (
                        <div
                          dangerouslySetInnerHTML={{ __html: note.content }}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{note.content}</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No shared notes available for this lecture.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LectureNotes;
