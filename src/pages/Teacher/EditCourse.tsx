import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Check,
  ArrowLeft,
  ArrowRight,
  CloudUpload,
  X,
  Loader,
  Save,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import StepIndicator from "@/components/StepIndicator";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadList,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemDelete,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { useAppDispatch } from "@/redux/hooks";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import {
  useGetCourseByIdQuery,
  useEditCourseMutation,
} from "@/redux/features/course/courseApi";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { COURSE_CATEGORIES, COURSE_LEVEL } from "@/types";
import { setCourse } from "@/redux/features/course/courseSlice";
import { Skeleton } from "@/components/ui/skeleton";

const courseSchema = z
  .object({
    // Step 1: Course Info
    title: z
      .string()
      .min(5, { message: "Title must be at least 5 characters" }),
    subtitle: z.string().optional(),
    description: z
      .string()
      .min(20, { message: "Description must be at least 20 characters" }),
    category: z.enum(COURSE_CATEGORIES),
    courseLevel: z.enum(COURSE_LEVEL),

    // Step 2: Materials (will be converted to 'file' when submitting)
    courseThumbnail: z.instanceof(File).optional(),

    // Step 3: Settings
    status: z.enum(["draft", "published", "upcoming", "ongoing", "finished"]),
    coursePrice: z.string().optional(),
    isFree: z.enum(["free", "paid"]),
  })
  .superRefine((data, ctx) => {
    if (data.isFree === "paid" && !data.coursePrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price is required for paid courses",
        path: ["coursePrice"],
      });
    }
  });

const steps = [
  {
    id: "info",
    title: "Course Info",
    description: "Enter basic information about your course including title, description, category, and level."
  },
  {
    id: "materials",
    title: "Upload Materials",
    description: "Upload your course thumbnail and other teaching materials."
  },
  {
    id: "settings",
    title: "Settings",
    description: "Configure course settings including status and pricing options."
  },
  {
    id: "review",
    title: "Review & Save",
    description: "Review all your course information before saving changes."
  },
];

