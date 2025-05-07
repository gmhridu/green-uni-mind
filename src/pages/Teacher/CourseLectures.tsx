import React, { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, Plus, Video, Clock, Eye, Edit, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/utils/formatDuration";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import {
  useGetLectureByCourseIdQuery,
  useUpdateLectureOrderMutation,
} from "@/redux/features/lecture/lectureApi";
import { toast } from "sonner";

interface Lecture {
  _id: string;
  lectureTitle: string;
  duration?: number;
  views?: number;
  pdfUrl?: string;
  isPreviewFree?: boolean;
  order: number;
}

const CourseLectures: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { data, isLoading, refetch } = useGetLectureByCourseIdQuery(
    { id: courseId! },
    { skip: !courseId }
  );
  const [updateOrder] = useUpdateLectureOrderMutation();

  // Local state for UI reordering
  const [orderedLectures, setOrderedLectures] = useState<Lecture[]>([]);

  // When data arrives, initialize local state
  useEffect(() => {
    if (data?.data) {
      // Sort by order just in case
      const sorted = [...data.data].sort((a, b) => a.order - b.order);
      setOrderedLectures(sorted);
    }
  }, [data]);

  const userRole = "teacher"; // Replace with real auth logic

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(orderedLectures);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);

    // Recalculate order
    const updated = items.map((lec, idx) => ({
      ...lec,
      order: idx + 1,
    }));
    setOrderedLectures(updated);

    try {
      await updateOrder({
        id: courseId!,
        data: {
          lectures: updated.map((lec) => ({
            lectureId: lec._id,
            order: lec.order,
          })),
        },
      }).unwrap();
      toast.success("Lecture order updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update order, reverting");
      refetch();
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/teacher/courses`)}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <h1 className="inline text-3xl font-bold tracking-tight">
            Course Lectures
          </h1>
          <span className="ml-4 text-sm text-muted-foreground">
            {orderedLectures.length}{" "}
            {orderedLectures.length === 1 ? "Lecture" : "Lectures"}
          </span>
        </div>
        {userRole === "teacher" && (
          <Button
            onClick={() =>
              navigate(`/teacher/courses/${courseId}/lecture/create`)
            }
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add New Lecture
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Lectures</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-md" />
              ))}
            </div>
          ) : orderedLectures.length > 0 ? (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="lectures">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="divide-y"
                  >
                    {orderedLectures.map((lecture, index) => (
                      <Draggable
                        key={lecture._id}
                        draggableId={lecture._id}
                        index={index}
                        isDragDisabled={userRole !== "teacher"}
                      >
                        {(prov, snapshot) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className={`py-4 px-2 ${
                              snapshot.isDragging
                                ? "bg-blue-50 shadow-lg"
                                : "bg-white"
                            } rounded-md transition`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-[#3b82f6]/10  flex items-center justify-center mr-4">
                                  <Video className="h-5 w-5 text-[#4483e7]" />
                                </div>
                                <div>
                                  <h3 className="font-medium">
                                    {index + 1}. {lecture.lectureTitle}
                                  </h3>
                                  <div className="mt-1 flex items-center space-x-3 text-sm text-muted-foreground">
                                    <span className="flex items-center">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {lecture.duration != null
                                        ? formatDuration(lecture.duration)
                                        : "N/A"}
                                    </span>
                                    <span className="flex items-center">
                                      <Eye className="h-3 w-3 mr-1" />
                                      {lecture.views ?? 0} views
                                    </span>
                                    {lecture.pdfUrl && (
                                      <>
                                        <span className="mx-2">•</span>
                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                          PDF
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {lecture.isPreviewFree && (
                                  <Badge
                                    variant="outline"
                                    className="border-green-200 text-green-700 bg-green-50"
                                  >
                                    Preview
                                  </Badge>
                                )}
                                {userRole === "teacher" && (
                                  <Link
                                    to={`/teacher/courses/${courseId}/lecture/edit/${lecture._id}`}
                                  >
                                    <Button variant="ghost" size="icon">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                <Video className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium">No lectures yet</h3>
              <p className="mt-1 text-muted-foreground">
                Start adding lectures to your course
              </p>
              {userRole === "teacher" && (
                <Button
                  onClick={() =>
                    navigate(`/teacher/courses/${courseId}/lecture/create`)
                  }
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Lecture
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseLectures;
