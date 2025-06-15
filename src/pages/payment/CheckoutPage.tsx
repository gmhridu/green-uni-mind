import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGetCourseByIdQuery } from "@/redux/features/course/courseApi";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { useCreateCheckoutSessionMutation } from "@/redux/features/payment/payment.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AlertCircle, CheckCircle, CreditCard, Loader2, Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const CheckoutPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch course data
  const { data: courseData, isLoading: isCourseLoading } = useGetCourseByIdQuery(courseId || "", {
    skip: !courseId,
  });
  
  const course = courseData?.data;
  
  // Fetch user data
  const { data: userData, isLoading: isUserLoading } = useGetMeQuery(undefined);
  const user = userData?.data;
  
  // Create checkout session mutation
  const [createCheckoutSession, { isLoading: isCreatingSession }] = useCreateCheckoutSessionMutation();
  
  // Check if user is already enrolled in this course
  const isAlreadyEnrolled = user?.role === "student" && 
    user.enrolledCourses?.some((enrolledCourse) => enrolledCourse.courseId === courseId);
  
  // Check if user is a student
  const isStudent = user?.role === "student";
  
  // Handle checkout
  const handleCheckout = async () => {
    if (!courseId || !user?.id) {
      toast.error("Missing course or user information");
      return;
    }
    
    if (!isStudent) {
      toast.error("Only students can purchase courses");
      return;
    }
    
    if (isAlreadyEnrolled) {
      toast.error("You are already enrolled in this course");
      return;
    }
    
    try {
      setIsRedirecting(true);
      const response = await createCheckoutSession({
        courseId,
        amount: course?.coursePrice,
      }).unwrap();
      
      if (response?.data?.url) {
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        toast.error("Failed to create checkout session");
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      const err = error as { data?: { message?: string } };
      const errorMessage = err?.data?.message || "Failed to create checkout session";
      
      setError(errorMessage);
      toast.error(errorMessage);
      setIsRedirecting(false);
    }
  };
  
  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  // If user is not a student, show error
  useEffect(() => {
    if (user && !isUserLoading && user.role !== "student") {
      setError("Only students can purchase courses");
    }
  }, [user, isUserLoading]);
  
  // If user is already enrolled, show error
  useEffect(() => {
    if (isAlreadyEnrolled) {
      setError("You are already enrolled in this course");
    }
  }, [isAlreadyEnrolled]);
  
  const isLoading = isCourseLoading || isUserLoading;
  
  if (isLoading) {
    return (
      <div className="container max-w-4xl py-10">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="container max-w-4xl py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Course not found</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container max-w-4xl py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Checkout</CardTitle>
          <CardDescription>Complete your purchase to access this course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Course Information */}
            <div className="flex items-start gap-4">
              {course.courseThumbnail && (
                <img 
                  src={course.courseThumbnail} 
                  alt={course.title} 
                  className="h-24 w-24 object-cover rounded"
                />
              )}
              <div>
                <h3 className="font-medium text-lg">{course.title}</h3>
                <p className="text-muted-foreground text-sm">
                  By {typeof course.creator === 'object' && course.creator?.name
                    ? `${course.creator.name.firstName || ''} ${course.creator.name.lastName || ''}`.trim() || 'Instructor'
                    : 'Instructor'}
                </p>
                <div className="mt-2 text-xl font-bold">
                  {formatPrice(course.coursePrice || 0)}
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {/* Already Enrolled Message */}
            {isAlreadyEnrolled && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Already Enrolled</AlertTitle>
                <AlertDescription>
                  You are already enrolled in this course. 
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-green-600"
                    onClick={() => navigate(`/course/${courseId}`)}
                  >
                    Go to course
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Payment Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Payment Information</h3>
              <div className="flex items-center justify-between py-2 border-b">
                <span>Course Price</span>
                <span>{formatPrice(course.coursePrice || 0)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b font-medium">
                <span>Total</span>
                <span>{formatPrice(course.coursePrice || 0)}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Lock className="h-3 w-3 mr-1" />
                <span>Secure checkout powered by Stripe</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button 
            onClick={handleCheckout} 
            disabled={isCreatingSession || isRedirecting || !!error || !isStudent || isAlreadyEnrolled}
            className="w-full"
          >
            {isCreatingSession || isRedirecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to Checkout...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Proceed to Payment
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate(`/course/${courseId}`)}
          >
            Return to Course
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CheckoutPage;
