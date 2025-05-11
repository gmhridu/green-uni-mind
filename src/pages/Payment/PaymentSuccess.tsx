// src/pages/PaymentSuccess.tsx
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { clearCart } from "@/redux/features/cart/cartSlice";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useGetMeQuery } from "@/redux/features/auth/authApi";
import { CheckCircle, ArrowRight, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { selectCurrentToken, TUser } from "@/redux/features/auth/authSlice";
import { verifyToken } from "@/utils/verifyToken";
import { USER_ROLE } from "@/constants/global";

const PaymentSuccess = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { data: userData, isLoading, refetch } = useGetMeQuery(undefined);
  const [countdown, setCountdown] = useState(5);
  const [isProcessing, setIsProcessing] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState<string | null>(null);

  
  const token = useAppSelector(selectCurrentToken);
  const user = token ? verifyToken(token) : null;

  
  useEffect(() => {
    
    if (!sessionId) {
      toast.error("Invalid payment session. Redirecting to home page.");
      setShouldRedirect("/");
      return;
    }

    
    if (!token || (user && (user as TUser).role !== USER_ROLE.STUDENT)) {
      toast.error("You must be logged in as a student to view this page.");
      setShouldRedirect("/login");
    }
  }, [sessionId, token, user]);

  
  useEffect(() => {
    if (!shouldRedirect && userData?.data?._id) {
      
      refetch();

      
      dispatch(clearCart({ userId: userData.data._id }));

      
      toast.success("Payment successful! You are now enrolled in the course.");

      
      const processingTimer = setTimeout(() => {
        setIsProcessing(false);
      }, 1500);

      
      const redirectTimer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(redirectTimer);
            navigate("/student/dashboard");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearTimeout(processingTimer);
        clearInterval(redirectTimer);
      };
    }
  }, [dispatch, navigate, userData?.data?._id, refetch, shouldRedirect]);

  
  if (shouldRedirect) {
    return <Navigate to={shouldRedirect} replace />;
  }

  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="animate-spin h-12 w-12 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Verifying your payment...</h2>
        </div>
      </div>
    );
  }

  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-white py-12 px-4">
      <Card className="max-w-2xl w-full shadow-xl border-0 overflow-hidden">
        <div className="bg-green-500 h-2 w-full"></div>

        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="bg-green-100 p-4 rounded-full mb-6">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">Payment Successful!</h1>

            <p className="text-lg text-gray-600 mb-6 max-w-md">
              {isProcessing
                ? "We're processing your enrollment..."
                : "Your course enrollment has been completed successfully."}
            </p>

            {sessionId && (
              <div className="bg-gray-50 px-4 py-3 rounded-md text-sm text-gray-500 mb-6 w-full max-w-md">
                <span className="font-medium">Transaction ID:</span> {sessionId.substring(0, 16)}...
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-md mb-8">
              <div className="bg-blue-50 p-4 rounded-lg flex items-center">
                <BookOpen className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-800">Course Access</h3>
                  <p className="text-sm text-gray-600">Immediate access granted</p>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg flex items-center">
                <Clock className="h-6 w-6 text-purple-500 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-800">Redirecting</h3>
                  <p className="text-sm text-gray-600">In {countdown} seconds</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => navigate("/student/dashboard")}
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Return to Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