const EditCourse = () => {
  const dispatch = useAppDispatch();
  const { courseId } = useParams<{ courseId: string }>();
  const { data: userData } = useGetMeQuery(undefined);
  const { data: courseData, isLoading: isLoadingCourse } =
    useGetCourseByIdQuery(courseId as string, {
      skip: !courseId,
    });

  console.log("Course ID:", courseId);
  const [editCourse, { isLoading }] = useEditCourseMutation();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formInitialized, setFormInitialized] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const navigate = useNavigate();
  const teacherId = userData?.data?._id;

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      status: "draft",
      isFree: "free",
      coursePrice: "",
    },
  });

  // Load course data when available
  useEffect(() => {
    console.log("EditCourse useEffect - Loading state:", isLoadingCourse);
    console.log("EditCourse useEffect - Course data:", courseData);
    console.log("EditCourse useEffect - Course ID:", courseId);

    if (courseData?.data) {
      console.log(
        "EditCourse useEffect - Course data available:",
        courseData.data
      );
      const course = courseData.data;

      form.reset({
        title: course.title || "",
        subtitle: course.subtitle || "",
        description: course.description || "",
        category: course.category as any,
        courseLevel: course.courseLevel as any,
        status: (course.status as any) || "draft",
        isFree: (course.isFree as any) || "free",
        coursePrice: course.coursePrice ? course.coursePrice.toString() : "",
      });

      if (course.courseThumbnail) {
        setThumbnailPreview(course.courseThumbnail);
      }

      setFormInitialized(true);
      console.log("EditCourse useEffect - Form initialized");
    } else if (!isLoadingCourse && courseId && courseData === undefined) {
      // If we're not loading, have a courseId, but no data, there might be an error
      console.error("Failed to load course data");
      toast.error("Failed to load course data");
      navigate("/teacher/courses");
    }
  }, [courseData, isLoadingCourse, courseId, form, navigate]);

  const goToNextStep = useCallback(() => {
    setCompletedSteps((prev) => [...prev, currentStep]);
    setCurrentStep((prev) => prev + 1);
  }, [currentStep]);

  const goToPrevStep = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

  const updateCourse = useCallback(async () => {
    if (!courseId) {
      console.error("Cannot update course: courseId is undefined");
      toast.error("Cannot update course: missing course ID");
      return;
    }

    try {
      console.log("Updating course with ID:", courseId);
      const values = form.getValues();
      const formData = new FormData();

      // Handle coursePrice separately
      if (values.coursePrice) {
        const price = Number(values.coursePrice);
        if (!isNaN(price)) {
          formData.append("coursePrice", price.toString());
        }
      }

      // Handle file separately
      if (values.courseThumbnail instanceof File) {
        formData.append("file", values.courseThumbnail);
      }

      // Set isPublished as boolean
      formData.append(
        "isPublished",
        JSON.stringify(values.status === "published")
      );

      // Set status
      formData.append("status", values.status || "draft");

      // Handle other fields
      const { coursePrice, courseThumbnail, status, ...otherValues } = values;

      // Add required fields with proper type handling
      if (values.title) formData.append("title", values.title);
      if (values.category) formData.append("category", values.category);
      if (values.courseLevel)
        formData.append("courseLevel", values.courseLevel);
      if (values.isFree) formData.append("isFree", values.isFree);
      if (values.description)
        formData.append("description", values.description);
      if (values.subtitle) formData.append("subtitle", values.subtitle);

      console.log("Calling editCourse mutation with ID:", courseId);
      const res = await editCourse({
        id: courseId,
        data: formData,
        file: values.courseThumbnail,
      }).unwrap();

      dispatch(setCourse(res.data));
      toast.success("Course updated successfully");
      navigate("/teacher/courses");
    } catch (error: unknown) {
      console.error("Failed to update course:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to update course");
    }
  }, [form, editCourse, courseId, dispatch, navigate]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (isLoadingCourse) {
      const timeout = setTimeout(() => {
        if (isLoadingCourse) {
          console.error("Loading timeout - course data not received");
          toast.error("Failed to load course data - timeout");
          navigate("/teacher/courses");
        }
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoadingCourse, navigate]);

  console.log(
    "Render state - isLoadingCourse:",
    isLoadingCourse,
    "formInitialized:",
    formInitialized
  );

  if (isLoadingCourse || !formInitialized) {
    return <EditCourseSkeleton />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-4">
          Edit Course
        </h1>

        {/* Step indicators */}
        <div className="mb-6 sm:mb-10">
          <StepIndicator
            steps={steps}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={(index) => {
              // Only allow clicking on completed steps or the current step + 1
              if (completedSteps.includes(index) || index === currentStep || index === currentStep + 1) {
                setCurrentStep(index);
              }
            }}
          />
        </div>
      </div>

      {/* Step content */}
      <Card className="form-card mb-6 w-full">
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          <Form {...form}>
            {/* Step 1: Course Info */}
            {currentStep === 0 && (
              <div className="space-y-4 sm:space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Course Title*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Complete JavaScript Course 2023"
                          className="text-sm sm:text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Course Subtitle</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Master JavaScript with projects"
                          className="text-sm sm:text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Course Description*</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what students will learn in this course..."
                          className="min-h-[100px] sm:min-h-[150px] text-sm sm:text-base"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">Category*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="text-sm sm:text-base">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COURSE_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category} className="text-sm sm:text-base">
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="courseLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm sm:text-base">Course Level*</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="text-sm sm:text-base">
                              <SelectValue placeholder="Select course level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COURSE_LEVEL.map((level) => (
                              <SelectItem key={level} value={level} className="text-sm sm:text-base">
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs sm:text-sm" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/teacher/courses")}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      form
                        .trigger([
                          "title",
                          "description",
                          "category",
                          "courseLevel",
                        ])
                        .then((isValid) => {
                          if (isValid) goToNextStep();
                        });
                    }}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Course Materials */}
            {currentStep === 1 && (
              <div className="space-y-4 sm:space-y-6">
                <FormField
                  control={form.control}
                  name="courseThumbnail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Course Thumbnail</FormLabel>
                      <FormControl>
                        <div className="space-y-3 sm:space-y-4">
                          {thumbnailPreview && !field.value && (
                            <div className="mb-3 sm:mb-4">
                              <p className="text-xs sm:text-sm mb-2">Current Thumbnail:</p>
                              <div className="relative w-full max-w-[200px] sm:max-w-[300px] mx-auto sm:mx-0 rounded-md overflow-hidden">
                                <img
                                  src={thumbnailPreview}
                                  alt="Current thumbnail"
                                  className="w-full h-auto object-cover"
                                />
                              </div>
                            </div>
                          )}

                          <FileUpload
                            value={field.value ? [field.value] : []}
                            onValueChange={(files) => {
                              field.onChange(files[0]);
                              // Clear the preview when a new file is selected
                              if (files[0]) {
                                setThumbnailPreview(null);
                              }
                            }}
                            accept="image/*"
                            maxFiles={1}
                            maxSize={5 * 1024 * 1024}
                            onFileReject={(_, message) => {
                              form.setError("courseThumbnail", { message });
                            }}
                            multiple={false}
                          >
                            <FileUploadDropzone className="flex-row border-dotted text-xs sm:text-sm p-3 sm:p-4">
                              <CloudUpload className="size-3 sm:size-4" />
                              <span className="hidden sm:inline">Drag and drop or</span>
                              <span className="sm:hidden">Upload</span>
                              <FileUploadTrigger asChild>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 text-xs sm:text-sm"
                                >
                                  choose a file
                                </Button>
                              </FileUploadTrigger>
                              <span className="hidden sm:inline">to upload</span>
                            </FileUploadDropzone>
                            <FileUploadList>
                              {field.value && (
                                <FileUploadItem value={field.value}>
                                  <FileUploadItemPreview />
                                  <FileUploadItemMetadata className="text-xs sm:text-sm" />
                                  <FileUploadItemDelete asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-6 sm:size-7"
                                      onClick={() => field.onChange(undefined)}
                                    >
                                      <X className="size-3 sm:size-4" />
                                      <span className="sr-only">Delete</span>
                                    </Button>
                                  </FileUploadItemDelete>
                                </FileUploadItem>
                              )}
                            </FileUploadList>
                          </FileUpload>
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">
                        {field.value
                          ? "New thumbnail will replace the current one."
                          : "Upload a new thumbnail image up to 5MB or keep the current one."}
                      </FormDescription>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />

                <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:justify-between">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={goToPrevStep}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      form.trigger(["courseThumbnail"]).then((isValid) => {
                        if (isValid) goToNextStep();
                      });
                    }}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Course Settings */}
            {currentStep === 2 && (
              <div className="space-y-4 sm:space-y-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Course Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-sm sm:text-base">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft" className="text-sm sm:text-base">Draft</SelectItem>
                          <SelectItem value="published" className="text-sm sm:text-base">Published</SelectItem>
                          <SelectItem value="upcoming" className="text-sm sm:text-base">Upcoming</SelectItem>
                          <SelectItem value="ongoing" className="text-sm sm:text-base">Ongoing</SelectItem>
                          <SelectItem value="finished" className="text-sm sm:text-base">Finished</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />

                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <Label className="mb-2 block text-sm sm:text-base">Pricing</Label>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                      <FormField
                        control={form.control}
                        name="isFree"
                        render={({ field }) => (
                          <FormItem className="space-y-2 sm:space-y-3">
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-col space-y-2"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="free" id="free" />
                                  <Label
                                    htmlFor="free"
                                    className="text-xs sm:text-sm font-medium"
                                  >
                                    Free Course
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="paid" id="paid" />
                                  <Label
                                    htmlFor="paid"
                                    className="text-xs sm:text-sm font-medium"
                                  >
                                    Paid Course
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage className="text-xs sm:text-sm" />
                          </FormItem>
                        )}
                      />

                      {form.watch("isFree") === "paid" && (
                        <div className="sm:ml-4">
                          <FormField
                            control={form.control}
                            name="coursePrice"
                            render={({ field }) => (
                              <FormItem>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <span className="text-gray-500 text-sm sm:text-base">$</span>
                                  </div>
                                  <Input
                                    type="number"
                                    placeholder="29.99"
                                    className="pl-6 text-sm sm:text-base"
                                    {...field}
                                  />
                                </div>
                                <FormMessage className="text-xs sm:text-sm" />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPrevStep}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      form
                        .trigger(["status", "isFree", "coursePrice"])
                        .then((isValid) => {
                          if (isValid) goToNextStep();
                        });
                    }}
                    className="w-full sm:w-auto order-1 sm:order-2"
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Review & Save */}
            {currentStep === 3 && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <h3 className="text-base sm:text-lg font-medium mb-4 sm:mb-6">
                    Review Course Details
                  </h3>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="border-b pb-4">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">
                        Course Information
                      </h4>
                      <p className="text-lg sm:text-xl font-semibold line-clamp-2">
                        {form.watch("title")}
                      </p>
                      {form.watch("subtitle") && (
                        <p className="text-gray-600 text-sm sm:text-base line-clamp-2">
                          {form.watch("subtitle")}
                        </p>
                      )}
                      <div className="mt-2">
                        <span className="inline-flex bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          {form.watch("category")}
                        </span>
                      </div>
                      <div className="mt-3 sm:mt-4 text-xs sm:text-sm max-h-24 sm:max-h-32 overflow-y-auto pr-2">
                        {form.watch("description")}
                      </div>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">
                        Materials
                      </h4>
                      <div className="flex items-center gap-3">
                        {(form.watch("courseThumbnail") || thumbnailPreview) && (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                            {form.watch("courseThumbnail") ? (
                              <img
                                src={URL.createObjectURL(form.watch("courseThumbnail"))}
                                alt="New thumbnail"
                                className="w-full h-full object-cover"
                              />
                            ) : thumbnailPreview ? (
                              <img
                                src={thumbnailPreview}
                                alt="Current thumbnail"
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                        )}
                        <p className="text-xs sm:text-sm text-gray-600">
                          {form.watch("courseThumbnail")
                            ? "New thumbnail will be uploaded"
                            : thumbnailPreview
                            ? "Using existing thumbnail"
                            : "No thumbnail"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">
                        Settings
                      </h4>
                      <div className="flex flex-wrap gap-4 sm:gap-6">
                        <div>
                          <span className="text-xs text-gray-500 block">
                            Status
                          </span>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              form.watch("status") === "published"
                                ? "bg-green-100 text-green-800"
                                : form.watch("status") === "draft"
                                ? "bg-amber-100 text-amber-800"
                                : form.watch("status") === "upcoming"
                                ? "bg-blue-100 text-blue-800"
                                : form.watch("status") === "ongoing"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {form.watch("status").charAt(0).toUpperCase() +
                              form.watch("status").slice(1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">
                            Price
                          </span>
                          <span className="text-sm sm:text-base font-medium">
                            {form.watch("isFree") === "free"
                              ? "Free"
                              : `$${form.watch("coursePrice")}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPrevStep}
                    disabled={isLoading}
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button
                    onClick={updateCourse}
                    className="bg-blue-700 w-full sm:w-auto order-1 sm:order-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader className="animate-spin w-4 h-4" />
                        <span className="text-sm sm:text-base">Saving Changes...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        <span className="text-sm sm:text-base">Save Changes</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

const EditCourseSkeleton = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <Skeleton className="h-8 sm:h-10 w-36 sm:w-48 mb-4" />

        {/* Step indicators skeleton */}
        <div className="relative mb-6 sm:mb-10">
          {/* Mobile step indicators skeleton */}
          <div className="flex md:hidden justify-between items-center px-2 py-2">
            {[1, 2, 3, 4].map((_, index) => (
              <div key={index} className="flex flex-col items-center">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="w-12 h-3 mt-2" />
              </div>
            ))}
          </div>

          {/* Tablet/Desktop step indicators skeleton */}
          <div className="hidden md:flex justify-between items-center">
            {[1, 2, 3, 4].map((_, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                  <Skeleton className="w-12 h-12 lg:w-16 lg:h-16 rounded-full" />
                  <Skeleton className="w-16 h-4 mt-2" />
                </div>

                {index < 3 && (
                  <div className="flex-1 mx-2">
                    <Skeleton className="h-1 w-full" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <Card className="form-card mb-6 w-full">
        <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Form fields skeleton */}
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-9 sm:h-10 w-full" />
            </div>

            <div>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-9 sm:h-10 w-full" />
            </div>

            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-24 sm:h-32 w-full" />
            </div>

            {/* Grid layout for category and level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-9 sm:h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-9 sm:h-10 w-full" />
              </div>
            </div>

            {/* Buttons skeleton */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:justify-between">
              <Skeleton className="h-9 sm:h-10 w-full sm:w-24 order-2 sm:order-1" />
              <Skeleton className="h-9 sm:h-10 w-full sm:w-24 order-1 sm:order-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditCourse;
