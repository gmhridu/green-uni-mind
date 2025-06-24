import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Upload,
  FileText,
  Video,
  Clock,
  CheckCircle,
  X,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { formatBytes } from '@/utils/uploadMedia';
import { ILecture } from '@/types/course';

// Validation schema
const lectureSchema = z.object({
  lectureTitle: z.string().min(1, 'Lecture title is required'),
  instruction: z.string().optional(),
  isPreviewFree: z.boolean().default(false),
  videoUrl: z.string().optional(),
  videoResolutions: z.array(z.object({
    url: z.string(),
    quality: z.string(),
    format: z.string().optional(),
  })).optional(),
  hlsUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
});

type LectureFormValues = z.infer<typeof lectureSchema>;

interface LectureFormProps {
  courseId: string;
  courseName?: string;
  initialData?: Partial<ILecture>;
  mode: 'create' | 'edit';
  onSubmit: (data: LectureFormValues & { 
    videoFile?: File | null; 
    pdfFile?: File | null;
    videoDuration?: number;
  }) => Promise<void>;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

interface UploadProgress {
  video: number;
  pdf: number;
}

const LectureForm: React.FC<LectureFormProps> = ({
  courseId,
  courseName,
  initialData,
  mode,
  onSubmit,
  isSubmitting = false,
  onCancel,
}) => {
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ video: 0, pdf: 0 });
  const [videoDuration, setVideoDuration] = useState<number>(0);

  const form = useForm<LectureFormValues>({
    resolver: zodResolver(lectureSchema),
    defaultValues: {
      lectureTitle: initialData?.lectureTitle || '',
      instruction: initialData?.instruction || '',
      isPreviewFree: initialData?.isPreviewFree || false,
      videoUrl: initialData?.videoUrl || '',
      videoResolutions: initialData?.videoResolutions || [],
      hlsUrl: initialData?.hlsUrl || '',
      pdfUrl: initialData?.pdfUrl || '',
    },
  });

  // Update form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && mode === 'edit') {
      form.reset({
        lectureTitle: initialData.lectureTitle || '',
        instruction: initialData.instruction || '',
        isPreviewFree: initialData.isPreviewFree || false,
        videoUrl: initialData.videoUrl || '',
        videoResolutions: initialData.videoResolutions || [],
        hlsUrl: initialData.hlsUrl || '',
        pdfUrl: initialData.pdfUrl || '',
      });
    }
  }, [initialData, mode, form]);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) { // 500MB limit
        toast.error('Video file size must be less than 500MB');
        return;
      }
      setVideoFile(file);
      
      // Get video duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setVideoDuration(Math.round(video.duration));
        window.URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error('PDF file size must be less than 50MB');
        return;
      }
      setPdfFile(file);
    }
  };

  const removeVideoFile = () => {
    setVideoFile(null);
    setVideoDuration(0);
    setUploadProgress(prev => ({ ...prev, video: 0 }));
  };

  const removePdfFile = () => {
    setPdfFile(null);
    setUploadProgress(prev => ({ ...prev, pdf: 0 }));
  };

  const handleFormSubmit = async (data: LectureFormValues) => {
    try {
      await onSubmit({
        ...data,
        videoFile,
        pdfFile,
        videoDuration,
      });
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(`/teacher/courses/${courseId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {mode === 'create' ? 'Create New Lecture' : 'Edit Lecture'}
            </h1>
            {courseName && (
              <p className="text-sm text-muted-foreground">
                Course: {courseName}
              </p>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Lecture Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="lectureTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lecture Title*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter a descriptive title for this lecture"
                          {...field}
                          disabled={isSubmitting}
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
                          placeholder="Add instructions, summary, or learning objectives for students..."
                          className="min-h-[100px]"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide context and guidance to help students understand what they'll learn
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPreviewFree"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Free Preview</FormLabel>
                        <FormDescription>
                          Allow students to preview this lecture before purchasing the course
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Media Upload Section */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Content Upload</h3>
                
                {/* Video Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    <span className="font-medium">Video Content</span>
                  </div>
                  
                  {!videoFile && !initialData?.videoUrl ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="video-upload" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Upload video file
                            </span>
                            <span className="mt-1 block text-sm text-gray-500">
                              MP4, WebM up to 500MB
                            </span>
                          </label>
                          <input
                            id="video-upload"
                            type="file"
                            className="hidden"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            disabled={isSubmitting}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-4"
                          onClick={() => document.getElementById('video-upload')?.click()}
                          disabled={isSubmitting}
                        >
                          Choose Video File
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Video className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="font-medium">
                              {videoFile?.name || 'Existing video'}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {videoFile && <span>{formatBytes(videoFile.size)}</span>}
                              {videoDuration > 0 && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toString().padStart(2, '0')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeVideoFile}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {uploadProgress.video > 0 && uploadProgress.video < 100 && (
                        <div className="mt-3">
                          <Progress value={uploadProgress.video} className="h-2" />
                          <p className="text-sm text-gray-500 mt-1">
                            Uploading... {uploadProgress.video}%
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* PDF Upload */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">PDF Resources (Optional)</span>
                  </div>
                  
                  {!pdfFile && !initialData?.pdfUrl ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                      <div className="text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <label htmlFor="pdf-upload" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900">
                              Upload PDF resources
                            </span>
                            <span className="mt-1 block text-sm text-gray-500">
                              PDF files up to 50MB
                            </span>
                          </label>
                          <input
                            id="pdf-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf"
                            onChange={handlePdfUpload}
                            disabled={isSubmitting}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-4"
                          onClick={() => document.getElementById('pdf-upload')?.click()}
                          disabled={isSubmitting}
                        >
                          Choose PDF File
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-red-500" />
                          <div>
                            <p className="font-medium">
                              {pdfFile?.name || 'Existing PDF'}
                            </p>
                            {pdfFile && (
                              <p className="text-sm text-gray-500">
                                {formatBytes(pdfFile.size)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removePdfFile}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {uploadProgress.pdf > 0 && uploadProgress.pdf < 100 && (
                        <div className="mt-3">
                          <Progress value={uploadProgress.pdf} className="h-2" />
                          <p className="text-sm text-gray-500 mt-1">
                            Uploading... {uploadProgress.pdf}%
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {mode === 'create' ? 'Creating...' : 'Updating...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {mode === 'create' ? 'Create Lecture' : 'Update Lecture'}
                    </>
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

export default LectureForm;
