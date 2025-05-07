// src/pages/PaymentSuccess.tsx
import { useEffect, useState } from "react";
import { useAppDispatch } from "@/redux/hooks";
import { clearCart } from "@/redux/features/cart/cartSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGetMeQuery } from "@/redux/features/auth/authApi";

const PaymentSuccess = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data: userData, refetch } = useGetMeQuery(undefined);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Refetch user data to get updated enrolled courses
    if (userData?.data?._id) {
      refetch();
      // Fix: Pass the userId in an object as expected by the clearCart action
      dispatch(clearCart({ userId: userData.data._id }));
      toast.success("Payment successful! You are now enrolled in the course.");

      // Start countdown for auto-redirect
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate("/student/dashboard");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [dispatch, navigate, userData?.data?._id, refetch]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p className="text-lg mb-2">Thank you for your purchase.</p>
        <p className="text-gray-600 mb-6">You now have access to your course(s).</p>
        <div className="animate-bounce text-green-500 text-6xl mb-4">🎉</div>
        <p className="text-gray-500">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
