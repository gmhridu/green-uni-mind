import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setUser } from "@/redux/features/auth/authSlice";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useGetMeQuery, authApi } from "@/redux/features/auth/authApi";
import { config } from "@/config";
import { useAppDispatch } from "@/redux/hooks";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data, isLoading: isUserDataLoading } = useGetMeQuery(undefined);

  // Make sure we have a valid userId
  const userId = data?.data?._id;
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

        // Clear URL parameters immediately to prevent issues with refreshes
        window.history.replaceState({}, document.title, "/oauth/callback");

        // Handle errors from OAuth provider
        if (errorParam) {
          setError(`Authentication failed: ${errorParam}`);
          toast.error(`Authentication failed: ${errorParam}`);
          setTimeout(() => navigate("/login"), 3000);
          return;
        }

        // Handle account linking flow
        if (isLinking && providerId && provider && data) {
          try {
            // Make sure we have all required data before proceeding
            if (!userId) {
              console.error("Missing userId for OAuth account linking");
              setError("User ID not found. Please try again later.");
              toast.error("User ID not found. Please try again later.");
              setTimeout(() => navigate("/user/edit-profile"), 3000);
              return;
            }

            // Validate provider is one of the expected values
            if (!['google', 'facebook', 'apple'].includes(provider)) {
              console.error("Invalid provider:", provider);
              setError(`Invalid provider: ${provider}. Must be google, facebook, or apple.`);
              toast.error("Invalid provider. Please try again.");
              setTimeout(() => navigate("/user/edit-profile"), 3000);
              return;
            }

            // Get the role from URL params or use the current user's role
            const roleParam = searchParams.get("role");
            const userRole = roleParam || data?.data?.role;

            console.log("Attempting to link OAuth account:", {
              userId,
              provider,
              providerId,
              email: email || undefined,
              role: userRole,
            });

            // Ensure we're passing the correct provider type
            const providerType = provider as "google" | "facebook" | "apple";

            // Create the request payload
            const payload = {
              userId,
              provider: providerType,
              providerId,
              email: email || undefined,
              role: data?.data?.role || searchParams.get("role") || "student", // Include the role
            };

            console.log("Sending OAuth link request with payload:", JSON.stringify(payload));

            // Try a direct fetch call instead of using RTK Query
            try {
              // Get the token for authorization
              const token = localStorage.getItem("accessToken");

              // Check if we have a valid token
              if (!token) {
                console.error("No access token found for authorization");
                throw new Error("Authentication token not found. Please log in again.");
              }

              console.log("Using token for authorization:", token.substring(0, 10) + "...");

              // Try both approaches: FormData and JSON
              console.log("Trying multiple approaches for OAuth linking");

              // First, try with JSON
              try {
                console.log("Attempt 1: Using JSON approach for OAuth linking");

                // Make a direct fetch call to the API using JSON
                const jsonResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/oauth/link`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                  },
                  body: JSON.stringify(payload),
                  credentials: "include" // Include cookies
                });

                // If successful, use this response
                if (jsonResponse.ok) {
                  console.log("JSON approach succeeded");

                  // Check if this is a special case where accounts can be merged
                  const jsonData = await jsonResponse.json();
                  console.log("JSON response data:", jsonData);

                  if (jsonData.data?.accountsCanBeMerged) {
                    // This is a special case where the OAuth account is already linked to another account
                    // with the same email. We'll show a special message and offer to merge accounts.
                    console.log("OAuth account already linked to another account with the same email");

                    // Instead of showing a confirmation dialog, just proceed with linking
                    // This avoids the unwanted alert
                    const confirmMerge = false;

                    if (confirmMerge) {
                      // User wants to use the existing account
                      console.log("User confirmed account switch");

                      // Show success message
                      toast.success("Redirecting to login page...");

                      // Use a timeout to ensure the toast is shown before redirecting
                      setTimeout(() => {
                        // Navigate to the login page with a special parameter
                        window.location.href = `/login?provider=${provider}&email=${encodeURIComponent(email || '')}`;
                      }, 1500);

                      // Return a success response
                      return new Response(JSON.stringify({ success: true, redirected: true }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                      });
                    } else {
                      // User wants to keep trying with the current account
                      console.log("User declined account switch");
                      throw new Error("Account linking cancelled by user");
                    }
                  }

                  // Create a new response with the same data since we already consumed the original
                  return new Response(JSON.stringify(jsonData), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                  });
                }

                console.log("JSON approach failed, status:", jsonResponse.status);
              } catch (jsonError) {
                console.error("JSON approach error:", jsonError);
              }

              // If JSON fails, try with FormData
              console.log("Attempt 2: Using FormData approach for OAuth linking");

              // Create a FormData object
              const formData = new FormData();
              formData.append('userId', userId);
              formData.append('provider', provider);
              formData.append('providerId', providerId);
              if (email) {
                formData.append('email', email);
              }
              // Include the role
              const role = data?.data?.role || searchParams.get("role") || "student";
              formData.append('role', role);

              // Make a direct fetch call to the API using FormData
              const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/oauth/link`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${token}`
                  // Note: Do not set Content-Type with FormData, browser will set it automatically
                },
                body: formData,
                credentials: "include" // Include cookies
              });

              // Check if the FormData approach succeeded
              if (response.ok) {
                console.log("FormData approach succeeded");

                try {
                  // Check if this is a special case where accounts can be merged
                  const formDataResponse = await response.clone().json();
                  console.log("FormData response data:", formDataResponse);

                  if (formDataResponse.data?.accountsCanBeMerged) {
                    // This is a special case where the OAuth account is already linked to another account
                    // with the same email. We'll show a special message and offer to merge accounts.
                    console.log("OAuth account already linked to another account with the same email");

                    // Instead of showing a confirmation dialog, just proceed with linking
                    // This avoids the unwanted alert
                    const confirmMerge = false;

                    if (confirmMerge) {
                      // User wants to use the existing account
                      console.log("User confirmed account switch");

                      // Show success message
                      toast.success("Redirecting to login page...");

                      // Use a timeout to ensure the toast is shown before redirecting
                      setTimeout(() => {
                        // Navigate to the login page with a special parameter
                        window.location.href = `/login?provider=${provider}&email=${encodeURIComponent(email || '')}`;
                      }, 1500);

                      // Return a success response
                      return new Response(JSON.stringify({ success: true, redirected: true }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                      });
                    } else {
                      // User wants to keep trying with the current account
                      console.log("User declined account switch");
                      throw new Error("Account linking cancelled by user");
                    }
                  }
                } catch (parseError) {
                  console.error("Error parsing FormData response:", parseError);
                }
              }

              // If FormData fails, try with URL parameters
              if (!response.ok) {
                console.log("FormData approach failed, status:", response.status);
                console.log("Attempt 3: Using URL parameters for OAuth linking");

                // Create URL with parameters
                const url = new URL(`${import.meta.env.VITE_API_BASE_URL}/oauth/link`);
                url.searchParams.append('userId', userId);
                url.searchParams.append('provider', provider);
                url.searchParams.append('providerId', providerId);
                if (email) {
                  url.searchParams.append('email', email);
                }
                // Include the role
                const role = data?.data?.role || searchParams.get("role") || "student";
                url.searchParams.append('role', role);

                // Make a direct fetch call to the API using URL parameters
                const urlResponse = await fetch(url.toString(), {
                  method: "POST",
                  headers: {
                    "Authorization": `Bearer ${token}`,
                    // Add custom headers with the parameters as well
                    "X-User-Id": userId,
                    "X-Provider": provider,
                    "X-Provider-Id": providerId,
                    "X-Role": role
                  },
                  credentials: "include" // Include cookies
                });

                return urlResponse;
              }

              // Log the response status
              console.log("OAuth link response status:", response.status);

              // Handle the response parsing
              try {
                // Parse the response JSON
                const responseData = await response.json();
                console.log("OAuth link response data:", responseData);

                // Check if the response indicates success
                if (responseData.success) {
                  console.log("OAuth account linking successful");
                } else {
                  console.error("OAuth account linking failed:", responseData);
                  throw new Error(responseData.message || "Failed to link account");
                }
              } catch (parseError) {
                console.error("Error parsing response:", parseError);

                // If we can't parse the response but the status is OK, assume success
                if (response.ok) {
                  console.log("Response parsing failed but status is OK, assuming success");
                } else {
                  throw new Error("Failed to parse response from server");
                }
              }

              // If we got here, the request was successful

              // Show success message
              toast.success(
                `${
                  provider.charAt(0).toUpperCase() + provider.slice(1)
                } account linked successfully!`
              );

              // Refresh the page to update the UI with the new connected account
              setTimeout(() => {
                navigate("/user/edit-profile?tab=connections&linked=true");
              }, 1000);

              return response;
            } catch (fetchError) {
              console.error("Fetch error during OAuth linking:", fetchError);
              throw fetchError;
            }
          } catch (error: any) {
            console.error("Error linking account:", error);

            // Try to extract more detailed error information
            let errorMessage = "Failed to link account. Please try again.";

            // Handle different error formats
            if (error.message) {
              errorMessage = `Error: ${error.message}`;
            } else if (error.data?.message) {
              errorMessage = `Error: ${error.data.message}`;
            } else if (error.data?.err?.message) {
              errorMessage = `Error: ${error.data.err.message}`;
            } else if (error.data?.err?.issues) {
              // Handle Zod validation errors
              const issues = error.data.err.issues;
              if (issues && issues.length > 0) {
                const issueMessages = issues.map((issue: any) =>
                  `${issue.path.join('.')}: ${issue.message}`
                ).join(', ');
                errorMessage = `Validation error: ${issueMessages}`;
              }
            }

            setError(errorMessage);
            toast.error(errorMessage);

            // Log detailed error information for debugging
            console.log("Detailed error:", {
              message: error.message,
              status: error.status,
              data: error.data,
              errorMessage
            });

            // Log the userId and provider for debugging
            console.log("Debug info:", {
              userId,
              provider,
              providerId,
              isUserIdValid: typeof userId === 'string' && userId.length > 0,
              isProviderValid: ['google', 'facebook', 'apple'].includes(provider),
              isProviderIdValid: typeof providerId === 'string' && providerId.length > 0
            });

            setTimeout(() => navigate("/user/edit-profile"), 3000);
            return;
          }
        }

        // Handle regular OAuth login flow
        if (token && provider) {
          // Store token first so RTK Query can use it
          localStorage.setItem("accessToken", token);

          // Use RTK Query to fetch user data instead of direct fetch
          try {
            const userData = await dispatch(
              authApi.endpoints.getMe.initiate(undefined, { forceRefetch: true })
            ).unwrap();

            if (userData.data) {
              // Create a complete user object with all necessary fields
              const user = {
                ...userData.data,
                photoUrl: userData.data.profileImg || null,
                // Ensure role is explicitly set from the backend data
                role: userData.data.role,
              };

              // Log the user role and complete object for debugging
              console.log("User role from OAuth login:", user.role);
              console.log("Complete user object:", JSON.stringify(user, null, 2));

              // Set the user in Redux store with the correct role
              dispatch(setUser({ user, token }));
              toast.success("Logged in successfully!");

              // Navigate based on user role and enrollment status
              // Make sure we're using the correct role from the backend
              if (user.role === "teacher") {
                console.log(
                  "Navigating to teacher dashboard with role:",
                  user.role
                );
                navigate("/teacher/dashboard");
              } else if (user.role === "student") {
                console.log(
                  "Navigating to student dashboard with role:",
                  user.role
                );
                // Check if student has enrolled courses
                const hasEnrolledCourses =
                  user.enrolledCourses && user.enrolledCourses.length > 0;
                navigate(hasEnrolledCourses ? "/student/dashboard" : "/");
              } else {
                console.log("Navigating to home with role:", user.role);
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
          // If we don't have token and provider, but we have user data,
          // we can still try to redirect the user to the appropriate dashboard
          if (data?.data) {
            // Create a complete user object with all necessary fields
            const user = {
              ...data.data,
              photoUrl: data.data.profileImg || null,
              // Ensure role is explicitly set from the backend data
              role: data.data.role,
            };

            console.log("No callback parameters, but user is logged in. Redirecting to dashboard.");
            console.log("User role for redirection:", user.role);
            console.log("Complete user object:", JSON.stringify(user, null, 2));

            // Navigate based on user role
            if (user.role === "teacher") {
              navigate("/teacher/dashboard");
            } else if (user.role === "student") {
              // Check if student has enrolled courses
              const hasEnrolledCourses = user.enrolledCourses && user.enrolledCourses.length > 0;
              navigate(hasEnrolledCourses ? "/student/dashboard" : "/");
            } else {
              navigate("/");
            }
            return;
          }

          // Redirect to login page without showing error toast
          navigate("/login");
        }
      } finally {
        setIsProcessing(false);
      }
    };

    processOAuthCallback();
  }, [searchParams, navigate, dispatch, data, userId, isUserDataLoading]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        {isProcessing || isUserDataLoading ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">
              Processing Authentication
            </h2>
            <p className="text-gray-600">
              {isUserDataLoading
                ? "Loading your user data..."
                : "Please wait while we complete your authentication..."}
            </p>
          </>
        ) : error ? (
          <>
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Authentication Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors mb-4"
            >
              Return to Login
            </button>
            <p className="text-sm text-gray-500">
              Redirecting automatically in a few seconds...
            </p>
          </>
        ) : (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-semibold mb-2">
              Authentication Successful
            </h2>
            <p className="text-gray-600 mb-4">
              You have been successfully authenticated.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting you to your dashboard...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
