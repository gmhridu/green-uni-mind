import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { useCreateLectureMutation } from "@/redux/features/lecture/lectureApi";
import { useGetCourseByIdQuery } from "@/redux/features/course/course.api";
import { useMedia } from "@/hooks/useMediaUpload";
import { useAppDispatch } from "@/redux/hooks";
import { setLectures } from "@/redux/features/lecture/lectureSlice";
import LectureForm from "@/components/Lecture/LectureForm";
import Breadcrumb from "@/components/Navigation/Breadcrumb";

// Define VideoResolution interface
interface VideoResolution {
  url: string;
  quality: string;
  format?: string;
}

const LectureCreate = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [createLecture] = useCreateLectureMutation();
  const dispatch = useAppDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Media upload hooks
  const { uploadMedia: uploadVideo } = useMedia();
  const { uploadMedia: uploadPdf } = useMedia();

  // Get course data for context
  const { data: courseData } = useGetCourseByIdQuery(courseId || "", {
    skip: !courseId,
  });

  const course = courseData?.data;

  const handleSubmit = async (data: any) => {
    const toastId = toast.loading("Creating lecture...");

    if (!data.videoFile) {
      toast.error("Please upload a video for the lecture", { id: toastId });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare upload promises
      const uploadPromises: Promise<void>[] = [];
      let videoUrl = "";
      let videoDuration = data.videoDuration || 0;
      let videoResolutions: VideoResolution[] = [];
      let hlsUrl = "";
      let pdfUrl = "";

      // Video upload (required) with adaptive streaming
      uploadPromises.push(
        uploadVideo(data.videoFile, undefined, true).then((response) => {
          if (!response) {
            throw new Error("Video upload failed - no response received");
          }

          if (!response.secure_url) {
            throw new Error("Video upload failed - no URL received");
          }

          // Set standard video URL for backward compatibility
          videoUrl = response.secure_url;
          videoDuration = response?.duration || videoDuration;

          // Set adaptive streaming URLs if available
          if (response.videoResolutions && response.videoResolutions.length > 0) {
            videoResolutions = response.videoResolutions;

            // Set HLS URL if available
            const hlsVariant = videoResolutions.find(r => r.format === 'hls');
            if (hlsVariant) {
              hlsUrl = hlsVariant.url;
            }
          }

          console.log("Video upload successful:", response);
        }).catch(error => {
          console.error("Video upload error:", error);
          throw error;
        })
      );

      // PDF upload (optional)
      if (data.pdfFile) {
        uploadPromises.push(
          uploadPdf(data.pdfFile).then((response) => {
            if (response?.secure_url) {
              pdfUrl = response.secure_url;
            }
          })
        );
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      // Prepare lecture data with adaptive streaming support
      const lectureData = {
        lectureTitle: data.lectureTitle,
        instruction: data.instruction || undefined,
        isPreviewFree: data.isPreviewFree,
        videoUrl, // Keep for backward compatibility
        videoResolutions, // New field for adaptive streaming
        hlsUrl, // HLS streaming URL
        duration: videoDuration,
        pdfUrl: pdfUrl || "",
        courseId: courseId!,
      };

      // Create lecture with all media URLs
      const response = await createLecture({
        data: lectureData,
        id: courseId,
      }).unwrap();

      toast.success("Lecture created successfully!", {
        id: toastId,
      });
      dispatch(setLectures(response.data));
      navigate(`/teacher/courses/${courseId}`);
    } catch (error: unknown) {
      let errorMessage = "Failed to create lecture";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Check if it's a Cloudinary error
      if (typeof error === 'object' && error !== null && 'error' in error) {
        const cloudinaryError = error as { error?: { message?: string } };
        if (cloudinaryError.error?.message) {
          errorMessage = `Cloudinary error: ${cloudinaryError.error.message}`;
        }
      }

      toast.error(errorMessage, {
        id: toastId,
      });
      console.error("Upload error details:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Courses', href: '/teacher/courses' },
    { label: course?.title || 'Course', href: `/teacher/courses/${courseId}` },
    { label: 'Create Lecture', current: true },
  ];

  if (!courseId) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Course</h1>
          <p className="text-gray-600 mb-4">Course ID is missing or invalid.</p>
          <button
            onClick={() => navigate('/teacher/courses')}
            className="text-blue-600 hover:underline"
          >
            Return to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* Lecture Form */}
      <LectureForm
        courseId={courseId}
        courseName={course?.title}
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default LectureCreate;
