import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ArrowLeft,
  ArrowRight,
  CloudUpload,
  X,
  Loader,
  ExternalLink,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { debounce } from "lodash";

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
import { useCreateCourseMutation } from "@/redux/features/course/courseApi";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { COURSE_CATEGORIES, COURSE_LEVEL } from "@/types";
import { setCourse } from "@/redux/features/course/courseSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { useConnectStripeAccountMutation } from "@/redux/features/payment/payment.api";
import StepIndicator from "@/components/StepIndicator";
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
    status: z.enum(["draft", "published"]),
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
  { id: "info", title: "Course Info" },
  { id: "materials", title: "Upload Materials" },
  { id: "settings", title: "Settings" },
  { id: "review", title: "Review & Publish" },
];

const CourseCreate = () => {
  const dispatch = useAppDispatch();
  const { data } = useGetMeQuery(undefined);
  const [createCourse, { isLoading }] = useCreateCourseMutation();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formInitialized, setFormInitialized] = useState(false);
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [connectStripeAccount, { isLoading: isConnectingStripe }] = useConnectStripeAccountMutation();

  // Check if the screen is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Check multiple fields to determine if Stripe is connected
  const hasStripeConnected = data?.data?.stripeVerified ||
                            data?.data?.stripeOnboardingComplete ||
                            (data?.data?.stripeAccountId && data?.data?.stripeAccountId.length > 0);
                            
  // Log Stripe connection status for debugging
  useEffect(() => {
    if (data?.data) {
      console.log("Teacher Stripe status:", {
        stripeVerified: data.data.stripeVerified,
        stripeOnboardingComplete: data.data.stripeOnboardingComplete,
        stripeAccountId: data.data.stripeAccountId,
        hasStripeConnected
      });
    }
  }, [data?.data, hasStripeConnected]);

  const navigate = useNavigate();
  const teacherId = data?.data?._id;

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      status: "draft",
      isFree: "free",
      coursePrice: "",
    },
  });

  // Load saved form data
  useEffect(() => {
    const savedData = localStorage.getItem("courseForm");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData.courseThumbnail) {
          delete parsedData.courseThumbnail;
        }
        form.reset(parsedData);
      } catch (e) {
        console.error("Failed to parse saved form data", e);
      }
    }
    setFormInitialized(true);
  }, [form]);

  // Save form data to localStorage
  useEffect(() => {
    const saveFormData = debounce(() => {
      const values = form.getValues();
      const serializableValues = { ...values };
      if (values.courseThumbnail) {
        delete serializableValues.courseThumbnail;
      }
      localStorage.setItem("courseForm", JSON.stringify(serializableValues));
    }, 500);

    const subscription = form.watch(saveFormData);
    return () => subscription.unsubscribe();
  }, [form]);

  const goToNextStep = useCallback(() => {
    setCompletedSteps((prev) => [...prev, currentStep]);
    setCurrentStep((prev) => prev + 1);
  }, [currentStep]);

  const goToPrevStep = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

  const handleConnectStripe = async () => {
    try {
      // Check if teacherId exists
      if (!teacherId) {
        console.error("Teacher ID is missing");
        toast.error("Teacher ID is missing. Please try again or contact support.");
        return;
      }

      // Check if Stripe is already connected
      if (hasStripeConnected) {
        console.log("Stripe is already connected");
        toast.success("Your Stripe account is already connected!");
        setShowStripeModal(false);
        navigate("/teacher/courses");
        return;
      }

      console.log("Connecting Stripe with teacherId:", teacherId);
      console.log("Current auth state:", { token: data?.data?.accessToken });

      // Call the API to connect Stripe
      const result = await connectStripeAccount(teacherId).unwrap();
      console.log("Stripe connection result:", result);

      // Check for different response formats
      if (result?.data?.url) {
        // Format 1: data.url
        console.log("Opening Stripe URL (format 1):", result.data.url);
        window.open(result.data.url, "_blank");
        toast.info("Completing your Stripe setup in a new tab. Please complete all steps.");
        setShowStripeModal(false);
      } else if (result?.url) {
        // Format 2: direct url property
        console.log("Opening Stripe URL (format 2):", result.url);
        window.open(result.url, "_blank");
        toast.info("Completing your Stripe setup in a new tab. Please complete all steps.");
        setShowStripeModal(false);
      } else if (result?.status === "complete") {
        // Already complete
        toast.success("Your Stripe account is already set up and verified!");
        setShowStripeModal(false);
      } else {
        // Log the unexpected format for debugging
        console.warn("Unexpected result format:", JSON.stringify(result, null, 2));
        toast.warning("Received an unexpected response. Please try again.");
      }
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        data?: { message?: string };
        error?: string
      };
      console.error("Stripe connection error:", error);

      // Detailed error logging
      console.error("Error details:", {
        status: err.status,
        data: err.data,
        message: err.data?.message,
        error: err.error,
      });

      // More specific error messages based on status codes
      if (err.data?.message?.includes("Stripe")) {
        toast.error(err.data.message);
      } else if (err.status === 404) {
        toast.error("Teacher account not found. Please contact support.");
      } else if (err.status === 401) {
        toast.error("Authentication error. Please log in again.");
      } else if (err.status === 403) {
        toast.error("You don't have permission to connect a Stripe account.");
      } else if (err.status === 500) {
        toast.error("Server error. Please try again later or contact support.");
      } else {
        toast.error(err.data?.message || "Failed to connect Stripe account");
      }
    }
  };

  const publishCourse = useCallback(async () => {
    try {
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
      formData.append("isPublished", JSON.stringify(values.status === "published"));

      // Set status
      formData.append("status", values.status || "draft");

      // Handle other fields
      const { coursePrice, courseThumbnail, status, ...otherValues } = values;

      // Add required fields with proper type handling
      if (values.title) formData.append("title", values.title);
      if (values.category) formData.append("category", values.category);
      if (values.courseLevel) formData.append("courseLevel", values.courseLevel);
      if (values.isFree) formData.append("isFree", values.isFree);
      if (values.description) formData.append("description", values.description);
      if (values.subtitle) formData.append("subtitle", values.subtitle);

      const res = await createCourse({
        id: teacherId,
        data: formData,
      }).unwrap();

      dispatch(setCourse(res.data));
      localStorage.removeItem("courseForm");

      // Double-check if teacher has connected Stripe
      // First check our local state
      if (!hasStripeConnected) {
        // If not connected according to local state, do an additional check
        // by looking at the response data which might have updated information
        const stripeConnected = res?.data?.teacher?.stripeVerified ||
                               res?.data?.teacher?.stripeOnboardingComplete ||
                               (res?.data?.teacher?.stripeAccountId && res?.data?.teacher?.stripeAccountId.length > 0);

        if (stripeConnected) {
          // If connected according to response, navigate to courses
          navigate("/teacher/courses");
        } else {
          // If still not connected, show the modal
          setShowStripeModal(true);
        }
      } else {
        // If already connected according to local state, navigate to courses
        navigate("/teacher/courses");
      }
    } catch (error: unknown) {
      console.error("Failed to create course:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to create course");
    }
  }, [form, createCourse, teacherId, dispatch, navigate, hasStripeConnected]);

  // CourseCreateSkeleton component for loading state
  const CourseCreateSkeleton = () => {
    return (
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 animate-in fade-in duration-500">
        <div className="mb-6 sm:mb-8">
          <Skeleton className="h-8 sm:h-10 w-64 sm:w-80 mb-4" />

          {/* Step indicators skeleton */}
          <div className="mb-6 sm:mb-10">
            <div className="hidden md:block lg:hidden">
              <div className="relative flex items-center justify-between px-6 py-3">
                <div className="absolute top-1/2 left-[40px] right-[40px] h-1 bg-gray-200 z-0 transform -translate-y-1/2" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative z-10 flex flex-col items-center">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <Skeleton className="mt-2 h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
            <div className="md:hidden">
              <div className="relative flex items-center justify-between min-w-max py-2 mx-auto w-full max-w-[320px]">
                <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-gray-200 z-0 transform -translate-y-1/2" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col items-center space-y-2 relative z-10 px-2">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative flex items-center justify-between px-10 py-4">
                <div className="absolute top-1/2 left-[60px] right-[60px] h-1 bg-gray-200 z-0 transform -translate-y-1/2" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="relative z-10 flex flex-col items-center">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <Skeleton className="mt-3 h-5 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Form card skeleton */}
        <Card className="form-card mb-6 w-full border border-gray-200 shadow-sm">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="space-y-4 sm:space-y-6">
              {/* Form fields skeleton */}
              <div className="space-y-4">
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-5 w-36 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-32 w-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Skeleton className="h-5 w-24 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              </div>

              {/* Buttons skeleton */}
              <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:justify-between">
                <Skeleton className="h-10 w-full sm:w-32 order-2 sm:order-1" />
                <Skeleton className="h-10 w-full sm:w-32 order-1 sm:order-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (!formInitialized) {
    return <CourseCreateSkeleton />;
  }
  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-4">
          Create New Course
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
                          defaultValue={field.value}
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
                          defaultValue={field.value}
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
                        <FileUpload
                          value={field.value ? [field.value] : []}
                          onValueChange={(files) => field.onChange(files[0])}
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
                      </FormControl>
                      <FormDescription className="text-xs sm:text-sm">
                        Upload a thumbnail image up to 5MB.
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
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-sm sm:text-base">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft" className="text-sm sm:text-base">Draft</SelectItem>
                          <SelectItem value="published" className="text-sm sm:text-base">Published</SelectItem>
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

            {/* Step 4: Review & Publish */}
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
                        {form.watch("courseThumbnail") && (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                            <img
                              src={URL.createObjectURL(form.watch("courseThumbnail"))}
                              alt="Course thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <p className="text-xs sm:text-sm text-gray-600">
                          {form.watch("courseThumbnail")
                            ? "Course thumbnail uploaded"
                            : "No thumbnail uploaded"}
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
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {form.watch("status") === "published"
                              ? "Published"
                              : "Draft"}
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
                    onClick={publishCourse}
                    className="bg-blue-700 w-full sm:w-auto order-1 sm:order-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2 px-2">
                        <Skeleton className="w-4 h-4 rounded-full animate-pulse" />
                        <Skeleton className="h-5 w-24 sm:w-32 animate-pulse" />
                      </div>
                    ) : (
                      <span className="text-sm sm:text-base">
                        {form.watch("status") === "published"
                          ? "Publish Course"
                          : "Save as Draft"}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Form>
        </CardContent>
      </Card>
      {/* Responsive Stripe Connection Modal - Dialog for desktop, Drawer for mobile */}
      {isMobile ? (
        <Drawer open={showStripeModal} onOpenChange={setShowStripeModal}>
          <DrawerContent>
            <DrawerHeader className="space-y-2 text-center">
              <DrawerTitle className="text-lg">Connect Stripe to Receive Payments</DrawerTitle>
              <DrawerDescription className="text-xs">
                To receive payments for your courses, you need to connect your Stripe account. This is a one-time setup process.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 flex flex-col space-y-3 py-3">
              <p className="text-sm font-medium">Benefits of connecting Stripe:</p>
              <ul className="list-disc pl-4 space-y-1 text-xs">
                <li>Receive payments directly to your bank account</li>
                <li>Track earnings in real-time</li>
                <li>Manage payouts and transactions</li>
              </ul>
            </div>
            <DrawerFooter className="flex flex-col gap-3 pt-2">
              <Button
                onClick={handleConnectStripe}
                disabled={isConnectingStripe}
                className="flex items-center justify-center gap-2 w-full text-xs"
              >
                {isConnectingStripe ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full animate-pulse" />
                    <Skeleton className="h-4 w-20 animate-pulse" />
                  </div>
                ) : (
                  <>
                    <ExternalLink className="h-3 w-3" />
                    <span>Connect with Stripe</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowStripeModal(false);
                  navigate("/teacher/courses");
                }}
                className="w-full text-xs"
              >
                Skip for now
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showStripeModal} onOpenChange={setShowStripeModal}>
          <DialogContent className="sm:max-w-md p-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-xl">Connect Stripe to Receive Payments</DialogTitle>
              <DialogDescription className="text-sm">
                To receive payments for your courses, you need to connect your Stripe account. This is a one-time setup process.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col space-y-4 py-4">
              <p className="text-base font-medium">Benefits of connecting Stripe:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Receive payments directly to your bank account</li>
                <li>Track earnings in real-time</li>
                <li>Manage payouts and transactions</li>
              </ul>
            </div>
            <DialogFooter className="flex flex-row justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowStripeModal(false);
                  navigate("/teacher/courses");
                }}
                className="w-auto text-sm"
              >
                Skip for now
              </Button>
              <Button
                onClick={handleConnectStripe}
                disabled={isConnectingStripe}
                className="flex items-center justify-center gap-2 w-auto text-sm"
              >
                {isConnectingStripe ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
                    <Skeleton className="h-5 w-24 animate-pulse" />
                  </div>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    <span>Connect with Stripe</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default React.memo(CourseCreate);
