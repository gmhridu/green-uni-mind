"use client";

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
import { loginSchema } from "@/types/authSchema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { useLoginMutation } from "@/redux/features/auth/authApi";
import {
  setIsLoading,
  setUser,
  TUser,
  TUserToken,
} from "@/redux/features/auth/authSlice";
import { useDispatch } from "react-redux";
import { Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { verifyToken } from "@/utils/verifyToken";

export type TLoginForm = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [login] = useLoginMutation();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const { formState } = form;
  const { isLoading, isSubmitting } = formState;

  const onSubmit = async (formData: FieldValues) => {
    const toastId = toast.loading("Logging...");
    dispatch(setIsLoading(true));

    try {
      const userInfo = {
        email: formData.email,
        password: formData.password,
      };

      const res = await login(userInfo).unwrap();

      const data: TUser = res.data.user;

      const user = {
        email: data.email,
        name: data.name,
        photoUrl: data.photoUrl,
        role: data.role,
        isDeleted: data.isDeleted,
        isVerified: data.isVerified,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        _id: data._id,
      };

      const tokenVerify = verifyToken(res.data.accessToken) as TUserToken;

      dispatch(setUser({ user, tokenVerify, token: res.data.accessToken }));
      toast.success("Login Successfully!", { id: toastId, duration: 2000 });
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
      <Card className="">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Login Here
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Fill out the form to login your account to GreenUniMind
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
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
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="">Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="w-full"
                            type="password"
                            placeholder="Your Password"
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
                      <span>Logging...</span>
                    </div>
                  ) : (
                    "Login"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex items-center justify-center">
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/sign-up" className="text-blue-500 hover:underline">
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;
