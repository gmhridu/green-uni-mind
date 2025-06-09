import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { clearCart } from "@/redux/features/cart/cartSlice";
import { useAppDispatch } from "@/redux/hooks";
import { useGetMeQuery } from "@/redux/features/auth/authApi";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { data: userData } = useGetMeQuery(undefined);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Clear the cart after successful payment
    if (userData?.data?._id) {
      dispatch(clearCart({ userId: userData.data._id }));
      
      // Simulate processing time
      const timer = setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [dispatch, userData?.data?._id]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 mt-10">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-6">
          {isProcessing 
            ? "We're processing your enrollment..." 
            : "Your course enrollment has been completed successfully."}
        </p>
        
        {sessionId && (
          <p className="text-sm text-gray-500 mb-6">
            Transaction ID: {sessionId.substring(0, 16)}...
          </p>
        )}
        
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => navigate("/student/dashboard/my-courses")}
            className="w-full"
          >
            Go to My Courses
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate("/")}
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
