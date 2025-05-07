import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
  useGetMeQuery,
  useUpdateUserProfileMutation,
} from "@/redux/features/auth/authApi";
import { setUser, selectCurrentToken } from "@/redux/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { CloudUpload, Loader, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

const formSchema = z.object({
  photoUrl: z
    .union([z.instanceof(File), z.string().url(), z.undefined()])
    .refine(
      (file) => {
        if (file instanceof File) {
          return file.size <= 5 * 1024 * 1024; // 5MB max size
        }
        return true;
      },
      {
        message: "File must be less than 5MB",
      }
    )
    .optional(),
});

const EditUserPhoto = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectCurrentToken);
  const { data, isLoading, isFetching } = useGetMeQuery(undefined, {
    skip: !token,
  });

  const [updateUserProfile, { isLoading: isUpdating }] =
    useUpdateUserProfileMutation();

  const user = data?.data;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      photoUrl: user?.profileImg || undefined,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        photoUrl: user.profileImg,
      });
    }
  }, [user, form]);

  const handleUpdateUser = async (values: z.infer<typeof formSchema>) => {
    const toastId = toast.loading("Updating...");

    try {
      if (!user?._id) {
        throw new Error("User ID not found");
      }

      const formData = new FormData();

      // Only append the file if it's a new file being uploaded
      if (values.photoUrl instanceof File) {
        formData.append("file", values.photoUrl);
      }

      const res = await updateUserProfile({
        id: user._id,
        data: formData,
      });

      const userData = res.data.data;

      if (userData) {
        dispatch(setUser({ user: userData, token }));
      }

      toast.success("Profile Photo updated successfully!", {
        id: toastId,
      });
    } catch (error) {
      toast.error("Failed to update profile", {
        id: toastId,
      });
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center space-y-3 pt-5">
        <h2 className="text-2xl font-semibold">Photo</h2>
        <p className="text-gray-600 pb-8">
          Add a nice photo of yourself for your profile.
        </p>
      </div>
      <Separator className="bg-gray-200 w-full mb-4" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleUpdateUser)}
          className="space-y-6 w-full p-6 container mx-auto"
        >
          <div className="space-y-3">
            {isLoading || isFetching || isUpdating ? (
              <div className="flex justify-center items-center max-w-2xl lg:max-w-6xl h-80">
                <Loader className="animate-spin text-lg" />
              </div>
            ) : (
              <>
                {user?.profileImg && (
                  <PhotoProvider>
                    <PhotoView src={user?.profileImg}>
                      <div className="flex items-center justify-center">
                        <img
                          src={user?.profileImg}
                          alt={user?.name}
                          className="cursor-pointer object-cover rounded-md max-w-80 max-h-72"
                        />
                      </div>
                    </PhotoView>
                  </PhotoProvider>
                )}
              </>
            )}
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Photo</FormLabel>
                  <FormControl>
                    <FileUpload
                      value={field.value instanceof File ? [field.value] : []}
                      onValueChange={(files) => field.onChange(files?.[0])}
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
                          <Button variant="link" size="sm" className="p-0">
                            choose a file
                          </Button>
                        </FileUploadTrigger>
                        to upload
                      </FileUploadDropzone>
                      <FileUploadList>
                        {field.value instanceof File && (
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
          </div>

          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? (
              <span className="flex items-center justify-center">
                <Loader className="animate-spin text-lg" />
                <span className="ml-2">Updating...</span>
              </span>
            ) : (
              "Update Photo"
            )}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default EditUserPhoto;
