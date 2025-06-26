import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaApple } from "react-icons/fa";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { config } from "@/config";

interface SocialLoginButtonsProps {
  isSignUp?: boolean;
  role?: "student" | "teacher";
  className?: string;
}

const SocialLoginButtons = ({
  isSignUp = false,
  role = "student",
  className,
}: SocialLoginButtonsProps) => {
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width: 640px)");

  // Get the current URL to determine if we're on login or signup page
  const isLoginPage = location.pathname.includes("login");
  const isSignUpPage = location.pathname.includes("sign-up");

  // Base URL for OAuth endpoints
  const baseUrl = config.apiBaseUrl;

  // Function to handle OAuth login
  const handleOAuthLogin = (provider: string) => {
    // Determine if this is for account linking
    const isLinking = false;

    // Store the requested role in localStorage to verify it after login
    localStorage.setItem("oauthRequestedRole", role);

    // Log the role being used
    console.log(`OAuth login with ${provider} using role:`, role);

    // Construct the OAuth URL with appropriate query parameters
    const oauthUrl = `${baseUrl}/oauth/${provider}?role=${role}&linking=${isLinking}`;

    console.log("Redirecting to OAuth URL:", oauthUrl);

    // Redirect to the OAuth provider
    window.location.href = oauthUrl;
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 transition-colors"
          onClick={() => handleOAuthLogin("google")}
        >
          <FcGoogle className="h-5 w-5" />
          <span>{isSignUp ? "Sign up" : "Continue"} with Google</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 transition-colors"
          onClick={() => handleOAuthLogin("facebook")}
        >
          <FaFacebook className="h-5 w-5 text-blue-600" />
          <span>{isSignUp ? "Sign up" : "Continue"} with Facebook</span>
        </Button>

        {!isMobile && (
          <Button
            type="button"
            variant="outline"
            className="flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50 transition-colors"
            onClick={() => handleOAuthLogin("apple")}
          >
            <FaApple className="h-5 w-5" />
            <span>{isSignUp ? "Sign up" : "Continue"} with Apple</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default SocialLoginButtons;
