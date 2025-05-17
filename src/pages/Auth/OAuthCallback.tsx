import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/features/auth/authSlice";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLinkOAuthAccountMutation } from "@/redux/features/auth/authApi";
import { useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/features/auth/authSlice";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useAppSelector(selectCurrentUser);

  const [linkOAuthAccount] = useLinkOAuthAccountMutation();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Get parameters from URL
        const token = searchParams.get("token");
        const provider = searchParams.get("provider");
        const providerId = searchParams.get("providerId");
        const email = searchParams.get("email");
        const isLinking = searchParams.get("isLinking") === "true";
        const errorParam = searchParams.get("error");

        // Handle errors from OAuth provider
        if (errorParam) {
          setError(`Authentication failed: ${errorParam}`);
          toast.error(`Authentication failed: ${errorParam}`);
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        // Handle account linking flow
        if (isLinking && providerId && provider && currentUser) {
          try {
            console.log("Attempting to link OAuth account:", {
              userId: currentUser._id,
              provider,
              providerId,
              email: email || undefined
            });

            await linkOAuthAccount({
              userId: currentUser._id,
              provider,
              providerId,
              email: email || undefined,
            }).unwrap();

            toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account linked successfully!`);

            // Refresh the page to update the UI with the new connected account
            setTimeout(() => {
              navigate("/user/edit-profile?tab=connections&linked=true");
            }, 1000);
            return;
          } catch (error) {
            console.error("Error linking account:", error);
            setError("Failed to link account. Please try again.");
            toast.error("Failed to link account. Please try again.");
            setTimeout(() => navigate("/user/edit-profile"), 3000);
            return;
          }
        }

        // Handle regular OAuth login flow
        if (token && provider) {
          // Fetch user data using the token
          try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!response.ok) {
              throw new Error("Failed to fetch user data");
            }

            const userData = await response.json();

            if (userData.success && userData.data) {
              const user = {
                ...userData.data,
                photoUrl: userData.data.profileImg || null,
              };

              dispatch(setUser({ user, token }));
              toast.success("Logged in successfully!");

              // Navigate based on user role and enrollment status
              if (user.role === "teacher") {
                navigate("/teacher/dashboard");
              } else if (user.role === "student") {
                // Check if student has enrolled courses
                const hasEnrolledCourses = user.enrolledCourses && user.enrolledCourses.length > 0;
                navigate(hasEnrolledCourses ? "/student/dashboard" : "/");
              } else {
                navigate("/");
              }
            } else {
              throw new Error("Invalid user data received");
            }
          } catch (error) {
            console.error("Error processing OAuth login:", error);
            setError("Failed to complete login. Please try again.");
            toast.error("Failed to complete login. Please try again.");
            setTimeout(() => navigate("/login"), 3000);
          }
        } else {
          setError("Invalid callback parameters");
          toast.error("Invalid callback parameters");
          setTimeout(() => navigate("/login"), 3000);
        }
      } finally {
        setIsProcessing(false);
      }
    };

    processOAuthCallback();
  }, [searchParams, navigate, dispatch, linkOAuthAccount, currentUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        {isProcessing ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Processing Authentication</h2>
            <p className="text-gray-600">Please wait while we complete your authentication...</p>
          </>
        ) : error ? (
          <>
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting you back to login page...</p>
          </>
        ) : (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-semibold mb-2">Authentication Successful</h2>
            <p className="text-gray-600 mb-4">You have been successfully authenticated.</p>
            <p className="text-sm text-gray-500">Redirecting you to your dashboard...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
