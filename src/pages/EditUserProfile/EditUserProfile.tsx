import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  useGetMeQuery,
  useUpdateUserProfileMutation,
} from "@/redux/features/auth/authApi";
import { setUser, useCurrentToken } from "@/redux/features/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const formSchema = z.object({
  name: z.object({
    firstName: z
      .string({ required_error: "First name is required" })
      .min(2, "At least 2 characters")
      .optional(),
    middleName: z.string().optional(),
    lastName: z
      .string({ required_error: "Last name is required" })
      .min(2, "At least 2 characters")
      .optional(),
  }),
  email: z.string({ required_error: "Email is required" }).email().optional(),
});

const EditUserProfile = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector(useCurrentToken);
  const { data, isLoading, isFetching } = useGetMeQuery(undefined, {
    skip: !token,
  });
  const [updateUserProfile, { isLoading: isUpdating }] =
    useUpdateUserProfileMutation();

  // Accessing the user data with name as user.name.firstName, user.name.middleName, etc.
  const user = data?.data;

  console.log(user);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: {
        firstName: user?.name?.firstName || "",
        middleName: user?.name?.middleName || "",
        lastName: user?.name?.lastName || "",
      },
      email: user?.email || "",
    },
  });

  // Reset form values if user data changes
  useEffect(() => {
    if (user && user.name) {
      form.reset({
        name: {
          firstName: user?.name?.firstName || "",
          middleName: user?.name?.middleName || "",
          lastName: user?.name?.lastName || "",
        },
        email: user?.email || "",
      });
    }
  }, [user, form]); // This will run when `user` changes or when the form is initialized

  const handleUpdateUser = async (values: z.infer<typeof formSchema>) => {
    const toastId = toast.loading("Updating...");

    try {
      if (!user?._id) {
        throw new Error("User ID not found");
      }

      const res = await updateUserProfile({
        id: user._id,
        data: values,
      });

      const userData = res.data.data;

      if (userData) {
        dispatch(setUser({ user: userData, token }));
      }

      toast.success("Profile updated successfully!", {
        id: toastId,
      });
    } catch (error) {
      toast.error("Failed to update profile", {
        id: toastId,
      });
    }
  };

  if (isLoading || isFetching || isUpdating) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <Loader className="animate-spin text-lg" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center space-y-3 pt-5">
        <h2 className="text-2xl font-semibold">Public profile</h2>
        <p className="text-gray-600 pb-8">Add information about yourself</p>
      </div>
      <Separator className="bg-gray-200 w-full mb-4" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleUpdateUser)}
          className="space-y-6 w-full p-6 container mx-auto"
        >
          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name.firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="First name"
                      disabled={isUpdating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name.middleName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Middle Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Middle name (optional)"
                      disabled={isUpdating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name.lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Last name"
                      disabled={isUpdating}
                    />
                  </FormControl>
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
              "Update Profile"
            )}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default EditUserProfile;
