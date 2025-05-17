import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch } from "@/redux/hooks";
import { setUser } from "@/redux/features/auth/authSlice";
import { useLinkOAuthAccountMutation, useGetMeQuery } from "@/redux/features/auth/authApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import config from "@/config";

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [linkOAuthAccount] = useLinkOAuthAccountMutation();
  const { refetch } = useGetMeQuery(undefined, { skip: true });
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const processOAuthCallback = async () => {
      try {
        // Get parameters from URL query params
        const params = new URLSearchParams(location.search);
        const token = params.get("token");
        const provider = params.get("provider");
        const providerId = params.get("providerId");
        const email = params.get("email");
        const isLinking = params.get("linking") === "true";

        // Store debug information
        setDebugInfo({
          urlParams: {
            token: token ? "exists" : "null",
            provider,
            providerId: providerId ? providerId.substring(0, 8) + "..." : "null",
            email: email ? `${email.substring(0, 3)}...${email.substring(email.indexOf('@'))}` : "null",
            isLinking
          },
          localStorage: {
            oauthLinkUserId: localStorage.getItem("oauthLinkUserId"),
            oauthLinkUserEmail: localStorage.getItem("oauthLinkUserEmail") ? "exists" : "null"
          }
        });

        console.log("OAuth callback parameters:", {
          token: token ? "exists" : "null",
          provider,
          providerId: providerId ? providerId.substring(0, 8) + "..." : "null",
          email: email ? `${email.substring(0, 3)}...${email.substring(email.indexOf('@'))}` : "null",
          isLinking
        });

        // Check if this is an account linking flow from the URL
        if (isLinking && provider && providerId && email) {
          console.log("Processing OAuth account linking flow");

          // This is an account linking flow from the OAuth provider
          const storedUserId = localStorage.getItem("oauthLinkUserId");
          const storedEmail = localStorage.getItem("oauthLinkUserEmail");

          console.log("OAuth linking data from localStorage:", {
            storedUserId,
            storedEmail: storedEmail ? `${storedEmail.substring(0, 3)}...${storedEmail.substring(storedEmail.indexOf('@'))}` : "null",
          });

          if (!storedUserId) {
            console.error("User ID not found in localStorage for account linking");
            setError("User ID not found for account linking. Please try again.");
            return;
          }

          try {
            // Make a direct API call to verify the user ID before linking
            console.log("Verifying user ID before linking...");
            // Use the stored access token specifically for OAuth linking if available
            const accessToken = localStorage.getItem('oauthLinkAccessToken') || localStorage.getItem('accessToken');

            if (!accessToken) {
              console.error("No access token found for verification");
              setError("Authentication token not found. Please try again.");
              return;
            }

            const verifyResponse = await fetch(`${config.apiBaseUrl}/users/${storedUserId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
              }
            });

            if (!verifyResponse.ok) {
              console.error("Failed to verify user ID:", verifyResponse.status);
              // Try to get more details about the error
              try {
                const errorData = await verifyResponse.json();
                console.error("Error details:", errorData);
              } catch (e) {
                console.error("Could not parse error response");
              }

              setError("Could not verify your user account. Please try again.");
              return;
            }

            const userData = await verifyResponse.json();
            console.log("User verification successful:", userData.success);

            // Log the data we're using for linking
            console.log("Attempting to link OAuth account:", {
              userId: storedUserId,
              provider,
              providerId: providerId ? providerId.substring(0, 8) + "..." : "null",
              email: email ? `${email.substring(0, 3)}...${email.substring(email.indexOf('@'))}` : "null"
            });

            // Link the account using the stored user ID
            const result = await linkOAuthAccount({
              userId: storedUserId,
              provider: provider as "google" | "facebook" | "apple",
              providerId,
              email,
            }).unwrap();

            console.log("Account linking result:", result);

            // Refresh user data to get the updated OAuth information
            await refetch();

            toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account linked successfully`);

            // Clear all stored linking data
            localStorage.removeItem("oauthLinkUserId");
            localStorage.removeItem("oauthLinkUserEmail");
            localStorage.removeItem("oauthLinkAccessToken");

            // Navigate to the user profile page
            navigate("/user/edit-profile?tab=connections&linked=true");
          } catch (error: any) {
            console.error("Failed to link account:", error);

            // Try to extract more detailed error information
            let errorMessage = `Failed to link your ${provider} account.`;
            if (error.data?.message) {
              errorMessage += ` ${error.data.message}`;
            }

            setError(errorMessage);
          }
        } else if (token) {
          // This is a regular OAuth login flow with a token
          console.log("Processing regular OAuth login flow with token");

          // Set the user in Redux store
          dispatch(setUser({
            user: {
              // This is a placeholder - in a real app, you'd get this from the token
              email: "user@example.com",
              role: "student",
            },
            token
          }));

          // Navigate based on user role (simplified for demo)
          navigate("/student/dashboard");
        } else {
          console.error("Invalid or missing authentication data");
          setError("Invalid or missing authentication data");
        }
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        setError(`Authentication failed: ${error.message || "Please try again."}`);
      } finally {
        setIsProcessing(false);
      }
    };

    processOAuthCallback();
  }, [dispatch, navigate, location.search, linkOAuthAccount, refetch]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
          <h1 className="text-2xl font-bold mb-2">Processing Authentication</h1>
          <p className="text-gray-600">Please wait while we complete your authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Authentication Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
          >
            Return to Login
          </button>

          {/* Debug button */}
          <div className="mt-8 text-left">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-gray-500 underline"
            >
              {showDebug ? "Hide Debug Info" : "Show Debug Info"}
            </button>

            {showDebug && debugInfo && (
              <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-60">
                <h3 className="font-bold mb-2">Debug Information</h3>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-green-600 text-2xl">✓</span>
        </div>
        <h1 className="text-2xl font-bold mb-2">Authentication Successful</h1>
        <p className="text-gray-600 mb-6">You have been successfully authenticated.</p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Continue to Dashboard
        </button>

        {/* Debug button */}
        <div className="mt-8 text-left">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-gray-500 underline"
          >
            {showDebug ? "Hide Debug Info" : "Show Debug Info"}
          </button>

          {showDebug && debugInfo && (
            <div className="mt-2 p-4 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-60">
              <h3 className="font-bold mb-2">Debug Information</h3>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
