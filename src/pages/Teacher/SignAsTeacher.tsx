import React from "react";

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
import { toast } from "sonner";
import { CloudUpload, Loader2, X } from "lucide-react";
import { registerSchema } from "@/types/authSchema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/redux/hooks";
import { setIsLoading, setUser, TUser } from "@/redux/features/auth/authSlice";
import { Link, useNavigate } from "react-router-dom";
import { useRegisterMutation } from "@/redux/features/auth/authApi";
import { InputPassWord } from "@/components/ui/input-password";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemMetadata,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";

export type TRegisterForm = {
  name: string;
  email: string;
  role: string;
  password: string;
};

const SignAsTeacher = () => {
  const dispatch = useAppDispatch();
  const [register] = useRegisterMutation();
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      photoUrl: undefined,
    },
  });

  const { formState } = form;
  const { isLoading, isSubmitting } = formState;

  const onSubmit = async (data: FieldValues) => {
    const toastId = toast.loading("Registering...");
    dispatch(setIsLoading(true));

    try {
      const userInfo = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: "teacher",
      };

      const formData = new FormData();
      formData.append("data", JSON.stringify(userInfo));
      if (data.photoUrl) {
        formData.append("file", data.photoUrl);
      }

      const res = await register(formData).unwrap();

      const userData: TUser = res.data.user;

      const user = {
        email: userData.email,
        name: userData.name,
        photoUrl: userData.photoUrl,
        role: userData.role,
        isDeleted: userData.isDeleted,
        isVerified: userData.isVerified,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      };

      dispatch(setUser({ user, token: res.data.accessToken }));

      toast.success("Register Successfully!", { id: toastId, duration: 2000 });
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong", { id: toastId, duration: 2000 });
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Card>
        <CardHeader>
          <CardTitle>Sign Up</CardTitle>
          <CardDescription>
            Register as a teacher to manage your courses, students, and content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="">Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="w-full"
                            type="text"
                            placeholder="Your Name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="">Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="w-full"
                            type="text"
                            placeholder="Your Email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile Photo</FormLabel>
                        <FormControl>
                          <FileUpload
                            value={field.value ? [field.value] : []}
                            onValueChange={(files) =>
                              field.onChange(files?.[0])
                            }
                            accept="image/*"
                            maxFiles={1}
                            maxSize={5 * 1024 * 1024}
                            onFileReject={(_, message) => {
                              form.setError("photoUrl", { message });
                            }}
                            multiple={false}
                          >
                            <FileUploadDropzone className="flex-row border-dotted">
                              <CloudUpload className="size-4" />
                              Drag and drop or
                              <FileUploadTrigger asChild>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0"
                                >
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
                          Upload a profile image up to 5MB.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <InputPassWord
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full my-3 cursor-pointer"
                  disabled={isLoading || isSubmitting}
                >
                  {isLoading || isSubmitting ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 animate-spin" />
                      <span>Registering...</span>
                    </div>
                  ) : (
                    "Register"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex items-center justify-center">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500 hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignAsTeacher;
