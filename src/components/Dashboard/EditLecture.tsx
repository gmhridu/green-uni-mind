import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, File, Loader, Upload, Video, X } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import ReactPlayer from "react-player/lazy";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  useUpdateLectureMutation,
  useGetLectureByIdQuery,
} from "@/redux/features/lecture/lectureApi";
import { useMedia } from "@/hooks/useMediaUpload";
import { useAppDispatch } from "@/redux/hooks";
import { setLectures } from "@/redux/features/lecture/lectureSlice";
import { formatBytes } from "@/utils/uploadMedia";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadList,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemDelete,
} from "@/components/ui/file-upload";

// Lecture upload schema
const lectureSchema = z.object({
  lectureTitle: z
    .string({
      required_error: "Lecture title is required",
    })
    .min(5, { message: "Title must be at least 5 characters" }),
  instruction: z.string().optional(),
  isPreviewFree: z.boolean().default(false),
  videoUrl: z.string().optional(),
  pdfUrl: z.string().optional().or(z.literal("")),
  duration: z.number().optional(),
});

type LectureFormValues = z.infer<typeof lectureSchema>;

const EditLecture = () => {
  const { courseId, lectureId } = useParams<{
    courseId: string;
    lectureId: string;
  }>();
  const navigate = useNavigate();
  const [updateLecture, { isLoading }] = useUpdateLectureMutation();
  const { data: lectureData, isLoading: isLectureLoading } =
    useGetLectureByIdQuery({ id: lectureId });
  const dispatch = useAppDispatch();

  // Media upload hooks
  const {
    uploadMedia: uploadVideo,
    progress: videoProgress,
    isUploading: isVideoUploading,
  } = useMedia();

  const {
    uploadMedia: uploadPdf,
    progress: pdfProgress,
    isUploading: isPdfUploading,
  } = useMedia();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingVideoUrl, setExistingVideoUrl] = useState("");
  const [existingPdfUrl, setExistingPdfUrl] = useState("");

  const form = useForm<LectureFormValues>({
    resolver: zodResolver(lectureSchema),
    defaultValues: {
      lectureTitle: "",
      instruction: "",
      isPreviewFree: false,
      videoUrl: "",
      pdfUrl: "",
    },
  });

  useEffect(() => {
    if (lectureData?.data) {
      const lecture = lectureData.data;
      setExistingVideoUrl(lecture.videoUrl || "");
      setExistingPdfUrl(lecture.pdfUrl || "");

      form.reset({
        lectureTitle: lecture.lectureTitle,
        instruction: lecture.instruction || "",
        isPreviewFree: lecture.isPreviewFree || false,
        videoUrl: lecture.videoUrl || "",
        pdfUrl: lecture.pdfUrl || "",
        duration: lecture.duration,
      });
    }
  }, [lectureData, form]);

  const handleVideoChange = async (file: File | undefined) => {
    if (!file) {
      setVideoFile(null);
      form.setValue("videoUrl", existingVideoUrl, { shouldValidate: true });
      return;
    }

    if (!file.type.includes("video/")) {
      toast.error("Please upload a valid video file");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error("Video must be less than 500MB");
      return;
    }

    setVideoFile(file);
    form.setValue("videoUrl", file.name, { shouldValidate: true });
  };

  const handlePdfChange = async (file: File | undefined) => {
    if (!file) {
      setPdfFile(null);
      form.setValue("pdfUrl", existingPdfUrl, { shouldValidate: true });
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF file");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("PDF must be less than 50MB");
      return;
    }

    setPdfFile(file);
    form.setValue("pdfUrl", file.name, { shouldValidate: true });
  };

  const removeVideo = () => {
    setVideoFile(null);
    form.setValue("videoUrl", existingVideoUrl, { shouldValidate: true });
  };

  const removePdf = () => {
    setPdfFile(null);
    form.setValue("pdfUrl", existingPdfUrl, { shouldValidate: true });
  };

  const removeExistingVideo = () => {
    setExistingVideoUrl("");
    form.setValue("videoUrl", "", { shouldValidate: true });
  };

  const removeExistingPdf = () => {
    setExistingPdfUrl("");
    form.setValue("pdfUrl", "", { shouldValidate: true });
  };

  const onSubmit = async (data: LectureFormValues) => {
    const toastId = toast.loading("Updating lecture...");
    setIsSubmitting(true);

    try {
      let videoUrl = existingVideoUrl;
      let videoDuration = data.duration || 0;
      let pdfUrl = existingPdfUrl;

      // Handle video upload if a new file was selected
      if (videoFile) {
        const videoResponse = await uploadVideo(videoFile);
        if (!videoResponse?.secure_url) throw new Error("Video upload failed");
        videoUrl = videoResponse.secure_url;
        videoDuration = videoResponse?.duration || videoDuration;
      }

      // Handle PDF upload if a new file was selected
      if (pdfFile) {
        const pdfResponse = await uploadPdf(pdfFile);
        if (pdfResponse?.secure_url) {
          pdfUrl = pdfResponse.secure_url;
        }
      }

      const updatedLecture = {
        lectureTitle: data.lectureTitle,
        instruction: data.instruction || undefined,
        isPreviewFree: data.isPreviewFree,
        videoUrl,
        duration: videoDuration,
        pdfUrl: pdfUrl || "",
      };

      // Update lecture
      const res = await updateLecture({
        courseId,
        lectureId,
        data: updatedLecture,
      }).unwrap();

      dispatch(setLectures(res.data));

      toast.success("Lecture updated successfully!", { id: toastId });
      navigate(`/teacher/courses/${courseId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update lecture", { id: toastId });
      console.error("Update error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUploading = isVideoUploading || isPdfUploading || isSubmitting;

  if (isLectureLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/teacher/courses/${courseId}`)}
          className="mr-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">Edit Lecture</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lecture Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="lectureTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lecture Title*</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter a title for this lecture"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instruction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add instructions or summary for students..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lecture Video*</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {/* Existing video preview */}
                        {existingVideoUrl && !videoFile && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">
                                Current Video
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={removeExistingVideo}
                                disabled={isUploading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="aspect-video bg-black rounded-md overflow-hidden">
                              <ReactPlayer
                                url={existingVideoUrl}
                                width="100%"
                                height="100%"
                                pip
                                controls
                              />
                            </div>
                          </div>
                        )}

                        {/* Video upload section */}
                        <FileUpload
                          value={videoFile ? [videoFile] : []}
                          onValueChange={(files) =>
                            handleVideoChange(files?.[0])
                          }
                          accept="video/*"
                          maxFiles={1}
                          maxSize={500 * 1024 * 1024}
                          onFileReject={(_, message) => {
                            form.setError("videoUrl", { message });
                          }}
                          multiple={false}
                        >
                          <FileUploadDropzone className="flex-row border-dotted">
                            <Upload className="size-4" />
                            Drag and drop or
                            <FileUploadTrigger asChild>
                              <Button variant="link" size="sm" className="p-0">
                                choose a file
                              </Button>
                            </FileUploadTrigger>
                            to upload
                          </FileUploadDropzone>
                          <FileUploadList>
                            {videoFile && (
                              <FileUploadItem value={videoFile}>
                                <FileUploadItemPreview>
                                  <Video className="size-10 text-muted-foreground" />
                                </FileUploadItemPreview>
                                <FileUploadItemMetadata>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium truncate">
                                      {videoFile.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatBytes(videoFile.size)}
                                    </p>
                                  </div>
                                  {isVideoUploading && (
                                    <div className="w-full">
                                      <Progress
                                        value={videoProgress}
                                        className="h-2 w-full bg-blue-200 rounded-full overflow-hidden"
                                      />
                                      <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-gray-600">
                                          {Math.round(videoProgress)}%
                                        </span>
                                        <span className="text-xs text-gray-600">
                                          {formatBytes(
                                            (videoProgress / 100) *
                                              videoFile.size
                                          )}{" "}
                                          / {formatBytes(videoFile.size)}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </FileUploadItemMetadata>
                                <FileUploadItemDelete asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={removeVideo}
                                    disabled={isUploading}
                                  >
                                    <X />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </FileUploadItemDelete>
                              </FileUploadItem>
                            )}
                          </FileUploadList>
                        </FileUpload>
                      </div>
                    </FormControl>
                    <FormDescription>
                      MP4, WebM, OGG (Max 500MB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pdfUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PDF Materials (Optional)</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {/* Existing PDF preview */}
                        {existingPdfUrl && !pdfFile && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">
                                Current PDF
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={removeExistingPdf}
                                disabled={isUploading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center p-3 border rounded-md bg-gray-50">
                              <File className="h-10 w-10 text-muted-foreground mr-3" />
                              <div className="flex-1">
                                <p className="text-sm font-medium truncate">
                                  {existingPdfUrl.substring(
                                    existingPdfUrl.lastIndexOf("/") + 1
                                  )}
                                </p>
                                <a
                                  href={existingPdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  View PDF
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* PDF upload section */}
                        <FileUpload
                          value={pdfFile ? [pdfFile] : []}
                          onValueChange={(files) => handlePdfChange(files?.[0])}
                          accept="application/pdf"
                          maxFiles={1}
                          maxSize={50 * 1024 * 1024}
                          onFileReject={(_, message) => {
                            form.setError("pdfUrl", { message });
                          }}
                          multiple={false}
                        >
                          <FileUploadDropzone className="flex-row border-dotted">
                            <Upload className="size-4" />
                            Drag and drop or
                            <FileUploadTrigger asChild>
                              <Button variant="link" size="sm" className="p-0">
                                choose a file
                              </Button>
                            </FileUploadTrigger>
                            to upload
                          </FileUploadDropzone>
                          <FileUploadList>
                            {pdfFile && (
                              <FileUploadItem value={pdfFile}>
                                <FileUploadItemPreview>
                                  <File className="size-10 text-muted-foreground" />
                                </FileUploadItemPreview>
                                <FileUploadItemMetadata>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium truncate">
                                      {pdfFile.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatBytes(pdfFile.size)}
                                    </p>
                                  </div>
                                  {isPdfUploading && (
                                    <div className="w-full">
                                      <Progress
                                        value={pdfProgress}
                                        className="h-2 w-full bg-blue-200 rounded-full overflow-hidden"
                                      />
                                      <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-gray-600">
                                          {Math.round(pdfProgress)}%
                                        </span>
                                        <span className="text-xs text-gray-600">
                                          {formatBytes(
                                            (pdfProgress / 100) * pdfFile.size
                                          )}{" "}
                                          / {formatBytes(pdfFile.size)}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </FileUploadItemMetadata>
                                <FileUploadItemDelete asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={removePdf}
                                    disabled={isUploading}
                                  >
                                    <X />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </FileUploadItemDelete>
                              </FileUploadItem>
                            )}
                          </FileUploadList>
                        </FileUpload>
                      </div>
                    </FormControl>
                    <FormDescription>
                      PDF documents only (Max 50MB)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPreviewFree"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Make this lecture available as a free preview
                      </FormLabel>
                      <p className="text-sm text-gray-500">
                        Students can watch this lecture without enrolling in the
                        course
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/teacher/courses/${courseId}`)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? (
                    <div className="flex items-center">
                      <Loader className="mr-2 animate-spin" />
                      Updating...
                    </div>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditLecture;
