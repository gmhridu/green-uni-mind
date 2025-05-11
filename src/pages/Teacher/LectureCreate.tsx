import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, File, Loader, Upload, Video, X } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

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
import { useCreateLectureMutation } from "@/redux/features/lecture/lectureApi";
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

// Define VideoResolution interface
interface VideoResolution {
  url: string;
  quality: string;
  format?: string;
}

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
  videoResolutions: z.array(
    z.object({
      url: z.string(),
      quality: z.string(),
      format: z.string().optional(),
    })
  ).optional(),
  hlsUrl: z.string().optional(),
  pdfUrl: z.string().optional().or(z.literal("")),
  duration: z.number().optional(),
});

type LectureFormValues = z.infer<typeof lectureSchema>;

const LectureCreate = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [createLecture, { isLoading }] = useCreateLectureMutation();
  const dispatch = useAppDispatch();

  // Media upload hooks
  const {
    uploadMedia: uploadVideo,
    progress: videoProgress,
    isUploading: isVideoUploading,
    error: videoError,
    bytesUploaded: videoBytesUploaded,
    totalBytes: videoTotalBytes,
  } = useMedia();

  const {
    uploadMedia: uploadPdf,
    progress: pdfProgress,
    isUploading: isPdfUploading,
    error: pdfError,
  } = useMedia();

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LectureFormValues>({
    resolver: zodResolver(lectureSchema),
    defaultValues: {
      lectureTitle: "",
      instruction: "",
      isPreviewFree: false,
      videoUrl: "",
      videoResolutions: [],
      hlsUrl: "",
      pdfUrl: "",
    },
  });

  const handleVideoChange = async (file: File | undefined) => {
    if (!file) {
      setVideoFile(null);
      form.setValue("videoUrl", "", { shouldValidate: true });
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
      form.setValue("pdfUrl", "", { shouldValidate: true });
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
    form.setValue("videoUrl", "", { shouldValidate: true });
  };

  const removePdf = () => {
    setPdfFile(null);
    form.setValue("pdfUrl", "", { shouldValidate: true });
  };

  const onSubmit = async (data: LectureFormValues) => {
    const toastId = toast.loading("Creating...");
    if (!videoFile) {
      toast.error("Please upload a video for the lecture");
      return;
    }

    if (!data.lectureTitle) {
      toast.error("Lecture title is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare upload promises
      const uploadPromises: Promise<void>[] = [];
      let videoUrl = "";
      let videoDuration = 0;
      let videoResolutions: VideoResolution[] = [];
      let hlsUrl = "";
      let pdfUrl = "";

      // Video upload (required) with adaptive streaming
      uploadPromises.push(
        uploadVideo(videoFile, undefined, true).then((response) => {
          if (!response) {
            throw new Error("Video upload failed - no response received");
          }

          if (!response.secure_url) {
            throw new Error("Video upload failed - no URL received");
          }

          // Set standard video URL for backward compatibility
          videoUrl = response.secure_url;
          videoDuration = response?.duration || 0;
          form.setValue("videoUrl", videoUrl, { shouldValidate: true });
          form.setValue("duration", videoDuration, {
            shouldValidate: true,
          });

          // Set adaptive streaming URLs if available
          if (response.videoResolutions && response.videoResolutions.length > 0) {
            videoResolutions = response.videoResolutions;
            form.setValue("videoResolutions", videoResolutions, { shouldValidate: true });

            // Set HLS URL if available
            const hlsVariant = videoResolutions.find(r => r.format === 'hls');
            if (hlsVariant) {
              hlsUrl = hlsVariant.url;
              form.setValue("hlsUrl", hlsUrl, { shouldValidate: true });
            }
          }

          console.log("Video upload successful:", response);
        }).catch(error => {
          console.error("Video upload error:", error);
          throw error;
        })
      );

      // PDF upload (optional)
      if (pdfFile) {
        uploadPromises.push(
          uploadPdf(pdfFile).then((response) => {
            if (response?.secure_url) {
              pdfUrl = response.secure_url;
              form.setValue("pdfUrl", pdfUrl, { shouldValidate: true });
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
  const isUploading =
    isVideoUploading || isPdfUploading || isSubmitting || isLoading;

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

        <h1 className="text-3xl font-bold tracking-tight">Add New Lecture</h1>
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
                render={({ field: _ }) => (
                  <FormItem>
                    <FormLabel>Lecture Video*</FormLabel>
                    <FormControl>
                      <FileUpload
                        value={videoFile ? [videoFile] : []}
                        onValueChange={(files) => handleVideoChange(files?.[0])}
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
                                          videoBytesUploaded || (videoProgress / 100) * videoFile.size
                                        )}{" "}
                                        / {formatBytes(videoTotalBytes || videoFile.size)}
                                      </span>
                                    </div>
                                    {videoProgress > 0 && videoProgress < 100 && (
                                      <div className="mt-1">
                                        <span className="text-xs text-blue-600">
                                          Preparing adaptive streaming formats...
                                        </span>
                                      </div>
                                    )}
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
                render={({ field: _ }) => (
                  <FormItem>
                    <FormLabel>PDF Materials (Optional)</FormLabel>
                    <FormControl>
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
                                  onClick={() => {
                                    setPdfFile(null);
                                    form.setValue("pdfUrl", "", {
                                      shouldValidate: true,
                                    });
                                  }}
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
                      Uploading...
                    </div>
                  ) : (
                    "Save Lecture"
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

export default LectureCreate;
