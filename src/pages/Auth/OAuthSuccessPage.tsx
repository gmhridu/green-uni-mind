import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "@/redux/features/auth/authSlice";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useGetEnrolledCoursesQuery } from "@/redux/features/student/studentApi";
import { AlertCircle, Loader2 } from "lucide-react";
import { USER_ROLE } from "@/constants/global";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";

const OAuthSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const error = searchParams.get("error");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check for error parameter in URL
  useEffect(() => {
    if (error) {
      console.error("OAuth error:", error);
      setErrorMessage(
        error === "authentication_failed"
          ? "Authentication failed. Please try again."
          : `Login error: ${error}`
      );
      toast.error("Authentication failed. Please try again.");
    }
  }, [error]);

  const { data, isLoading, isSuccess, error: apiError } = useGetMeQuery(undefined, {
    skip: !token,
  });


  const studentId = data?.data?._id;
  const userRole = data?.data?.role;

  const {
    data: enrolledCoursesData,
    isLoading: isCoursesLoading
  } = useGetEnrolledCoursesQuery(
    { studentId: studentId || "" },
    { skip: !studentId || userRole !== USER_ROLE.STUDENT }
  );

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (isSuccess && data) {

      const userData = data.data;

      // Extract role from various sources with proper fallbacks
      // Start with role from userData
      let userRole = userData.role;

      // Check if role is nested in user object (common structure from backend)
      if (!userRole && userData.user && userData.user.role) {
        userRole = userData.user.role;

      }

      // Try to get role from token as a fallback
      if (!userRole || userRole === 'user') {
        try {
          const decodedToken = jwtDecode<{role?: string}>(token);

          if (decodedToken && decodedToken.role) {
            userRole = decodedToken.role;
            // Also update userData.role for consistency
            userData.role = decodedToken.role;

          }
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }



      // Extract the correct user ID and student ID
      let userId = null;
      let studentId = null;

      // Check if we have a nested user object (common in student/teacher responses)
      if (userData.user && userData.user._id) {
        userId = userData.user._id;

        // If role is student, the top-level _id is likely the student ID
        if (userRole === 'student') {
          studentId = userData._id;
        }
      } else {
        // Direct user object
        userId = userData._id;
      }

      console.log("Extracted IDs:", { userId, studentId, role: userRole });

      // Set user data in Redux store with explicit role and all required fields
      dispatch(
        setUser({
          user: {
            _id: userId, // Use the actual user ID for the _id field
            userId: userId, // Store user ID explicitly
            studentId: studentId, // Store student ID if available
            email: userData.email,
            name: userData.name,
            photoUrl: userData.profileImg || null,
            role: userRole,
            isDeleted: userData.isDeleted,
            isVerified: userData.isVerified || false,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
            // Include OAuth fields from the correct location
            googleId: userData.user?.googleId || userData.googleId || null,
            facebookId: userData.user?.facebookId || userData.facebookId || null,
            appleId: userData.user?.appleId || userData.appleId || null,
            // Store reference to nested user object if available
            user: userData.user,
          },
          token,
        })
      );

      console.log("User data set in Redux store:", {
        _id: userId,
        userId: userId,
        studentId: studentId,
        email: userData.email,
        role: userRole,
        googleId: userData.user?.googleId || userData.googleId || null
      });




      const normalizedRole = userRole?.toUpperCase();


      if (normalizedRole === USER_ROLE.TEACHER.toUpperCase()) {
        setTimeout(() => {
          navigate("/teacher/dashboard");
        }, 100);
      }
      // For students, check enrollment status
      else if (normalizedRole === USER_ROLE.STUDENT.toUpperCase()) {
       if (!isCoursesLoading && enrolledCoursesData) {
          const hasEnrolledCourses = enrolledCoursesData.data && enrolledCoursesData.data.length > 0;
          console.log('Has enrolled courses:', hasEnrolledCourses);

          if (hasEnrolledCourses) {

            setTimeout(() => {
              navigate("/student/dashboard");
            }, 100);
          } else {
            setTimeout(() => {
              navigate("/");
            }, 100);
          }
        } else {

          setTimeout(() => {
            navigate("/");
          }, 100);
        }
      } else {
        setTimeout(() => {
          navigate("/");
        }, 100);
      }
    }
  }, [token, isSuccess, data, enrolledCoursesData, isCoursesLoading, dispatch, navigate]);

  // Handle API errors
  useEffect(() => {
    if (apiError) {
      console.error("API error:", apiError);
      setErrorMessage("Failed to fetch user data. Please try again.");
      toast.error("Failed to fetch user data. Please try again.");
    }
  }, [apiError]);

  // Show error message if there's an error
  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h1 className="text-2xl font-bold mt-4">Authentication Error</h1>
        <p className="text-muted-foreground mt-2">{errorMessage}</p>
        <button
          onClick={() => navigate("/login")}
          className="mt-6 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Return to Login
        </button>
      </div>
    );
  }

  // Show loading state
  if (isLoading || isCoursesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-2xl font-bold mt-4">Completing login...</h1>
        <p className="text-muted-foreground mt-2">Please wait while we set up your account</p>
      </div>
    );
  }

  return null;
};

export default OAuthSuccessPage;
