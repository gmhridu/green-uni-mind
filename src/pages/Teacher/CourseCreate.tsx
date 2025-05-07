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
import { toast } from "sonner";
import { useConnectStripeAccountMutation } from "@/redux/features/payment/payment.api";

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
  const [connectStripeAccount, { isLoading: isConnectingStripe }] = useConnectStripeAccountMutation();

  const navigate = useNavigate();
  const teacherId = data?.data?._id;
  const hasStripeConnected = data?.data?.stripeVerified;

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
  }, []);

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
  }, [form.watch]);

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

      console.log("Connecting Stripe with teacherId:", teacherId);
      console.log("Current auth state:", { token: data?.data?.accessToken });

      // Call the API to connect Stripe
      const result = await connectStripeAccount(teacherId).unwrap();
      console.log("Stripe connection result:", result);

      if (result?.data?.url) {
        // Open Stripe onboarding in a new tab
        window.open(result.data.url, "_blank");
        toast.info("Completing your Stripe setup in a new tab. Please complete all steps.");
        setShowStripeModal(false);
      } else if (result?.status === "complete") {
        toast.success("Your Stripe account is already set up and verified!");
        setShowStripeModal(false);
      } else {
        console.warn("Unexpected result format:", result);
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

      // Check if teacher has connected Stripe
      if (!hasStripeConnected) {
        setShowStripeModal(true);
      } else {
        navigate("/teacher/courses");
      }
    } catch (error: unknown) {
      console.error("Failed to create course:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err?.data?.message || "Failed to create course");
    }
  }, [form, createCourse, teacherId, dispatch, navigate, hasStripeConnected]);

  if (!formInitialized) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="animate-spin" />
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-4">
          Create New Course
        </h1>

        {/* Step indicators */}
        <div className="relative mb-10">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-full border-2 text-lg font-semibold transition-all duration-300 ${
                      currentStep === index
                        ? "bg-white border-[#e5e7eb] text-gray-400"
                        : completedSteps.includes(index)
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300 bg-white text-gray-400"
                    }`}
                  >
                    {completedSteps.includes(index) ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`mt-2 text-sm font-medium ${
                      currentStep === index
                        ? "text-blue-600"
                        : completedSteps.includes(index)
                        ? "text-green-500"
                        : "text-gray-400"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div className="flex-1 mx-2">
                    <div
                      className={`h-1 rounded-full transition-all duration-500 ${
                        completedSteps.includes(index)
                          ? "bg-green-500"
                          : "bg-gray-200"
                      }`}
                    ></div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <Card className="form-card mb-6">
        <CardContent className="pt-6">
          <Form {...form}>
            {/* Step 1: Course Info */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Complete JavaScript Course 2023"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Subtitle</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Master JavaScript with projects"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Description*</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what students will learn in this course..."
                          className="min-h-[150px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COURSE_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="courseLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Level*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select course level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COURSE_LEVEL.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 flex justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/teacher/courses")}
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
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Course Materials */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="courseThumbnail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Thumbnail</FormLabel>
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
                          <FileUploadDropzone className="flex-row border-dotted">
                            <CloudUpload className="size-4" />
                            Drag and drop or
                            <FileUploadTrigger asChild>
                              <Button variant="link" size="sm" className="p-0">
                                choose a file
                              </Button>
                            </FileUploadTrigger>
                            to upload
                          </FileUploadDropzone>
                          <FileUploadList>
                            {field.value && (
                              <FileUploadItem value={field.value}>
                                <FileUploadItemPreview />
                                <FileUploadItemMetadata />
                                <FileUploadItemDelete asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7"
                                    onClick={() => field.onChange(undefined)}
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
                        Upload a thumbnail image up to 5MB.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4 flex justify-between">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={goToPrevStep}
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
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Course Settings */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label className="mb-2 block">Pricing</Label>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name="isFree"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
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
                                    className="text-sm font-medium"
                                  >
                                    Free Course
                                  </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="paid" id="paid" />
                                  <Label
                                    htmlFor="paid"
                                    className="text-sm font-medium"
                                  >
                                    Paid Course
                                  </Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch("isFree") === "paid" && (
                        <div className="ml-6 mt-2">
                          <FormField
                            control={form.control}
                            name="coursePrice"
                            render={({ field }) => (
                              <FormItem>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <span className="text-gray-500">$</span>
                                  </div>
                                  <Input
                                    type="number"
                                    placeholder="29.99"
                                    className="pl-6"
                                    {...field}
                                  />
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPrevStep}
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
                  >
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Review & Publish */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-medium mb-6">
                    Review Course Details
                  </h3>

                  <div className="space-y-6">
                    <div className="border-b pb-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Course Information
                      </h4>
                      <p className="text-xl font-semibold">
                        {form.watch("title")}
                      </p>
                      {form.watch("subtitle") && (
                        <p className="text-gray-600">
                          {form.watch("subtitle")}
                        </p>
                      )}
                      <div className="mt-2">
                        <span className="inline-flex bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                          {form.watch("category")}
                        </span>
                      </div>
                      <p className="mt-4 text-sm">
                        {form.watch("description")}
                      </p>
                    </div>

                    <div className="border-b pb-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Materials
                      </h4>
                      <p className="text-sm text-gray-600">
                        {form.watch("courseThumbnail")
                          ? "Course thumbnail uploaded"
                          : "No thumbnail uploaded"}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        Settings
                      </h4>
                      <div className="flex items-center space-x-6">
                        <div>
                          <span className="text-xs text-gray-500 block">
                            Status
                          </span>
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold ${
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
                          <span className="font-medium">
                            {form.watch("isFree") === "free"
                              ? "Free"
                              : `$${form.watch("coursePrice")}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPrevStep}
                    disabled={isLoading}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button
                    onClick={publishCourse}
                    className="bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader className="animate-spin w-4 h-4" />
                        {form.watch("status") === "published"
                          ? "Publishing..."
                          : "Saving to Draft..."}
                      </div>
                    ) : form.watch("status") === "published" ? (
                      "Publish Course"
                    ) : (
                      "Save as Draft"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Form>
        </CardContent>
      </Card>
      {/* Add Stripe Connection Modal */}
      <Dialog open={showStripeModal} onOpenChange={setShowStripeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Stripe to Receive Payments</DialogTitle>
            <DialogDescription>
              To receive payments for your courses, you need to connect your Stripe account. This is a one-time setup process.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <p>Benefits of connecting Stripe:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Receive payments directly to your bank account</li>
              <li>Track earnings in real-time</li>
              <li>Manage payouts and transactions</li>
            </ul>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowStripeModal(false);
                navigate("/teacher/courses");
              }}
            >
              Skip for now
            </Button>
            <Button
              onClick={handleConnectStripe}
              disabled={isConnectingStripe}
              className="flex items-center gap-2"
            >
              {isConnectingStripe ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Connecting...</span>
                </>
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
    </div>
  );
};

export default React.memo(CourseCreate);
