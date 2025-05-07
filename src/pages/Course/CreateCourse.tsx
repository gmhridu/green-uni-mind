import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldValues, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { toast } from "sonner";
import { useCreateCourseMutation } from "@/redux/features/course/courseApi"; // Your API hook for creating course
import { Link, useNavigate } from "react-router-dom";
import { CloudUpload, Loader2, X } from "lucide-react";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemDelete,
  FileUploadList,
} from "@/components/ui/file-upload";
import {
  selectCurrentUser,
  setIsLoading,
} from "@/redux/features/auth/authSlice";
import { createCourseSchema } from "@/types/courseSchema";
import { setCourse } from "@/redux/features/course/courseSlice";
import { useGetMeQuery } from "@/redux/features/auth/authApi";

export type TCreateCourseForm = {
  title: string;
  subTitle?: string;
  description?: string;
  category: string;
  courseLevel: string;
  coursePrice: number;
  courseThumbnail: File | undefined;
};

const CreateCourse = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data } = useGetMeQuery(undefined);
  const [createCourse] = useCreateCourseMutation();

  const teacherId = data?.data?._id;

  const form = useForm({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      title: "",
      subTitle: "",
      description: "",
      category: "",
      courseLevel: "",
      coursePrice: 0,
      courseThumbnail: undefined,
    },
  });

  const { formState } = form;
  const { isLoading, isSubmitting } = formState;

  const onSubmit = async (values: FieldValues) => {
    const toastId = toast.loading("Creating Course...");
    dispatch(setIsLoading(true));

    try {
      const formData = new FormData();
      
      // Create a data object without the file
      const dataToSend = { ...values };
      delete dataToSend.courseThumbnail;
      
      // Append the JSON data
      formData.append("data", JSON.stringify(dataToSend));
      
      // Append the file separately
      if (values.courseThumbnail) {
        formData.append("file", values.courseThumbnail);
      }

      const res = await createCourse({
        id: teacherId,
        data: formData,
      }).unwrap();

      console.log(res);

      dispatch(setCourse(res));

      toast.success("Course created successfully!", {
        id: toastId,
        duration: 2000,
      });
      navigate("/courses");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong", { id: toastId, duration: 2000 });
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center pt-[75px]">
      <Card className="my-6">
        <CardHeader>
          <CardTitle>Create Course</CardTitle>
          <CardDescription>
            Fill out the details below to create a new course.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="w-full"
                          type="text"
                          placeholder="Course Title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtitle</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="w-full"
                          type="text"
                          placeholder="Subtitle (Optional)"
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="w-full"
                          type="text"
                          placeholder="Course Description"
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
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="w-full"
                          type="text"
                          placeholder="Category"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="courseLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Course Level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">
                            Intermediate
                          </SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="coursePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="w-full"
                          type="number"
                          placeholder="Course Price"
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                          onBlur={() =>
                            field.onChange(parseFloat(String(field.value)) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="courseThumbnail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Thumbnail</FormLabel>
                      <FormControl>
                        <FileUpload
                          value={field.value ? [field.value] : []}
                          onValueChange={(files) => field.onChange(files?.[0])}
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

                <Button
                  type="submit"
                  className="w-full my-3 cursor-pointer"
                  disabled={isLoading || isSubmitting}
                >
                  {isLoading || isSubmitting ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 animate-spin" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    "Create Course"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex items-center justify-center">
          <p className="text-sm text-gray-500">
            Want to go back to courses?{" "}
            <Link to="/courses" className="text-blue-500 hover:underline">
              View Courses
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateCourse;
